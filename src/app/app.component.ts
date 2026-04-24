import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LeftSidebarContentComponent } from './components/left-sidebar-content/left-sidebar-content.component';
import { RightSidebarContentComponent } from './components/right-sidebar-content/right-sidebar-content.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AppRouterService } from './services/app-router.service';
import { DiagramViewInitStateService } from './views/diagram-view/diagram-view-permalink.service';

@Component({
  selector: 'helgoland-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    LeftSidebarContentComponent,
    RightSidebarContentComponent,
    SidebarComponent,
  ],
})
export class AppComponent {
  //private initStateService = inject(DiagramViewInitStateService);
  //private appRouter = inject(AppRouterService);

  title = 'helgoland';
  fullscreen = true;

  constructor() {
    // TODO: maybe there is a better place?
    /*
    this.initStateService.preloadDatasets().subscribe((loadDs) => {
      if (!loadDs) {
        this.appRouter.toMapSelection();
      }
    });
    */
  }
}
