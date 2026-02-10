import { inngest } from "../client";
import { sendDailyDigests } from "@/lib/delivery/queue";

/** Runs every hour at :00 UTC; sends digests for subscriptions whose digestScheduleTime matches current HH:MM */
export const sendDailyDigestsCron = inngest.createFunction(
  { id: "send-daily-digests", retries: 1 },
  { cron: "0 * * * *" }, // every hour at :00
  async ({ step }) => {
    const now = new Date();
    const hh = now.getUTCHours().toString().padStart(2, "0");
    const mm = now.getUTCMinutes().toString().padStart(2, "0");
    const utcTimeHHMM = `${hh}:${mm}`;
    const result = await step.run("send-digests", () => sendDailyDigests(utcTimeHHMM));
    return { utcTimeHHMM, ...result };
  }
);
