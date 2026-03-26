import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [MatIconModule],
})
export class SidebarComponent {
  @Input() collapsible = true;
  @Input() position: 'left' | 'right' = 'left';
  @Input() handleTop: string = '50%';

  collapsed = false;
}
