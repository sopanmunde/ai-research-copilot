"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Check, AlertCircle, ArrowLeft, Brain, Database, GitMerge, Terminal, CheckCircle2, Webhook } from "lucide-react"
import { TriVisionXLogo } from "@/components/TriVisionXLogo"
import { API_BASE_URL } from "@/lib/api"

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const colors = ["", "bg-red-500", "bg-amber-400", "bg-yellow-400", "bg-emerald-500"]
  const labels = ["", "Weak", "Fair", "Good", "Strong"]
  const labelCls = ["", "text-red-400", "text-amber-400", "text-yellow-400", "text-emerald-400"]
  if (!password) return null
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score] : "bg-zinc-700"
              }`}
          />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-[11px] font-medium ${labelCls[score]}`}>{labels[score]}</p>
      )}
    </div>
  )
}

const inputCls =
  "flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm text-foreground shadow-sm placeholder:text-muted-foreground outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium leading-none text-zinc-200 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {children}
    </label>
  )
}

function FormItem({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5">{children}</div>
}


interface FlowNodeProps {
  label: string
  icon: React.ElementType
  className: string
  activeColor: string
}

function FlowNode({ label, icon: Icon, className, activeColor }: FlowNodeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 0.65, scale: 1 }}
      whileHover={{ opacity: 1, scale: 1.03, borderColor: "rgba(168,85,247,0.35)", boxShadow: "0 0 15px rgba(168,85,247,0.15)" }}
      transition={{ duration: 0.5 }}
      className={`absolute hidden lg:flex items-center gap-2 px-3 py-2.5 rounded-xl border border-zinc-850 bg-card/40 backdrop-blur-md shadow-lg font-mono text-[10px] text-muted-foreground pointer-events-auto transition-all ${className}`}
    >
      <div className="p-1.5 rounded-lg bg-background/80 border border-border text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-zinc-200">{label}</span>
        <span className="text-[8px] text-muted-foreground flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${activeColor} animate-pulse`} />
          FLOW ACTIVE
        </span>
      </div>
    </motion.div>
  )
}

function BackgroundFlows() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* SVG Connections */}
      <svg
        viewBox="0 0 1000 800"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full opacity-[0.12] hidden lg:block"
      >
        {/* Base Connections */}
        <path d="M 80 120 L 120 360" stroke="#3f3f46" strokeWidth="2" fill="none" />
        <path d="M 120 360 L 80 600" stroke="#3f3f46" strokeWidth="2" fill="none" />
        <path d="M 80 600 L 920 144" stroke="#3f3f46" strokeWidth="1.5" fill="none" strokeDasharray="5 5" />
        <path d="M 920 144 L 880 400" stroke="#3f3f46" strokeWidth="2" fill="none" />
        <path d="M 880 400 L 920 640" stroke="#3f3f46" strokeWidth="2" fill="none" />

        {/* Glowing flow pulses */}
        <motion.path
          d="M 80 120 L 120 360"
          stroke="url(#flowGradient)"
          strokeWidth="2.5"
          fill="none"
          strokeDasharray="12 18"
          animate={{ strokeDashoffset: [-60, 0] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 3 }}
        />
        <motion.path
          d="M 120 360 L 80 600"
          stroke="url(#flowGradient)"
          strokeWidth="2.5"
          fill="none"
          strokeDasharray="12 18"
          animate={{ strokeDashoffset: [-60, 0] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 3, delay: 1 }}
        />
        <motion.path
          d="M 80 600 L 920 144"
          stroke="url(#flowGradient)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="8 12"
          animate={{ strokeDashoffset: [-40, 0] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 5 }}
        />
        <motion.path
          d="M 920 144 L 880 400"
          stroke="url(#flowGradient)"
          strokeWidth="2.5"
          fill="none"
          strokeDasharray="12 18"
          animate={{ strokeDashoffset: [-60, 0] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 3, delay: 0.5 }}
        />
        <motion.path
          d="M 880 400 L 920 640"
          stroke="url(#flowGradient)"
          strokeWidth="2.5"
          fill="none"
          strokeDasharray="12 18"
          animate={{ strokeDashoffset: [-60, 0] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 3, delay: 1.5 }}
        />

        <defs>
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>

      {/* Scattered Flow Node Cards */}
      <FlowNode
        label="Webhook Trigger"
        icon={Webhook}
        className="left-[6%] top-[15%]"
        activeColor="bg-purple-500"
      />
      <FlowNode
        label="NLP Classifier"
        icon={Brain}
        className="left-[10%] top-[45%]"
        activeColor="bg-blue-500"
      />
      <FlowNode
        label="Pinecone Search"
        icon={Database}
        className="left-[6%] top-[75%]"
        activeColor="bg-blue-400"
      />

      <FlowNode
        label="Router Branch"
        icon={GitMerge}
        className="right-[6%] top-[18%]"
        activeColor="bg-pink-500"
      />
      <FlowNode
        label="Python Sandbox"
        icon={Terminal}
        className="right-[10%] top-[50%]"
        activeColor="bg-amber-500"
      />
      <FlowNode
        label="Slack Dispatch"
        icon={CheckCircle2}
        className="right-[6%] top-[80%]"
        activeColor="bg-emerald-500"
      />
    </div>
  )
}

