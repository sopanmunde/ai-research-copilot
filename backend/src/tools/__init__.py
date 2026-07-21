"""
src/tools/__init__.py — Tool registry for TriVisionX LangGraph agents
=====================================================================
Exports all LangChain @tool functions grouped by category.

Tool Categories:
  - web_tools   : web_search, fetch_webpage_content
  - code_tools  : python_code_executor, format_code
  - file_tools  : read_file, write_file, list_directory, apply_git_diff
  - rag_tools   : search_knowledge_base, query_user_workspace
  - github_tools: get_repo_context, create_github_issue, post_pr_comment
"""

from src.tools.web_tools import web_search, fetch_webpage_content
from src.tools.code_tools import python_code_executor, format_code
from src.tools.file_tools import read_workspace_file, write_workspace_file, list_workspace_directory, apply_git_diff
from src.tools.rag_tools import search_knowledge_base, query_user_workspace
from src.tools.github_tools import get_repo_context, create_github_issue, post_pr_comment

# All available tools (bind these to LLM via llm.bind_tools(ALL_TOOLS))
ALL_TOOLS = [
    web_search,
    fetch_webpage_content,
    python_code_executor,
    format_code,
    read_workspace_file,
    write_workspace_file,
    list_workspace_directory,
    apply_git_diff,
    search_knowledge_base,
    query_user_workspace,
    get_repo_context,
    create_github_issue,
    post_pr_comment,
]

# Coding-specific tools (bound to coding agent nodes)
CODING_TOOLS = [
    python_code_executor,
    format_code,
    read_workspace_file,
    write_workspace_file,
    list_workspace_directory,
    apply_git_diff,
    get_repo_context,
    create_github_issue,
]

# Research-specific tools
RESEARCH_TOOLS = [
    web_search,
    fetch_webpage_content,
    search_knowledge_base,
    query_user_workspace,
]

__all__ = [
    "ALL_TOOLS",
    "CODING_TOOLS",
    "RESEARCH_TOOLS",
    "web_search",
    "fetch_webpage_content",
    "python_code_executor",
    "format_code",
    "read_workspace_file",
    "write_workspace_file",
    "list_workspace_directory",
    "apply_git_diff",
    "search_knowledge_base",
    "query_user_workspace",
    "get_repo_context",
    "create_github_issue",
    "post_pr_comment",
]
