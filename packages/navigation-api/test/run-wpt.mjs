import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const packagePath = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const wptPath = resolve(packagePath, 'wpt');
const python = process.env.PYTHON ?? 'python3.12';
const include = (process.env.WPT_INCLUDE ?? '')
  .split(',')
  .map(testPath => testPath.trim())
  .filter(Boolean)
  .flatMap(testPath => ['--include', testPath]);
const result = spawnSync(
  python,
  [
    'wpt',
    'run',
    '--yes',
    '--headless',
    '--install-webdriver',
    '--binary',
    chromium.executablePath(),
    '--binary-arg=--host-resolver-rules=MAP *.test 127.0.0.1',
    '--inject-script',
    '../build/wpt-inject.js',
    '--log-wptreport',
    '../wpt-report.json',
    ...include,
    'chrome',
    ...(include.length > 0 ? [] : ['navigation-api']),
  ],
  {
    cwd: wptPath,
    stdio: 'inherit',
  }
);

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
