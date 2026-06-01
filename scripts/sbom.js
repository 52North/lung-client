import { execFileSync } from 'child_process';

console.log(`Creating SBOM`);
execFileSync(process.execPath, [
    './node_modules/@cyclonedx/cyclonedx-npm/bin/cyclonedx-npm-cli.js',
    '--output-format', 'JSON',
    '--omit', 'dev',
    '--flatten-components',
    '--output-reproducible',
    '--output-file', `sbom.json`
]);
