/**
 * useAIInsights Hook
 * Composes the insights engine and AI service for the AIInsightsView component.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { insightsEngine, ComputedInsight, InsightsSummary, RawData } from '../services/insights-engine';
import { aiService } from '../services/ai-service';
import { useAuth } from '../contexts/AuthContext';

export type InsightFilter = 'all' | 'risks' | 'opportunities' | 'predictions' | 'anomalies';

interface ChatEntry {
  type: 'user' | 'ai';
  message: string;
}

export function useAIInsights() {
  // Core data
  const [insights, setInsights] = useState<ComputedInsight[]>([]);
  const [summary, setSummary] = useState<InsightsSummary>({ total: 0, highPriority: 0, opportunities: 0, avgConfidence: 0 });
  const [rawData, setRawData] = useState<RawData | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Filter
  const [activeFilter, setActiveFilter] = useState<InsightFilter>('all');

  // Current user
  const { user } = useAuth();

  // AI availability
  const aiAvailable = aiService.isAvailable();

  // Fetch and compute insights on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await insightsEngine.fetchForAIInsights();
        if (cancelled) return;
        const computedInsights = insightsEngine.computeInsights(data);
        const computedSummary = insightsEngine.computeSummary(computedInsights);

        setInsights(computedInsights);
        setSummary(computedSummary);
        setRawData(data);

        // Show content immediately — don't wait for AI enhancement
        setIsLoading(false);

        // AI enhancement runs in background after content is already visible
        if (aiService.isAvailable() && computedInsights.length > 0) {
          setIsEnhancing(true);
          try {
            const enhanced = await aiService.enhanceInsights(computedInsights, data);
            if (!cancelled) {
              setInsights(enhanced);
              setSummary(insightsEngine.computeSummary(enhanced));
              setIsEnhanced(true);
            }
          } catch {
            // Enhancement failure is non-critical
          } finally {
            if (!cancelled) setIsEnhancing(false);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load insights');
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Filter logic
  const filteredInsights = useMemo(() => {
    switch (activeFilter) {
      case 'risks':
        return insights.filter(i => i.type === 'risk');
      case 'opportunities':
        return insights.filter(i => i.type === 'opportunity' || i.type === 'recommendation');
      case 'predictions':
        return insights.filter(i => i.type === 'prediction');
      case 'anomalies':
        return insights.filter(i => i.type === 'anomaly');
      default:
        return insights;
    }
  }, [insights, activeFilter]);

  // Chat handler — streams response token by token
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !rawData) return;

    // Add user message and an empty AI placeholder in one update
    setChatHistory(prev => [...prev, { type: 'user', message }, { type: 'ai', message: '' }]);
    setIsChatLoading(true);

    try {
      await aiService.sendChatMessage(
        message,
        chatHistory,
        { insights, rawData },
        user,
        (chunk: string) => {
          // Append each chunk to the last (AI placeholder) entry
          setChatHistory(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.type === 'ai') {
              updated[updated.length - 1] = { ...last, message: last.message + chunk };
            }
            return updated;
          });
        }
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get AI response';
      setChatHistory(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.type === 'ai' && last.message === '') {
          updated[updated.length - 1] = { type: 'ai', message: `Error: ${errorMsg}` };
        }
        return updated;
      });
    } finally {
      setIsChatLoading(false);
    }
  }, [chatHistory, insights, rawData]);

  // Retry handler
  const retry = useCallback(() => {
    setInsights([]);
    setSummary({ total: 0, highPriority: 0, opportunities: 0, avgConfidence: 0 });
    setRawData(null);
    setError(null);
    setIsEnhanced(false);
    setIsLoading(true);

    insightsEngine.fetchForAIInsights().then(data => {
      const computedInsights = insightsEngine.computeInsights(data);
      const computedSummary = insightsEngine.computeSummary(computedInsights);
      setInsights(computedInsights);
      setSummary(computedSummary);
      setRawData(data);
      setIsLoading(false);
    }).catch(err => {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
      setIsLoading(false);
    });
  }, []);

  return {
    // Data
    insights,
    filteredInsights,
    summary,
    rawData,

    // Loading
    isLoading,
    isEnhancing,
    isEnhanced,
    error,

    // Filter
    activeFilter,
    setActiveFilter,

    // Chat
    chatHistory,
    isChatLoading,
    sendMessage,
    aiAvailable,

    // Actions
    retry,
  };
}
