const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWin = process.platform === 'win32';

let pythonCmd = isWin ? 'python' : 'python3';
const venvPythonWin = path.join(__dirname, '..', 'backend', '.venv', 'Scripts', 'python.exe');
const venvPythonNix = path.join(__dirname, '..', 'backend', '.venv', 'bin', 'python');

if (isWin && fs.existsSync(venvPythonWin)) {
  pythonCmd = venvPythonWin;
} else if (!isWin && fs.existsSync(venvPythonNix)) {
  pythonCmd = venvPythonNix;
}

let frontendCmd = 'bun';
let frontendArgs = ['dev'];
const frontendDir = path.join(__dirname, '..', 'frontend');
const hasBunLock = fs.existsSync(path.join(frontendDir, 'bun.lock'));
if (!hasBunLock) {
  frontendCmd = isWin ? 'npm.cmd' : 'npm';
  frontendArgs = ['run', 'dev'];
}

console.log('\x1b[32m%s\x1b[0m', `[TriVisionX] Starting FastAPI Backend with: ${pythonCmd}`);
console.log('\x1b[36m%s\x1b[0m', `[TriVisionX] Starting Next.js Frontend with: ${frontendCmd} ${frontendArgs.join(' ')}`);

const backend = spawn(pythonCmd, ['index.py'], {
  cwd: path.join(__dirname, '..', 'backend'),
  stdio: 'inherit',
  shell: true
});

const frontend = spawn(frontendCmd, frontendArgs, {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  console.log('\n[TriVisionX] Stopping all services...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
