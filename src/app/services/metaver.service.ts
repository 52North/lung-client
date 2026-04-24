import { HttpClient } from "@angular/common/http";
import { Injectable, inject, input, resource } from "@angular/core";
import { map, firstValueFrom } from "rxjs";


export interface MetadataElement {
    id: string;
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
    status: string | null;
    interval: string | null;
    interval_description: string | null;
    downloads: {
        applicationProfile: string | null;
        linkage: string | null;
        protocol: string | null;
        name: string | null;
        function: string | null;
    }[]
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

    private queryNodes(path: string, context: Node = this.xmlDoc): Node[] {
        const result = this.xmlDoc.evaluate(
            path,
            context,
            null,
            XPathResult.ORDERED_NODE_ITERATOR_TYPE,
            null,
        );

        const nodes: Node[] = [];
        let node = result.iterateNext();

        while (node) {
            nodes.push(node);
            node = result.iterateNext();
        }

        return nodes;
    }

    public parse(): MetadataElement {
        return {
            id: this.query(
                "//*[local-name()='fileIdentifier']/*[local-name()='CharacterString']"
            )!,
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
            status: this.query(
                "//*[local-name()='resourceMaintenance']//*[local-name()='maintenanceAndUpdateFrequency']//@codeListValue"
            ),
            interval: this.query(
                "//*[local-name()='resourceMaintenance']//*[local-name()='updateScope']//@codeListValue"
            ),
            interval_description: this.query(
                "//*[local-name()='resourceMaintenance']//*[local-name()='maintenanceNote']"
            ),
            downloads: this.queryNodes("//*[local-name()='transferOptions']").map(node => {
                return {
                    applicationProfile: this.query(".//*[local-name()='applicationProfile']", node),
                    linkage: this.query(".//*[local-name()='linkage']", node),
                    protocol: this.query(".//*[local-name()='protocol']", node),
                    name: this.query(".//*[local-name()='name']", node),
                    function: this.query(".//*[local-name()='function']", node),
                }
            })
        };
    }
}

export abstract class MetaverService {
    abstract getMetadataResource: (id: string) => Promise<MetadataElement>;
}

@Injectable({
    providedIn: 'root',
})
export class MetaverServiceImpl {
    httpClient = inject(HttpClient);

    getMetadataResource(id: string) {
        const url = `https://metaver.de/csw?REQUEST=GetRecordById&SERVICE=CSW&VERSION=2.0.2&id=${id}`;
        const request = this.httpClient.get(url, { responseType: 'text' }).pipe(
            map((data) => {
                const parserInstance = new MetadataParser(data);
                return parserInstance.parse();
            }),
        );
        return firstValueFrom(request);
    }
}