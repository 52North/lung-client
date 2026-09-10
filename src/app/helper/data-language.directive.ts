import { Directive } from '@angular/core';

/**
 * The language of the labels that come from the data source.
 *
 * The STA interface delivers german names - parameters, water bodies, stations -
 * no matter which language the ui runs in, and it carries no language
 * information of its own. Without a `lang` on the elements that show them, a
 * screen reader reads "Fauler Graben" with an english voice as soon as the ui
 * is switched (WCAG 3.1.2). Fixed here rather than derived, because there is
 * nothing to derive it from; if the interface ever reports a language, this is
 * the one place to change.
 */
export const DATA_LANGUAGE = 'de';

/**
 * Marks an element whose text comes from the data source, so it keeps its own
 * language when the ui switches. See {@link DATA_LANGUAGE}.
 */
@Directive({
  selector: '[dataLanguage]',
  host: { '[attr.lang]': 'language' },
})
export class DataLanguageDirective {
  protected readonly language = DATA_LANGUAGE;
}
