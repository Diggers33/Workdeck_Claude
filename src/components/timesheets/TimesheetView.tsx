import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  X,
  Briefcase,
  FileText,
  Calendar,
  Download,
  Send,
  CheckCircle,
  XCircle,
  CalendarDays,
  Users,
  RefreshCw,
} from 'lucide-react';
import { dashboardApi } from '../../services/dashboard-api';
import { apiClient } from '../../services/api-client';
import { ENDPOINTS } from '../../config/api';
import {
  CalendarEvent,
  TimesheetEntry,
  TimesheetRecord,
  ProjectSummary,
} from '../../services/dashboard-api';

// ============================================================================
// Helpers
// ============================================================================

function toDisplayDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function toInputDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fromInputDate(value: string): string {
  const [yyyy, mm, dd] = value.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    if (!isNaN(d.getTime())) return d;
  }
  // Try ISO
  const iso = new Date(dateStr);
  if (!isNaN(iso.getTime())) return iso;
  return null;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function parseHours(value?: string | number): number {
  return parseFloat(String(value ?? '0')) || 0;
}

/**
 * Parse API datetime strings which may be in 'DD/MM/YYYY HH:mm:ss+HH:MM' format.
 * new Date() treats the date part as MM/DD/YYYY which is wrong for our API.
 */
function parseApiDatetime(str: string): Date | null {
  if (!str) return null;
  // Handle 'DD/MM/YYYY HH:mm:ss+TZ' format
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})(.*)?$/);
  if (m) {
    const [, dd, mm, yyyy, hh, min, ss, tz] = m;
    const iso = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}${tz?.trim() || 'Z'}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return d;
  }
  // Fallback: ISO or other standard formats
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function formatHm(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function eventToEntry(e: CalendarEvent): TimesheetEntry {
  const startAt = new Date(e.startAt);
  const endAt = new Date(e.endAt);
  const hours = Math.max(0, (endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60));
  return {
    id: e.id,
    user: { id: '', fullName: '' },
    date: toDisplayDate(startAt),
    hours: hours.toFixed(2),
    task: e.task,
    project: e.project,
    description: e.title,
  };
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${weekStart.getDate()}–${weekEnd.getDate()} ${MONTH_SHORT[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
  }
  return `${weekStart.getDate()} ${MONTH_SHORT[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MONTH_SHORT[weekEnd.getMonth()]} ${weekStart.getFullYear()}`;
}

/**
 * Find the timesheet record for a given period start date
 * in the employee's list of submitted records.
 * The backend stores startAt as ISO; we match by week/month.
 */
function findRecordForPeriod(
  records: TimesheetRecord[],
  periodStart: Date,
  viewMode: 'week' | 'month',
): TimesheetRecord | undefined {
  return records.find(r => {
    const recStart = parseDate(r.startAt);
    if (!recStart) return false;
    if (viewMode === 'week') {
      // Same week — both dates fall in the same Monday-anchored week
      return getWeekStart(recStart).getTime() === getWeekStart(periodStart).getTime();
    } else {
      return recStart.getFullYear() === periodStart.getFullYear() &&
        recStart.getMonth() === periodStart.getMonth();
    }
  });
}

// ============================================================================
// Status helpers
// ============================================================================

// Backend status: 1=PENDING, 2=APPROVED, 3=DENIED
const STATUS_LABEL: Record<number, string> = {
  1: 'Submitted',
  2: 'Approved',
  3: 'Denied',
};
const STATUS_BG: Record<number, string> = {
  1: '#EFF6FF',
  2: '#D1FAE5',
  3: '#FEE2E2',
};
const STATUS_COLOR: Record<number, string> = {
  1: '#1D4ED8',
  2: '#065F46',
  3: '#991B1B',
};

function StatusBadge({ status }: { status: number }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: STATUS_BG[status] ?? '#F3F4F6', color: STATUS_COLOR[status] ?? '#6B7280' }}
    >
      {STATUS_LABEL[status] ?? 'Unknown'}
    </span>
  );
}

// ============================================================================
// PDF Export
// ============================================================================

