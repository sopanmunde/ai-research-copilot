import io
import os
import tokenize
from pathlib import Path

ROOT = Path(r"C:\Users\sopan\Desktop\trivisionx-ai")

SKIP_DIRS = {
    '.git', 'node_modules', '.venv', '.next', '__pycache__',
    '.bun', '.cache', '.pytest_cache', '.mypy_cache', '.ruff_cache',
    '.eggs', 'dist', 'build', '.tox', '.vscode',
}
SKIP_EXTS = {
    '.pyc', '.pyo', '.so', '.dll', '.dylib',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
    '.pdf', '.docx', '.xlsx', '.pptx',
    '.ttf', '.woff', '.woff2', '.eot',
    '.mp4', '.avi', '.mov', '.webm',
    '.zip', '.tar', '.gz', '.7z', '.rar',
    '.bin', '.exe', '.msi',
    '.lock',
}


def get_comment_info(filepath):
    ext = filepath.suffix.lower()
    name = filepath.name

    if ext == '.py':
        return 'python', None
    if ext in ('.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.mts', '.cts', '.vue'):
        return '//', ('/*', '*/')
    if ext in ('.css', '.scss', '.sass', '.less'):
        return '//', ('/*', '*/')
    if ext in ('.yml', '.yaml'):
        return '#', None
    if ext == '.toml':
        return '#', None
    if ext in ('.sh', '.bash', '.zsh'):
        return '#', None
    if ext in ('.ini', '.cfg'):
        return '#', None
    if name == '.editorconfig':
        return '#', None
    if name == 'Dockerfile' or ext == '.dockerfile':
        return '#', None
    if name in ('Makefile', 'makefile'):
        return '#', None
    if name.startswith('.env') or ext == '.env':
        return '#', None
    if name in ('.gitignore', '.dockerignore', '.prettierignore', '.eslintignore',
                '.node-version', '.nvmrc', '.python-version'):
        return '#', None
    if ext in ('.md', '.mdx'):
        return None, ('<!--', '-->')
    if ext == '.svelte':
        return '//', ('/*', '*/')

    return None, None


def process_python_file(filepath):
    """Use tokenize to safely remove actual comment-only lines from Python files."""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
    except Exception:
        return 0, 0

    if not content or not content.strip():
        return 0, 0

    lines = content.split('\n')
    comment_lines = set()

    try:
        tokens = tokenize.generate_tokens(io.StringIO(content).readline)
        for tok in tokens:
            if tok.type == tokenize.COMMENT:
                line_idx = tok.start[0] - 1
                col = tok.start[1]
                if line_idx < len(lines):
                    before_comment = lines[line_idx][:col].strip()
                    if not before_comment:
                        comment_lines.add(line_idx)
    except tokenize.TokenError:
        pass

    if not comment_lines:
        return 0, 0

    new_lines = [line for i, line in enumerate(lines) if i not in comment_lines]
    removed = len(comment_lines)

    new_content = '\n'.join(new_lines)
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return removed, 1

    return 0, 0


def process_generic_file(filepath, single_marker, block_markers):
    """Remove comment-only lines from non-Python files."""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
    except Exception:
        return 0, 0

    if not content:
        return 0, 0

    original_lines = content.split('\n')
    new_lines = []
    removed = 0
    in_block = False

    for line in original_lines:
        stripped = line.strip()

        if stripped.startswith('#!'):
            new_lines.append(line)
            continue

        if in_block:
            removed += 1
            if block_markers and block_markers[1] in stripped:
                in_block = False
            continue

        if block_markers:
            start, end = block_markers

            if start in stripped and end in stripped:
                idx_start = stripped.index(start)
                idx_end = stripped.index(end, idx_start + len(start))
                before_start = stripped[:idx_start].strip()
                after_end = stripped[idx_end + len(end):].strip()

                if not before_start and not after_end:
                    removed += 1
                    continue

            elif start in stripped and end not in stripped:
                idx_start = stripped.index(start)
                before_start = stripped[:idx_start].strip()
                if not before_start:
                    in_block = True
                    removed += 1
                    continue

        if single_marker:
            if stripped.startswith(single_marker):
                removed += 1
                continue

        new_lines.append(line)

    new_content = '\n'.join(new_lines)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return removed, 1

    return 0, 0


def process_file(filepath):
    info = get_comment_info(filepath)
    if info is None:
        return 0, 0

    marker, block_markers = info

    if marker == 'python':
        return process_python_file(filepath)
    else:
        return process_generic_file(filepath, marker, block_markers)


def main():
    total_removed = 0
    total_checked = 0
    modified_files = 0

    for root, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for file in files:
            filepath = Path(root) / file

            if filepath.suffix.lower() in SKIP_EXTS:
                continue

            total_checked += 1
            count, modified = process_file(filepath)
            if modified:
                modified_files += 1
                total_removed += count
                relpath = filepath.relative_to(ROOT)
                print(f"  {relpath}: removed {count} line(s)")

    print(f"\nDone! Checked {total_checked} files, modified {modified_files} files, removed {total_removed} comment lines.")


if __name__ == '__main__':
    main()
