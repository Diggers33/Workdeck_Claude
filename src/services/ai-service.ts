/**
 * AI Service
 * Handles Claude API communication via Vite proxy for insight enhancement and chat.
 */

import { ComputedInsight, RawData } from './insights-engine';

// ============================================================================
// Types
// ============================================================================

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
}

// ============================================================================
// AI Service
// ============================================================================

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com';
  private model = 'claude-sonnet-4-5-20250929';
  private chatModel = 'claude-haiku-4-5-20251001'; // Haiku for chat: higher rate limits, faster

  constructor() {
    this.apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
  }

  /**
   * Check if the API key is configured
   */
  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Build a system prompt with real project context, filtered by the user's access rights.
   */
  private buildSystemPrompt(
    insights: ComputedInsight[],
    rawData: RawData,
    currentUser?: {
      fullName?: string; email?: string; id?: string;
      isAdmin?: boolean; isManager?: boolean;
      isExpenseAdmin?: boolean; isClientAdmin?: boolean; isPurchaseAdmin?: boolean;
    } | null
  ): string {
    const { projects, tasks, users, whosWhere, timesheets, expenses, invoices, clients, leaveRequests, whatsNew, departments } = rawData;

    // ── Access role flags ─────────────────────────────────────────────────────
    const uid = currentUser?.id;
    const isAdmin = currentUser?.isAdmin === true;
    const isManager = currentUser?.isManager === true;
    const hasTeamAccess = isAdmin || isManager;
    const hasFinanceAccess = isAdmin || currentUser?.isExpenseAdmin === true || currentUser?.isPurchaseAdmin === true;
    const hasBillingAccess = isAdmin || currentUser?.isClientAdmin === true;

    // ── Scope data to what this user is allowed to see ────────────────────────
    const visibleProjects = hasTeamAccess
      ? projects
      : projects.filter(p => (p.members || []).some(m => m.user?.id === uid));

    const visibleTasks = hasTeamAccess
      ? tasks
      : tasks.filter(t => (t.participants || []).some(p => p.user?.id === uid));

    const visibleTimesheets = hasTeamAccess
      ? timesheets
      : timesheets.filter(ts => ts.user?.id === uid);

    const visibleLeave = hasTeamAccess
      ? leaveRequests
      : leaveRequests.filter(lr => lr.user?.id === uid);

    // ── Department-user mapping (managers/admins only) ────────────────────────
    const deptMap = new Map<string, Set<string>>();
    const userDeptMap = new Map<string, string>();
    if (hasTeamAccess) {
      for (const deptName of departments) {
        if (deptName && typeof deptName === 'string') deptMap.set(deptName.trim(), new Set());
      }
      for (const user of users) {
        const deptName = typeof user.department === 'string' ? user.department : user.department?.name;
        if (deptName) {
          const trimmed = deptName.trim();
          if (!deptMap.has(trimmed)) deptMap.set(trimmed, new Set());
          deptMap.get(trimmed)!.add(user.fullName);
          userDeptMap.set(user.id, trimmed);
        }
      }
    }
    const assignedUserIds = new Set(userDeptMap.keys());
    const unassignedUsers = hasTeamAccess ? users.filter(u => !assignedUserIds.has(u.id)) : [];

    // Helper: parse DD/MM/YYYY to YYYY-MM key
    const toMonthKey = (dateStr: string): string | null => {
      const parts = (dateStr || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      return parts ? `${parts[3]}-${parts[2].padStart(2, '0')}` : null;
    };

    // ── Project lines ─────────────────────────────────────────────────────────
    const projectLines = visibleProjects.slice(0, 30).map(p => {
      const spent = parseFloat(p.spentHours || '0') || 0;
      const planned = parseFloat(p.plannedHours || '0') || 0;
      const status = spent > planned ? 'OVER BUDGET' : 'OK';
      const memberNames = hasTeamAccess
        ? (p.members || []).map(m => `${m.user.fullName}${m.isProjectManager ? ' (PM)' : ''}`).join(', ')
        : '';
      const clientName = hasBillingAccess && p.client?.name ? ` [Client: ${p.client.name}]` : '';
      return `- ${p.name} (${p.code}): ${spent.toFixed(0)}h/${planned.toFixed(0)}h planned, ${status}${clientName}${p.startDate ? `, ${p.startDate}–${p.endDate || '?'}` : ''}${memberNames ? `\n  Members: ${memberNames}` : ''}`;
    }).join('\n');

    // ── Department lines ──────────────────────────────────────────────────────
    const deptLines = hasTeamAccess
      ? Array.from(deptMap.entries()).sort((a, b) => b[1].size - a[1].size)
          .map(([dept, members]) => `- ${dept} (${members.size}): ${Array.from(members).join(', ')}`).join('\n')
      : '';
    const unassignedLine = unassignedUsers.length > 0
      ? `\n- Unassigned (${unassignedUsers.length}): ${unassignedUsers.slice(0, 20).map(u => u.fullName).join(', ')}${unassignedUsers.length > 20 ? '...' : ''}`
      : '';

    // ── Timesheet utilization ─────────────────────────────────────────────────
    const deptMonthHours = new Map<string, Map<string, number>>();
    const userMonthHours = new Map<string, Map<string, number>>();
    for (const ts of visibleTimesheets) {
      const hours = parseFloat(ts.hours || '0') || 0;
      if (hours <= 0) continue;
      const monthKey = toMonthKey(ts.date);
      if (!monthKey) continue;
      if (hasTeamAccess) {
        const dept = userDeptMap.get(ts.user.id) || 'Unknown';
        if (!deptMonthHours.has(dept)) deptMonthHours.set(dept, new Map());
        const dm = deptMonthHours.get(dept)!;
        dm.set(monthKey, (dm.get(monthKey) || 0) + hours);
      }
      const userName = ts.user.fullName;
      if (!userMonthHours.has(userName)) userMonthHours.set(userName, new Map());
      const um = userMonthHours.get(userName)!;
      um.set(monthKey, (um.get(monthKey) || 0) + hours);
    }

    const utilizationLines: string[] = [];
    if (hasTeamAccess) {
      for (const [dept, monthMap] of Array.from(deptMonthHours.entries()).sort()) {
        const months = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([m, h]) => `${m}: ${h.toFixed(1)}h`).join(', ');
        utilizationLines.push(`- ${dept} (${deptMap.get(dept)?.size || 1} members): ${months}`);
      }
    }

    const userUtilLines: string[] = [];
    const sortedUtilUsers = Array.from(userMonthHours.entries())
      .map(([name, monthMap]) => ({ name, monthMap, totalHours: Array.from(monthMap.values()).reduce((a, b) => a + b, 0) }))
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, hasTeamAccess ? 15 : 1);
    for (const { name, monthMap } of sortedUtilUsers) {
      const months = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([m, h]) => `${m}: ${h.toFixed(1)}h`).join(', ');
      const dept = hasTeamAccess ? (users.find(u => u.fullName === name)?.department?.name || '') : '';
      userUtilLines.push(`- ${name}${dept ? ` [${dept}]` : ''}: ${months}`);
    }

    // ── Leave ─────────────────────────────────────────────────────────────────
    const leaveStatusLabel = (s: number) => s === 0 ? 'Pending' : s === 1 ? 'Approved' : 'Denied';
    const leaveLines = visibleLeave.slice(0, 25).map(lr =>
      `- ${lr.user.fullName}: ${lr.leaveType.name}, ${lr.startDate}–${lr.endDate} (${lr.days}d, ${leaveStatusLabel(lr.status)})`
    ).join('\n');
    const approvedLeave = visibleLeave.filter(lr => lr.status === 1);
    const leaveSummary = new Map<string, number>();
    for (const lr of approvedLeave) {
      const dept = userDeptMap.get(lr.user.id) || 'Unknown';
      leaveSummary.set(dept, (leaveSummary.get(dept) || 0) + lr.days);
    }
    const leaveSummaryLines = hasTeamAccess
      ? Array.from(leaveSummary.entries()).sort((a, b) => b[1] - a[1]).map(([dept, days]) => `- ${dept}: ${days} approved leave days`).join('\n')
      : '';

    // ── Expenses (finance admins only) ────────────────────────────────────────
    let expenseProjectLines = 'Not available for your role.';
    let expenseCategoryLines = '';
    let expenseMonthLines = '';
    if (hasFinanceAccess) {
      const byProject = new Map<string, number>();
      const byMonth = new Map<string, number>();
      const byCategory = new Map<string, number>();
      for (const exp of expenses) {
        const amount = parseFloat(exp.amount || '0') || 0;
        if (amount <= 0) continue;
        const projKey = exp.project?.name || 'Unassigned';
        byProject.set(projKey, (byProject.get(projKey) || 0) + amount);
        const mk = toMonthKey(exp.date);
        if (mk) byMonth.set(mk, (byMonth.get(mk) || 0) + amount);
        const catKey = exp.category || 'Other';
        byCategory.set(catKey, (byCategory.get(catKey) || 0) + amount);
      }
      expenseProjectLines = Array.from(byProject.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([p, a]) => `- ${p}: ${a.toFixed(2)}`).join('\n') || 'None.';
      expenseCategoryLines = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]).map(([c, a]) => `- ${c}: ${a.toFixed(2)}`).join('\n');
      expenseMonthLines = Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([m, a]) => `${m}: ${a.toFixed(2)}`).join(', ');
    }

    // ── Invoices & clients (billing admins only) ──────────────────────────────
    let invoiceLines = 'Not available for your role.';
    let recentInvoices = '';
    let clientLines = 'Not available for your role.';
    if (hasBillingAccess) {
      const invoiceStatusMap = new Map<string, { count: number; total: number }>();
      for (const inv of invoices) {
        const total = parseFloat(inv.total || inv.amount || '0') || 0;
        const status = inv.status || 'Unknown';
        const existing = invoiceStatusMap.get(status) || { count: 0, total: 0 };
        existing.count++; existing.total += total;
        invoiceStatusMap.set(status, existing);
      }
      invoiceLines = Array.from(invoiceStatusMap.entries()).map(([s, { count, total }]) => `- ${s}: ${count} invoices, total ${total.toFixed(2)}`).join('\n') || 'No invoices.';
      recentInvoices = invoices.slice(0, 10).map(inv => `- #${inv.number}: ${inv.client?.name || 'N/A'}, ${inv.total}${inv.currency?.symbol || ''}, ${inv.status}, due ${inv.dueDate || 'N/A'}`).join('\n');
      clientLines = clients.map(c => `- ${c.name}${c.contactName ? ` (${c.contactName})` : ''}${c.email ? `, ${c.email}` : ''}`).join('\n') || 'No clients.';
    }

    // ── Who's where ───────────────────────────────────────────────────────────
    const locationSummary = new Map<string, number>();
    for (const entry of whosWhere) {
      const status = entry.status || 'Unknown';
      locationSummary.set(status, (locationSummary.get(status) || 0) + 1);
    }
    const locationLines = Array.from(locationSummary.entries()).map(([s, c]) => `${s}: ${c}`).join(', ');

    // ── Insights ──────────────────────────────────────────────────────────────
    const insightLines = insights.slice(0, 10).map(i =>
      `- [${i.priority.toUpperCase()}] ${i.type}: ${i.title} (${i.confidence}% confidence)`
    ).join('\n');

    // ── Tasks (scoped) ────────────────────────────────────────────────────────
    const activeTasks = visibleTasks.filter(t => t.column?.systemCode !== 3);
    const doneTasks = visibleTasks.filter(t => t.column?.systemCode === 3);
    const today = new Date().toISOString().slice(0, 10);
    const sortedTasks = [...activeTasks].sort((a, b) => {
      const aOverdue = a.endDate && a.endDate < today ? 1 : 0;
      const bOverdue = b.endDate && b.endDate < today ? 1 : 0;
      if (bOverdue !== aOverdue) return bOverdue - aOverdue;
      return (b.importance || 0) - (a.importance || 0);
    });
    const taskLines = sortedTasks.slice(0, 60).map(t => {
      const project = t.activity?.project?.name || t.activity?.name || '?';
      const assignees = (t.participants || []).map(p => (p.user?.fullName || '').split(' ')[0]).filter(Boolean).join('/') || '-';
      const due = t.endDate ? t.endDate : '';
      const overdue = t.endDate && t.endDate < today ? '!' : '';
      const importance = t.importance === 3 ? 'H' : t.importance === 2 ? 'M' : '';
      const status = t.column?.name || '?';
      return `${overdue}[${project}] ${t.name}${importance ? ' [' + importance + ']' : ''}${due ? ' due:' + due : ''} | ${status} | ${assignees}`;
    }).join('\n');

    // ── Recent activity ───────────────────────────────────────────────────────
    const recentActivityLines = whatsNew.slice(0, 10).map(item =>
      `- [${item.type}] ${item.title}: ${item.message} (${item.date})`
    ).join('\n');

    // ── Role context for prompt ───────────────────────────────────────────────
    const roleLabel = isAdmin ? 'Admin' : isManager ? 'Manager' : 'Team Member';
    const accessNote = isAdmin
      ? 'Full access to all company data.'
      : isManager
      ? "Access to your team's projects, tasks, timesheets, and leave. Financial data requires finance/billing admin role."
      : 'Access limited to your own projects, tasks, timesheets, and leave.';

    const currentUserSection = currentUser?.fullName
      ? `CURRENT USER: ${currentUser.fullName}${currentUser.email ? ` (${currentUser.email})` : ''} — Role: ${roleLabel}
Access: ${accessNote}
When the user says "my tasks", "what am I working on", "my projects", "my hours", "my leave" etc., filter data for this person.

`
      : '';

    return `You are a project management AI assistant for Workdeck. Answer using ONLY the data below — it has been filtered to what this user is authorised to see.

${currentUserSection}PROJECTS (${visibleProjects.length} visible to you):
${projectLines || 'No projects available.'}

${hasBillingAccess ? `CLIENTS (${clients.length} total):\n${clientLines}\n\n` : ''}${hasTeamAccess ? `DEPARTMENTS & TEAMS:\n${deptLines || 'No departments configured.'}${unassignedLine}\n\n` : ''}TASKS (${activeTasks.length} active, ${doneTasks.length} done — overdue and high-importance first):
${taskLines || 'No active tasks.'}

${hasTeamAccess ? `UTILIZATION BY DEPARTMENT (hours logged per month):\n${utilizationLines.length > 0 ? utilizationLines.join('\n') : 'No timesheet data.'}\n\n` : ''}UTILIZATION${hasTeamAccess ? ' BY TEAM MEMBER' : ''} (hours logged per month):
${userUtilLines.length > 0 ? userUtilLines.join('\n') : 'No timesheet data.'}

LEAVE REQUESTS (${visibleLeave.length} visible to you):
${leaveLines || 'No leave requests.'}
${leaveSummaryLines ? `\nApproved Leave by Department:\n${leaveSummaryLines}` : ''}

EXPENSES (${hasFinanceAccess ? expenses.length + ' total' : 'restricted'}):
${hasFinanceAccess ? `By project:\n${expenseProjectLines}\nBy category:\n${expenseCategoryLines}\nMonthly trend: ${expenseMonthLines || 'N/A'}` : 'Not available for your role.'}

INVOICES (${hasBillingAccess ? invoices.length + ' total' : 'restricted'}):
${invoiceLines}${recentInvoices ? `\nRecent:\n${recentInvoices}` : ''}

${locationLines ? `TODAY'S STATUS: ${locationLines}` : ''}

