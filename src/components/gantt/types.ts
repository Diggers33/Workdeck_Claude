export interface GanttTask {
  id: string;
  name: string;
  avatars?: string[];
  hours?: string;
  hoursColor?: string;
  startWeek: number;
  durationWeeks: number;
  progress?: number;
  barColor?: string;
  completed?: boolean;
  flag?: boolean;
  flagWeek?: number; // Week position for the flag marker
  milestone?: boolean;
  warning?: boolean;
  striped?: boolean;
  type?: 'task' | 'milestone';
  dueDate?: string;
  status?: 'upcoming' | 'overdue' | 'completed';
  outOfScheduleWork?: {
    beforeStart?: number; // weeks before scheduled start where work was logged
    afterEnd?: number; // weeks after scheduled end where work was logged
  };
  timeExceeded?: boolean; // true if actual hours exceed allocated hours
  milestones?: GanttMilestone[]; // Milestones attached to this task
  _rawData?: any; // Raw API data for filtering and modal display
}

export interface GanttMilestone {
  id: string;
  name: string;
  week: number; // Week position on timeline
  status?: 'upcoming' | 'overdue' | 'completed';
  dueDate?: string;
}

export interface GanttActivity {
  id: string;
  type: 'activity';
  name: string;
  duration: string;
  borderColor: string;
  expanded: boolean;
  taskCount?: number;
  startWeek?: number;
  durationWeeks?: number;
  barColor?: string;
  children?: GanttTask[];
  milestones?: GanttMilestone[]; // Milestones attached to this activity
}

export interface GanttWeek {
  label: string;
  isToday: boolean;
}