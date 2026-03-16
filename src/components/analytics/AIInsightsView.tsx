import React, { useState, useMemo, useCallback } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  Users,
  DollarSign,
  Target,
  ThumbsUp,
  ThumbsDown,
  Brain,
  Lightbulb,
  Shield,
  Activity,
  ChevronRight,
  Send,
  X,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAIInsights, InsightFilter } from '../../hooks/useAIInsights';
import { ComputedInsight } from '../../services/insights-engine';
import { formatRelativeTime } from '../../utils/date-utils';

interface AIInsightsViewProps {
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

// Map insight types to icons
function getInsightIcon(type: ComputedInsight['type']) {
  switch (type) {
    case 'risk': return AlertTriangle;
    case 'opportunity': return Users;
    case 'prediction': return DollarSign;
    case 'success': return TrendingUp;
    case 'anomaly': return Clock;
    case 'recommendation': return Lightbulb;
    default: return Activity;
  }
}

// Map insight types to colors
function getInsightColor(type: ComputedInsight['type']) {
  switch (type) {
    case 'risk': return '#EF4444';
    case 'opportunity': return '#10B981';
    case 'prediction': return '#F59E0B';
    case 'success': return '#0066FF';
    case 'anomaly': return '#8B5CF6';
    case 'recommendation': return '#F59E0B';
    default: return '#6B7280';
  }
}

// Map filter tab labels to filter keys
const filterTabs: Array<{ label: string; key: InsightFilter }> = [
  { label: 'All Insights', key: 'all' },
  { label: 'Risks', key: 'risks' },
  { label: 'Opportunities', key: 'opportunities' },
  { label: 'Predictions', key: 'predictions' },
  { label: 'Anomalies', key: 'anomalies' },
];

const AIInsightsView = React.memo(function AIInsightsView({ scrollContainerRef }: AIInsightsViewProps) {
  const [selectedInsight, setSelectedInsight] = useState<ComputedInsight | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  const {
    filteredInsights,
    summary,
    isLoading,
    isEnhancing,
    isEnhanced,
    error,
    activeFilter,
    setActiveFilter,
    chatHistory,
    isChatLoading,
    sendMessage,
    aiAvailable,
    retry,
  } = useAIInsights();

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  }, []);

  const getTypeLabel = useCallback((type: string) => {
    switch (type) {
      case 'risk': return 'Risk Alert';
      case 'opportunity': return 'Opportunity';
      case 'prediction': return 'Prediction';
      case 'success': return 'Success Pattern';
      case 'anomaly': return 'Anomaly Detected';
      case 'recommendation': return 'Recommendation';
      default: return type;
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!chatMessage.trim()) return;
    const msg = chatMessage;
    setChatMessage('');
    await sendMessage(msg);
  }, [chatMessage, sendMessage]);

  const handleDismissInsight = useCallback((insightId: string) => {
    console.log('Dismissing insight:', insightId);
  }, []);

  const handleFeedback = useCallback((insightId: string, helpful: boolean) => {
    console.log('Feedback for insight:', insightId, helpful ? 'helpful' : 'not helpful');
  }, []);

  const handleSelectInsight = useCallback((insight: ComputedInsight) => {
    setSelectedInsight(insight);
  }, []);

  const handleClearInsight = useCallback(() => {
    setSelectedInsight(null);
  }, []);

  const handleOpenChat = useCallback(() => {
    setShowAIChat(true);
  }, []);

  const handleCloseChat = useCallback(() => {
    setShowAIChat(false);
  }, []);

