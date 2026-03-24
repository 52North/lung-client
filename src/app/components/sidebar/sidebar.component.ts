import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
})
export class SidebarComponent {
  @Input() collapsible = true;
  @Input() position: 'left' | 'right' = 'left';
  @Input() handleTop: string = '50%';

  collapsed = false;
}