COMPUTED INSIGHTS (${insights.length} total):
${insightLines || 'No insights computed.'}

${recentActivityLines ? `RECENT ACTIVITY:\n${recentActivityLines}` : ''}

OVERVIEW: ${visibleProjects.length} projects, ${activeTasks.length} active tasks, ${visibleTimesheets.length} timesheet entries visible to you

Guidelines:
- Be concise and actionable. Reference specific names and metrics from the data above.
- If the user asks about data outside their role (e.g. expenses as a team member), politely say it is restricted and suggest contacting the relevant admin.
- TASKS: Use the TASKS section for "what is X working on?", "what's overdue?", "who owns Y?", priority tasks etc.
- DEPARTMENTS: If departments are empty, look for a PROJECT with that name and treat its members as the team.
- UTILIZATION: Use UTILIZATION sections when available; approximate from spentHours if empty and say so.
- Cross-reference leave requests with project assignments for capacity questions.
- Format numbers clearly (hours, percentages, days, currency).`;
  }

  /**
   * Send a chat message to Claude with project context, streaming the response token by token.
   * onChunk is called with each text delta as it arrives.
   */
  async sendChatMessage(
    message: string,
    history: Array<{ type: 'user' | 'ai'; message: string }>,
    context: { insights: ComputedInsight[]; rawData: RawData },
    currentUser: {
      fullName?: string; email?: string; id?: string;
      isAdmin?: boolean; isManager?: boolean;
      isExpenseAdmin?: boolean; isClientAdmin?: boolean; isPurchaseAdmin?: boolean;
    } | null | undefined,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('AI service is not configured. Set VITE_ANTHROPIC_API_KEY in your .env file.');
    }

    const systemPrompt = this.buildSystemPrompt(context.insights, context.rawData, currentUser);

    const messages: ChatMessage[] = history.map(h => ({
      role: h.type === 'user' ? 'user' : 'assistant',
      content: h.message,
    }));
    messages.push({ role: 'user', content: message });

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.chatModel,
        system: systemPrompt,
        messages,
        max_tokens: 1024,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Claude API error (${response.status}): ${errorText}`);
    }

    // Read SSE stream
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            onChunk(parsed.delta.text);
          }
        } catch {
          // Ignore non-JSON lines
        }
      }
    }
  }

  /**
   * Enhance top insights with richer AI-generated descriptions
   */
  async enhanceInsights(
    insights: ComputedInsight[],
    rawData: RawData
  ): Promise<ComputedInsight[]> {
    if (!this.isAvailable()) return insights;

    const top5 = insights.slice(0, 5);
    if (top5.length === 0) return insights;

    const systemPrompt = this.buildSystemPrompt(insights, rawData);

    const insightSummaries = top5.map((ins, i) =>
      `${i + 1}. [${ins.type}/${ins.priority}] "${ins.title}": ${ins.description}`
    ).join('\n');

    const userMessage = `Enhance these ${top5.length} insights with richer descriptions and better recommendations. For each insight, provide:
1. An improved description (1-2 sentences, more specific)
2. 3 actionable recommendations

Respond in JSON format:
[{"index": 0, "description": "...", "recommendations": ["...", "...", "..."]}, ...]

Insights:
${insightSummaries}`;

    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: this.model,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
          max_tokens: 1024,
        }),
      });

      if (!response.ok) return insights;

      const data: ClaudeResponse = await response.json();
      const textContent = data.content?.find(c => c.type === 'text');
      if (!textContent?.text) return insights;

      // Parse JSON from response (handle markdown code blocks)
      const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return insights;

      const enhancements: Array<{
        index: number;
        description: string;
        recommendations: string[];
      }> = JSON.parse(jsonMatch[0]);

      // Apply enhancements
      const enhanced = [...insights];
      for (const e of enhancements) {
        if (e.index >= 0 && e.index < top5.length) {
          const originalIdx = insights.indexOf(top5[e.index]);
          if (originalIdx >= 0) {
            enhanced[originalIdx] = {
              ...enhanced[originalIdx],
              description: e.description || enhanced[originalIdx].description,
              recommendations: e.recommendations?.length > 0
                ? e.recommendations
                : enhanced[originalIdx].recommendations,
            };
          }
        }
      }

      return enhanced;
    } catch (error) {
      console.warn('Failed to enhance insights with AI:', error);
      return insights;
    }
  }
}

export const aiService = new AIService();
