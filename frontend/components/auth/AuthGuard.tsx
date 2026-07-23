"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      const token = localStorage.getItem("token")
      const cookieAuth = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="))

      if (!token && !cookieAuth) {
        setIsAuthenticated(false)
        router.replace("/login")
      } else {
        setIsAuthenticated(true)
      }
    } catch {
      setIsAuthenticated(false)
      router.replace("/login")
    }
  }, [router])

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
