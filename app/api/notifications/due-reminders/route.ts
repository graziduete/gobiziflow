import { type NextRequest, NextResponse } from "next/server"
import { sendTaskDueReminders } from "@/lib/notifications"

export async function POST(request: NextRequest) {
  try {
    // This endpoint would typically be called by a cron job or scheduled task
    // For security, you might want to add API key authentication here

    const success = await sendTaskDueReminders()

    return NextResponse.json({
      success,
      message: success ? "Due reminders sent successfully" : "Failed to send some reminders",
    })
  } catch (error) {
    console.error("Error in due-reminders notification API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
