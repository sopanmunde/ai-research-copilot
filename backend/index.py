"""
backend/index.py — Uvicorn entry point
=======================================
Imports the enterprise app factory from src/main.py.
Run with: python index.py  OR  uvicorn index:app --reload
"""
import os
import sys
import warnings

try:
    from langchain_core.exceptions import LangChainPendingDeprecationWarning
    warnings.filterwarnings("ignore", category=LangChainPendingDeprecationWarning)
except ImportError:
    pass

warnings.filterwarnings("ignore", category=RuntimeWarning, message=".*ClientResponse.json.*")
warnings.filterwarnings("ignore", module="langgraph")
warnings.filterwarnings("ignore", module="sentence_transformers")
warnings.filterwarnings("ignore", message=".*allowed_objects.*")

os.environ.setdefault("PYTHONIOENCODING", "utf-8")
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

if sys.platform == "win32":
    import asyncio
    from functools import wraps
    try:
        from asyncio.proactor_events import _ProactorBasePipeTransport
        def silence_connection_reset(func):
            @wraps(func)
            def wrapper(self, *args, **kwargs):
                try:
                    return func(self, *args, **kwargs)
                except (ConnectionResetError, BrokenPipeError):
                    pass
            return wrapper
        _ProactorBasePipeTransport._call_connection_lost = silence_connection_reset(
            _ProactorBasePipeTransport._call_connection_lost
        )
    except ImportError:
        pass

PORT = 8000

def _free_port(port: int) -> None:
    """Kill any process holding the given port before binding."""
    import subprocess, platform
    if platform.system() == "Windows":
        try:
            result = subprocess.run(
                ["netstat", "-ano"],
                capture_output=True, text=True
            )
            for line in result.stdout.splitlines():
                if f":{port}" in line and "LISTENING" in line:
                    parts = line.split()
                    pid = int(parts[-1])
                    if pid != os.getpid():
                        subprocess.run(["taskkill", "/F", "/PID", str(pid)],
                                       capture_output=True)
                        print(f"Freed port {port} (killed PID {pid})")
        except Exception as e:
            print(f"Warning: could not auto-free port {port}: {e}")

print("Starting index.py...")
from src.main import create_app
print("Imported create_app, creating app...")
app = create_app()
print("App created successfully.")

if __name__ == "__main__":
    _free_port(PORT)
    print("Running uvicorn...")
    import uvicorn
    uvicorn.run("index:app")
