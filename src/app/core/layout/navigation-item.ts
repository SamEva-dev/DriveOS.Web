export interface NavigationItem {
  readonly labelKey: string;
  readonly icon: string;
  readonly routerLink: string;
  readonly exact?: boolean;
}