  const handleChatInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setChatMessage(e.target.value);
  }, []);

  const handleChatKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleFilterChange = useCallback((filter: InsightFilter) => {
    setActiveFilter(filter);
  }, [setActiveFilter]);

  // Summary cards data
  const summaryCards = useMemo(() => [
    {
      label: 'Active Insights',
      value: String(summary.total),
      trend: summary.total > 0 ? `Across your projects` : 'No insights yet',
      icon: Sparkles,
      color: '#0066FF'
    },
    {
      label: 'High Priority Alerts',
      value: String(summary.highPriority),
      trend: summary.highPriority > 0 ? 'Requires attention' : 'All clear',
      icon: AlertTriangle,
      color: '#EF4444'
    },
    {
      label: 'Opportunities Found',
      value: String(summary.opportunities),
      trend: summary.opportunities > 0 ? 'Potential improvements' : 'None detected',
      icon: Target,
      color: '#10B981'
    },
    {
      label: 'Avg Confidence',
      value: summary.avgConfidence > 0 ? `${summary.avgConfidence}%` : '—',
      trend: summary.avgConfidence >= 80 ? 'High confidence' : summary.avgConfidence > 0 ? 'Moderate confidence' : 'No data',
      icon: Shield,
      color: '#8B5CF6'
    },
  ], [summary]);

  // Loading state
  if (isLoading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
          <Loader2 style={{ width: '40px', height: '40px', color: '#0066FF', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '16px', color: '#6B7280' }}>Analyzing project data...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
          <AlertCircle style={{ width: '40px', height: '40px', color: '#EF4444' }} />
          <p style={{ fontSize: '16px', color: '#374151' }}>Failed to load insights</p>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>{error}</p>
          <button
            onClick={retry}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', background: '#0066FF', color: 'white',
              border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer',
            }}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderDetailView = () => {
    if (!selectedInsight) return null;
    const Icon = getInsightIcon(selectedInsight.type);
    const color = getInsightColor(selectedInsight.type);
    return (
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Back button */}
        <button
          onClick={handleClearInsight}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#6B7280',
            cursor: 'pointer',
            marginBottom: '24px'
          }}
        >
          ← Back to All Insights
        </button>

        {/* Insight Detail Header */}
        <div style={{
          padding: '24px',
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '6px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '8px',
              background: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Icon style={{ width: '28px', height: '28px', color }} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: `${color}15`,
                  color
                }}>
                  {getTypeLabel(selectedInsight.type)}
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: `${getPriorityColor(selectedInsight.priority)}15`,
                  color: getPriorityColor(selectedInsight.priority)
                }}>
                  {selectedInsight.priority.toUpperCase()} PRIORITY
                </span>
                <span style={{
                  fontSize: '12px',
                  color: '#9CA3AF',
                  marginLeft: 'auto'
                }}>
                  {selectedInsight.confidence}% confidence • {formatRelativeTime(selectedInsight.dateGenerated)}
                </span>
              </div>

              <h1 style={{ fontSize: '24px', color: '#0A0A0A', marginBottom: '8px' }}>
                {selectedInsight.title}
              </h1>
              <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: '1.6' }}>
                {selectedInsight.description}
              </p>
            </div>
          </div>

          {/* Key Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(Object.keys(selectedInsight.metrics).length, 4)}, 1fr)`,
            gap: '16px',
            padding: '20px',
            background: '#F9FAFB',
            borderRadius: '6px'
          }}>
            {Object.entries(selectedInsight.metrics).map(([key, value]) => (
              <div key={key}>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div style={{ fontSize: '20px', color: '#0A0A0A' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div style={{
          padding: '24px',
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '6px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Lightbulb style={{ width: '20px', height: '20px', color: '#F59E0B' }} />
            <h2 style={{ fontSize: '18px', color: '#0A0A0A' }}>
              AI Recommendations
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedInsight.recommendations.map((rec: string, idx: number) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#0066FF',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
                    {rec}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const projectName = selectedInsight.affectedProjects?.[0] || '';
                    const prompt = `How do I "${rec}"${projectName ? ` for project ${projectName}` : ''}? Give me specific steps.`;
                    setShowAIChat(true);
                    setChatMessage(prompt);
                    setTimeout(() => {
                      sendMessage(prompt);
                      setChatMessage('');
                    }, 100);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#0066FF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Take Action
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Visualization */}
        {selectedInsight.trendData && selectedInsight.trendData.length > 0 && (
          <div style={{
            padding: '24px',
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '18px', color: '#0A0A0A', marginBottom: '16px' }}>
              Trend Analysis
            </h2>

            {selectedInsight.chartType === 'area' && (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={selectedInsight.trendData}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0066FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="week" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#0066FF"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorActual)"
                  />
                  <Line type="monotone" dataKey="predicted" stroke="#9CA3AF" strokeDasharray="5 5" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {selectedInsight.chartType === 'line' && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={selectedInsight.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="spent" stroke="#0066FF" strokeWidth={2} />
                  <Line type="monotone" dataKey="forecast" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="planned" stroke="#10B981" strokeWidth={2} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            )}

            {selectedInsight.chartType === 'bar' && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={selectedInsight.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="week" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hours" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="baseline" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* Affected Projects */}
        {selectedInsight.affectedProjects.length > 0 && (
          <div style={{
            padding: '24px',
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '18px', color: '#0A0A0A', marginBottom: '16px' }}>
              Affected Projects
            </h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {selectedInsight.affectedProjects.map((project: string) => (
                <span
                  key={project}
                  style={{
                    padding: '8px 16px',
                    background: '#F3F4F6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#374151'
                  }}
                >
                  {project}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        <div style={{
          padding: '20px',
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '14px', color: '#6B7280' }}>
            Was this insight helpful?
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleFeedback(selectedInsight.id, true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              <ThumbsUp style={{ width: '16px', height: '16px' }} />
              Helpful
            </button>
            <button
              onClick={() => handleFeedback(selectedInsight.id, false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              <ThumbsDown style={{ width: '16px', height: '16px' }} />
              Not Helpful
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render the chat modal (used by both detail and list views)
  const chatModal = showAIChat ? (
    <>
      <div
        onClick={handleCloseChat}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          maxHeight: '700px',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Chat Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #0066FF 0%, #00C2FF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Brain style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', color: '#0A0A0A', marginBottom: '2px' }}>
                AI Assistant
              </h2>
              <p style={{ fontSize: '12px', color: '#6B7280' }}>
                Ask me anything about your projects
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseChat}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: 'none',
              background: '#F3F4F6',
              color: '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Chat Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px'
        }}>
          {chatHistory.length === 0 && !isChatLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Brain style={{ width: '48px', height: '48px', color: '#9CA3AF', margin: '0 auto 16px' }} />
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
                Ask me about project risks, resource allocation, budget forecasts, or team performance
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  'What projects are at risk?',
                  'How is team utilization this week?',
                  'Show me budget forecast for Q2'
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      sendMessage(suggestion);
                    }}
                    style={{
                      padding: '12px',
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#374151',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}
                >
                  {msg.type === 'ai' && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #0066FF 0%, #00C2FF 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Brain style={{ width: '16px', height: '16px', color: 'white' }} />
                    </div>
                  )}
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '6px',
                      background: msg.type === 'user' ? '#0066FF' : '#F3F4F6',
                      color: msg.type === 'user' ? 'white' : '#374151',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      maxWidth: '80%',
                      marginLeft: msg.type === 'user' ? 'auto' : '0',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.message}
                    {/* Blinking cursor on the last AI message while streaming */}
                    {msg.type === 'ai' && isChatLoading && idx === chatHistory.length - 1 && (
                      <span style={{ display: 'inline-block', width: '2px', height: '1em', background: '#6B7280', marginLeft: '2px', verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />
                    )}
                  </div>
                </div>
              ))}
              <style>{`@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={chatMessage}
              onChange={handleChatInputChange}
              onKeyPress={handleChatKeyPress}
              placeholder="Ask about projects, resources, or performance..."
              disabled={isChatLoading}
              style={{
                flex: 1,
                padding: '12px',
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#0A0A0A',
                opacity: isChatLoading ? 0.6 : 1,
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatMessage.trim() || isChatLoading}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '6px',
                border: 'none',
                background: chatMessage.trim() && !isChatLoading ? '#0066FF' : '#E5E7EB',
                color: 'white',
                cursor: chatMessage.trim() && !isChatLoading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </div>
      </div>
    </>
  ) : null;

  // Detail view wraps with chat modal
  if (selectedInsight) {
    const detailView = renderDetailView();
    return (
      <>
        {detailView}
        {chatModal}
      </>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Brain style={{ width: '28px', height: '28px', color: '#0066FF' }} />
          <h1 style={{ fontSize: '24px', color: '#0A0A0A' }}>
            AI Insights
          </h1>
          {isEnhancing && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B7280' }}>
              <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
              Enhancing with AI...
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </span>
          )}
          {isEnhanced && !isEnhancing && (
            <span style={{
              padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
              background: '#0066FF15', color: '#0066FF'
            }}>
              AI Enhanced
            </span>
          )}
        </div>
        <p style={{ fontSize: '14px', color: '#6B7280' }}>
          Intelligent predictions, recommendations, and anomaly detection powered by machine learning
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {summaryCards.map((card, idx) => {
          const CardIcon = card.icon;
          return (
            <div
              key={idx}
              style={{
                padding: '20px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '6px',
                  background: `${card.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CardIcon style={{ width: '20px', height: '20px', color: card.color }} />
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>
                {card.label}
              </div>
              <div style={{ fontSize: '28px', color: '#0A0A0A', marginBottom: '4px' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>
                {card.trend}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions / AI Chat Banner */}
      {aiAvailable ? (
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          padding: '16px',
          background: 'linear-gradient(135deg, #0066FF 0%, #00C2FF 100%)',
          borderRadius: '8px'
        }}>
          <Brain style={{ width: '24px', height: '24px', color: 'white', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '16px', color: 'white', marginBottom: '4px' }}>
              Ask AI Anything
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
              Get instant answers about your projects, resources, and performance
            </p>
          </div>
          <button
            onClick={handleOpenChat}
            style={{
              padding: '8px 20px',
              background: 'white',
              color: '#0066FF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              alignSelf: 'center'
            }}
          >
            Start Chat
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          padding: '16px',
          background: '#F3F4F6',
          borderRadius: '8px',
          border: '1px solid #E5E7EB'
        }}>
          <Brain style={{ width: '24px', height: '24px', color: '#9CA3AF', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '16px', color: '#6B7280', marginBottom: '4px' }}>
              AI Chat Unavailable
            </h3>
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
              Set <code style={{ background: '#E5E7EB', padding: '2px 6px', borderRadius: '3px', fontSize: '13px' }}>VITE_ANTHROPIC_API_KEY</code> in your .env file to enable AI-powered chat and enhanced insights.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #E5E7EB',
        paddingBottom: '0'
      }}>
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeFilter === tab.key ? '2px solid #0066FF' : '2px solid transparent',
              color: activeFilter === tab.key ? '#0066FF' : '#6B7280',
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '-1px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Insights Grid */}
      {filteredInsights.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'white', border: '1px solid #E5E7EB', borderRadius: '6px'
        }}>
          <Activity style={{ width: '40px', height: '40px', color: '#9CA3AF', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '16px', color: '#374151', marginBottom: '8px' }}>
            {activeFilter === 'all' ? 'No insights detected' : `No ${activeFilter} found`}
          </p>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            {activeFilter === 'all'
              ? 'Insights will appear as project data is analyzed.'
              : 'Try selecting a different filter or check back later.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredInsights.map(insight => {
            const Icon = getInsightIcon(insight.type);
            const color = getInsightColor(insight.type);
            return (
              <div
                key={insight.id}
                style={{
                  padding: '20px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0066FF';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,102,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => handleSelectInsight(insight)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  {/* Icon */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '6px',
                    background: `${color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon style={{ width: '24px', height: '24px', color }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: `${color}15`,
                        color
                      }}>
                        {getTypeLabel(insight.type)}
                      </span>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: `${getPriorityColor(insight.priority)}15`,
                        color: getPriorityColor(insight.priority)
                      }}>
                        {insight.priority}
                      </span>
                      <div style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Shield style={{ width: '14px', height: '14px', color: '#9CA3AF' }} />
                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                          {insight.confidence}% confidence
                        </span>
                      </div>
                    </div>

                    <h3 style={{
                      fontSize: '16px',
                      color: '#0A0A0A',
                      marginBottom: '8px',
                      fontWeight: 600
                    }}>
                      {insight.title}
                    </h3>

                    <p style={{
                      fontSize: '14px',
                      color: '#6B7280',
                      marginBottom: '12px',
                      lineHeight: '1.5'
                    }}>
                      {insight.description}
                    </p>

                    {/* Metrics */}
                    <div style={{
                      display: 'flex',
                      gap: '24px',
                      padding: '12px 0',
                      borderTop: '1px solid #E5E7EB',
                      borderBottom: '1px solid #E5E7EB',
                      marginBottom: '12px'
                    }}>
                      {Object.entries(insight.metrics).map(([key, value]) => (
                        <div key={key}>
                          <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div style={{ fontSize: '15px', color: '#0A0A0A', fontWeight: 600 }}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {insight.affectedProjects.map((project: string) => (
                          <span
                            key={project}
                            style={{
                              padding: '4px 8px',
                              background: '#F3F4F6',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: '#6B7280'
                            }}
                          >
                            {project}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                          {formatRelativeTime(insight.dateGenerated)}
                        </span>
                        <ChevronRight style={{ width: '20px', height: '20px', color: '#9CA3AF' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Chat Modal */}
      {chatModal}
    </div>
  );
});

export { AIInsightsView };
