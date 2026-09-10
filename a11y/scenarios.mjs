/**
 * The states the accessibility check runs against.
 *
 * `needsData: true` means the scenario only exists once timeseries have been
 * loaded from the backend - those are skipped with `--no-data`.
 */

/** Clicks through station -> phenomenon group -> datasets, like a user would. */
export async function seedDatasets(page, base, count = 2) {
  await page.goto(base + '/list-selection', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  await page.locator('.station-entry').first().click();
  await page.waitForTimeout(4500);
  await page
    .locator('mat-dialog-container mat-expansion-panel-header')
    .first()
    .click();
  await page.waitForTimeout(2500);
  const options = page.locator('mat-dialog-container mat-list-option');
  for (let i = 0; i < count; i++) {
    await options.nth(i).click();
    await page.waitForTimeout(1200);
  }
  await page.getByRole('button', { name: /Schließen|Close/ }).click();
  await page.waitForTimeout(2500);
}

/**
 * Without loaded timeseries the app sends every route to the map selection,
 * which covers the sidebar menu with an overlay. This gets the base menu back.
 */
export async function ensureBaseMenu(page) {
  const overlay = page.locator('.info-overlay .overlay-header button').first();
  if (await overlay.count()) {
    await overlay.click();
    await page.waitForTimeout(1500);
  }
}

export const SCENARIOS = [
  {
    name: 'list-selection',
    title: 'Listenauswahl',
    path: '/list-selection',
  },
  {
    name: 'map-selection',
    title: 'Kartenauswahl',
    path: '/map-selection',
    wait: 9000,
  },
  {
    name: 'map-layers-overlay',
    title: 'Kartenauswahl mit offener Hintergrundkarten-Auswahl',
    path: '/map-selection',
    wait: 9000,
    // cdk overlays render at the end of <body>, outside every landmark - the
    // `region` rule can not be satisfied there
    disableRules: ['region'],
    setup: async (page) => {
      await page.locator('helgoland-layers-control button').first().click();
      await page.waitForTimeout(1000);
    },
  },
  {
    name: 'sidebar-info-overlay',
    title: 'Sidebar-Overlay „Information & Kontakt"',
    path: '/',
    setup: async (page) => {
      await ensureBaseMenu(page);
      await page.getByRole('button', { name: /Information & Kontakt/ }).click();
      await page.waitForTimeout(1500);
    },
  },
  {
    name: 'sidebar-download-overlay',
    title: 'Sidebar-Overlay „Landesweiter Datendownload"',
    path: '/',
    setup: async (page) => {
      await ensureBaseMenu(page);
      await page
        .getByRole('button', { name: /Landesweiter Datendownload/ })
        .click();
      await page.waitForTimeout(4000);
    },
  },
  {
    name: 'main-config-dialog',
    title: 'Dialog „Allgemeine Einstellungen"',
    path: '/',
    setup: async (page) => {
      await page.locator('helgoland-modal-main-config-button button').click();
      await page.waitForTimeout(2000);
    },
  },
  {
    name: 'favorites-dialog',
    title: 'Dialog „Favoriten"',
    path: '/',
    setup: async (page) => {
      await page.locator('helgoland-modal-favorite-list-button button').click();
      await page.waitForTimeout(2000);
    },
  },
  {
    // The state that slipped through until 2026-09-10: the dialog above only
    // ever showed the read-only card, so the edit mode - an input field and two
    // buttons - was never scanned. It needs a favorite, hence needsData.
    name: 'favorites-edit-mode',
    title: 'Dialog „Favoriten" im Bearbeiten-Modus',
    path: '/',
    needsData: true,
    wait: 8000,
    setup: async (page) => {
      await page
        .locator('button[aria-label*="Favoriten hinzufügen"]')
        .first()
        .click();
      await page.waitForTimeout(1500);
      await page.locator('helgoland-modal-favorite-list-button button').click();
      await page.waitForTimeout(2500);
      await page
        .locator('mat-dialog-container mat-card .fav-title button')
        .first()
        .click();
      await page.waitForTimeout(1500);
    },
  },
  {
    name: 'data-source-dialog',
    title: 'Dialog „Datenquelle wechseln"',
    path: '/',
    setup: async (page) => {
      await ensureBaseMenu(page);
      await page.getByRole('button', { name: /Datenquelle wechseln/ }).click();
      await page.waitForTimeout(2500);
    },
  },
  {
    name: 'station-dataset-dialog',
    title: 'Dialog „Zeitreihen einer Station"',
    path: '/list-selection',
    wait: 8000,
    setup: async (page) => {
      await page.locator('.station-entry').first().click();
      await page.waitForTimeout(4500);
      await page
        .locator('mat-dialog-container mat-expansion-panel-header')
        .first()
        .click();
      await page.waitForTimeout(2500);
    },
  },
  {
    name: 'diagram-view',
    title: 'Diagrammansicht mit zwei Zeitreihen',
    path: '/',
    needsData: true,
    wait: 8000,
  },
  {
    name: 'table-view',
    title: 'Tabellenansicht mit zwei Zeitreihen',
    path: '/table',
    needsData: true,
    wait: 8000,
  },
  {
    // The only state in which a legend entry is collapsed: visible series keep
    // their panel open ([expanded]="dataset().visible"). Decision E5 was about
    // exactly that state, so it gets scanned too
    name: 'legend-entry-collapsed',
    title: 'Diagrammansicht mit zugeklapptem Legendeneintrag',
    path: '/',
    needsData: true,
    wait: 8000,
    setup: async (page) => {
      await page.locator('.legend .controls button.toggle-visibility').first().click();
      await page.waitForTimeout(1500);
    },
  },
  {
    name: 'timeseries-options-dialog',
    title: 'Dialog „Zeitreihendarstellung ändern"',
    path: '/',
    needsData: true,
    wait: 8000,
    setup: async (page) => {
      await page
        .locator(
          '.legend button:has(helgoland-timeseries-entry-symbol):visible',
        )
        .first()
        .click();
      await page.waitForTimeout(2500);
    },
  },
  {
    name: 'diagram-settings-dialog',
    title: 'Dialog „Diagrammeinstellungen"',
    path: '/',
    needsData: true,
    wait: 8000,
    setup: async (page) => {
      await page.locator('button.local-settings-button').click();
      await page.waitForTimeout(2000);
    },
  },
  {
    name: 'download-menu',
    title: 'Datenexport-Menü',
    path: '/',
    needsData: true,
    wait: 8000,
    // see map-layers-overlay: the menu panel lives outside the landmarks
    disableRules: ['region'],
    setup: async (page) => {
      await page.locator('helgoland-download-data button').click();
      await page.waitForTimeout(1500);
    },
  },
];