async function exportToPDF(
  entries: TimesheetEntry[],
  periodLabel: string,
  periodStart: string,
  periodEnd: string,
  employeeName: string,
  record?: TimesheetRecord,
) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 16;
  let y = margin;

  // Header bar
  doc.setFillColor(0, 102, 255);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('WORKDECK', margin, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('TIMESHEET REPORT', pageW - margin, 12, { align: 'right' });

  y = 26;
  doc.setTextColor(10, 10, 10);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Timesheet Report', margin, y);
  y += 10;

  // Metadata
  const statusLabel = record ? (STATUS_LABEL[record.status] ?? '—') : 'Draft';
  const meta = [
    ['Employee', employeeName],
    ['Period', periodLabel],
    ['Start', periodStart],
    ['End', periodEnd],
    ['Status', statusLabel],
    ['Total Hours', formatHm(entries.reduce((s, e) => s + parseHours(e.hours), 0))],
    ['Deny Reason', record?.denyComment || '—'],
  ];

  doc.setFontSize(8.5);
  const colW = (pageW - margin * 2) / 4;
  let mx = margin;
  let metaY = y;
  for (let i = 0; i < meta.length; i++) {
    if (i > 0 && i % 4 === 0) { metaY += 10; mx = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128);
    doc.text(meta[i][0].toUpperCase(), mx, metaY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(17, 24, 39);
    doc.text(meta[i][1], mx, metaY + 5);
    mx += colW;
  }
  y = metaY + 16;

  doc.setDrawColor(209, 213, 219);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // --- Summary by project ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 10, 10);
  doc.text('Timesheet Summary', margin, y);
  y += 7;

  const projectMap = new Map<string, { name: string; code: string; hours: number }>();
  for (const e of entries) {
    const key = e.project?.id || 'no-project';
    const ex = projectMap.get(key);
    if (ex) {
      ex.hours += parseHours(e.hours);
    } else {
      projectMap.set(key, {
        name: e.project?.name || 'No Project',
        code: e.project?.code || key.substring(0, 8).toUpperCase(),
        hours: parseHours(e.hours),
      });
    }
  }
  const totalHours = entries.reduce((s, e) => s + parseHours(e.hours), 0);

  const col1 = margin, col2 = margin + 80, col3 = margin + 145;
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, y, pageW - margin * 2, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('PROJECT', col1 + 2, y + 5.5);
  doc.text('PROJECT CODE', col2 + 2, y + 5.5);
  doc.text('TOTAL HOURS', col3 + 2, y + 5.5);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  for (const [, proj] of projectMap) {
    doc.setFontSize(9);
    doc.text(proj.name, col1 + 2, y);
    doc.text(proj.code, col2 + 2, y);
    doc.text(formatHm(proj.hours), col3 + 2, y);
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y + 3, pageW - margin, y + 3);
    y += 9;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(10, 10, 10);
  doc.text('TOTAL', col1 + 2, y + 1);
  doc.text(formatHm(totalHours), col3 + 2, y + 1);
  y += 12;

  doc.setDrawColor(209, 213, 219);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // --- Activity Details ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 10, 10);
  doc.text('Activity / Event Details', margin, y);
  y += 7;

  const dCol = [margin, margin + 40, margin + 82, margin + 124, margin + 154, margin + 178];
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, y, pageW - margin * 2, 8, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  ['PROJECT', 'CODE', 'ACTIVITY/EVENT', 'TASK', 'DAY', 'HOURS'].forEach((h, i) => {
    doc.text(h, dCol[i] + 2, y + 5.5);
  });
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const sorted = [...entries].sort((a, b) => {
    const da = parseDate(a.date);
    const db = parseDate(b.date);
    if (!da || !db) return 0;
    return da.getTime() - db.getTime();
  });

  for (const e of sorted) {
    if (y > 270) { doc.addPage(); y = margin + 10; }
    const d = parseDate(e.date);
    const dayLabel = d
      ? d.toLocaleDateString('en-GB', { weekday: 'short' }) + ' ' + toDisplayDate(d)
      : e.date;
    doc.setTextColor(17, 24, 39);
    doc.text(trunc(e.project?.name || '—', 16), dCol[0] + 2, y);
    doc.text(trunc(e.project?.code || (e.project?.id || '').substring(0, 6).toUpperCase() || '—', 8), dCol[1] + 2, y);
    doc.text(trunc(e.description || '—', 20), dCol[2] + 2, y);
    doc.text(trunc(e.task?.name || '—', 16), dCol[3] + 2, y);
    doc.text(dayLabel, dCol[4] + 2, y);
    doc.text(formatHm(parseHours(e.hours)), dCol[5] + 2, y);
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y + 3, pageW - margin, y + 3);
    y += 9;
  }

  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    doc.text(`Generated by Workdeck · ${new Date().toLocaleDateString('en-GB')}`, margin, 292);
    doc.text(`Page ${p} of ${pageCount}`, pageW - margin, 292, { align: 'right' });
  }

  const fname = `timesheet_${employeeName.replace(/\s+/g, '_')}_${periodStart.replace(/\//g, '-')}.pdf`;
  doc.save(fname);
}

function trunc(str: string, max: number): string {
  return str && str.length > max ? str.substring(0, max - 1) + '…' : (str || '');
}

// ============================================================================
// WeekBar
// ============================================================================

