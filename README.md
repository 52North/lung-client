# lung-client

> A customized [52°North Helgoland](https://github.com/52North/helgoland-toolbox) Sensor Web Viewer.

This is a fork/modification of the original Helgoland client, adapted for display of data provided by the LUNG MV.

Custom features (not present in the Helgoland-Toolbox):

- Tabular data view
- Data Export in CSV+XLSX format
- Filtering by categories
- Integration von Metadaten aus MetaVer
- Various performance improvements

## Development

Requires Node ≥ 20.

```bash
npm install
npm start          # serve at http://localhost:4200
npm run build:client
```

## Accessibility

The client targets WCAG 2.1 AA. The automated part of that is checked by the run below;
keyboard operation, screen reader output, contrast inside SVG and zoom behaviour need a
manual pass.

```bash
npx playwright install chromium   # once
npm run a11y                      # axe-core over all views, dialogs and overlays
npm run a11y -- --no-data         # without the scenarios that need the live API (CI)
```

See [`a11y/README.md`](a11y/README.md) for the options, the baseline of accepted findings
and how to add scenarios.

## Deployment (Docker)

The [`Dockerfile`](Dockerfile) clones and builds the custom helgoland-toolbox, builds the
client, and serves it with nginx.

```bash
docker build -t lung-client .
docker run -p 8080:80 lung-client
```

`PORT` and `BASE_HREF` can be overridden via environment variables.


## Funding organizations/projects

The development of this client implementations was supported by several organizations and projects. Among other we would like to thank the following organisations and projects:

| Project/Logo | Description |
| :-------------: | :------------- |
| <a target="_blank" href="https://www.lung.mv-regierung.de/"><img alt="LUNG MV" align="middle" width="172" src="https://raw.githubusercontent.com/52North/lung-client/refs/heads/feature/mv/src/assets/img/mv_tut_gut_kl.png?token=GHSAT0AAAAAAD3IYZLJNUX3MFIGA3QBSAO62SUAV7Q"/></a> |  Landesamt für Umwelt, Naturschutz und Geologie Mecklenburg-Vorpommern |


## License

Apache-2.0. Based on the 52°North Helgoland client.