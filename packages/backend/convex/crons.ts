import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check and fire scheduled notifications every minute
crons.interval(
  "process-prayer-notifications",
  { minutes: 1 },
  internal.pushNotifications.processScheduledNotifications,
);

export default crons;
