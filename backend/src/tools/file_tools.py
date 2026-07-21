"""
src/tools/file_tools.py — Workspace File I/O Tools
===================================================
Provides LangChain @tool functions for reading and writing files
within the agent's workspace directory.

All paths are validated against CODE_EXECUTION_WORKSPACE (default: ./workspace)
to prevent directory traversal attacks.

Tools:
  1. read_workspace_file     — read a file from the workspace
  2. write_workspace_file    — write/overwrite a file in the workspace
  3. list_workspace_directory — list files and folders at a path
  4. apply_git_diff          — apply a unified diff patch to a workspace file
"""
import os
import re
import difflib
from pathlib import Path
from langchain_core.tools import tool
from src.core.config import settings
from src.core.logger import get_logger

logger = get_logger(__name__)


def _get_workspace_root() -> Path:
    """Returns the resolved, absolute workspace root directory."""
    workspace = getattr(settings, "CODE_EXECUTION_WORKSPACE", "./workspace")
    root = Path(workspace).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def _safe_resolve(relative_path: str) -> tuple[Path, str]:
    """
    Resolves a relative path against workspace root.
    Returns (resolved_path, error_message). If error_message is non-empty, the path is unsafe.
    """
    root = _get_workspace_root()
    try:
        resolved = (root / relative_path).resolve()
        # Ensure path is within workspace (prevent directory traversal)
        resolved.relative_to(root)
        return resolved, ""
    except ValueError:
        return root, f"Security violation: Path '{relative_path}' is outside the workspace directory."
    except Exception as e:
        return root, f"Path resolution error: {e}"


# ---------------------------------------------------------------------------
# 1. read_workspace_file
# ---------------------------------------------------------------------------

@tool
def read_workspace_file(path: str) -> str:
    """
    Read the contents of a file from the workspace directory.

    Use this tool when:
    - You need to inspect existing code or configuration files
    - The user wants you to review, modify, or analyze a specific file
    - You want to understand the existing codebase structure before generating new code

    Args:
        path: Relative path to the file within the workspace (e.g., 'src/main.py' or 'README.md').
              Must be within the workspace root directory.

    Returns:
        The full text content of the file, or an error message if the file doesn't exist.
    """
    resolved, err = _safe_resolve(path)
    if err:
        logger.warning(f"[read_workspace_file] {err}")
        return f"Error: {err}"

    logger.info(f"[read_workspace_file] Reading: {resolved}")

    if not resolved.exists():
        return f"Error: File not found: '{path}'"
    if not resolved.is_file():
        return f"Error: '{path}' is a directory, not a file. Use list_workspace_directory instead."

    try:
        content = resolved.read_text(encoding="utf-8", errors="replace")
        line_count = content.count("\n") + 1
        logger.info(f"[read_workspace_file] Read {len(content)} chars ({line_count} lines)")
        return f"File: {path}\nLines: {line_count}\n{'='*50}\n{content}"
    except Exception as e:
        logger.error(f"[read_workspace_file] Error reading {resolved}: {e}")
        return f"Error reading file: {e}"


# ---------------------------------------------------------------------------
# 2. write_workspace_file
# ---------------------------------------------------------------------------

@tool
def write_workspace_file(path: str, content: str, overwrite: bool = True) -> str:
    """
    Write or create a file in the workspace directory.

    Use this tool when:
    - You want to save generated code to a file
    - You're scaffolding a new project and need to create multiple files
    - You want to persist the output of code generation for the user to download

    Args:
        path: Relative path for the file (e.g., 'src/utils/helper.py').
              Parent directories will be created automatically.
        content: The text content to write to the file.
        overwrite: If True (default), overwrites existing files. If False, returns error if file exists.

    Returns:
        Success message with the file path and size, or an error message.
    """
    resolved, err = _safe_resolve(path)
    if err:
        logger.warning(f"[write_workspace_file] {err}")
        return f"Error: {err}"

    if resolved.exists() and not overwrite:
        return f"Error: File '{path}' already exists. Set overwrite=True to replace it."

    logger.info(f"[write_workspace_file] Writing {len(content)} chars to: {resolved}")

    try:
        resolved.parent.mkdir(parents=True, exist_ok=True)
        resolved.write_text(content, encoding="utf-8")
        size_kb = len(content.encode("utf-8")) / 1024
        logger.info(f"[write_workspace_file] Wrote {size_kb:.1f} KB to {path}")
        return f"✅ File written successfully: {path} ({size_kb:.1f} KB, {content.count(chr(10))+1} lines)"
    except Exception as e:
        logger.error(f"[write_workspace_file] Error writing {resolved}: {e}")
        return f"Error writing file: {e}"


# ---------------------------------------------------------------------------
# 3. list_workspace_directory
# ---------------------------------------------------------------------------

