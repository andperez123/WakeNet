import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { pollFeedsCron } from "@/inngest/functions/poll-feeds";
import { processQueuedDeliveriesCron } from "@/inngest/functions/process-queued-deliveries";
import { sendDailyDigestsCron } from "@/inngest/functions/send-daily-digests";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [pollFeedsCron, processQueuedDeliveriesCron, sendDailyDigestsCron],
});
