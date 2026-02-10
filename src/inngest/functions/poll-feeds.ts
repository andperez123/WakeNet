import { inngest } from "../client";
import { getFeedsDueForPoll } from "@/lib/pipeline/run";
import { runFeedPoll } from "@/lib/pipeline/run";

export const pollFeedsCron = inngest.createFunction(
  {
    id: "poll-feeds",
    retries: 2,
  },
  { cron: "*/5 * * * *" }, // every 5 minutes
  async ({ step }) => {
    const dueIds = await step.run("get-due-feeds", getFeedsDueForPoll);
    const results = await step.run("poll-all", async () => {
      const out: { feedId: string; eventsFound: number; eventsNew: number; deliveriesCreated: number }[] = [];
      for (const feedId of dueIds) {
        try {
          const r = await runFeedPoll(feedId);
          if (!("error" in r)) out.push({ feedId, ...r });
        } catch (e) {
          console.error(`Poll failed for feed ${feedId}:`, e);
        }
      }
      return out;
    });
    return { polled: dueIds.length, results };
  }
);
