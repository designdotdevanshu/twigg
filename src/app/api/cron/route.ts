import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const startedAt = new Date();
  const schedule = request.headers.get("x-vercel-cron-schedule");
  const userAgent = request.headers.get("user-agent") ?? "unknown";

  try {
    // --- Phase 1: Test & Audit Execution ---
    // (In Phase 2, the full financial worker logic will run here)

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    const log = await db.cronLog.create({
      data: {
        jobName: "daily-financial-worker",
        status: "SUCCESS",
        startedAt,
        completedAt,
        durationMs,
        schedule,
        metadata: {
          userAgent,
          phase: "audit-test",
        },
      },
    });

    return NextResponse.json({
      ok: true,
      logId: log.id,
      status: "SUCCESS",
      durationMs,
      schedule,
      timestamp: completedAt.toISOString(),
    });
  } catch (error) {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const errorMessage = error instanceof Error ? error.message : String(error);

    await db.cronLog
      .create({
        data: {
          jobName: "daily-financial-worker",
          status: "FAILED",
          startedAt,
          completedAt,
          durationMs,
          schedule,
          error: errorMessage,
          metadata: {
            userAgent,
            phase: "audit-test",
          },
        },
      })
      .catch((logErr) => {
        console.error("Failed to record error to cron_logs:", logErr);
      });

    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
        durationMs,
        timestamp: completedAt.toISOString(),
      },
      { status: 500 }
    );
  }
}
