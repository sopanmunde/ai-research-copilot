"""
src/tools/github_tools.py — GitHub API Integration Tools
=========================================================
Provides LangChain @tool functions for interacting with GitHub:
  1. get_repo_context   — fetch README, file tree, and recent commits
  2. create_github_issue — create a GitHub issue via REST API
  3. post_pr_comment    — post a comment on a pull request

Requires GITHUB_TOKEN in .env (Personal Access Token with repo scope).
"""
import httpx
from typing import Optional
from langchain_core.tools import tool
from core.config import settings
from core.logger import get_logger

logger = get_logger(__name__)

GITHUB_API = "https://api.github.com"


def _get_token() -> Optional[str]:
    return getattr(settings, "GITHUB_TOKEN", "") or None


def _github_headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


# ---------------------------------------------------------------------------
# 1. get_repo_context
# ---------------------------------------------------------------------------

@tool
async def get_repo_context(owner: str, repo: str, include_tree: bool = True) -> str:
    """
    Fetch high-level context about a GitHub repository: README, file tree, and recent commits.

    Use this tool when:
    - The user wants you to review or contribute to a GitHub repository
    - You need to understand a project's structure before generating code for it
    - The user asks 'what does this repo do?' or 'explain this project'
    - You need to know what files exist before writing new ones

    Args:
        owner: GitHub username or organization name (e.g., 'microsoft', 'langchain-ai').
        repo: Repository name (e.g., 'vscode', 'langchain').
        include_tree: Whether to include the file tree (default: True).

    Returns:
        Formatted string with repository README preview, file structure, and recent commits.
    """
    token = _get_token()
    if not token:
        return "Error: GITHUB_TOKEN is not configured. Add it to your .env file to use GitHub tools."

    logger.info(f"[get_repo_context] Fetching: {owner}/{repo}")
    headers = _github_headers(token)
    sections = [f"GitHub Repository: {owner}/{repo}\n{'='*60}"]

    async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
        # 1. Repo metadata
        try:
            res = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}")
            if res.status_code == 200:
                data = res.json()
                sections.append(
                    f"\nDescription: {data.get('description') or 'N/A'}"
                    f"\nLanguage: {data.get('language') or 'N/A'}"
                    f"\nStars: {data.get('stargazers_count', 0):,}"
                    f"\nForks: {data.get('forks_count', 0):,}"
                    f"\nOpen Issues: {data.get('open_issues_count', 0):,}"
                    f"\nDefault Branch: {data.get('default_branch', 'main')}"
                )
            elif res.status_code == 404:
                return f"Error: Repository '{owner}/{repo}' not found or is private."
        except Exception as e:
            logger.warning(f"[get_repo_context] Metadata error: {e}")

        # 2. README
        try:
            res = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}/readme",
                                   headers={**headers, "Accept": "application/vnd.github.raw"})
            if res.status_code == 200:
                readme = res.text[:2000]
                sections.append(f"\n--- README (first 2000 chars) ---\n{readme}")
        except Exception as e:
            logger.warning(f"[get_repo_context] README error: {e}")

        # 3. File tree (top-level)
        if include_tree:
            try:
                res = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/HEAD",
                                       params={"recursive": "0"})
                if res.status_code == 200:
                    tree = res.json().get("tree", [])
                    file_lines = []
                    for entry in tree[:50]:  # Limit to 50 top-level entries
                        icon = "📁" if entry.get("type") == "tree" else "📄"
                        file_lines.append(f"  {icon} {entry.get('path', '')}")
                    sections.append(f"\n--- File Tree (root) ---\n" + "\n".join(file_lines))
            except Exception as e:
                logger.warning(f"[get_repo_context] Tree error: {e}")

        # 4. Recent commits
        try:
            res = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}/commits",
                                   params={"per_page": 5})
            if res.status_code == 200:
                commits = res.json()
                commit_lines = []
                for c in commits:
                    sha = c.get("sha", "")[:7]
                    msg = (c.get("commit", {}).get("message", "")[:80] or "").split("\n")[0]
                    author = c.get("commit", {}).get("author", {}).get("name", "Unknown")
                    commit_lines.append(f"  [{sha}] {msg} — {author}")
                sections.append(f"\n--- Recent Commits ---\n" + "\n".join(commit_lines))
        except Exception as e:
            logger.warning(f"[get_repo_context] Commits error: {e}")

    return "\n".join(sections)


