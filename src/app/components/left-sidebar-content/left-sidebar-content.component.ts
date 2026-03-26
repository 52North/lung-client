import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AppRouterService } from '../../services/app-router.service';
import { ListSelectionMenuComponent } from '../../views/list-selection-view/list-selection-menu/list-selection-menu.component';
import { MapSelectionMenuComponent } from '../../views/map-selection-view/map-selection-menu/map-selection-menu.component';

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
  ],
})
export class LeftSidebarContentComponent {
  protected appRouter = inject(AppRouterService);

  showInfoOverlay = false;

  openMapSelection() {
    this.appRouter.toMapSelection();
  }

  openListSelection() {
    this.appRouter.toListSelection();
  }
}
