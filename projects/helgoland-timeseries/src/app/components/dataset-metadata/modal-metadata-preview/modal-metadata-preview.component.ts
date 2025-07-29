import { HttpClient } from '@angular/common/http';
import { Component, inject, input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-modal-metadata-preview',
  templateUrl: './modal-metadata-preview.component.html',
  imports: [TranslateModule, MatDialogModule, MatButtonModule],
  styleUrls: ['./modal-metadata-preview.component.scss'],
})
export class ModalMetadataPreviewComponent implements OnInit {
  httpClient = inject(HttpClient);

  readonly metadataId = input.required<string>();

  xmlContent: string | undefined;

  constructor() {}

  ngOnInit() {
    console.log('Metadata ID:', this.metadataId());
    const url = `https://metaver.de/csw?REQUEST=GetRecordById&SERVICE=CSW&VERSION=2.0.2&id=${this.metadataId()}`;
    this.httpClient.get(url, { responseType: 'text' }).subscribe({
      next: (data) => (this.xmlContent = this.formatXml(data)),
      error: (error) => console.error('Error fetching metadata:', error),
    });
  }

  private formatXml(xml: string): string {
    const PADDING = '  ';
    const reg = /(>)(<)(\/*)/g;
    let formatted = '';
    let pad = 0;

    xml = xml.replace(reg, '$1\r\n$2$3');
    xml.split('\r\n').forEach((node) => {
      let indent = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (node.match(/^<\/\w/)) {
        if (pad !== 0) pad -= 1;
      } else if (node.match(/^<\w([^>]*[^/])?>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }

      const padding = PADDING.repeat(pad);
      formatted += padding + node + '\r\n';
      pad += indent;
    });

    return formatted;
  }
}