function getFriendlyErrorMessage(err: Error, defaultMsg: string): string {
  const msg = err.message || "";
  if (msg.includes("Failed to fetch") || msg.includes("Load failed") || msg.includes("fetch failed")) {
    return "Unable to connect to the server. Please check if the API backend is running.";
  }
  return msg || defaultMsg;
}

function getProviderFromParams(searchParams: any): string {
  const state = searchParams.get("state")
  if (!state) return "google"
  try {
    const parts = state.split(".")
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))
      return payload.provider || "google"
    }
  } catch (e) {
  }
  return state === "github" ? "github" : "google"
}

function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isGitHubLoading, setIsGitHubLoading] = useState(false)
  const [isSsoLoading, setIsSsoLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [ssoCallbackState, setSsoCallbackState] = useState<{ active: boolean; provider: string }>({
    active: false,
    provider: "google",
  })

  useEffect(() => {
    const code = searchParams.get("code")
    if (!code) return

    const state = searchParams.get("state")
    let provider = getProviderFromParams(searchParams)

    setSsoCallbackState({ active: true, provider })

    window.history.replaceState({}, "", "/login")
    if (typeof window !== "undefined") localStorage.removeItem("oauth_provider")

    const exchangeCode = async () => {
      setIsSsoLoading(true)
      if (provider === "github") setIsGitHubLoading(true)
      else setIsGoogleLoading(true)
      setError("")
      try {
        const apiUrl = API_BASE_URL
        const res = await fetch(`${apiUrl}/auth/${provider}/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || `${provider} sign-in failed`)

        localStorage.setItem("token", data.access_token)
        document.cookie = `auth_token=${data.access_token}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`
        router.push("/dashboard")
      } catch (err) {
        const e = err as Error
        setError(getFriendlyErrorMessage(e, `${provider} sign-in failed. Please try again.`))
        setSsoCallbackState({ active: false, provider })
      } finally {
        setIsSsoLoading(false)
        setIsGoogleLoading(false)
        setIsGitHubLoading(false)
      }
    }

    exchangeCode()
  }, [searchParams, router])

  const [form, setForm] = useState({
    email: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError("")
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("oauth_provider", "google")
      }
      const apiUrl = API_BASE_URL
      const res = await fetch(`${apiUrl}/auth/google/login`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed to get Google login URL")
      window.location.href = data.authorization_url
    } catch (err) {
      const e = err as Error
      setError(getFriendlyErrorMessage(e, "Google sign-in failed. Please try again."))
      setIsGoogleLoading(false)
    }
  }

  const handleGitHubLogin = async () => {
    setIsGitHubLoading(true)
    setError("")
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("oauth_provider", "github")
      }
      const apiUrl = API_BASE_URL
      const res = await fetch(`${apiUrl}/auth/github/login`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed to get GitHub login URL")
      window.location.href = data.authorization_url
    } catch (err) {
      const e = err as Error
      setError(getFriendlyErrorMessage(e, "GitHub sign-in failed. Please try again."))
      setIsGitHubLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const apiUrl = API_BASE_URL
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Login failed")
      localStorage.setItem("token", data.access_token)
      document.cookie = `auth_token=${data.access_token}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`
      router.push("/dashboard")
    } catch (err) {
      const error = err as Error
      setError(getFriendlyErrorMessage(error, "Something went wrong. Please try again."))
    } finally {
      setIsLoading(false)
    }
  }

  if (ssoCallbackState.active) {
    const provider = ssoCallbackState.provider === "github" ? "GitHub" : "Google"

    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden">
        {/* Background radial glow */}
        <div
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[700px] h-[500px] rounded-full blur-3xl opacity-25"
          style={{ background: "radial-gradient(ellipse, rgba(113,113,122,0.4) 0%, rgba(82,82,91,0.15) 50%, transparent 70%)" }}
        />
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <BackgroundFlows />

        <div className="relative z-10 w-full max-w-sm flex flex-col items-center justify-center text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <TriVisionXLogo size="lg" animate={true} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="rounded-xl border border-border bg-card p-8 shadow-2xl shadow-black/60 w-full flex flex-col items-center space-y-5"
          >
            <div className="relative flex items-center justify-center w-12 h-12 rounded-full border border-border bg-background">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-zinc-200">
                Verifying Credentials
              </h2>
              <p className="text-xs text-muted-foreground max-w-[240px]">
                Securely authenticating with {provider}...
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden">
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[700px] h-[500px] rounded-full blur-3xl opacity-25"
        style={{ background: "radial-gradient(ellipse, rgba(113,113,122,0.4) 0%, rgba(82,82,91,0.15) 50%, transparent 70%)" }}
      />
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <BackgroundFlows />

      {/* Home button — top left */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 rounded-md border border-border bg-card/80 px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-sm hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Home
      </Link>

      {/* ── Shadcn Card ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-sm">

        {/* Logo above card — matches landing page */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center mb-6"
        >
          <TriVisionXLogo size="lg" animate={false} />
        </motion.div>

        {/* ── Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-xl border border-border bg-card text-foreground shadow-2xl shadow-black/60"
        >
          {/* CardHeader */}
          <div className="flex flex-col space-y-1 p-6 pb-4">
            <h1 className="text-xl font-semibold leading-none tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Enter your credentials to sign in.
            </p>
          </div>

          {/* CardContent */}
          <div className="p-6 pt-0 space-y-4">
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2.5 rounded-md border border-red-800/60 bg-red-950/50 px-3 py-2.5 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2.5 rounded-md border border-emerald-800/60 bg-emerald-950/50 px-3 py-2.5 text-sm text-emerald-400"
                >
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
                    <Check className="h-2.5 w-2.5 text-foreground" />
                  </div>
                  Account created! Redirecting to sign in…
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">

              {/* Email */}
              <FormItem>
                <Label htmlFor="email">Email</Label>
                <input
                  id="email" name="email" type="email" value={form.email}
                  onChange={handleChange} placeholder="m@example.com" required className={inputCls}
                />
              </FormItem>

              {/* Password */}
              <FormItem>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="text-xs text-muted-foreground hover:text-zinc-200 transition-colors underline underline-offset-4">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password" name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password} onChange={handleChange} required
                    className={inputCls + " pr-9"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormItem>

              {/* Submit — Shadcn primary button */}
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground shadow hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-300 disabled:pointer-events-none disabled:opacity-50 transition-colors"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign in
              </button>
            </form>
          </div>

          {/* CardFooter — OR divider + social */}
          <div className="px-6 pb-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground tracking-widest">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors disabled:pointer-events-none disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Google
              </button>

              {/* GitHub */}
              <button
                type="button"
                onClick={handleGitHubLogin}
                disabled={isGitHubLoading}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors disabled:pointer-events-none disabled:opacity-50"
              >
                {isGitHubLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                )}
                GitHub
              </button>
            </div>
          </div>
        </motion.div>

        {/* Toggle sign-in / sign-up */}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  )
}
