export interface DashboardMetric {
  readonly code: string;
  readonly labelKey: string;
  readonly value: string;
  readonly detailKey: string;
  readonly tone: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  readonly icon: DashboardIcon;
}

export interface DashboardQuickAction {
  readonly code: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly route: string;
  readonly tone: 'primary' | 'accent';
  readonly icon: DashboardIcon;
  readonly badgeKey?: string;
}

export interface DashboardAgendaItem {
  readonly id: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly title: string;
  readonly description: string;
  readonly status: string;
}

export interface DashboardAlertItem {
  readonly id: string;
  readonly messageKey: string;
  readonly parameters: Readonly<Record<string, string | null>>;
  readonly severity: 'info' | 'warning' | 'danger';
  readonly route: string;
}

export interface DashboardActivityItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly occurredAtUtc: string;
  readonly icon: DashboardIcon;
}

export interface DashboardSnapshot {
  readonly metrics: readonly DashboardMetric[];
  readonly quickActions: readonly DashboardQuickAction[];
  readonly agenda: readonly DashboardAgendaItem[];
  readonly alerts: readonly DashboardAlertItem[];
  readonly activities: readonly DashboardActivityItem[];
}

export type DashboardIcon =
  | 'building'
  | 'student'
  | 'calendar'
  | 'instructor'
  | 'vehicle'
  | 'wallet'
  | 'exam'
  | 'alert'
  | 'document'
  | 'chart'
  | 'plus'
  | 'refresh';
