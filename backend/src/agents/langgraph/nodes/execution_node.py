"""
src/agents/langgraph/nodes/execution_node.py — Code Execution Node
===================================================================
Runs generated Python code in a sandboxed subprocess.
Captures stdout/stderr and exit code, then updates AgentState
for the self-correction feedback loop in the coding graph.

State reads:  generated_code, retry_count
State writes: execution_output, execution_errors, retry_count, current_node
"""
import asyncio
import sys
import tempfile
import os
from datetime import datetime, timezone
from agents.langgraph.state import AgentState
from core.config import settings
from core.logger import get_logger

logger = get_logger(__name__)

# Dangerous patterns that should never be executed server-side
_BLOCKED_PATTERNS = [
    "import os", "os.system", "os.popen", "os.remove", "os.rmdir",
    "import subprocess", "subprocess.run", "subprocess.Popen",
    "import socket", "import shutil", "shutil.rmtree",
    "__import__", "sys.exit",
]


def _is_code_safe(code: str) -> tuple[bool, str]:
    code_lower = code.lower()
    for pattern in _BLOCKED_PATTERNS:
        if pattern.lower() in code_lower:
            return False, f"Blocked pattern: '{pattern}'"
    return True, ""


async def execution_node(state: AgentState) -> dict:
    """
    Code Execution Node — runs generated Python code in a subprocess sandbox.

    Flow in coding graph:
      code_generation → execution_node → [conditional]
        ├── errors + retry_count < 3 → back to code_generation (with error feedback)
        └── success or max retries   → code_review → testing → reporter

    Returns:
        execution_output: stdout from successful run
        execution_errors: stderr/error message if failed (or empty string)
        retry_count:      incremented by 1 for each failed execution
        current_node:     'execution'
    """
    generated_code = state.get("generated_code", "").strip()
    retry_count = state.get("retry_count", 0)
    timeout = getattr(settings, "CODE_EXECUTION_TIMEOUT_SECONDS", 30)

    logger.info(
        f"[Execution] Running code ({len(generated_code)} chars), "
        f"retry_count={retry_count}, timeout={timeout}s"
    )

    # If no code was generated, pass through
    if not generated_code:
        logger.info("[Execution] No generated_code in state — skipping execution")
        return {
            "execution_output": "",
            "execution_errors": "",
            "current_node": "execution",
        }

    # Extract code block from markdown if present (```python ... ```)
    code_to_run = _extract_code_block(generated_code)

    # Safety check
    is_safe, reason = _is_code_safe(code_to_run)
    if not is_safe:
        logger.warning(f"[Execution] Blocked unsafe code: {reason}")
        return {
            "execution_output": "",
            "execution_errors": f"BLOCKED: {reason}. Code uses restricted system operations.",
            "retry_count": retry_count + 1,
            "current_node": "execution",
        }

    # Write to temp file and execute
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", delete=False, encoding="utf-8"
    ) as tmp:
        tmp.write(code_to_run)
        tmp_path = tmp.name

    stdout_output = ""
    stderr_output = ""
    exit_code = -1
    start = asyncio.get_event_loop().time()

    try:
        proc = await asyncio.create_subprocess_exec(
            sys.executable, tmp_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env={"PYTHONPATH": "", "HOME": tempfile.gettempdir()},
        )
        try:
            raw_out, raw_err = await asyncio.wait_for(
                proc.communicate(), timeout=float(timeout)
            )
            stdout_output = raw_out.decode("utf-8", errors="replace").strip()
            stderr_output = raw_err.decode("utf-8", errors="replace").strip()
            exit_code = proc.returncode or 0
        except asyncio.TimeoutError:
            proc.kill()
            await proc.communicate()
            stderr_output = f"TimeoutError: Code execution exceeded {timeout} seconds limit."
            exit_code = -1
    except Exception as e:
        stderr_output = f"ExecutionError: {str(e)}"
        exit_code = -1
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

    elapsed_ms = int((asyncio.get_event_loop().time() - start) * 1000)

    if exit_code == 0:
        logger.info(f"[Execution] ✅ Success in {elapsed_ms}ms: {stdout_output[:100]}")
        return {
            "execution_output": stdout_output or "(No output)",
            "execution_errors": "",
            "current_node": "execution",
        }
    else:
        new_retry = retry_count + 1
        logger.warning(
            f"[Execution] ❌ Failed (exit={exit_code}), retry_count → {new_retry}: "
            f"{stderr_output[:150]}"
        )
        return {
            "execution_output": stdout_output or "",
            "execution_errors": stderr_output or f"Process exited with code {exit_code}",
            "retry_count": new_retry,
            "current_node": "execution",
        }


def _extract_code_block(text: str) -> str:
    """
    Extract raw Python code from a markdown fenced code block if present.
    Falls back to the full text if no code block is found.
    """
    import re
    # Match ```python ... ``` or ``` ... ```
    pattern = re.compile(r"```(?:python|py)?\s*\n(.*?)```", re.DOTALL | re.IGNORECASE)
    matches = pattern.findall(text)
    if matches:
        return "\n\n".join(m.strip() for m in matches)
    # If no code fence, return as-is
    return text
