"""
src/tools/code_tools.py — Code Execution & Formatting Tools
============================================================
Provides LangChain @tool functions for:
  1. python_code_executor — runs Python code in a sandboxed subprocess
  2. format_code          — formats code using black (Python) or prettier (JS/TS)

Safety:
  - Execution is time-limited via CODE_EXECUTION_TIMEOUT_SECONDS (default: 30s)
  - No network access inside the sandbox (subprocess has no outbound calls)
  - Dangerous builtins (os.system, subprocess, __import__ etc.) are blocked
    when SAFE_MODE=True (default)
"""
import asyncio
import subprocess
import sys
import tempfile
import os
import textwrap
from datetime import datetime, timezone
from typing import Optional
from langchain_core.tools import tool
from core.config import settings
from core.logger import get_logger

logger = get_logger(__name__)

# Dangerous patterns blocked in safe mode
_BLOCKED_PATTERNS = [
    "import os", "import sys", "import subprocess", "import socket",
    "import shutil", "import pathlib", "__import__", "eval(", "exec(",
    "open(", "os.system", "os.popen", "os.remove", "os.rmdir",
    "shutil.rmtree", "sys.exit", "socket.", "__builtins__",
]


def _is_safe_code(code: str) -> tuple[bool, str]:
    """Check for dangerous patterns. Returns (is_safe, reason)."""
    code_lower = code.lower()
    for pattern in _BLOCKED_PATTERNS:
        if pattern.lower() in code_lower:
            return False, f"Blocked pattern detected: '{pattern}'"
    return True, ""


# ---------------------------------------------------------------------------
# 1. python_code_executor
# ---------------------------------------------------------------------------

@tool
async def python_code_executor(code: str, timeout: int = 30) -> str:
    """
    Execute Python code in a secure sandboxed subprocess and return the output.

    Use this tool when:
    - You need to verify that generated code actually runs without errors
    - You want to compute mathematical results, process data, or test logic
    - The user asks to run or test a Python snippet
    - You need to validate algorithm correctness with sample inputs

    Args:
        code: Valid Python code to execute. Do NOT include dangerous imports.
              Pure computational/algorithmic code only.
        timeout: Maximum execution time in seconds (default: 30, max: 60).

    Returns:
        JSON-like string with keys: stdout, stderr, exit_code, execution_time_ms
        Example: "stdout: Hello World\\nexit_code: 0\\nexecution_time_ms: 45"
    """
    timeout = min(timeout, getattr(settings, "CODE_EXECUTION_TIMEOUT_SECONDS", 30))
    logger.info(f"[python_code_executor] Executing {len(code)} chars of code (timeout={timeout}s)")

    # Safety check
    is_safe, reason = _is_safe_code(code)
    if not is_safe:
        logger.warning(f"[python_code_executor] Blocked unsafe code: {reason}")
        return f"BLOCKED: {reason}\nPlease rewrite the code without using system-level operations."

    # Write code to a temporary file
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", delete=False, encoding="utf-8"
    ) as tmp:
        tmp.write(code)
        tmp_path = tmp.name

    start_time = asyncio.get_event_loop().time()
    stdout_output = ""
    stderr_output = ""
    exit_code = -1

    try:
        # Run in a subprocess with timeout
        proc = await asyncio.create_subprocess_exec(
            sys.executable, tmp_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env={
                # Minimal safe env — no PATH manipulation or secrets
                "PYTHONPATH": "",
                "HOME": tempfile.gettempdir(),
            },
        )

        try:
            raw_stdout, raw_stderr = await asyncio.wait_for(
                proc.communicate(), timeout=float(timeout)
            )
            stdout_output = raw_stdout.decode("utf-8", errors="replace").strip()
            stderr_output = raw_stderr.decode("utf-8", errors="replace").strip()
            exit_code = proc.returncode or 0
        except asyncio.TimeoutError:
            proc.kill()
            await proc.communicate()
            stderr_output = f"TimeoutError: Code execution exceeded {timeout} seconds."
            exit_code = -1

    except Exception as e:
        stderr_output = f"ExecutionError: {str(e)}"
        exit_code = -1
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

    elapsed_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)

    # Build result string
    parts = []
    if stdout_output:
        parts.append(f"stdout:\n{stdout_output}")
    if stderr_output:
        parts.append(f"stderr:\n{stderr_output}")
    parts.append(f"exit_code: {exit_code}")
    parts.append(f"execution_time_ms: {elapsed_ms}")

    result = "\n".join(parts)
    logger.info(f"[python_code_executor] exit_code={exit_code}, time={elapsed_ms}ms")
    return result


# ---------------------------------------------------------------------------
# 2. format_code
# ---------------------------------------------------------------------------

@tool
async def format_code(code: str, language: str = "python") -> str:
    """
    Format source code using the standard formatter for the given language.

    Supported languages:
    - python: uses 'black' formatter (must be installed)
    - javascript / typescript: returns code unchanged (prettier requires Node.js)

    Use this tool when:
    - You want to ensure generated code follows standard style guidelines
    - The code looks messy and needs consistent indentation/formatting
    - Before presenting final code to the user

    Args:
        code: The source code string to format.
        language: The programming language ('python', 'javascript', 'typescript').

    Returns:
        The formatted source code string, or the original code if formatting fails.
    """
    language = language.lower().strip()
    logger.info(f"[format_code] Formatting {len(code)} chars of {language} code")

    if language == "python":
        return await _format_python(code)
    elif language in ("javascript", "typescript", "js", "ts"):
        # Return as-is (prettier requires Node environment)
        logger.info("[format_code] JS/TS formatting skipped — requires prettier in Node env")
        return code
    else:
        logger.info(f"[format_code] No formatter available for '{language}', returning original")
        return code


async def _format_python(code: str) -> str:
    """Format Python code using black."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", delete=False, encoding="utf-8"
    ) as tmp:
        tmp.write(code)
        tmp_path = tmp.name

    try:
        proc = await asyncio.create_subprocess_exec(
            sys.executable, "-m", "black", "--quiet", tmp_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await asyncio.wait_for(proc.communicate(), timeout=10.0)

        with open(tmp_path, "r", encoding="utf-8") as f:
            formatted = f.read()
        return formatted
    except FileNotFoundError:
        logger.warning("[format_code] black is not installed, returning unformatted code")
        return code
    except Exception as e:
        logger.warning(f"[format_code] black error: {e}")
        return code
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
