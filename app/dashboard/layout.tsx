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
    <div className="relative flex h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Background blobs (sutil, inspirado no login) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <span className="absolute left-1/2 top-20 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-emerald-200/35 blur-3xl animate-blob" />
        <span className="absolute -left-24 bottom-0 h-[420px] w-[420px] rounded-full bg-cyan-200/30 blur-3xl animate-blob animation-delay-2000" />
        <span className="absolute right-[-120px] top-1/3 h-[360px] w-[360px] rounded-full bg-sky-100/50 blur-3xl animate-blob animation-delay-4000" />
      </div>
      <ClientSidebar className="shrink-0" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ClientHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
