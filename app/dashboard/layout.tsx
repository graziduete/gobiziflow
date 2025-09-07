import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClientSidebar } from "@/components/client/sidebar"
import { ClientHeader } from "@/components/client/header"

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      console.warn("[v0] Client auth failed:", error?.message)
      redirect("/auth/login")
    }

    // Check if user is client (not admin)
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single()

    if (profile?.role === "admin") {
      redirect("/admin")
    }
  } catch (networkError) {
    console.error("[v0] Network error in client layout:", networkError)
    console.warn("[v0] Allowing client access due to network issues")
  }

  return (
    <div className="flex h-screen bg-background">
      <ClientSidebar className="shrink-0" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ClientHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
