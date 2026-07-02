from starlette.middleware.gzip import GZipMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send

class CompressionMiddleware:
    """
    Middleware that compresses HTTP responses using gzip if Accept-Encoding is present,
    excluding configured paths (like SSE streaming routes) and responses below a minimum size.
    """
    def __init__(
        self,
        app: ASGIApp,
        minimum_size: int = 1000,
        exclude_paths: list[str] = None
    ) -> None:
        self.app = app
        self.minimum_size = minimum_size
        self.exclude_paths = exclude_paths or []
        self.gzip_middleware = GZipMiddleware(app, minimum_size=minimum_size)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http":
            path = scope.get("path", "")
            normalized_path = path.rstrip("/")
            normalized_excludes = [p.rstrip("/") for p in self.exclude_paths]
            
            if any(normalized_path.startswith(ex_path) for ex_path in normalized_excludes if ex_path):
                await self.app(scope, receive, send)
                return
                
        await self.gzip_middleware(scope, receive, send)

        