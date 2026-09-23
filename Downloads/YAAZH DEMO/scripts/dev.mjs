import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const processes = [
  spawn(npmCommand, ['run', 'dev:frontend'], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  }),
  spawn(npmCommand, ['run', 'dev:backend'], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  }),
];

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of processes) {
    if (!child.killed) child.kill();
  }
  process.exitCode = exitCode;
}

for (const child of processes) {
  child.on('error', (error) => {
    console.error(`[YAAZH] Failed to start process: ${error.message}`);
    shutdown(1);
  });
  child.on('exit', (code, signal) => {
    if (!shuttingDown && (code ?? 0) !== 0) {
      console.error(`[YAAZH] A development process stopped${signal ? ` (${signal})` : ` with code ${code}`}.`);
      shutdown(code ?? 1);
    }
  });
}

process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());
