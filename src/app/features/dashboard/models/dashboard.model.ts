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
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly statusKey: string;
  readonly status: 'confirmed' | 'pending' | 'attention';
}

export interface DashboardAlertItem {
  readonly id: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly severity: 'info' | 'warning' | 'danger';
  readonly route: string;
}

export interface DashboardActivityItem {
  readonly id: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly timeKey: string;
  readonly icon: DashboardIcon;
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
