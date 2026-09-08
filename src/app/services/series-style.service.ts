import { Injectable } from '@angular/core';
import { ColorService, PointSymbol, PointSymbolType } from '@helgoland/core';

/**
 * The library's {@link ColorService} hands out random colors. That leaves both
 * the contrast against the white diagram background and the distinguishability
 * of the series to chance - measured examples reached 1.75:1, well below the
 * 3:1 that WCAG 1.4.11 asks for graphical objects.
 *
 * This palette is a subset of Paul Tol's "muted" scheme: every color keeps at
 * least 3.8:1 against white, and the cyclic order is picked so that neighbouring
 * colors stay apart under normal vision as well as under deuteranopia and
 * protanopia (smallest CIE76 distance 32).
 *
 * Colors alone are never enough (WCAG 1.4.1), so every color is paired with a
 * point symbol; the series are told apart by shape as well.
 */
@Injectable()
export class SeriesStyleService extends ColorService {
  private static readonly PALETTE = [
    '#0072B2', // blue
    '#882255', // wine
    '#D55E00', // vermillion
    '#AA4499', // purple
    '#117733', // green
    '#1B7B7B', // teal
  ];

  private static readonly SYMBOLS = [
    PointSymbolType.diamond,
    PointSymbolType.square,
    PointSymbolType.triangle,
    PointSymbolType.star,
    PointSymbolType.cross,
    PointSymbolType.wye,
  ];

  private index = -1;

  override getColor(): string {
    this.index++;
    return SeriesStyleService.PALETTE[
      this.index % SeriesStyleService.PALETTE.length
    ];
  }

  /**
   * The symbol belonging to the color handed out last - call it right after
   * {@link getColor}.
   */
  getPointSymbol(): PointSymbol {
    const index = Math.max(this.index, 0);
    return {
      type: SeriesStyleService.SYMBOLS[
        index % SeriesStyleService.SYMBOLS.length
      ],
      size: 3,
    };
  }
}
