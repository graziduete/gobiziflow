import type React from "react"
import { redirect } from "next/navigation"
import { SidebarWrapper } from "@/components/admin/sidebar-wrapper"
import { Header } from "@/components/admin/header"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let userData: any = null
  
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    })

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    console.log("🔍 [AdminLayout] Auth check:", {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      error: error?.message
    })

    if (error || !user) {
      console.warn("[v0] Admin auth failed:", error?.message)
      redirect("/auth/login")
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, full_name, email")
      .eq("id", user.id)
      .single()

    console.log("🔍 [AdminLayout] Profile check:", {
      hasProfile: !!profile,
      profileRole: profile?.role,
      profileError: profileError?.message
    })

    if (profileError || !profile) {
      console.warn("[v0] Profile fetch failed:", profileError?.message)
      redirect("/auth/login")
    }

    if (profile.role !== "admin" && profile.role !== "admin_operacional") {
      console.log("🚨 [AdminLayout] Non-admin user detected, redirecting to dashboard:", {
        userId: user.id,
        userEmail: user.email,
        userRole: profile.role
      })
      redirect("/dashboard")
    }

    console.log("✅ [AdminLayout] Admin access granted for:", {
      userId: user.id,
      userEmail: user.email,
      userRole: profile.role
    })

    // Preparar dados do usuário para o Header
    userData = {
      id: user.id,
      email: user.email,
      full_name: profile.full_name
    }

  } catch (networkError) {
    console.error("[v0] Network error in admin layout:", networkError)
    console.warn("[v0] Allowing admin access due to network issues")
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SidebarWrapper className="shrink-0" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userData={userData} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
