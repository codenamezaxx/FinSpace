import * as webpush from "web-push";
import { translations } from "@/lib/i18n/translations";
import {
  getDailyReminderSlot,
  isReminderLocale,
  isValidPushSubscription,
  isValidTimezone,
  type PushReminderRecord,
} from "@/lib/push-reminders";
import { getPushRedis, isPushServerConfigured } from "@/lib/push-server";

export const runtime = "nodejs";
export const maxDuration = 60;

function parseRecord(value: unknown): PushReminderRecord | null {
  try {
    const parsed =
      typeof value === "string" ? JSON.parse(value) as unknown : value;
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Partial<PushReminderRecord>;
    if (
      !record.subscription ||
      !isValidPushSubscription(record.subscription) ||
      !isValidTimezone(record.timezone) ||
      !isReminderLocale(record.locale) ||
      typeof record.activityDate !== "string" ||
      typeof record.hasLoggedExpense !== "boolean"
    ) {
      return null;
    }
    return record as PushReminderRecord;
  } catch {
    return null;
  }
}

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("Push reminder cron is missing CRON_SECRET.");
    return Response.json({ error: "Cron is not configured." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isPushServerConfigured()) {
    console.error("Push reminder cron is missing its server environment configuration.");
    return Response.json({ error: "Push notifications are not configured." }, { status: 503 });
  }

  try {
    const redis = getPushRedis();
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    let cursor = 0;
    let sent = 0;
    let removed = 0;
    const now = new Date();
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: "finspace:push:subscription:*",
        count: 100,
      });
      cursor = Number(nextCursor);

      for (const key of keys) {
        const record = parseRecord(await redis.get(key));
        if (!record) {
          await redis.del(key);
          removed += 1;
          continue;
        }

        const slot = getDailyReminderSlot(now, record.timezone);
        if (!slot) continue;
        if (
          record.activityDate === slot.date &&
          record.hasLoggedExpense
        ) {
          continue;
        }

        const lockKey = `${key}:sent:${slot.date}:${slot.slot}`;
        const lock = await redis.set(lockKey, "1", { nx: true, ex: 172_800 });
        if (lock !== "OK") continue;

        const copy = translations[record.locale].notification;
        try {
          await webpush.sendNotification(
            record.subscription,
            JSON.stringify({
              title: copy.reminder_title,
              body: copy.reminder_body,
              url: "/dashboard",
              tag: `finspace-expense-reminder-${slot.date}-${slot.slot}`,
            })
          );
          sent += 1;
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await redis.del(key);
            removed += 1;
          } else {
            await redis.del(lockKey);
            console.error("Failed to deliver a device reminder.", error);
          }
        }
      }
    } while (cursor !== 0);

    return Response.json({ ok: true, sent, removed });
  } catch (error) {
    console.error("Push reminder cron failed:", error);
    return Response.json({ error: "Could not process device reminders." }, { status: 500 });
  }
}
