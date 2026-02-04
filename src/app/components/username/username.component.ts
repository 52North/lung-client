import { Component, effect, inject, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { KEYCLOAK_EVENT_SIGNAL, KeycloakEventType } from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import {
  AppConfig,
  ConfigurationService,
} from '../../services/configuration.service';

@Component({
  selector: 'app-username',
  templateUrl: './username.component.html',
  styleUrls: ['./username.component.css'],
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslateModule],
})
export class UsernameComponent {
  private readonly keycloak = inject(Keycloak);

  private readonly configSrvc =
    inject<ConfigurationService<AppConfig>>(ConfigurationService);

  protected readonly username = model<string | undefined>();
  protected readonly isAdmin = model<boolean | undefined>();

  protected adminUrl: string = this.configSrvc.getSettings().keycloak.adminUrl;

  constructor() {
    const keycloakSignal = inject(KEYCLOAK_EVENT_SIGNAL);

    effect(() => {
      const keycloakEvent = keycloakSignal();

      if (keycloakEvent.type === KeycloakEventType.Ready) {
        const parsedToken = this.keycloak.idTokenParsed;
        if (parsedToken) {
          const adminGroup = this.configSrvc.getSettings().keycloak.adminGroup;
          this.username.set(parsedToken['preferred_username']);
          const isAdmin = parsedToken['groups']?.includes(adminGroup) ?? false;
          this.isAdmin.set(isAdmin);
        }
      }

      if (keycloakEvent.type === KeycloakEventType.AuthLogout) {
        this.username.set(undefined);
        this.isAdmin.set(undefined);
      }
    });
  }

  login() {
    this.keycloak.login();
  }

  logout() {
    this.keycloak.logout();
  }
}
