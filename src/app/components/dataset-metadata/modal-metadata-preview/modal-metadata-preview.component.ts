import { HttpClient } from '@angular/common/http';
import { Component, inject, input, resource } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HelgolandCoreModule } from '@helgoland/core';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom, map } from 'rxjs';

interface MetadataElement {
  title: string | null;
  abstract: string | null;
  contact: {
    organisation: string | null;
    positionName: string | null;
    address: {
      deliveryPoint: string | null;
      city: string | null;
      postalCode: string | null;
      country: string | null;
      email: string | null;
    };
  };
  creationDate?: string | null;
  revisionDate?: string | null;
}

class MetadataParser {
  private xmlDoc: Document;

  constructor(xmlString: string) {
    const parser = new DOMParser();
    this.xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  }

  private query(path: string, context: Node = this.xmlDoc): string | null {
    const result = this.xmlDoc.evaluate(
      path,
      context,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    );
    return result.singleNodeValue?.textContent?.trim() ?? null;
  }

  public parse(): MetadataElement {
    return {
      title: this.query(
        "//*[local-name()='identificationInfo']//*[local-name()='citation']//*[local-name()='title']/*[local-name()='CharacterString']",
      ),
      abstract: this.query(
        "//*[local-name()='abstract']/*[local-name()='CharacterString']",
      ),
      contact: {
        organisation: this.query(
          "//*[local-name()='pointOfContact']//*[local-name()='organisationName']/*[local-name()='CharacterString']",
        ),
        positionName: this.query(
          "//*[local-name()='pointOfContact']//*[local-name()='positionName']/*[local-name()='CharacterString']",
        ),
        address: {
          deliveryPoint: this.query(
            "//*[local-name()='pointOfContact']//*[local-name()='address']//*[local-name()='deliveryPoint']/*[local-name()='CharacterString']",
          ),
          city: this.query(
            "//*[local-name()='pointOfContact']//*[local-name()='address']//*[local-name()='city']/*[local-name()='CharacterString']",
          ),
          postalCode: this.query(
            "//*[local-name()='pointOfContact']//*[local-name()='address']//*[local-name()='postalCode']/*[local-name()='CharacterString']",
          ),
          country: this.query(
            "//*[local-name()='pointOfContact']//*[local-name()='address']//*[local-name()='country']/*[local-name()='CharacterString']",
          ),
          email: this.query(
            "//*[local-name()='pointOfContact']//*[local-name()='address']//*[local-name()='electronicMailAddress']/*[local-name()='CharacterString']",
          ),
        },
      },
      creationDate: this.query(
        `//*[local-name()='identificationInfo']//*[local-name()='citation']//*[local-name()='date'][.//*[local-name()='CI_DateTypeCode'][@codeListValue='creation']]//*[local-name()='DateTime']`,
      ),
      revisionDate: this.query(
        `//*[local-name()='identificationInfo']//*[local-name()='citation']//*[local-name()='date'][.//*[local-name()='CI_DateTypeCode'][@codeListValue='revision']]//*[local-name()='DateTime']`,
      ),
    };
  }
}

@Component({
  selector: 'app-modal-metadata-preview',
  templateUrl: './modal-metadata-preview.component.html',
  imports: [
    TranslateModule,
    MatDialogModule,
    MatProgressBarModule,
    MatButtonModule,
    HelgolandCoreModule,
  ],
  styleUrls: ['./modal-metadata-preview.component.scss'],
})
export class ModalMetadataPreviewComponent {
  httpClient = inject(HttpClient);

  readonly metadataId = input.required<string>();

  metadataResource = resource({
    params: () => ({ id: this.metadataId() }),
    loader: ({ params }): Promise<MetadataElement> => {
      const url = `https://metaver.de/csw?REQUEST=GetRecordById&SERVICE=CSW&VERSION=2.0.2&id=${params.id}`;
      const request = this.httpClient.get(url, { responseType: 'text' }).pipe(
        map((data) => {
          const parserInstance = new MetadataParser(data);
          return parserInstance.parse();
        }),
      );
      return firstValueFrom(request);
    },
  });

  openAdditionalInformation() {
    window.open(
      `https://metaver.de/trefferanzeige?docuuid=${this.metadataId()}`,
      '_blank',
    );
  }
}
