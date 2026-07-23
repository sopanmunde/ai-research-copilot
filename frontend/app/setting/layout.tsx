import { AuthGuard } from "@/components/auth/AuthGuard"

export default function SettingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthGuard>{children}</AuthGuard>
}
