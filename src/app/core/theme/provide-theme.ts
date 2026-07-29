import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';

import { ThemeService } from './theme.service';

export function provideTheme():
  EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      inject(ThemeService).initialize();
    }),
  ]);
}
