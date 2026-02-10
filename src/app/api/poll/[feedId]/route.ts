import { NextResponse } from "next/server";
import { runFeedPoll } from "@/lib/pipeline/run";
import { requireApiKey } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ feedId: string }> }
) {
  const authError = requireApiKey(req);
  if (authError) return authError;
  const { feedId } = await params;
  try {
    const result = await runFeedPoll(feedId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Poll failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
