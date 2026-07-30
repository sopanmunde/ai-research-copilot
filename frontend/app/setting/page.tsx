'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SettingPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard?tab=setting")
  }, [router])

  return null
}