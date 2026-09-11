import { inject, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { CategorySelectionService } from '../../components/category-selection/category-selection.service';
import { ConfigurationService } from '../../services/configuration.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { SelectedDataSourceService } from '../../services/selected-data-source.service';

const PARAM_CAT_ONE = 'cat1';
const PARAM_CAT_TWO = 'cat2';
const PARAM_CAT_THREE = 'cat3';
const PARAM_CAT_FOUR = 'cat4';
const PARAM_SEARCH = 'search';
const PARAM_ACTIVE = 'active';
const PARAM_SERVICE = 'service';
const PARAM_API = 'api';

/** Read by `src/main.ts` before routing starts, so a share link keeps it. */
const PARAM_LOCALE = 'locale';

const OWN_PARAMS = [
  PARAM_CAT_ONE,
  PARAM_CAT_TWO,
  PARAM_CAT_THREE,
  PARAM_CAT_FOUR,
  PARAM_SEARCH,
  PARAM_ACTIVE,
  PARAM_SERVICE,
  PARAM_API,
];

/**
 * Turns the list selection - categories, search string, the active toggle and
 * the chosen data source - into a link and back, mirroring what
 * `DiagramViewInitStateService` does for the diagram view.
 */
@Injectable({
  providedIn: 'root',
})
export class ListSelectionViewInitStateService {
  private categorySelection = inject(CategorySelectionService);
  private selectedDataSource = inject(SelectedDataSourceService);
  private configSrvc = inject(ConfigurationService);
  private activatedRoute = inject(ActivatedRoute);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);

  // Handed to `helgoland-share-button` as a value, so it has to stay a property.
  generatePermalink = (): string => {
    const url = new URL(window.location.href);
    const locale = url.searchParams.get(PARAM_LOCALE);
    url.search = '';
    url.hash = '';

    const params = new URLSearchParams();
    if (locale) {
      params.set(PARAM_LOCALE, locale);
    }

    const one = this.categorySelection.selectedCategoryOne();
    const two = this.categorySelection.selectedCategoryTwo();
    const three = this.categorySelection.selectedCategoryThree();
    const four = this.categorySelection.selectedCategoryFour();
    if (one) {
      params.set(PARAM_CAT_ONE, one);
      if (two) {
        params.set(PARAM_CAT_TWO, two);
        if (three) {
          params.set(PARAM_CAT_THREE, three);
          if (four) {
            params.set(PARAM_CAT_FOUR, four);
          }
        }
      }
    }

    const search = this.categorySelection.searchTerm();
    if (search) {
      params.set(PARAM_SEARCH, search);
    }

    // Defaults stay out of the link, so the common case stays readable.
    if (!this.categorySelection.showActiveOnly()) {
      params.set(PARAM_ACTIVE, 'false');
    }

    const service = this.selectedDataSource.selectedService();
    const defaultService = this.configSrvc.configuration?.defaultService;
    if (
      service &&
      (service.id !== defaultService?.serviceId ||
        service.apiUrl !== defaultService?.apiUrl)
    ) {
      params.set(PARAM_SERVICE, service.id);
      params.set(PARAM_API, service.apiUrl);
    }

    url.search = params.toString();
    return url.href;
  };

  /**
   * Applies a shared link. Called from the constructor of the routed component:
   * at that point the router has written the browser url and filled the
   * snapshot, but the sidebar menu does not exist yet and the resources have not
   * loaded - so the state is in place before anything reads it.
   */
  applyFromUrl(): void {
    const params = this.activatedRoute.snapshot.queryParamMap;
    const present = OWN_PARAMS.filter((param) => params.has(param));
    if (present.length === 0) {
      return;
    }

    const api = params.get(PARAM_API);
    const service = params.get(PARAM_SERVICE);
    if (api && service && !this.selectedDataSource.selectById(api, service)) {
      this.errorHandler.error(
        this.translate.instant('permalink.unknown-data-source'),
      );
    }

    const active = params.get(PARAM_ACTIVE);
    this.categorySelection.restoreState({
      categoryOne: params.get(PARAM_CAT_ONE) ?? undefined,
      categoryTwo: params.get(PARAM_CAT_TWO) ?? undefined,
      categoryThree: params.get(PARAM_CAT_THREE) ?? undefined,
      categoryFour: params.get(PARAM_CAT_FOUR) ?? undefined,
      searchTerm: params.get(PARAM_SEARCH) ?? undefined,
      showActiveOnly: active === null ? undefined : active !== 'false',
    });

    this.removeQueryParams(present);
  }

  /**
   * Drops the consumed parameters, one by one so that `locale` survives. Without
   * this the address bar would keep claiming a state that the next click on a
   * category already invalidated, and coming back to the view would silently
   * reset the selection to the one from the link.
   */
  private removeQueryParams(params: string[]): void {
    const url = new URL(window.location.href);
    params.forEach((param) => url.searchParams.delete(param));
    history.replaceState(history.state, '', url.href);
  }
}