function WeekBar({
  weekStart,
  entries,
  selectedDay,
  onSelectDay,
}: {
  weekStart: Date;
  entries: TimesheetEntry[];
  selectedDay: Date | null;
  onSelectDay: (day: Date) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="grid grid-cols-7 gap-2">
      {DAY_NAMES.map((name, i) => {
        const day = addDays(weekStart, i);
        const dayStr = toDisplayDate(day);
        const hours = entries.filter(t => t.date === dayStr).reduce((s, t) => s + parseHours(t.hours), 0);
        const isToday = isSameDay(day, today);
        const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
        const isWeekend = i >= 5;
        const fillColor = hours === 0 ? '#F3F4F6' : hours >= 7 ? '#10B981' : hours >= 4 ? '#3B82F6' : '#F59E0B';

        return (
          <button
            key={name}
            onClick={() => onSelectDay(day)}
            className="flex flex-col items-center rounded-xl border transition-all"
            style={{
              padding: '12px 8px',
              borderColor: isSelected ? '#0066FF' : isToday ? '#93C5FD' : '#E5E7EB',
              backgroundColor: isSelected ? '#EFF6FF' : isToday ? '#F0F9FF' : isWeekend ? '#FAFAFA' : 'white',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500, marginBottom: '4px' }}>{name}</span>
            <span style={{ fontSize: '14px', fontWeight: isToday ? 700 : 500, color: isSelected ? '#0066FF' : isToday ? '#1D4ED8' : '#374151', marginBottom: '8px' }}>
              {day.getDate()}
            </span>
            <div className="rounded-full w-full" style={{ height: '4px', backgroundColor: '#F3F4F6', marginBottom: '4px' }}>
              <div className="rounded-full" style={{ width: `${Math.min(100, (hours / 8) * 100)}%`, height: '100%', backgroundColor: fillColor }} />
            </div>
            <span style={{ fontSize: '11px', color: hours > 0 ? '#374151' : '#D1D5DB', fontWeight: hours > 0 ? 600 : 400 }}>
              {hours > 0 ? `${hours.toFixed(1)}h` : '—'}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// MonthGrid
// ============================================================================

function MonthGrid({
  monthDate,
  entries,
  onDayClick,
}: {
  monthDate: Date;
  entries: TimesheetEntry[];
  onDayClick: (day: Date) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthStart = getMonthStart(monthDate);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const gridStart = getWeekStart(monthStart);

  const days: Date[] = [];
  let d = new Date(gridStart);
  while (d <= monthEnd || days.length % 7 !== 0) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
    if (days.length > 42) break;
  }

  const hoursByDay = new Map<string, number>();
  for (const entry of entries) {
    const h = hoursByDay.get(entry.date) || 0;
    hoursByDay.set(entry.date, h + parseHours(entry.hours));
  }

  return (
    <div>
      <div className="grid grid-cols-7" style={{ marginBottom: '4px' }}>
        {DAY_NAMES.map(n => (
          <div key={n} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#9CA3AF', padding: '4px 0' }}>{n}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const dayStr = toDisplayDate(day);
          const hours = hoursByDay.get(dayStr) || 0;
          const inMonth = day.getMonth() === monthDate.getMonth();
          const isToday = isSameDay(day, today);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const fillColor = hours === 0 ? 'transparent' : hours >= 7 ? '#10B981' : hours >= 4 ? '#3B82F6' : '#F59E0B';

          return (
            <button
              key={i}
              onClick={() => inMonth && onDayClick(day)}
              style={{
                position: 'relative',
                minHeight: '72px',
                padding: '8px',
                borderRadius: '8px',
                border: isToday ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                backgroundColor: !inMonth ? '#FAFAFA' : isWeekend ? '#F9FAFB' : 'white',
                cursor: inMonth ? 'pointer' : 'default',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                opacity: inMonth ? 1 : 0.35,
                overflow: 'hidden',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: isToday ? 700 : 500, color: isToday ? '#2563EB' : isWeekend ? '#9CA3AF' : '#374151' }}>
                {day.getDate()}
              </span>
              {hours > 0 && (
                <span style={{ fontSize: '11px', fontWeight: 600, color: fillColor }}>
                  {formatHm(hours)}
                </span>
              )}
              {hours > 0 && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', width: `${Math.min(100, (hours / 8) * 100)}%`, backgroundColor: fillColor, borderRadius: '0 0 0 8px' }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// EntryRow
// ============================================================================

function EntryRow({
  entry,
  isFromCalendar,
  onEdit,
  onDelete,
  deleting,
}: {
  entry: TimesheetEntry;
  isFromCalendar: boolean;
  onEdit: (entry: TimesheetEntry) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const hours = parseHours(entry.hours);

  return (
    <div className="flex items-center gap-4 rounded-lg border hover:bg-gray-50 transition-colors" style={{ padding: '12px 16px', borderColor: '#E5E7EB' }}>
      <div className="flex items-center justify-center rounded-lg flex-shrink-0"
        style={{ width: '40px', height: '40px', backgroundColor: isFromCalendar ? '#F0F9FF' : '#EFF6FF' }}>
        {isFromCalendar
          ? <Calendar className="w-4 h-4" style={{ color: '#0EA5E9' }} />
          : <Clock className="w-4 h-4" style={{ color: '#0066FF' }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: '2px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{hours.toFixed(1)}h</span>
          {isFromCalendar && (
            <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: '10px', fontWeight: 500, backgroundColor: '#E0F2FE', color: '#0369A1' }}>Calendar</span>
          )}
          {entry.project && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ fontSize: '11px', backgroundColor: '#F3F4F6', color: '#6B7280' }}>
              <Briefcase className="w-3 h-3" />{entry.project.name}
            </span>
          )}
          {entry.task && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ fontSize: '11px', backgroundColor: '#FEF3C7', color: '#92400E' }}>
              <FileText className="w-3 h-3" />{entry.task.name}
            </span>
          )}
        </div>
        {entry.description && (
          <p className="truncate" style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>{entry.description}</p>
        )}
      </div>
      {!isFromCalendar && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onEdit(entry)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Edit">
            <Edit2 className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
          </button>
          <button onClick={() => onDelete(entry.id)} disabled={deleting} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
            {deleting
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#9CA3AF' }} />
              : <Trash2 className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LogTimeForm
// ============================================================================

interface FormState { date: string; hours: string; projectId: string; description: string; }
const EMPTY_FORM: FormState = { date: toInputDate(new Date()), hours: '', projectId: '', description: '' };

function LogTimeForm({
  form, onChange, onSubmit, onCancel, projects, isSaving, isEdit, saveError,
}: {
  form: FormState; onChange: (f: FormState) => void; onSubmit: () => void; onCancel: () => void;
  projects: ProjectSummary[]; isSaving: boolean; isEdit: boolean; saveError: string | null;
}) {
  return (
    <div className="rounded-xl border" style={{ borderColor: '#0066FF', backgroundColor: '#F8FAFF', padding: '20px', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
        {isEdit ? 'Edit Entry' : 'Log Additional Time'}
      </h3>
      <div className="grid grid-cols-2 gap-3" style={{ marginBottom: '12px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Date</label>
          <input type="date" value={form.date} onChange={e => onChange({ ...form, date: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ borderColor: '#D1D5DB', fontSize: '13px' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Hours</label>
          <input type="number" min="0.25" max="24" step="0.25" placeholder="e.g. 8" value={form.hours}
            onChange={e => onChange({ ...form, hours: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ borderColor: '#D1D5DB', fontSize: '13px' }} />
        </div>
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Project (optional)</label>
        <select value={form.projectId} onChange={e => onChange({ ...form, projectId: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ borderColor: '#D1D5DB', fontSize: '13px', color: form.projectId ? '#111827' : '#9CA3AF' }}>
          <option value="">No project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Description (optional)</label>
        <textarea rows={2} placeholder="What did you work on?" value={form.description}
          onChange={e => onChange({ ...form, description: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          style={{ borderColor: '#D1D5DB', fontSize: '13px' }} />
      </div>
      {saveError && <p style={{ color: '#DC2626', fontSize: '12px', marginBottom: '12px' }}>{saveError}</p>}
      <div className="flex items-center gap-2">
        <button onClick={onSubmit} disabled={isSaving || !form.date || !form.hours}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: isSaving || !form.date || !form.hours ? '#93C5FD' : '#0066FF' }}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {isEdit ? 'Save Changes' : 'Log Time'}
        </button>
        <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors" style={{ color: '#6B7280' }}>
          <X className="w-4 h-4" />Cancel
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Approval Panel (Manager view — uses real API)
// ============================================================================

// ============================================================================
// Timesheet Detail Panel (slide-over)
// ============================================================================

function TimesheetDetailPanel({
  record,
  onClose,
  onApprove,
  onDeny,
}: {
  record: TimesheetRecord;
  onClose: () => void;
  onApprove?: (record: TimesheetRecord) => Promise<void>;
  onDeny?: (record: TimesheetRecord, comment: string) => Promise<void>;
}) {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [denyMode, setDenyMode] = useState(false);
  const [denyComment, setDenyComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    const periodStart = parseDate(record.startAt);
    if (!periodStart) { setIsLoading(false); return; }

    // Period end = last day of the month
    const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0, 23, 59, 59, 999);

    // Fetch events directly for the period — same approach as the Calendar Details sidebar.
    // The /queries/timesheets/:id snapshot is unreliable; the events API is the source of truth.
    const userId = record.user?.id;
    const fetchPromise = userId
      ? dashboardApi.getEventsForUser(userId, periodStart, periodEnd)
      : dashboardApi.getEvents(periodStart, periodEnd);

    fetchPromise.then(calEvents => {
      const mapped = calEvents
        .filter(ev => Boolean(ev.timesheet))
        .map(ev => {
          const startAt = parseApiDatetime(ev.startAt) ?? new Date(ev.startAt);
          const endAt = parseApiDatetime(ev.endAt) ?? new Date(ev.endAt);
          const hours = Math.max(0, (endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60));
          return {
            id: ev.id,
            user: record.user ?? { id: '', fullName: '' },
            date: toDisplayDate(startAt),
            hours: hours.toFixed(2),
            task: ev.task,
            project: ev.project,
            description: ev.title,
            _hours: hours,
          };
        })
        .filter(e => e._hours > 0)
        .map(({ _hours, ...e }) => e as TimesheetEntry);

      setEntries(mapped);
      setIsLoading(false);
    });
  }, [record.id, record.startAt, record.user?.id]);

  const getUserName = () => {
    const u = record.user;
    if (!u) return 'Unknown Employee';
    return u.fullName || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Unknown Employee';
  };

  const formatPeriod = () => {
    const d = parseDate(record.startAt);
    if (!d) return record.startAt;
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  // Project summary from events
  const projectTotals = useMemo(() => {
    const map = new Map<string, { name: string; code: string; hours: number }>();
    for (const e of entries) {
      const key = e.project?.id || 'none';
      const ex = map.get(key);
      if (ex) { ex.hours += parseHours(e.hours); }
      else { map.set(key, { name: e.project?.name || 'No Project', code: e.project?.code || key.substring(0, 6).toUpperCase(), hours: parseHours(e.hours) }); }
    }
    return Array.from(map.values());
  }, [entries]);

  // record.hours is backend-calculated from onlyTimesheets:true events at submission time
  const totalHours = parseHours(record.hours);

  const handleApprove = async () => {
    if (!onApprove) return;
    setActionLoading(true);
    await onApprove(record);
    setActionLoading(false);
    onClose();
  };

  const handleDeny = async () => {
    if (!onDeny || !denyComment.trim()) return;
    setActionLoading(true);
    await onDeny(record, denyComment.trim());
    setActionLoading(false);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 1000 }}
      />

      {/* Slide-over panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '520px',
        backgroundColor: 'white', zIndex: 1001, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
          <div className="flex items-start justify-between" style={{ marginBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                Timesheet Details
              </h2>
              <p style={{ fontSize: '13px', color: '#6B7280' }}>{getUserName()}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" style={{ color: '#6B7280' }} />
            </button>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={record.status} />
            <span style={{ fontSize: '13px', color: '#6B7280' }}>
              <Calendar className="w-3.5 h-3.5 inline mr-1 -mt-0.5" style={{ color: '#9CA3AF' }} />
              {formatPeriod()}
            </span>
            <span style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>
              <Clock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" style={{ color: '#9CA3AF' }} />
              {formatHm(totalHours)} total
            </span>
          </div>

          {/* Deny comment if denied */}
          {record.status === 3 && record.denyComment && (
            <div className="rounded-lg flex items-start gap-2 mt-3"
              style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', padding: '10px 12px' }}>
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#991B1B' }}>Denied</p>
                <p style={{ fontSize: '12px', color: '#B91C1C' }}>"{record.denyComment}"</p>
              </div>
            </div>
          )}
        </div>

        {/* Body — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {isLoading ? (
            <div className="flex items-center justify-center" style={{ padding: '60px 0' }}>
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6B7280' }} />
              <span style={{ marginLeft: '10px', color: '#6B7280', fontSize: '14px' }}>Loading snapshot…</span>
            </div>
          ) : (
            <>
              {/* Project summary */}
              {projectTotals.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Summary by Project
                  </h3>
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
                    {projectTotals.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                        style={{ padding: '10px 14px', borderBottom: i < projectTotals.length - 1 ? '1px solid #F3F4F6' : 'none', backgroundColor: i % 2 === 0 ? 'white' : '#FAFAFA' }}
                      >
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                          <span style={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>{p.name}</span>
                          {p.code && p.code !== 'NONE' && (
                            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{p.code}</span>
                          )}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{formatHm(p.hours)}</span>
                      </div>
                    ))}
                    <div
                      className="flex items-center justify-between"
                      style={{ padding: '10px 14px', backgroundColor: '#F9FAFB', borderTop: '2px solid #E5E7EB' }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Total</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                        {formatHm(totalHours)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Event entries */}
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Activity / Event Details
                </h3>
                {entries.length === 0 ? (
                  <div className="rounded-xl border flex flex-col items-center justify-center"
                    style={{ borderColor: '#E5E7EB', padding: '32px', textAlign: 'center' }}>
                    <Calendar className="w-7 h-7 mb-2" style={{ color: '#D1D5DB' }} />
                    <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
                      Event snapshot not returned by server
                    </p>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                      The approved total of <strong>{formatHm(totalHours)}</strong> is correct —
                      individual entries are stored server-side
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...entries]
                      .sort((a, b) => {
                        const da = parseDate(a.date), db = parseDate(b.date);
                        return da && db ? da.getTime() - db.getTime() : 0;
                      })
                      .map(entry => {
                        const d = parseDate(entry.date);
                        const h = parseHours(entry.hours);
                        return (
                          <div
                            key={entry.id}
                            className="rounded-lg border"
                            style={{ padding: '10px 14px', borderColor: '#E5E7EB', backgroundColor: 'white' }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '3px' }}>
                                  {entry.description || '(No title)'}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {d && (
                                    <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                      {d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </span>
                                  )}
                                  {entry.project && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                                      style={{ fontSize: '11px', backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                                      <Briefcase className="w-2.5 h-2.5" />{entry.project.name}
                                    </span>
                                  )}
                                  {entry.task && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                                      style={{ fontSize: '11px', backgroundColor: '#FEF3C7', color: '#92400E' }}>
                                      <FileText className="w-2.5 h-2.5" />{entry.task.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: '#374151', flexShrink: 0 }}>
                                {formatHm(h)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer — action buttons for PENDING timesheets */}
        {record.status === 1 && onApprove && onDeny && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', flexShrink: 0 }}>
            {denyMode ? (
              <div>
                <textarea
                  rows={2}
                  placeholder="Reason for denial…"
                  value={denyComment}
                  onChange={e => setDenyComment(e.target.value)}
                  autoFocus
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none resize-none"
                  style={{ borderColor: '#D1D5DB', fontSize: '13px', marginBottom: '10px' }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDeny}
                    disabled={!denyComment.trim() || actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium flex-1 justify-center"
                    style={{ backgroundColor: !denyComment.trim() || actionLoading ? '#FCA5A5' : '#DC2626' }}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Confirm Denial
                  </button>
                  <button onClick={() => { setDenyMode(false); setDenyComment(''); }}
                    className="px-4 py-2 rounded-lg text-sm border" style={{ color: '#6B7280', borderColor: '#E5E7EB' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium flex-1 justify-center"
                  style={{ backgroundColor: actionLoading ? '#6EE7B7' : '#10B981' }}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve
                </button>
                <button
                  onClick={() => setDenyMode(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border flex-1 justify-center"
                  style={{ borderColor: '#FECACA', color: '#991B1B', backgroundColor: '#FEF2F2' }}
                >
                  <XCircle className="w-4 h-4" />Deny
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================
// Approval Panel
// ============================================================================

type ApprovalFilter = 1 | 2 | 3; // 1=Pending, 2=Approved, 3=Denied

function ApprovalPanel() {
  const [filter, setFilter] = useState<ApprovalFilter>(1);
  const [records, setRecords] = useState<TimesheetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [denyComment, setDenyComment] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<TimesheetRecord | null>(null);

  const load = useCallback(async (status: ApprovalFilter) => {
    setIsLoading(true);
    const data = await dashboardApi.getTeamTimesheets(status);
    setRecords(data);
    setIsLoading(false);
  }, []);

  // Also keep the pending count up-to-date for the badge
  const refreshPendingCount = useCallback(async () => {
    const data = await dashboardApi.getTeamTimesheets(1);
    setPendingCount(data.length);
    if (filter === 1) setRecords(data);
  }, [filter]);

  useEffect(() => { load(filter); }, [filter, load]);
  useEffect(() => { refreshPendingCount(); }, []);

  const handleApprove = async (record: TimesheetRecord) => {
    setActionLoading(record.id);
    try {
      await apiClient.post(ENDPOINTS.UPDATE_TIMESHEET, { id: record.id, status: 2 });
      // Remove from pending list, update pending count
      setRecords(prev => prev.filter(r => r.id !== record.id));
      setPendingCount(c => Math.max(0, c - 1));
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (record: TimesheetRecord) => {
    if (!denyComment.trim()) return;
    setActionLoading(record.id);
    try {
      await apiClient.post(ENDPOINTS.UPDATE_TIMESHEET, { id: record.id, status: 3, denyComment: denyComment.trim() });
      setRecords(prev => prev.filter(r => r.id !== record.id));
      setPendingCount(c => Math.max(0, c - 1));
      setNoteFor(null);
      setDenyComment('');
    } catch (err) {
      console.error('Deny failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getUserName = (record: TimesheetRecord) => {
    if (!record.user) return 'Unknown Employee';
    return record.user.fullName || `${record.user.firstName ?? ''} ${record.user.lastName ?? ''}`.trim() || 'Unknown Employee';
  };

  const formatPeriod = (record: TimesheetRecord) => {
    const d = parseDate(record.startAt);
    return d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : record.startAt;
  };

  const filterTabs: { status: ApprovalFilter; label: string }[] = [
    { status: 1, label: 'Pending' },
    { status: 2, label: 'Approved' },
    { status: 3, label: 'Denied' },
  ];

  // Card styles per status
  const cardStyle = (status: ApprovalFilter): React.CSSProperties => ({
    1: { borderColor: '#BFDBFE', backgroundColor: '#F0F9FF' },
    2: { borderColor: '#A7F3D0', backgroundColor: '#F0FDF4' },
    3: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  }[status] as React.CSSProperties);

  return (
    <div>
      {/* Detail slide-over */}
      {selectedRecord && (
        <TimesheetDetailPanel
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onApprove={filter === 1 ? handleApprove : undefined}
          onDeny={filter === 1 ? async (r, comment) => {
            // handleDeny reads denyComment state — set it first
            setDenyComment(comment);
            setNoteFor(r.id);
            // call API directly so we don't depend on state timing
            setActionLoading(r.id);
            try {
              await apiClient.post(ENDPOINTS.UPDATE_TIMESHEET, { id: r.id, status: 3, denyComment: comment });
              setRecords(prev => prev.filter(x => x.id !== r.id));
              setPendingCount(c => Math.max(0, c - 1));
            } catch (err) { console.error('Deny failed:', err); }
            finally { setActionLoading(null); setNoteFor(null); }
          } : undefined}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2" style={{ marginBottom: '20px' }}>
        <Users className="w-5 h-5" style={{ color: '#6B7280' }} />
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>Manager Approval Panel</h3>
        <button
          onClick={() => load(filter)}
          className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" style={{ color: '#6B7280' }} />
        </button>
      </div>

      {/* Filter tabs: Pending / Approved / Denied */}
      <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: '#F3F4F6', marginBottom: '20px', width: 'fit-content' }}>
        {filterTabs.map(({ status, label }) => (
          <button
            key={status}
            onClick={() => { setFilter(status); setNoteFor(null); setDenyComment(''); }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all"
            style={{
              backgroundColor: filter === status ? 'white' : 'transparent',
              color: filter === status ? '#111827' : '#6B7280',
              boxShadow: filter === status ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {label}
            {status === 1 && pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: '40px' }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6B7280' }} />
          <span style={{ marginLeft: '10px', color: '#6B7280', fontSize: '14px' }}>Loading…</span>
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-xl border flex flex-col items-center justify-center"
          style={{ borderColor: '#E5E7EB', padding: '48px', textAlign: 'center' }}>
          <CheckCircle className="w-8 h-8 mb-2" style={{ color: '#D1D5DB' }} />
          <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
            {filter === 1 ? 'No timesheets pending review' : filter === 2 ? 'No approved timesheets yet' : 'No denied timesheets'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(record => {
            const isActing = actionLoading === record.id;
            return (
              <div
                key={record.id}
                className="rounded-xl border"
                style={{ padding: '16px', ...cardStyle(filter), cursor: 'pointer' }}
                onClick={(e) => {
                  // Don't open detail if clicking a button inside the card
                  if ((e.target as HTMLElement).closest('button')) return;
                  setSelectedRecord(record);
                }}
              >
                <div className="flex items-start justify-between" style={{ marginBottom: filter === 1 ? '12px' : '0' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{getUserName(record)}</p>
                    <p style={{ fontSize: '13px', color: '#6B7280' }}>Period starting {formatPeriod(record)}</p>
                    {/* Deny reason shown in Denied tab */}
                    {filter === 3 && record.denyComment && (
                      <p style={{ fontSize: '12px', color: '#B91C1C', marginTop: '4px' }}>
                        Reason: "{record.denyComment}"
                      </p>
                    )}
                    <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                      Click to view details →
                    </p>
                  </div>
                  <div className="text-right">
                    <p style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                      {formatHm(parseHours(record.hours))}
                    </p>
                    <StatusBadge status={record.status} />
                    {/* Approved: manager can still deny */}
                    {filter === 2 && (
                      <button
                        onClick={() => { setNoteFor(record.id); setDenyComment(''); }}
                        className="mt-2 flex items-center gap-1 text-xs"
                        style={{ color: '#DC2626', marginLeft: 'auto' }}
                      >
                        <XCircle className="w-3 h-3" />Revoke
                      </button>
                    )}
                  </div>
                </div>

                {/* Revoke (deny from approved) */}
                {filter === 2 && noteFor === record.id && (
                  <div style={{ marginTop: '12px' }}>
                    <textarea
                      rows={2}
                      placeholder="Reason for denial…"
                      value={denyComment}
                      onChange={e => setDenyComment(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 focus:outline-none resize-none"
                      style={{ borderColor: '#D1D5DB', fontSize: '13px', marginBottom: '8px' }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeny(record)}
                        disabled={!denyComment.trim() || isActing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-medium"
                        style={{ backgroundColor: !denyComment.trim() || isActing ? '#FCA5A5' : '#DC2626' }}
                      >
                        {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        Confirm Denial
                      </button>
                      <button onClick={() => { setNoteFor(null); setDenyComment(''); }}
                        className="px-3 py-1.5 rounded-lg text-sm" style={{ color: '#6B7280' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Pending actions */}
                {filter === 1 && (
                  noteFor === record.id ? (
                    <div>
                      <textarea
                        rows={2}
                        placeholder="Reason for denial…"
                        value={denyComment}
                        onChange={e => setDenyComment(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 focus:outline-none resize-none"
                        style={{ borderColor: '#D1D5DB', fontSize: '13px', marginBottom: '8px' }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeny(record)}
                          disabled={!denyComment.trim() || isActing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-medium"
                          style={{ backgroundColor: !denyComment.trim() || isActing ? '#FCA5A5' : '#DC2626' }}
                        >
                          {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          Confirm Denial
                        </button>
                        <button onClick={() => { setNoteFor(null); setDenyComment(''); }}
                          className="px-3 py-1.5 rounded-lg text-sm" style={{ color: '#6B7280' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(record)}
                        disabled={isActing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-medium"
                        style={{ backgroundColor: isActing ? '#6EE7B7' : '#10B981' }}
                      >
                        {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                      <button
                        onClick={() => { setNoteFor(record.id); setDenyComment(''); }}
                        disabled={isActing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border"
                        style={{ borderColor: '#FECACA', color: '#991B1B', backgroundColor: '#FEF2F2' }}
                      >
                        <XCircle className="w-3.5 h-3.5" />Deny
                      </button>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

type ViewMode = 'week' | 'month';
type Tab = 'timesheet' | 'approval';

export function TimesheetView() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [activeTab, setActiveTab] = useState<Tab>('timesheet');
  const [calendarEntries, setCalendarEntries] = useState<TimesheetEntry[]>([]);
  // Manual entries are only populated by in-session LogTimeForm saves (no API load)
  const [manualEntries, setManualEntries] = useState<TimesheetEntry[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [myRecords, setMyRecords] = useState<TimesheetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const weekStart = useMemo(() => addDays(getWeekStart(new Date()), weekOffset * 7), [weekOffset]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const monthDate = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1), [monthOffset]);
  const monthStart = useMemo(() => new Date(monthDate.getFullYear(), monthDate.getMonth(), 1), [monthDate]);
  const monthEnd = useMemo(() => new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0), [monthDate]);

  const fetchStart = viewMode === 'week' ? weekStart : monthStart;
  const fetchEnd = viewMode === 'week' ? weekEnd : monthEnd;

  // Load calendar events + projects — these control the loading spinner
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      dashboardApi.getEvents(fetchStart, fetchEnd),
      dashboardApi.getProjectsSummary(),
    ]).then(([events, projs]) => {
      if (cancelled) return;
      setCalendarEntries(events.map(eventToEntry));
      setProjects(projs);
      setIsLoading(false);
    }).catch(err => {
      if (cancelled) return;
      setError(err instanceof Error ? err.message : 'Failed to load timesheet data');
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [fetchStart.getTime(), fetchEnd.getTime()]);

  // Load submission records in the background — does not block the calendar display
  useEffect(() => {
    let cancelled = false;
    dashboardApi.getMyTimesheetRecords().then(records => {
      if (!cancelled) setMyRecords(records);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Pending count for approval badge — only fetch once on mount, not on every tab switch
  useEffect(() => {
    dashboardApi.getTeamTimesheets(1).then(recs => setPendingCount(recs.length)).catch(() => {});
  }, []);

  // All entries for current period
  const allEntries = useMemo(() => {
    const periodStart = viewMode === 'week' ? weekStart : monthStart;
    const periodEnd = viewMode === 'week' ? weekEnd : monthEnd;
    const inPeriod = (dateStr: string) => {
      const d = parseDate(dateStr);
      return d ? d >= periodStart && d <= periodEnd : false;
    };
    const calIds = new Set(calendarEntries.map(e => e.id));
    const periodManual = manualEntries.filter(e => inPeriod(e.date) && !calIds.has(e.id));
    return [...calendarEntries, ...periodManual];
  }, [calendarEntries, manualEntries, weekStart, weekEnd, monthStart, monthEnd, viewMode]);

  const calendarIds = useMemo(() => new Set(calendarEntries.map(e => e.id)), [calendarEntries]);
  const periodTotal = useMemo(() => allEntries.reduce((s, t) => s + parseHours(t.hours), 0), [allEntries]);

  // Current period's submitted record (if any)
  const periodStart = viewMode === 'week' ? weekStart : monthStart;
  const currentRecord = useMemo(
    () => findRecordForPeriod(myRecords, periodStart, viewMode),
    [myRecords, periodStart, viewMode]
  );

  const visibleEntries = useMemo(() => {
    if (!selectedDay) return allEntries;
    const dayStr = toDisplayDate(selectedDay);
    return allEntries.filter(t => t.date === dayStr);
  }, [allEntries, selectedDay]);

  const groupedEntries = useMemo(() => {
    const map = new Map<string, TimesheetEntry[]>();
    for (const t of visibleEntries) {
      const arr = map.get(t.date) || [];
      arr.push(t);
      map.set(t.date, arr);
    }
    return Array.from(map.entries()).sort((a, b) => {
      const da = parseDate(a[0]);
      const db = parseDate(b[0]);
      if (!da || !db) return 0;
      return db.getTime() - da.getTime();
    });
  }, [visibleEntries]);

  const periodLabel = viewMode === 'week'
    ? formatWeekRange(weekStart)
    : `${MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear()}`;

  // Submit timesheet for current period
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (currentRecord && currentRecord.status === 3) {
        // DENIED → resubmit: update status back to PENDING (1)
        // Backend recalculates snapshot from current calendar events
        await apiClient.post(ENDPOINTS.UPDATE_TIMESHEET, { id: currentRecord.id, status: 1 });
        setMyRecords(prev => prev.map(r =>
          r.id === currentRecord.id ? { ...r, status: 1, denyComment: undefined } : r
        ));
      } else {
        // New submission
        const newId = crypto.randomUUID();
        await apiClient.post(ENDPOINTS.CREATE_TIMESHEET, { id: newId });
        const newRecord: TimesheetRecord = {
          id: newId,
          status: 1,
          hours: periodTotal,
          startAt: fetchStart.toISOString(),
        };
        setMyRecords(prev => [...prev, newRecord]);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit timesheet');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentRecord, periodTotal, fetchStart]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportToPDF(allEntries, periodLabel, toDisplayDate(fetchStart), toDisplayDate(fetchEnd), 'Current User', currentRecord);
    } finally {
      setIsExporting(false);
    }
  }, [allEntries, periodLabel, fetchStart, fetchEnd, currentRecord]);

  const openLogForm = useCallback(() => {
    setForm({ ...EMPTY_FORM, date: toInputDate(selectedDay || new Date()) });
    setEditingEntry(null);
    setShowForm(true);
    setSaveError(null);
  }, [selectedDay]);

  const openEditForm = useCallback((entry: TimesheetEntry) => {
    const d = parseDate(entry.date);
    setForm({ date: d ? toInputDate(d) : toInputDate(new Date()), hours: entry.hours, projectId: entry.project?.id || '', description: entry.description || '' });
    setEditingEntry(entry);
    setShowForm(true);
    setSaveError(null);
  }, []);

  const cancelForm = useCallback(() => { setShowForm(false); setEditingEntry(null); setSaveError(null); }, []);

  const handleSave = useCallback(async () => {
    if (!form.date || !form.hours) return;
    setIsSaving(true);
    setSaveError(null);
    const payload: Record<string, any> = { date: fromInputDate(form.date), hours: form.hours };
    if (form.projectId) payload.project = { id: form.projectId };
    if (form.description.trim()) payload.description = form.description.trim();
    try {
      if (editingEntry) {
        await apiClient.post(ENDPOINTS.UPDATE_TIMESHEET, { id: editingEntry.id, ...payload });
        setManualEntries(prev => prev.map(t => t.id === editingEntry.id ? {
          ...t, date: payload.date, hours: payload.hours,
          project: form.projectId ? { id: form.projectId, name: projects.find(p => p.id === form.projectId)?.name || '' } : t.project,
          description: payload.description,
        } : t));
      } else {
        const result = await apiClient.post<TimesheetEntry>(ENDPOINTS.CREATE_TIMESHEET, payload);
        const newEntry: TimesheetEntry = result ?? {
          id: `manual-${Date.now()}`,
          user: { id: '', fullName: '' },
          date: payload.date,
          hours: payload.hours,
          project: form.projectId ? { id: form.projectId, name: projects.find(p => p.id === form.projectId)?.name || '' } : undefined,
          description: payload.description,
        };
        setManualEntries(prev => [newEntry, ...prev]);
      }
      setShowForm(false);
      setEditingEntry(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [form, editingEntry, projects]);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      await apiClient.post(ENDPOINTS.DELETE_TIMESHEET, { id });
      setManualEntries(prev => prev.filter(t => t.id !== id));
    } catch {
    } finally {
      setDeletingId(null);
    }
  }, []);

  const handleSelectDay = useCallback((day: Date) => {
    setSelectedDay(prev => prev && isSameDay(prev, day) ? null : day);
    if (viewMode === 'month') setViewMode('week');
  }, [viewMode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '400px' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6B7280' }} />
        <span style={{ marginLeft: '12px', color: '#6B7280', fontSize: '14px' }}>Loading timesheets…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: '400px' }}>
        <AlertCircle className="w-8 h-8 mb-3" style={{ color: '#DC2626' }} />
        <p style={{ color: '#DC2626', fontSize: '14px' }}>{error}</p>
      </div>
    );
  }

  // Submit button state
  const isDenied = currentRecord?.status === 3;
  const isPending = currentRecord?.status === 1;
  const isApproved = currentRecord?.status === 2;
  const canSubmit = !currentRecord || isDenied;

  return (
    <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-start justify-between" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>Timesheets</h2>
          <p style={{ fontSize: '13px', color: '#6B7280' }}>
            Hours pulled from calendar events marked as timesheet — log additional time as needed
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {currentRecord && <StatusBadge status={currentRecord.status} />}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#D1D5DB', color: '#374151' }}
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export PDF
          </button>
          {canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || periodTotal === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: isSubmitting || periodTotal === 0 ? '#93C5FD' : '#0066FF' }}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isDenied ? 'Resubmit Timesheet' : 'Submit Timesheet'}
            </button>
          )}
          {isPending && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: '13px', fontWeight: 500 }}>
              <Clock className="w-4 h-4" />Awaiting approval
            </div>
          )}
          {isApproved && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '13px', fontWeight: 500 }}>
              <CheckCircle className="w-4 h-4" />Approved
            </div>
          )}
        </div>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="rounded-lg flex items-center gap-2 mb-4" style={{ padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: '13px' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{submitError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: '#F3F4F6', marginBottom: '20px', width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab('timesheet')}
          className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all"
          style={{ backgroundColor: activeTab === 'timesheet' ? 'white' : 'transparent', color: activeTab === 'timesheet' ? '#111827' : '#6B7280', boxShadow: activeTab === 'timesheet' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
        >
          <CalendarDays className="w-4 h-4" />My Timesheet
        </button>
        <button
          onClick={() => setActiveTab('approval')}
          className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all"
          style={{ backgroundColor: activeTab === 'approval' ? 'white' : 'transparent', color: activeTab === 'approval' ? '#111827' : '#6B7280', boxShadow: activeTab === 'approval' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
        >
          <Users className="w-4 h-4" />Approvals
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'approval' && <ApprovalPanel />}

      {activeTab === 'timesheet' && (
        <>
          {/* View mode + Navigation */}
          <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: '#F3F4F6' }}>
                <button
                  onClick={() => { setViewMode('week'); setSelectedDay(null); }}
                  className="px-3 py-1 rounded-md text-sm font-medium transition-all"
                  style={{ backgroundColor: viewMode === 'week' ? 'white' : 'transparent', color: viewMode === 'week' ? '#111827' : '#6B7280', boxShadow: viewMode === 'week' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none' }}
                >Week</button>
                <button
                  onClick={() => { setViewMode('month'); setSelectedDay(null); }}
                  className="px-3 py-1 rounded-md text-sm font-medium transition-all"
                  style={{ backgroundColor: viewMode === 'month' ? 'white' : 'transparent', color: viewMode === 'month' ? '#111827' : '#6B7280', boxShadow: viewMode === 'month' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none' }}
                >Month</button>
              </div>
              <button onClick={() => { viewMode === 'week' ? setWeekOffset(w => w - 1) : setMonthOffset(m => m - 1); setSelectedDay(null); }}
                className="p-1.5 rounded-lg border hover:bg-gray-50 transition-colors" style={{ borderColor: '#E5E7EB' }}>
                <ChevronLeft className="w-4 h-4" style={{ color: '#6B7280' }} />
              </button>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{periodLabel}</span>
              <button onClick={() => { viewMode === 'week' ? setWeekOffset(w => w + 1) : setMonthOffset(m => m + 1); setSelectedDay(null); }}
                className="p-1.5 rounded-lg border hover:bg-gray-50 transition-colors" style={{ borderColor: '#E5E7EB' }}>
                <ChevronRight className="w-4 h-4" style={{ color: '#6B7280' }} />
              </button>
              {(weekOffset !== 0 || monthOffset !== 0) && (
                <button onClick={() => { setWeekOffset(0); setMonthOffset(0); setSelectedDay(null); }}
                  style={{ color: '#0066FF', fontSize: '12px', fontWeight: 500 }}
                  className="px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                  Today
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#F3F4F6' }}>
              <Clock className="w-4 h-4" style={{ color: '#6B7280' }} />
              <span style={{ fontSize: '13px', color: '#374151' }}>
                {viewMode === 'week' ? 'Week' : 'Month'} total: <strong>{periodTotal.toFixed(1)}h</strong>
              </span>
              {viewMode === 'week' && periodTotal >= 40 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>✓ Full week</span>
              )}
            </div>
          </div>

          {/* Denied banner */}
          {isDenied && currentRecord.denyComment && (
            <div className="rounded-lg border flex items-start gap-3" style={{ borderColor: '#FECACA', backgroundColor: '#FEF2F2', padding: '12px 16px', marginBottom: '16px' }}>
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#991B1B' }}>Timesheet denied</p>
                <p style={{ fontSize: '12px', color: '#B91C1C', marginTop: '2px' }}>"{currentRecord.denyComment}"</p>
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>Fix any issues then click "Resubmit Timesheet"</p>
              </div>
            </div>
          )}

          {/* Calendar view */}
          <div style={{ marginBottom: '24px' }}>
            {viewMode === 'week'
              ? <WeekBar weekStart={weekStart} entries={allEntries} selectedDay={selectedDay} onSelectDay={handleSelectDay} />
              : <MonthGrid monthDate={monthDate} entries={allEntries} onDayClick={handleSelectDay} />
            }
          </div>

          {selectedDay && (
            <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>
                Showing: <strong style={{ color: '#111827' }}>
                  {selectedDay.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </strong>
              </span>
              <button onClick={() => setSelectedDay(null)} className="text-xs px-2 py-0.5 rounded-full hover:bg-gray-100 transition-colors" style={{ color: '#6B7280' }}>
                Show all
              </button>
            </div>
          )}

          <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              {selectedDay ? 'Entries for day' : 'All entries'}
            </h3>
            <button onClick={openLogForm}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border hover:bg-blue-50 transition-colors"
              style={{ borderColor: '#BFDBFE', color: '#0066FF' }}>
              <Plus className="w-4 h-4" />Log Additional Time
            </button>
          </div>

          {showForm && (
            <LogTimeForm form={form} onChange={setForm} onSubmit={handleSave} onCancel={cancelForm}
              projects={projects} isSaving={isSaving} isEdit={!!editingEntry} saveError={saveError} />
          )}

          {groupedEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border"
              style={{ borderColor: '#E5E7EB', padding: '60px 24px', textAlign: 'center' }}>
              <Calendar className="w-10 h-10 mb-3" style={{ color: '#D1D5DB' }} />
              <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '4px' }}>
                {selectedDay ? 'No entries for this day' : `No calendar events this ${viewMode}`}
              </p>
              <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '16px' }}>
                Calendar events marked as "Timesheet" will appear here automatically
              </p>
              <button onClick={openLogForm}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: '#0066FF' }}>
                <Plus className="w-4 h-4" />Log Additional Time
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedEntries.map(([dateStr, entries]) => {
                const d = parseDate(dateStr);
                const dayTotal = entries.reduce((s, t) => s + parseHours(t.hours), 0);
                return (
                  <div key={dateStr}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                        {d ? d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : dateStr}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>{dayTotal.toFixed(1)}h total</span>
                    </div>
                    <div className="space-y-2">
                      {entries.map(entry => (
                        <EntryRow key={entry.id} entry={entry} isFromCalendar={calendarIds.has(entry.id)}
                          onEdit={openEditForm} onDelete={handleDelete} deleting={deletingId === entry.id} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