@tool
def list_workspace_directory(path: str = ".") -> str:
    """
    List files and subdirectories in the workspace at the given path.

    Use this tool when:
    - You want to see the current project structure before generating code
    - You need to check if a specific file exists
    - You're exploring the workspace layout to understand the codebase

    Args:
        path: Relative path to list (default: '.' for workspace root).
              Use subdirectory names like 'src/', 'tests/', etc.

    Returns:
        A tree-like listing of files and directories, or an error message.
    """
    resolved, err = _safe_resolve(path)
    if err:
        logger.warning(f"[list_workspace_directory] {err}")
        return f"Error: {err}"

    if not resolved.exists():
        return f"Error: Path not found: '{path}'"
    if not resolved.is_dir():
        return f"Error: '{path}' is a file, not a directory. Use read_workspace_file to read it."

    logger.info(f"[list_workspace_directory] Listing: {resolved}")

    try:
        root = _get_workspace_root()
        lines = [f"Workspace: {path}\n{'='*50}"]
        _build_tree(resolved, lines, prefix="", root=root, depth=0, max_depth=4)
        return "\n".join(lines)
    except Exception as e:
        logger.error(f"[list_workspace_directory] Error listing {resolved}: {e}")
        return f"Error listing directory: {e}"


def _build_tree(directory: Path, lines: list, prefix: str, root: Path, depth: int, max_depth: int):
    if depth >= max_depth:
        lines.append(f"{prefix}... (max depth reached)")
        return
    try:
        entries = sorted(directory.iterdir(), key=lambda p: (p.is_file(), p.name.lower()))
        for i, entry in enumerate(entries):
            is_last = (i == len(entries) - 1)
            connector = "└── " if is_last else "├── "
            rel = entry.relative_to(root)
            if entry.is_dir():
                lines.append(f"{prefix}{connector}{entry.name}/")
                extension = "    " if is_last else "│   "
                _build_tree(entry, lines, prefix + extension, root, depth + 1, max_depth)
            else:
                size = entry.stat().st_size
                size_str = f"{size:,} B" if size < 1024 else f"{size/1024:.1f} KB"
                lines.append(f"{prefix}{connector}{entry.name}  [{size_str}]")
    except PermissionError:
        lines.append(f"{prefix}[Permission denied]")


# ---------------------------------------------------------------------------
# 4. apply_git_diff
# ---------------------------------------------------------------------------

@tool
def apply_git_diff(path: str, diff: str) -> str:
    """
    Apply a unified diff patch to a file in the workspace.

    Use this tool when:
    - You want to make targeted edits to an existing file without rewriting it entirely
    - You generated a git-style diff (with +/- lines) and want to apply it
    - The user wants minimal, surgical changes to existing code

    Args:
        path: Relative path to the target file in the workspace.
        diff: A unified diff string (git diff format) with context lines, removals (-), and additions (+).

    Returns:
        Success message showing lines added/removed, or an error message.
    """
    resolved, err = _safe_resolve(path)
    if err:
        logger.warning(f"[apply_git_diff] {err}")
        return f"Error: {err}"

    if not resolved.exists():
        return f"Error: File not found: '{path}'. Cannot apply diff to non-existent file."

    logger.info(f"[apply_git_diff] Applying diff to: {resolved}")

    try:
        original = resolved.read_text(encoding="utf-8")
        original_lines = original.splitlines(keepends=True)

        # Parse and apply simple unified diff
        result_lines = list(original_lines)
        diff_lines = diff.splitlines()

        added = 0
        removed = 0
        i = 0

        # Try Python's patch approach: find context lines and apply hunks
        patched, n_added, n_removed = _apply_unified_diff(original_lines, diff_lines)

        if patched is None:
            return "Error: Could not apply diff — context lines did not match. Please verify the diff is correct."

        resolved.write_text("".join(patched), encoding="utf-8")
        logger.info(f"[apply_git_diff] Applied: +{n_added} -{n_removed} lines")
        return f"✅ Diff applied to '{path}': +{n_added} additions, -{n_removed} deletions"

    except Exception as e:
        logger.error(f"[apply_git_diff] Error: {e}")
        return f"Error applying diff: {e}"


def _apply_unified_diff(original_lines: list, diff_lines: list) -> tuple:
    """Simple unified diff applier. Returns (patched_lines, added, removed) or (None, 0, 0)."""
    patched = list(original_lines)
    added = 0
    removed = 0
    offset = 0  # Track line shifts as we apply hunks

    hunk_header = re.compile(r"^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@")

    i = 0
    while i < len(diff_lines):
        line = diff_lines[i]
        m = hunk_header.match(line)
        if m:
            orig_start = int(m.group(1)) - 1  # 0-indexed
            hunk_lines = []
            i += 1
            while i < len(diff_lines) and not hunk_header.match(diff_lines[i]):
                hunk_lines.append(diff_lines[i])
                i += 1

            # Apply this hunk
            pos = orig_start + offset
            result_pos = pos
            new_patch = []
            hunk_removed = 0
            hunk_added = 0

            for hl in hunk_lines:
                if hl.startswith("-"):
                    hunk_removed += 1
                elif hl.startswith("+"):
                    new_patch.append(hl[1:] + "\n" if not hl[1:].endswith("\n") else hl[1:])
                    hunk_added += 1
                elif hl.startswith(" "):
                    new_patch.append(patched[result_pos] if result_pos < len(patched) else "")
                    result_pos += 1
                    continue

            # Replace removed lines with new_patch
            patched[pos:pos + hunk_removed] = new_patch
            offset += hunk_added - hunk_removed
            added += hunk_added
            removed += hunk_removed
        else:
            i += 1

    return patched, added, removed
