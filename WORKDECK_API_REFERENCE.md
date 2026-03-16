# Workdeck API Reference & Patterns

This document captures all learnings about the Workdeck backend API patterns, based on analysis of the Angular frontend and React implementation work.

---

## Table of Contents

1. [Two-Phase Commit System](#two-phase-commit-system)
2. [Endpoint Types](#endpoint-types)
3. [Project Operations](#project-operations)
4. [Participant Management](#participant-management)
5. [Team/Member Management](#teammember-management)
6. [Activity & Task Management](#activity--task-management)
7. [Milestone Management](#milestone-management)
8. [Calendar & Events](#calendar--events)
9. [Timer API](#timer-api)
10. [Move Task API](#move-task-api)
11. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
12. [Frontend UI Patterns](#frontend-ui-patterns)
13. [Payload Formats](#payload-formats)

---

## Two-Phase Commit System

Workdeck uses a **Redis-based two-phase commit system** for project operations:

### How It Works

1. **Mock endpoints** (`/commands/mocks/...`) queue changes to Redis
2. **Commit endpoint** (`/commands/sync/commit-project`) processes the queue and persists to database
3. Changes are not visible until committed

### Why This Pattern?

- **Batching**: Multiple changes can be queued and committed together
- **Optimistic UI**: UI can update immediately while changes are queued
- **Draft/Undo capability**: Changes can be discarded by not committing
- **Atomic operations**: All queued changes succeed or fail together

### Important Rules

- Mock changes are **project-scoped** - each project has its own Redis queue
- Calling `commit-project` processes ALL queued changes for that project
- The queue is cleared after commit

---

## Endpoint Types

### Sync Endpoints (`/commands/sync/...`)

Write **directly** to the database. No commit needed.

```
/commands/sync/create-project
/commands/sync/update-project
/commands/sync/commit-project
/commands/sync/create-event
/commands/sync/update-event
/commands/sync/delete-event
```

### Mock Endpoints (`/commands/mocks/...`)

Queue changes to **Redis**. Require `commit-project` to persist.

```
/commands/mocks/add-task-participant
/commands/mocks/delete-task-participant
/commands/mocks/add-project-member
/commands/mocks/delete-project-member
/commands/mocks/update-project-milestone
/commands/mocks/delete-project-milestone
```

### Query Endpoints (`/queries/...`)

Read-only endpoints for fetching data.

```
/queries/projects/{id}
/queries/tasks/{id}
/queries/gantt/{projectId}
/queries/me/events
/queries/users-summary
```

---

## Project Operations

### Creating a New Project

```typescript
// Use sync endpoint with full payload
await apiClient.post('/commands/sync/create-project', {
  id: projectId,  // Client-generated UUID
  name: 'Project Name',
  code: 'PROJ001',
  startDate: '01/06/2022',  // DD/MM/YYYY format
  endDate: '31/12/2022',
  isDraft: true,
  client: { id: 'client-uuid' },
  activities: [...],
  milestones: [...],
  budgets: [...],
});
```

### Updating an Existing Project

```typescript
// 1. First update project structure via sync
await apiClient.post('/commands/sync/update-project', payload);

// 2. Then commit any queued mock changes (participants, etc.)
await apiClient.post('/commands/sync/commit-project', { id: projectId });
```

### Order of Operations (Critical!)

When updating a project with participant changes:

1. Queue participant changes via `mocks/add-task-participant`
2. Call `sync/update-project` with project/task data
3. Call `sync/commit-project` to apply participant changes **ON TOP**

If you commit before update-project, the update-project may overwrite participant data.

---

## Participant Management

### Key Concept: Upsert Pattern

The `add-task-participant` endpoint is an **upsert**:
- Creates participant if not exists
- Updates participant if exists (same endpoint for add and update hours)

### Adding/Updating a Participant

```typescript
await apiClient.post('/commands/mocks/add-task-participant', {
  projectId: 'project-uuid',
  taskId: 'task-uuid',
  userId: 'user-uuid',
  isOwner: 'true',        // STRING, not boolean!
  position: 0,
  availableHours: '40',   // STRING
  plannedHours: '40',     // STRING - backend uses this for allocated hours
});

// Then commit to persist
await apiClient.post('/commands/sync/commit-project', { id: projectId });
```

### Payload Format (Angular Minimal Format)

**IMPORTANT**: Use flat fields, not nested objects:

```typescript
// CORRECT - Angular format
{
  projectId: 'uuid',
  taskId: 'uuid',
  userId: 'uuid',
  isOwner: 'true',  // STRING
  position: 0,
  availableHours: '40',
  plannedHours: '40',
}

// WRONG - nested objects
{
  project: { id: 'uuid' },
  task: { id: 'uuid' },
  user: { id: 'uuid' },
  isOwner: true,  // boolean
}
```

### Removing a Participant

```typescript
await apiClient.post('/commands/mocks/delete-task-participant', {
  projectId: 'project-uuid',
  taskId: 'task-uuid',
  odpiId: 'participant-uuid',  // Note: odpiId not userId
});

await apiClient.post('/commands/sync/commit-project', { id: projectId });
```

### Changing Task Owner

When changing ownership, update both participants:

```typescript
// 1. Demote current owner
await apiClient.post('/commands/mocks/add-task-participant', {
  projectId, taskId,
  userId: currentOwnerId,
  isOwner: 'false',
  position: 1,
  availableHours: String(currentOwnerHours),
  plannedHours: String(currentOwnerHours),
});

// 2. Promote new owner
await apiClient.post('/commands/mocks/add-task-participant', {
  projectId, taskId,
  userId: newOwnerId,
  isOwner: 'true',
  position: 0,
  availableHours: String(newOwnerHours),
  plannedHours: String(newOwnerHours),
});

// 3. Commit
await apiClient.post('/commands/sync/commit-project', { id: projectId });
```

### Loading Participant Hours

**IMPORTANT**: The backend stores allocated hours in `availableHours`. The `plannedHours` field may contain `'0.00'` (a truthy string that parses to 0).

When loading from API, use `parseFloat()` BEFORE the `||` operator to handle `'0.00'` correctly:

```typescript
// CORRECT - parseFloat first, check availableHours before plannedHours
const hours = parseFloat(participant.availableHours) ||
              parseFloat(participant.plannedHours) || 0;

// WRONG - '0.00' is truthy, so this returns 0 even if availableHours has a value
const hours = parseFloat(participant.plannedHours || participant.availableHours || '0');
```

**Why this matters:**
- Backend stores the allocated hours in `availableHours`
- `plannedHours` may be `'0.00'` which is truthy as a string
- `'0.00' || '50'` returns `'0.00'` (wrong!)
- `parseFloat('0.00') || parseFloat('50')` returns `50` (correct!)

---

## Team/Member Management

### Adding a Project Member

```typescript
await apiClient.post('/commands/mocks/add-project-member', {
  projectId: 'project-uuid',
  userId: 'user-uuid',
  isProjectManager: false,
  departmentId: 'dept-uuid',  // optional
});

await apiClient.post('/commands/sync/commit-project', { id: projectId });
```

### Removing a Project Member

```typescript
await apiClient.post('/commands/mocks/delete-project-member', {
  odpiId: 'member-uuid',  // The project member record ID
  projectId: 'project-uuid',
});

await apiClient.post('/commands/sync/commit-project', { id: projectId });
```

### Important Note

Members are **NOT** included in the `update-project` payload. They are managed entirely via the mock endpoints above.

---

## Activity & Task Management

### Task Payload in update-project

Tasks ARE included in the `update-project` payload, but participants are NOT:

```typescript
{
  activities: [{
    id: 'activity-uuid',
    name: 'Activity Name',
    position: 0,
    availableHours: '100',
    project: { id: projectId },
    tasks: [{
      id: 'task-uuid',
      activity: { id: 'activity-uuid' },
      name: 'Task Name',
      position: 0,
      startDate: '01/06/2022',
      endDate: '15/06/2022',
      plannedHours: '40',
      availableHours: '40',
      description: '',
      flags: 1,
      // NOTE: NO participants array - managed via mock endpoints
    }]
  }]
}
```

### Creating New Tasks

Generate UUID on client side:

```typescript
const taskId = task.id?.startsWith('new-') ? crypto.randomUUID() : task.id;
```

---

## Milestone Management

### Creating/Updating Milestones

```typescript
await apiClient.post('/commands/mocks/update-project-milestone', {
  id: 'milestone-uuid',  // omit for new
  projectId: 'project-uuid',
  name: 'Milestone Name',
  description: 'Description',
  deliveryDate: '15/06/2022',  // DD/MM/YYYY
  alertDays: 7,
  color: '#FF5733',
  done: false,
  task: { id: 'linked-task-uuid' },  // optional
});

await apiClient.post('/commands/sync/commit-project', { id: projectId });
```

### Deleting Milestones

```typescript
await apiClient.post('/commands/mocks/delete-project-milestone', {
  id: 'milestone-uuid',
  projectId: 'project-uuid',
});

await apiClient.post('/commands/sync/commit-project', { id: projectId });
```

---

## Calendar & Events

Events use **sync endpoints** (not mock):

### Creating an Event

```typescript
await apiClient.post('/commands/sync/create-event', {
  id: crypto.randomUUID(),
  title: 'Event Title',
  startAt: '15/06/2022 09:00:00+00:00',  // DD/MM/YYYY HH:mm:ss+00:00
  endAt: '15/06/2022 10:00:00+00:00',
  color: '#3B82F6',
  state: 1,
  timezone: 'Europe/London',
  timesheet: true,
  billable: false,
  private: false,
  task: { id: 'task-uuid' },  // optional
  project: { id: 'project-uuid' },  // optional
  guests: [{ id: 'user-uuid' }],  // REQUIRED for visibility
  fromUser: 'creator-uuid',
  creator: { id: 'creator-uuid' },
});
```

### Important: Guest Array

The current user MUST be in the `guests` array for the event to appear in their calendar.

### Adding Task Participant for Timesheet

When creating a timesheet event linked to a task, add the user as a task participant:

```typescript
await apiClient.post('/commands/mocks/add-task-participant', {
  projectId: taskProjectId,
  taskId: task.id,
  userId: currentUserId,
  isOwner: 'false',
  position: 0,
  availableHours: '0',
  plannedHours: '0',
});

await apiClient.post('/commands/sync/commit-project', { id: taskProjectId });
```

---

## Timer API

The Timer API tracks time spent on tasks and auto-creates calendar events when stopped.

### Starting a Timer

```typescript
await apiClient.post('/commands/sync/timer/start', {
  task: { id: taskId },
  finishDate: '16/12/2024 14:30:00+0000',  // DD/MM/YYYY HH:mm:ss+0000
});
```

**Note**: `finishDate` is when the timer should end, not the duration.

### Stopping a Timer

```typescript
await apiClient.post('/commands/sync/timer/stop', {});
```

**Important**: Stopping the timer automatically creates a calendar event for the tracked time. No need to manually create the event.

### Extending a Timer

Call `/timer/start` again with a new `finishDate`:

```typescript
// Extend by 15 minutes
const newFinishDate = new Date(currentFinishDate.getTime() + 15 * 60 * 1000);
await apiClient.post('/commands/sync/timer/start', {
  task: { id: taskId },
  finishDate: formatDateForApi(newFinishDate),
});
```

### Date Format Helper

```typescript
function formatDateForTimerApi(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}+0000`;
}
```

---

## Move Task API

Move tasks between columns/stages in Kanban boards.

```typescript
await apiClient.post('/commands/sync/move-task', {
  id: taskId,
  column: { id: columnId },
  position: 0,  // Position within the column (0 = top)
});
```

---

## Common Pitfalls & Solutions

### 1. Participant Hours Not Persisting

**Problem**: Hours show in UI but reset after reload.

**Solutions**:
- Include BOTH `availableHours` AND `plannedHours` in payload
- Call `commit-project` AFTER `update-project`
- Don't call API on every keystroke - call on Accept/Save action
- Include tasks in `update-project` payload

### 2. Participants Not Showing in Modals

**Problem**: Task has participants in Gantt but modal shows empty.

**Solution**: Fall back to cached data when API returns empty:

```typescript
const freshParticipants = freshTaskData.participants || [];
const cachedParticipants = task._rawData?.participants || [];
const participants = freshParticipants.length > 0
  ? freshParticipants
  : cachedParticipants;
```

### 3. Mock Endpoint Returns 409 Conflict

**Problem**: `mocks/update-project` returns 409.

**Solution**: Use `sync/update-project` for project updates. Not all operations have mock equivalents.

### 4. Redis Queue Flooding

**Problem**: Making API calls on every input change.

**Solution**: Update local state on change, make API call only on action completion (Accept/Save button).

```typescript
// Local state update (on every keystroke)
const handleLocalChange = (value) => {
  setLocalState(value);
};

// API call (only on Accept)
const handleAccept = async () => {
  await apiClient.post('/commands/mocks/...', { value: localState });
};
```

### 5. Date Format Issues

**Problem**: API rejects dates or returns wrong dates.

**Solution**: Use DD/MM/YYYY format for API:

```typescript
// Convert YYYY-MM-DD to DD/MM/YYYY
const formatDateForApi = (dateStr: string) => {
  if (dateStr.includes('-') && dateStr.length === 10) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};
```

### 6. UI Reverts After Save

**Problem**: After saving data via API, the UI immediately reverts to old values.

**Cause**: Component receives data via props from parent. After API save completes, the props haven't been updated, so React re-renders with stale data.

**Solution**: Use local state that syncs with props but can be updated after save:

```typescript
function MyComponent({ data }: Props) {
  // Local state that syncs with props
  const [localData, setLocalData] = useState(data);

  // Update local state when props change
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleSave = async (newValue) => {
    await apiClient.post('/commands/mocks/...', { value: newValue });
    await apiClient.post('/commands/sync/commit-project', { id: projectId });

    // Update local state so UI reflects the change immediately
    setLocalData(prev => ({ ...prev, field: newValue }));
  };

  // Render using localData, not props
  return <div>{localData.field}</div>;
}
```

---

## Frontend UI Patterns

### @dnd-kit Drag-and-Drop Offset Issues

**Problem**: When dragging task cards, the DragOverlay appears offset from the cursor (often several inches below).

#### Root Causes & Fixes

**1. CSS Transform on Parent Containers**

Even `transform: scale(1)` creates a new stacking context that interferes with @dnd-kit positioning.

```tsx
// BAD - always applies transform, causes offset even at 100%
style={{ transform: `scale(${zoomScale})` }}

// GOOD - only apply when zoomed
style={zoomLevel !== 100 ? {
  transform: `scale(${zoomScale})`,
  transformOrigin: 'top left',
} : {}}
```

**2. Transform on Dragged Element**

Applying CSS transform to the source element during drag causes offset.

```tsx
const getTransform = () => {
  // DON'T apply transform when dragging - DragOverlay handles the visual
  if (isDragging) return 'none';
  if (isHovered) return 'translateY(-2px)';
  return 'none';
};
```

**3. DragOverlay Configuration**

Add `dropAnimation={null}` for cleaner drag behavior:

```tsx
<DragOverlay dropAnimation={null}>
  {activeTask && <TaskCard ... />}
</DragOverlay>
```

**4. Source Element Opacity**

Set low opacity on source element when dragging so it fades out:

```tsx
opacity: isDragging ? 0.3 : 1,
```

#### Debugging @dnd-kit Issues

Add debug logging to `handleDragStart`:

```tsx
const handleDragStart = (event: DragStartEvent) => {
  console.log('Active rect:', event.active.rect.current);

  const element = document.querySelector(`[data-task-id="${event.active.id}"]`);
  if (element) {
    console.log('Element rect:', element.getBoundingClientRect());
  }

  // Check scroll containers
  const scrollContainer = document.querySelector('.overflow-x-auto');
  console.log('Scroll:', scrollContainer?.scrollLeft, scrollContainer?.scrollTop);
};
```

Add `data-task-id` attribute to TaskCard for debugging:

```tsx
<div ref={setNodeRef} data-task-id={task.id} ...>
```

#### Key Files for Drag-and-Drop

- `src/components/my-tasks/MyTasksBoard.tsx` - DndContext and DragOverlay
- `src/components/my-tasks/TaskCard.tsx` - Draggable task cards
- `src/components/my-tasks/Column.tsx` - Drop targets

---

## Payload Formats

### String vs Boolean

Many fields that seem boolean are actually strings:

```typescript
isOwner: 'true'      // STRING, not boolean
isProjectManager: 'true'
```

### String Numbers

Hours and amounts are strings:

```typescript
availableHours: '40'
plannedHours: '40'
amount: '1000'
```

### ID References

Use `{ id: 'uuid' }` format for references:

```typescript
client: { id: 'client-uuid' }
project: { id: 'project-uuid' }
activity: { id: 'activity-uuid' }
task: { id: 'task-uuid' }
```

### Date/Time Formats

```typescript
// Date only
startDate: '01/06/2022'  // DD/MM/YYYY

// DateTime with timezone
startAt: '01/06/2022 09:00:00+00:00'  // DD/MM/YYYY HH:mm:ss+00:00
```

---

## Summary: The Angular Pattern

When making changes to a project:

1. **Mock endpoints** queue changes to Redis (participants, members, milestones)
2. **Sync update-project** updates project structure (activities, tasks, metadata)
3. **Sync commit-project** applies all queued changes from Redis

This ensures atomic updates and allows for optimistic UI updates while maintaining data consistency.

---

*Last updated: December 16, 2024*
