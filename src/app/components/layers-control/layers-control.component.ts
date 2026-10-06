import { CdkTrapFocus } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';
import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { LayerMap, LayerOptions, MapControlComponent } from '@helgoland/map';
import { TranslateModule } from '@ngx-translate/core';
import {
  FeatureGroup,
  GridLayer,
  ImageOverlay,
  Path,
  Popup,
  Tooltip,
} from 'leaflet';

@Component({
  selector: 'helgoland-layers-control',
  templateUrl: './layers-control.component.html',
  styleUrls: ['./layers-control.component.scss'],
  standalone: true,
  imports: [
    TranslateModule,
    MatIconModule,
    OverlayModule,
    MatButtonModule,
    MatRadioModule,
    CdkTrapFocus,
  ],
})
export class LayersControlComponent extends MapControlComponent {
  readonly baseMaps = input.required<LayerMap>();

  isOpen = false;

  switchBaseVisibility(layer: LayerOptions) {
    this.toggleBaseLayer(layer, this.baseMaps(), this.mapId());
  }

  toggleBaseLayer(layer: LayerOptions, baseMaps: LayerMap, mapId: string) {
    if (!layer.visible) {
      const map = this.mapCache.getMap(mapId);
      layer.visible = !layer.visible;
      // disable all base layer
      baseMaps.forEach((v) => {
        v.visible = false;
        map.removeLayer(v.layer);
      });
      // enable current base layer
      layer.visible = true;
      map.addLayer(layer.layer);
      if (
        layer.layer instanceof ImageOverlay ||
        layer.layer instanceof GridLayer ||
        layer.layer instanceof Path ||
        layer.layer instanceof FeatureGroup ||
        layer.layer instanceof Popup ||
        layer.layer instanceof Tooltip
      ) {
        layer.layer.bringToBack();
      }
    }
  }
}
