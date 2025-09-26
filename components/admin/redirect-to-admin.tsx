"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function RedirectToAdmin() {
  const router = useRouter()

  useEffect(() => {
    console.log("🔄 [RedirectToAdmin] Redirecting to /admin")
    router.push("/admin")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando para o painel administrativo...</p>
      </div>
    </div>
  )
}