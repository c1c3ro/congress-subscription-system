import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// This endpoint is called by Vercel Cron to keep the database active
// Supabase pauses free tier databases after 7 days of inactivity
export async function GET(request: Request) {
  // Verify the request is from Vercel Cron (optional but recommended)
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow requests without auth in development or if CRON_SECRET is not set
    if (process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const supabase = await createClient()

    // Simple query to keep the database active
    const { data, error } = await supabase.from("test_guests").select("id").limit(1)

    if (error) {
      console.error("Keep-alive query failed:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const timestamp = new Date().toISOString()
    console.log(`[Keep-alive] Database pinged successfully at ${timestamp}`)

    return NextResponse.json({
      success: true,
      message: "Database keep-alive ping successful",
      timestamp,
    })
  } catch (error) {
    console.error("Keep-alive error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
