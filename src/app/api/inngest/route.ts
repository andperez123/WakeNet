import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { pollFeedsCron } from "@/inngest/functions/poll-feeds";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [pollFeedsCron],
});
