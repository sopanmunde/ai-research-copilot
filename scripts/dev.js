const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWin = process.platform === 'win32';
const backendDir = path.join(__dirname, '..', 'backend');
const frontendDir = path.join(__dirname, '..', 'frontend');

// 1. Check and configure Python Virtual Environment
const venvDir = path.join(backendDir, '.venv');
const venvPythonWin = path.join(venvDir, 'Scripts', 'python.exe');
const venvPythonNix = path.join(venvDir, 'bin', 'python');

if (!fs.existsSync(venvDir)) {
  console.log('\x1b[33m%s\x1b[0m', '[TriVisionX] Creating Python virtual environment...');
  try {
    execSync('python -m venv .venv', { cwd: backendDir, stdio: 'inherit' });
    
    // Check if uv is available to speed up dependency installation
    let hasUv = false;
    try {
      execSync('uv --version', { stdio: 'ignore' });
      hasUv = true;
    } catch (e) {
      // uv not available
    }

    console.log('\x1b[33m%s\x1b[0m', '[TriVisionX] Installing backend dependencies...');
    if (hasUv) {
      execSync('uv pip install -r requirements.txt', { cwd: backendDir, stdio: 'inherit' });
    } else {
      const pipPath = isWin
        ? path.join(venvDir, 'Scripts', 'pip.exe')
        : path.join(venvDir, 'bin', 'pip');
      execSync(`"${pipPath}" install -r requirements.txt`, { cwd: backendDir, stdio: 'inherit' });
    }
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `[TriVisionX] Failed to setup python environment: ${error.message}`);
  }
}

let pythonCmd = isWin ? 'python' : 'python3';
if (isWin && fs.existsSync(venvPythonWin)) {
  pythonCmd = venvPythonWin;
} else if (!isWin && fs.existsSync(venvPythonNix)) {
  pythonCmd = venvPythonNix;
}

// 2. Check and install frontend dependencies
const nodeModulesDir = path.join(frontendDir, 'node_modules');
if (!fs.existsSync(nodeModulesDir)) {
  console.log('\x1b[33m%s\x1b[0m', '[TriVisionX] Installing frontend dependencies...');
  let installCmd = 'bun install';
  try {
    execSync('bun --version', { stdio: 'ignore' });
  } catch (e) {
    installCmd = 'npm install';
  }
  try {
    execSync(installCmd, { cwd: frontendDir, stdio: 'inherit' });
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `[TriVisionX] Failed to install frontend dependencies: ${error.message}`);
  }
}

let frontendCmd = 'bun';
let frontendArgs = ['dev'];
const hasBunLock = fs.existsSync(path.join(frontendDir, 'bun.lock'));
if (!hasBunLock) {
  frontendCmd = isWin ? 'npm.cmd' : 'npm';
  frontendArgs = ['run', 'dev'];
}

console.log('\x1b[32m%s\x1b[0m', `[TriVisionX] Starting FastAPI Backend with: ${pythonCmd}`);
console.log('\x1b[36m%s\x1b[0m', `[TriVisionX] Starting Next.js Frontend with: ${frontendCmd} ${frontendArgs.join(' ')}`);

const backend = spawn(pythonCmd, ['index.py'], {
  cwd: backendDir,
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
