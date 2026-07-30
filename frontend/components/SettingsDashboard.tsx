"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import {
  User, Palette, Key, Shield, Zap, CreditCard, Bell,
  Save, Sun, Moon, Monitor, Eye, EyeOff,
  RefreshCw, Smartphone, Laptop, Lock, ArrowLeft
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/api"

type SettingsTab = "profile" | "appearance" | "models" | "security" | "integrations" | "billing" | "notifications"

export function SettingsDashboard({ onNavigateToChat }: { onNavigateToChat?: () => void }) {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")
  const [isSaving, setIsSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})

  // User Profile State
  const [profile, setProfile] = useState({
    firstName: "Alex",
    lastName: "Dev",
    username: "alex_dev",
    email: "alex.dev@trivisionx.ai",
    bio: "AI Systems Engineer & Agentic Automation Specialist.",
    timezone: "UTC-5 (Eastern Time)",
  })

  // Model & API Keys State
  const [apiKeys, setApiKeys] = useState({
    openai: "sk-proj-49912093821729103...",
    anthropic: "sk-ant-api03-9912019...",
    gemini: "AIzaSyB89102931...",
    deepseek: "sk-ds-991204...",
    pinecone: "pcsk_499201...",
  })

  const [modelSettings, setModelSettings] = useState({
    defaultModel: "Claude 3.5 Sonnet",
    temperature: "0.2",
    maxTokens: "4096",
    enableFallback: true,
  })

  // Security State
  const [security, setSecurity] = useState({
    twoFactor: true,
    sessionTimeout: "30",
  })

  // Webhook State
  const [webhooks, setWebhooks] = useState({
    url: "https://api.trivisionx.ai/v1/webhooks/events",
    secret: "whsec_99410293810293",
    eventsPR: true,
    eventsSecOps: true,
    eventsRAG: true,
  })

  // Notifications State
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    slackPush: true,
    weeklyDigest: false,
    securityIncidentAlerts: true,
  })

  // Fetch logged in user details if available
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) return

    fetch(`${API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setProfile((prev) => ({
            ...prev,
            firstName: data.first_name || prev.firstName,
            lastName: data.last_name || prev.lastName,
            username: data.username || prev.username,
            email: data.email || prev.email,
          }))
        }
      })
      .catch(() => {})
  }, [])

  const toggleShowKey = (keyName: string) => {
    setShowApiKey((prev) => ({ ...prev, [keyName]: !prev[keyName] }))
  }

  const handleSaveSettings = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast.success("Settings saved successfully", {
        description: "Your preferences and API configurations are active across all dashboard agent workflows.",
      })
    }, 600)
  }

  return (
    <div className="relative flex-1 overflow-y-auto bg-background p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Dashboard Sub-Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-1">
              {onNavigateToChat && (
                <button
                  onClick={onNavigateToChat}
                  className="hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Assistant
                </button>
              )}
              {onNavigateToChat && <span>/</span>}
              <span className="text-foreground font-semibold">Dashboard Settings</span>
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              System & Workspace Preferences
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your personal profile, model API keys, security policies, and workspace notifications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="default"
              size="sm"
              disabled={isSaving}
              onClick={handleSaveSettings}
              className="gap-2 font-semibold shadow-xs h-8 text-xs"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </Button>
          </div>
        </div>

        {/* Main Settings Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sub-Navigation Sidebar (Left) */}
          <div className="lg:col-span-3">
            <Card className="p-2 border-border bg-card">
              <nav className="space-y-1 font-mono text-xs">
                {[
                  { id: "profile", label: "Profile & Account", icon: User },
                  { id: "appearance", label: "Appearance", icon: Palette },
                  { id: "models", label: "API Keys & Models", icon: Key },
                  { id: "security", label: "Security & Auth", icon: Shield },
                  { id: "integrations", label: "Integrations & Webhooks", icon: Zap },
                  { id: "billing", label: "Billing & Plan", icon: CreditCard },
                  { id: "notifications", label: "Notifications", icon: Bell },
                ].map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as SettingsTab)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Settings Content Area (Right) */}
          <div className="lg:col-span-9 space-y-6">
            {/* 1. Profile Tab */}
            {activeTab === "profile" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">Profile & Account Settings</CardTitle>
                  <CardDescription className="text-xs">
                    Update your workspace display identity, avatar, and contact email.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 border-b border-border pb-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold border border-border shadow-xs">
                      {(profile.firstName[0] || "A") + (profile.lastName[0] || "D")}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{profile.firstName} {profile.lastName}</h4>
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-xs">First Name</Label>
                      <Input
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="username" className="text-xs">Username</Label>
                      <Input
                        id="username"
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bio" className="text-xs">Bio & Role</Label>
                    <Input
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </CardContent>
                <CardFooter className="justify-end border-t border-border pt-3">
                  <Button size="sm" className="h-8 text-xs" onClick={handleSaveSettings}>Save Profile</Button>
                </CardFooter>
              </Card>
            )}

            {/* 2. Appearance Tab */}
            {activeTab === "appearance" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">Appearance & Theme</CardTitle>
                  <CardDescription className="text-xs">
                    Customize your dashboard interface theme, density, and animation preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                      Color Theme Mode
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "light", label: "Light", icon: Sun, desc: "Bright dashboard" },
                        { id: "dark", label: "Dark", icon: Moon, desc: "Dark enterprise" },
                        { id: "system", label: "System", icon: Monitor, desc: "OS default" },
                      ].map((t) => {
                        const Icon = t.icon
                        const isActive = theme === t.id
                        return (
                          <Card
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={`p-3.5 cursor-pointer transition-all border ${
                              isActive
                                ? "border-primary ring-1 ring-ring bg-accent/30"
                                : "border-border hover:border-accent-foreground/30"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <Icon className="w-4 h-4 text-primary" />
                              {isActive && <Badge variant="default" className="text-[8px] px-1 py-0">Active</Badge>}
                            </div>
                            <h5 className="font-bold text-xs text-foreground">{t.label}</h5>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-xs text-foreground">Compact Density</h4>
                        <p className="text-[11px] text-muted-foreground">Reduce panel spacing for high-density monitoring displays.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-xs text-foreground font-sans">Particle Workflow Animations</h4>
                        <p className="text-[11px] text-muted-foreground">Display live glowing signal streams on agent canvas graphs.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 3. API Keys & Models Tab */}
            {activeTab === "models" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">LLM API Keys & Model Runtimes</CardTitle>
                  <CardDescription className="text-xs">
                    Configure provider credentials and default fallback model engines.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    {[
                      { id: "openai", name: "OpenAI API Key", value: apiKeys.openai },
                      { id: "anthropic", name: "Anthropic Claude API Key", value: apiKeys.anthropic },
                      { id: "gemini", name: "Google Gemini API Key", value: apiKeys.gemini },
                      { id: "deepseek", name: "DeepSeek API Key", value: apiKeys.deepseek },
                      { id: "pinecone", name: "Pinecone Vector DB Key", value: apiKeys.pinecone },
                    ].map((keyItem) => (
                      <div key={keyItem.id} className="space-y-1 font-mono text-xs">
                        <Label htmlFor={keyItem.id} className="text-xs">{keyItem.name}</Label>
                        <div className="flex gap-2">
                          <Input
                            id={keyItem.id}
                            type={showApiKey[keyItem.id] ? "text" : "password"}
                            value={keyItem.value}
                            onChange={(e) => setApiKeys({ ...apiKeys, [keyItem.id]: e.target.value })}
                            className="font-mono text-xs h-9"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0 h-9 w-9"
                            onClick={() => toggleShowKey(keyItem.id)}
                          >
                            {showApiKey[keyItem.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                    <div className="space-y-1">
                      <Label htmlFor="defaultModel" className="text-xs">Default Model Engine</Label>
                      <Input
                        id="defaultModel"
                        value={modelSettings.defaultModel}
                        onChange={(e) => setModelSettings({ ...modelSettings, defaultModel: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="temp" className="text-xs">Temperature</Label>
                      <Input
                        id="temp"
                        value={modelSettings.temperature}
                        onChange={(e) => setModelSettings({ ...modelSettings, temperature: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="maxTokens" className="text-xs">Max Tokens Limit</Label>
                      <Input
                        id="maxTokens"
                        value={modelSettings.maxTokens}
                        onChange={(e) => setModelSettings({ ...modelSettings, maxTokens: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end border-t border-border pt-3">
                  <Button size="sm" className="h-8 text-xs" onClick={handleSaveSettings}>Save API Keys</Button>
                </CardFooter>
              </Card>
            )}

            {/* 4. Security Tab */}
            {activeTab === "security" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">Security & Authentication</CardTitle>
                  <CardDescription className="text-xs">
                    Manage multi-factor authentication, active login sessions, and password security.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-foreground">Two-Factor Authentication (2FA)</h4>
                      <p className="text-[11px] text-muted-foreground">Secure your account with TOTP authenticator apps (Google Authenticator, 1Password).</p>
                    </div>
                    <Switch
                      checked={security.twoFactor}
                      onCheckedChange={(checked) => setSecurity({ ...security, twoFactor: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold text-xs text-foreground">Active Authorized Sessions</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-2.5">
                          <Laptop className="w-4 h-4 text-primary" />
                          <div>
                            <div className="font-bold text-xs">Chrome on Windows 11 (Current Session)</div>
                            <div className="text-[10px] text-muted-foreground">IP: 194.26.29.10 • Active now</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-[9px] px-1.5 py-0">Active</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-2.5">
                          <Smartphone className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-bold text-xs">Safari on iOS 18</div>
                            <div className="text-[10px] text-muted-foreground">IP: 172.56.21.90 • 2 hours ago</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:bg-destructive/10">
                          Revoke
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 5. Integrations & Webhooks Tab */}
            {activeTab === "integrations" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">Webhooks & External Integrations</CardTitle>
                  <CardDescription className="text-xs">
                    Configure outgoing webhook payloads for agent events, GitHub PR comments, and Slack channels.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1 font-mono text-xs">
                    <Label htmlFor="webhookUrl" className="text-xs">Webhook Endpoint URL</Label>
                    <Input
                      id="webhookUrl"
                      value={webhooks.url}
                      onChange={(e) => setWebhooks({ ...webhooks, url: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1 font-mono text-xs">
                    <Label htmlFor="webhookSecret" className="text-xs">Signing Secret</Label>
                    <Input
                      id="webhookSecret"
                      type="password"
                      value={webhooks.secret}
                      onChange={(e) => setWebhooks({ ...webhooks, secret: e.target.value })}
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold text-xs text-foreground">Subscribed Event Triggers</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground">GitHub PR Code Audit Approval Events</span>
                        <Switch
                          checked={webhooks.eventsPR}
                          onCheckedChange={(c) => setWebhooks({ ...webhooks, eventsPR: c })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground">SecOps Automated Incident Alerts</span>
                        <Switch
                          checked={webhooks.eventsSecOps}
                          onCheckedChange={(c) => setWebhooks({ ...webhooks, eventsSecOps: c })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground">RAG Vector Knowledge Graph Updates</span>
                        <Switch
                          checked={webhooks.eventsRAG}
                          onCheckedChange={(c) => setWebhooks({ ...webhooks, eventsRAG: c })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 6. Billing Tab */}
            {activeTab === "billing" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">Billing & Subscription Plan</CardTitle>
                  <CardDescription className="text-xs">
                    Manage your organization subscription, usage quotas, and payment receipts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <Badge variant="default" className="mb-1.5 text-[9px]">PRO ENTERPRISE</Badge>
                      <h3 className="font-extrabold text-lg text-foreground">$49 / month</h3>
                      <p className="text-xs text-muted-foreground">Includes 5M tokens/mo, 128 parallel agent nodes, and priority support.</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-xs">Manage Subscription</Button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-xs text-foreground">Monthly Quota Consumption</h4>
                    <div className="space-y-2 text-xs font-mono">
                      <div>
                        <div className="flex justify-between text-muted-foreground mb-1 text-[11px]">
                          <span>Token Usage: 1,240,000 / 5,000,000</span>
                          <span>24.8%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-[24.8%]" />
                        </div>
                      </div>

                      <div className="pt-1">
                        <div className="flex justify-between text-muted-foreground mb-1 text-[11px]">
                          <span>Vector Storage: 4.8 GB / 20.0 GB</span>
                          <span>24.0%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[24%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 7. Notifications Tab */}
            {activeTab === "notifications" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">Notification Preferences</CardTitle>
                  <CardDescription className="text-xs">
                    Control how and when TriVisionX sends email alerts and Slack messages.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-foreground">Critical Security Incident Alerts</h4>
                      <p className="text-[11px] text-muted-foreground">Immediate alerts when Datadog SIEM or AWS WAF triggers automated remediation.</p>
                    </div>
                    <Switch
                      checked={notifications.securityIncidentAlerts}
                      onCheckedChange={(c) => setNotifications({ ...notifications, securityIncidentAlerts: c })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-foreground">Slack Instant Push Notifications</h4>
                      <p className="text-[11px] text-muted-foreground">Post PR review approvals directly to #engineering channel.</p>
                    </div>
                    <Switch
                      checked={notifications.slackPush}
                      onCheckedChange={(c) => setNotifications({ ...notifications, slackPush: c })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-foreground">Weekly Usage & Cost Digest</h4>
                      <p className="text-[11px] text-muted-foreground">Receive weekly summary emails detailing token throughput and cost breakdowns.</p>
                    </div>
                    <Switch
                      checked={notifications.weeklyDigest}
                      onCheckedChange={(c) => setNotifications({ ...notifications, weeklyDigest: c })}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
