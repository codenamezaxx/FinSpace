import {
  isReminderLocale,
  isValidLocalDate,
  isValidPushEndpoint,
  isValidTimezone,
  subscriptionKey,
  type PushReminderRecord,
} from "@/lib/push-reminders";
import { getPushRedis, isPushServerConfigured, isSameOriginRequest } from "@/lib/push-server";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }
  if (!isPushServerConfigured()) {
    console.error("Push activity API is missing its server environment configuration.");
    return Response.json({ error: "Push notifications are not configured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }
  if (
    !body ||
    typeof body !== "object" ||
    !("endpoint" in body) ||
    !isValidPushEndpoint(body.endpoint) ||
    !("timezone" in body) ||
    !isValidTimezone(body.timezone) ||
    !("locale" in body) ||
    !isReminderLocale(body.locale) ||
    !("activityDate" in body) ||
    !isValidLocalDate(body.activityDate) ||
    !("hasLoggedExpense" in body) ||
    typeof body.hasLoggedExpense !== "boolean"
  ) {
    return Response.json({ error: "Invalid device activity details." }, { status: 400 });
  }

  try {
    const redis = getPushRedis();
    const key = subscriptionKey(body.endpoint);
    const existing = await redis.get<PushReminderRecord>(key);
    if (!existing) {
      return Response.json({ error: "Device push subscription was not found." }, { status: 404 });
    }

    const updated: PushReminderRecord = {
      ...existing,
      timezone: body.timezone,
      locale: body.locale,
      activityDate: body.activityDate,
      hasLoggedExpense: body.hasLoggedExpense,
    };
    await redis.set(key, updated);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to update device reminder activity:", error);
    return Response.json({ error: "Could not update device reminder activity." }, { status: 503 });
  }
}
