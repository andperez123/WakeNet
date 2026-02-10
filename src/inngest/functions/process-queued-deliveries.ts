import { inngest } from "../client";
import { processQueuedDeliveries } from "@/lib/delivery/queue";

export const processQueuedDeliveriesCron = inngest.createFunction(
  { id: "process-queued-deliveries", retries: 1 },
  { cron: "*/2 * * * *" }, // every 2 minutes
  async ({ step }) => {
    const result = await step.run("process-queued", processQueuedDeliveries);
    return result;
  }
);