# ---------------------------------------------------------------------------
# 2. create_github_issue
# ---------------------------------------------------------------------------

@tool
async def create_github_issue(
    owner: str,
    repo: str,
    title: str,
    body: str,
    labels: str = "",
) -> str:
    """
    Create a new issue in a GitHub repository.

    Use this tool when:
    - The user wants to track a bug, feature request, or task in GitHub
    - You've identified a problem in code review and want to log it as an issue
    - The user asks you to 'create a GitHub issue for this'

    Args:
        owner: GitHub username or organization (e.g., 'myorg').
        repo: Repository name (e.g., 'my-project').
        title: Issue title (concise, descriptive).
        body: Issue body in markdown. Include steps to reproduce, expected behavior, etc.
        labels: Comma-separated label names (e.g., 'bug,high-priority'). Leave empty if none.

    Returns:
        Success message with the issue number and URL, or an error message.
    """
    token = _get_token()
    if not token:
        return "Error: GITHUB_TOKEN is not configured. Add it to your .env file to use GitHub tools."

    logger.info(f"[create_github_issue] Creating issue in {owner}/{repo}: '{title[:60]}'")
    headers = _github_headers(token)

    payload: dict = {"title": title[:256], "body": body[:65536]}
    if labels:
        payload["labels"] = [l.strip() for l in labels.split(",") if l.strip()]

    async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
        try:
            res = await client.post(f"{GITHUB_API}/repos/{owner}/{repo}/issues", json=payload)
            if res.status_code in (200, 201):
                data = res.json()
                issue_number = data.get("number")
                issue_url = data.get("html_url", "")
                logger.info(f"[create_github_issue] Created #{issue_number}: {issue_url}")
                return f"✅ GitHub issue created successfully!\nIssue #{issue_number}: {title}\nURL: {issue_url}"
            elif res.status_code == 404:
                return f"Error: Repository '{owner}/{repo}' not found or you don't have write access."
            elif res.status_code == 403:
                return "Error: GitHub token doesn't have permission to create issues. Check token scopes."
            else:
                return f"Error creating issue ({res.status_code}): {res.text[:300]}"
        except Exception as e:
            logger.error(f"[create_github_issue] Exception: {e}")
            return f"Failed to create GitHub issue: {str(e)[:200]}"


# ---------------------------------------------------------------------------
# 3. post_pr_comment
# ---------------------------------------------------------------------------

@tool
async def post_pr_comment(
    owner: str,
    repo: str,
    pr_number: int,
    comment: str,
) -> str:
    """
    Post a comment on an open GitHub Pull Request.

    Use this tool when:
    - You've reviewed code changes in a PR and want to share feedback
    - The user asks you to 'comment on PR #N with your review'
    - You want to post automated code review results to a PR

    Args:
        owner: GitHub username or organization.
        repo: Repository name.
        pr_number: The pull request number (e.g., 42).
        comment: The markdown-formatted comment to post.

    Returns:
        Success message with the comment URL, or an error message.
    """
    token = _get_token()
    if not token:
        return "Error: GITHUB_TOKEN is not configured. Add it to your .env file to use GitHub tools."

    logger.info(f"[post_pr_comment] Posting comment to {owner}/{repo}#PR{pr_number}")
    headers = _github_headers(token)

    # PRs use the issues comments endpoint in GitHub API
    url = f"{GITHUB_API}/repos/{owner}/{repo}/issues/{pr_number}/comments"
    payload = {"body": comment[:65536]}

    async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
        try:
            res = await client.post(url, json=payload)
            if res.status_code in (200, 201):
                data = res.json()
                comment_url = data.get("html_url", "")
                logger.info(f"[post_pr_comment] Posted comment: {comment_url}")
                return f"✅ Comment posted to PR #{pr_number}\nURL: {comment_url}"
            elif res.status_code == 404:
                return f"Error: PR #{pr_number} not found in '{owner}/{repo}'."
            else:
                return f"Error posting comment ({res.status_code}): {res.text[:300]}"
        except Exception as e:
            logger.error(f"[post_pr_comment] Exception: {e}")
            return f"Failed to post PR comment: {str(e)[:200]}"
