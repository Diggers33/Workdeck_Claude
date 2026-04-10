import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Loader2, CheckCircle, ChevronDown, ChevronRight, FileImage, AlertCircle } from 'lucide-react';
import { apiClient } from '../services/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface ParsedActivity {
  id: string;
  name: string;
  tasks: ParsedTask[];
}

interface ParsedProject {
  projectName: string;
  startDate: string;
  endDate: string;
  activities: ParsedActivity[];
}

type Step = 'upload' | 'analyzing' | 'preview' | 'creating' | 'done';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDateDMY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  onProjectCreated?: () => void;
}

export function GanttImportModal({ onClose, onProjectCreated }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsed, setParsed] = useState<ParsedProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

  // ── Image selection ──────────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, WebP, etc.)');
      return;
    }
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  // ── AI Analysis ──────────────────────────────────────────────────────────

  const analyzeImage = useCallback(async () => {
    if (!imageFile) return;
    setStep('analyzing');
    setError(null);

    try {
      const base64 = await fileToBase64(imageFile);
      const mediaType = imageFile.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

      const prompt = `Analyze this Gantt chart image and extract the project structure.

Return ONLY a valid JSON object with this exact shape (no explanation, no markdown):
{
  "projectName": "string",
  "startDate": "DD/MM/YYYY",
  "endDate": "DD/MM/YYYY",
  "activities": [
    {
      "id": "act-1",
      "name": "Full activity/work package name",
      "tasks": [
        {
          "id": "task-1-1",
          "name": "Full task name",
          "startDate": "DD/MM/YYYY",
          "endDate": "DD/MM/YYYY"
        }
      ]
    }
  ]
}

Rules:
- Activities are the top-level grouping rows (often labelled WP1, WP2, etc. — use their full descriptive name, not just the code)
- Tasks are the rows beneath each activity (e.g. T1.1, T1.2)
- If the chart uses "Year N, Week W" notation, assume the project starts 01/01/2025 and convert week numbers to calendar dates
- If exact dates are unreadable, estimate from bar positions relative to the total timeline
- If no project name is visible in the image, use "Imported Project"
- IDs must be unique strings`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: mediaType, data: base64 },
                },
                { type: 'text', text: prompt },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        throw new Error(`AI analysis failed (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const text: string = data.content?.[0]?.text || '';

      // Extract JSON — handle markdown code fences too
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
      if (!jsonMatch) throw new Error('Could not parse AI response — no JSON found');

      const result: ParsedProject = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      if (!Array.isArray(result.activities)) {
        throw new Error('Unexpected response format from AI');
      }

      setExpandedActivities(new Set(result.activities.map(a => a.id)));
      setParsed(result);
      setStep('preview');

    } catch (err: any) {
      setError(err.message || 'Analysis failed — please try again');
      setStep('upload');
    }
  }, [imageFile, apiKey]);

  // ── Edit parsed structure ────────────────────────────────────────────────

  const updateProjectName = (name: string) =>
    setParsed(prev => prev ? { ...prev, projectName: name } : prev);

  const updateActivityName = (actId: string, name: string) =>
    setParsed(prev => prev ? {
      ...prev,
      activities: prev.activities.map(a => a.id === actId ? { ...a, name } : a)
    } : prev);

  const updateTaskName = (actId: string, taskId: string, name: string) =>
    setParsed(prev => prev ? {
      ...prev,
      activities: prev.activities.map(a =>
        a.id === actId
          ? { ...a, tasks: a.tasks.map(t => t.id === taskId ? { ...t, name } : t) }
          : a
      )
    } : prev);

  const removeTask = (actId: string, taskId: string) =>
    setParsed(prev => prev ? {
      ...prev,
      activities: prev.activities.map(a =>
        a.id === actId ? { ...a, tasks: a.tasks.filter(t => t.id !== taskId) } : a
      )
    } : prev);

  const removeActivity = (actId: string) =>
    setParsed(prev => prev ? {
      ...prev,
      activities: prev.activities.filter(a => a.id !== actId)
    } : prev);

  const toggleActivity = (actId: string) =>
    setExpandedActivities(prev => {
      const next = new Set(prev);
      next.has(actId) ? next.delete(actId) : next.add(actId);
      return next;
    });

  // ── Create project ───────────────────────────────────────────────────────

  const createProject = useCallback(async () => {
    if (!parsed) return;
    setStep('creating');
    setError(null);

    try {
      const projectId = crypto.randomUUID();
      const today = formatDateDMY(new Date());
      const oneYearLater = formatDateDMY(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
      const code = (parsed.projectName || 'IMP').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'IMP';

      const activities = parsed.activities.map((a, aIdx) => {
        const actId = crypto.randomUUID();
        return {
          id: actId,
          name: a.name,
          position: aIdx,
          availableHours: '0',
          project: { id: projectId },
          tasks: a.tasks.map((t, tIdx) => ({
            id: crypto.randomUUID(),
            activity: { id: actId },
            name: t.name,
            position: tIdx,
            startDate: t.startDate || parsed.startDate || today,
            endDate: t.endDate || parsed.endDate || oneYearLater,
            plannedHours: '0',
            availableHours: '0',
            description: '',
            flags: 1,
          })),
        };
      });

      await apiClient.post('/commands/sync/create-project', {
        id: projectId,
        project: projectId,
        name: parsed.projectName || 'Imported Project',
        code,
        startDate: parsed.startDate || today,
        endDate: parsed.endDate || oneYearLater,
        availableHours: '0',
        plannedHours: '0',
        contractValue: '0',
        billable: false,
        timesheet: false,
        observations: 'Imported from Gantt chart image',
        isDraft: false,
        activities,
        milestones: [],
        budgets: [],
      });

      await apiClient.post('/commands/sync/commit-project', { id: projectId });

      setStep('done');
      onProjectCreated?.();

    } catch (err: any) {
      setError(err.message || 'Failed to create project');
      setStep('preview');
    }
  }, [parsed, onProjectCreated]);

  // ── Derived ──────────────────────────────────────────────────────────────

  const totalTasks = parsed?.activities.reduce((sum, a) => sum + a.tasks.length, 0) ?? 0;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px'
      }}
      onClick={step === 'done' ? onClose : undefined}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: step === 'preview' ? '680px' : '500px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'max-width 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0A0A0A' }}>
              Import from Gantt Chart
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#6B7280' }}>
              Upload a Gantt chart image — AI extracts activities &amp; tasks automatically
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: '#9CA3AF', flexShrink: 0, marginLeft: '16px' }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Step indicator */}
        {step !== 'done' && (
          <div style={{ padding: '0 24px', paddingTop: '14px', display: 'flex', alignItems: 'center', gap: '0', flexShrink: 0 }}>
            {(['upload', 'analyzing', 'preview', 'creating'] as Step[]).map((s, i, arr) => {
              const labels: Record<string, string> = { upload: 'Upload', analyzing: 'Analysing', preview: 'Review', creating: 'Creating' };
              const stepOrder = ['upload', 'analyzing', 'preview', 'creating'];
              const currentIdx = stepOrder.indexOf(step);
              const thisIdx = stepOrder.indexOf(s);
              const done = thisIdx < currentIdx;
              const active = s === step;
              return (
                <React.Fragment key={s}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      backgroundColor: done ? '#10B981' : active ? '#3B82F6' : '#E5E7EB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 700,
                      color: done || active ? '#fff' : '#9CA3AF'
                    }}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: '11px', color: active ? '#3B82F6' : done ? '#10B981' : '#9CA3AF', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
                      {labels[s]}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ flex: 1, height: '2px', backgroundColor: done ? '#10B981' : '#E5E7EB', margin: '0 6px', marginBottom: '16px' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* UPLOAD */}
          {step === 'upload' && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#3B82F6' : '#D1D5DB'}`,
                  borderRadius: '10px',
                  padding: imagePreviewUrl ? '16px' : '48px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: dragOver ? '#EFF6FF' : '#F9FAFB',
                  transition: 'all 0.15s'
                }}
              >
                {imagePreviewUrl ? (
                  <>
                    <img
                      src={imagePreviewUrl}
                      alt="Gantt chart preview"
                      style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '6px', display: 'block', margin: '0 auto 10px' }}
                    />
                    <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
                      <strong>{imageFile?.name}</strong> — click to change
                    </p>
                  </>
                ) : (
                  <>
                    <FileImage style={{ width: '44px', height: '44px', color: '#9CA3AF', margin: '0 auto 14px' }} />
                    <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                      Drop your Gantt chart here
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#9CA3AF' }}>
                      or click to browse · PNG, JPG, WebP
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>

              {!apiKey && (
                <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#FFFBEB', borderRadius: '6px', border: '1px solid #FDE68A', fontSize: '13px', color: '#92400E' }}>
                  <strong>Note:</strong> Set <code>VITE_ANTHROPIC_API_KEY</code> in your <code>.env</code> file to enable AI analysis.
                </div>
              )}

              {error && (
                <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#FEF2F2', borderRadius: '6px', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#DC2626' }}>
                  <AlertCircle style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                  {error}
                </div>
              )}
            </>
          )}

          {/* ANALYZING */}
          {step === 'analyzing' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              {imagePreviewUrl && (
                <img src={imagePreviewUrl} alt="" style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '6px', marginBottom: '20px', opacity: 0.5 }} />
              )}
              <Loader2 style={{ width: '36px', height: '36px', color: '#3B82F6', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
              <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 500, color: '#0A0A0A' }}>Analysing Gantt chart...</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>AI is reading activities and tasks</p>
            </div>
          )}

          {/* PREVIEW */}
          {step === 'preview' && parsed && (
            <>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Project Name
                </label>
                <input
                  value={parsed.projectName}
                  onChange={e => updateProjectName(e.target.value)}
                  style={{
                    display: 'block', width: '100%', marginTop: '6px',
                    padding: '9px 12px', border: '1px solid #D1D5DB',
                    borderRadius: '6px', fontSize: '14px', fontWeight: 500,
                    color: '#0A0A0A', outline: 'none', boxSizing: 'border-box'
                  }}
                />
                <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#9CA3AF' }}>
                  {parsed.activities.length} {parsed.activities.length === 1 ? 'activity' : 'activities'} · {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'} detected
                </p>
              </div>

              <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', fontSize: '13px' }}>
                {parsed.activities.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>
                    No activities remaining. Add them manually in the project wizard.
                  </div>
                )}
                {parsed.activities.map((activity, aIdx) => (
                  <div key={activity.id} style={{ borderBottom: aIdx < parsed.activities.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                    {/* Activity row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 12px', backgroundColor: '#F9FAFB' }}>
                      <button
                        onClick={() => toggleActivity(activity.id)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '1px', color: '#6B7280', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                      >
                        {expandedActivities.has(activity.id)
                          ? <ChevronDown style={{ width: '14px', height: '14px' }} />
                          : <ChevronRight style={{ width: '14px', height: '14px' }} />
                        }
                      </button>
                      <div style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: '#3B82F6', flexShrink: 0 }} />
                      <input
                        value={activity.name}
                        onChange={e => updateActivityName(activity.id, e.target.value)}
                        style={{ flex: 1, border: 'none', background: 'none', fontSize: '13px', fontWeight: 600, color: '#0A0A0A', outline: 'none', minWidth: 0 }}
                      />
                      <span style={{ fontSize: '11px', color: '#9CA3AF', flexShrink: 0 }}>
                        {activity.tasks.length}t
                      </span>
                      <button
                        onClick={() => removeActivity(activity.id)}
                        title="Remove activity"
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '1px', color: '#D1D5DB', display: 'flex', flexShrink: 0 }}
                      >
                        <X style={{ width: '13px', height: '13px' }} />
                      </button>
                    </div>

                    {/* Task rows */}
                    {expandedActivities.has(activity.id) && activity.tasks.map(task => (
                      <div
                        key={task.id}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px 6px 36px', borderTop: '1px solid #F3F4F6', backgroundColor: '#fff' }}
                      >
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D1D5DB', flexShrink: 0 }} />
                        <input
                          value={task.name}
                          onChange={e => updateTaskName(activity.id, task.id, e.target.value)}
                          style={{ flex: 1, border: 'none', background: 'none', fontSize: '13px', color: '#374151', outline: 'none', minWidth: 0 }}
                        />
                        {task.startDate && (
                          <span style={{ fontSize: '11px', color: '#9CA3AF', flexShrink: 0, whiteSpace: 'nowrap' }}>
                            {task.startDate} → {task.endDate}
                          </span>
                        )}
                        <button
                          onClick={() => removeTask(activity.id, task.id)}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '1px', color: '#E5E7EB', display: 'flex', flexShrink: 0 }}
                        >
                          <X style={{ width: '12px', height: '12px' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {error && (
                <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#FEF2F2', borderRadius: '6px', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#DC2626' }}>
                  <AlertCircle style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                  {error}
                </div>
              )}
            </>
          )}

          {/* CREATING */}
          {step === 'creating' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Loader2 style={{ width: '36px', height: '36px', color: '#3B82F6', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
              <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 500, color: '#0A0A0A' }}>Creating project...</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
                Setting up {parsed?.activities.length} activities and {totalTasks} tasks
              </p>
            </div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <CheckCircle style={{ width: '52px', height: '52px', color: '#10B981', margin: '0 auto 16px' }} />
              <p style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, color: '#0A0A0A' }}>
                Project created successfully!
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
                <strong>{parsed?.projectName}</strong> has been created with{' '}
                {parsed?.activities.length} {parsed?.activities.length === 1 ? 'activity' : 'activities'} and{' '}
                {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0
        }}>
          <button
            onClick={() => {
              if (step === 'done' || step === 'upload') { onClose(); }
              else if (step === 'preview') { setStep('upload'); }
            }}
            style={{ padding: '8px 16px', border: '1px solid #D1D5DB', borderRadius: '6px', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#374151' }}
          >
            {step === 'done' ? 'Close' : step === 'preview' ? 'Back' : 'Cancel'}
          </button>

          <div>
            {step === 'upload' && (
              <button
                onClick={analyzeImage}
                disabled={!imageFile || !apiKey}
                style={{
                  padding: '8px 20px', border: 'none', borderRadius: '6px',
                  background: imageFile && apiKey ? '#3B82F6' : '#E5E7EB',
                  color: imageFile && apiKey ? '#fff' : '#9CA3AF',
                  fontSize: '13px', fontWeight: 500,
                  cursor: imageFile && apiKey ? 'pointer' : 'not-allowed'
                }}
              >
                Analyse with AI
              </button>
            )}
            {step === 'preview' && (
              <button
                onClick={createProject}
                disabled={!parsed || parsed.activities.length === 0}
                style={{
                  padding: '8px 20px', border: 'none', borderRadius: '6px',
                  background: parsed && parsed.activities.length > 0 ? '#3B82F6' : '#E5E7EB',
                  color: parsed && parsed.activities.length > 0 ? '#fff' : '#9CA3AF',
                  fontSize: '13px', fontWeight: 500,
                  cursor: parsed && parsed.activities.length > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                Create Project
              </button>
            )}
            {step === 'done' && (
              <button
                onClick={onClose}
                style={{ padding: '8px 20px', border: 'none', borderRadius: '6px', background: '#10B981', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              >
                View Projects
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
