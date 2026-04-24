import { Injectable } from '@angular/core';
import { Settings, SettingsService } from '@helgoland/core';
import { LayerConfiguration } from '@helgoland/map';
import { KeycloakConfig } from 'keycloak-js';

export interface AppConfig extends Settings {
  supportTimeseriesSymbols: boolean;
  daysForOldTimespanCheck: number;
  baseLayers: LayerConfiguration[];
  dataTableVisible: boolean;
  keycloak: {
    config: KeycloakConfig;
    bearerTokenCondition: {
      urlPattern: string;
      bearerPrefix: string;
    };
    adminGroup: string;
    adminUrl: string;
  };
  metaver_uuid: string
}

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService<
  T extends AppConfig = AppConfig,
> extends SettingsService<T> {
  private _configuration!: T;

  public get configuration(): T {
    return this._configuration;
  }

  public set configuration(config: T) {
    this._configuration = config;
    this.setSettings(config);
  }
}
