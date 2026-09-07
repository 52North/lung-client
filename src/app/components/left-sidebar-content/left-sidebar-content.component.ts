import { CommonModule } from '@angular/common';
import { Component, computed, inject, resource, signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AppRouterService } from '../../services/app-router.service';
import { SelectedDataSourceService } from '../../services/selected-data-source.service';
import { ListSelectionMenuComponent } from '../../views/list-selection-view/list-selection-menu/list-selection-menu.component';
import { MapSelectionMenuComponent } from '../../views/map-selection-view/map-selection-menu/map-selection-menu.component';
import { ChangeDataSourceModalComponent } from '../change-data-source/change-data-source-modal/change-data-source-modal.component';
import { firstValueFrom, of, map, switchMap, Observable, forkJoin } from 'rxjs';
import { StaInterfaceService } from '@helgoland/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import {
  MetadataElement,
  MetaverService,
} from 'src/app/services/metaver.service';
import {
  AppConfig,
  ConfigurationService,
} from 'src/app/services/configuration.service';

@Component({
  selector: 'app-left-sidebar-content',
  templateUrl: './left-sidebar-content.component.html',
  styleUrls: ['./left-sidebar-content.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButton,
    MatIconButton,
    TranslateModule,
    MapSelectionMenuComponent,
    ListSelectionMenuComponent,
    MatCardModule,
    MatDividerModule,
  ],
})
export class LeftSidebarContentComponent {
  protected appRouter = inject(AppRouterService);
  protected selectedDataSource = inject(SelectedDataSourceService);
  private staSrvc = inject(StaInterfaceService);
  private metaverSrvc = inject(MetaverService);
  private dialog = inject(MatDialog);
  private staUrl = computed(
    () => this.selectedDataSource.selectedService()?.apiUrl,
  );
  private configSrvc = inject(
    ConfigurationService<AppConfig>,
  ) as ConfigurationService<AppConfig>;

  metaver_uuid = this.configSrvc.getSettings().metaver_uuid;
  showInfoOverlay = false;
  showDownloadOverlay = signal(false);

  openMapSelection() {
    this.appRouter.toMapSelection();
  }

  openListSelection() {
    this.appRouter.toListSelection();
  }

  openDatasource() {
    this.dialog.open(ChangeDataSourceModalComponent);
  }

  meta_uuids = resource({
    params: computed(() => ({
      url: this.staUrl(),
      visible: this.showDownloadOverlay(),
    })),
    loader: ({ params }) => {
      if (!params.visible) return Promise.resolve(undefined);

      return firstValueFrom(this.getDownloadUrls(params.url));
    },
  });

  private getDownloadUrls(
    url: string | undefined,
  ): Observable<MetadataElement[]> {
    if (!url) return of([]);
    return this.staSrvc
      .getThings(url, {
        $select: `distinct:properties/meta_uuid`,
      })
      .pipe(
        map((res) =>
          res.value
            .filter((e) => e !== undefined && e.properties !== undefined)
            .map((e) => {
              return e.properties!['meta_uuid'] as string;
            }),
        ),
        switchMap((ids: string[]) => {
          if (!ids || ids.length === 0) {
            return of([]);
          }
          const metadataRequests: Promise<MetadataElement>[] = ids.map((id) =>
            this.metaverSrvc.getMetadataResource(id),
          );
          return forkJoin(metadataRequests);
        }),
      );
  }
}
