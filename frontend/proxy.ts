import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedRoutes = ["/dashboard"]

const authRoutes = ["/login", "/signup"]

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get("auth_token")?.value

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  const nonce = crypto.randomUUID()
  
  const isDev = process.env.NODE_ENV === "development"
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' https://vercel.live"
    : `'self' 'nonce-${nonce}' 'strict-dynamic' https://vercel.live`

  const cspHeader = `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.vercel.app https://trivisionx-ai-api.onrender.com https://trivisionx-ai.onrender.com http://localhost:8000 https://vitals.vercel-analytics.com;`

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  response.headers.set("Content-Security-Policy", cspHeader)

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
}
