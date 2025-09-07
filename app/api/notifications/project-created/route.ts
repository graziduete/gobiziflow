import { type NextRequest, NextResponse } from "next/server"
import { sendProjectCreatedNotification } from "@/lib/notifications"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { projectId, createdById } = await request.json()

    if (!projectId || !createdById) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const success = await sendProjectCreatedNotification(projectId, createdById)

    return NextResponse.json({ success })
  } catch (error) {
    console.error("Error in project-created notification API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
