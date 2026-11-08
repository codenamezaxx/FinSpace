import { createHash } from "node:crypto";
import {
  createPushSubscription,
  isReminderLocale,
  isValidLocalDate,
  isValidPushEndpoint,
  isValidPushSubscription,
  isValidTimezone,
  subscriptionKey,
} from "@/lib/push-reminders";
import { getPushRedis, isPushServerConfigured, isSameOriginRequest } from "@/lib/push-server";
import type { PushSubscription } from "web-push";

export const runtime = "nodejs";

interface SubscriptionRequest {
  subscription?: unknown;
  timezone?: unknown;
  locale?: unknown;
  activityDate?: unknown;
  hasLoggedExpense?: unknown;
}

interface ValidSubscriptionRequest {
  subscription: PushSubscription;
  timezone: string;
  locale: "en" | "id";
  activityDate: string;
  hasLoggedExpense: boolean;
}

function isValidSubscriptionRequest(value: unknown): value is ValidSubscriptionRequest {
  if (!value || typeof value !== "object") return false;
  const body = value as SubscriptionRequest;
  return (
    isValidPushSubscription(body.subscription) &&
    isValidTimezone(body.timezone) &&
    isReminderLocale(body.locale) &&
    isValidLocalDate(body.activityDate) &&
    typeof body.hasLoggedExpense === "boolean"
  );
}

function configurationError(): Response {
  console.error("Push subscription API is missing its server environment configuration.");
  return Response.json({ error: "Push notifications are not configured." }, { status: 503 });
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }
  if (!isPushServerConfigured()) return configurationError();

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) {
    return Response.json({ error: "Subscription payload is too large." }, { status: 413 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return Response.json({ error: "Could not read request body." }, { status: 400 });
  }
  if (new TextEncoder().encode(rawBody).byteLength > 16_384) {
    return Response.json({ error: "Subscription payload is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }
  if (!isValidSubscriptionRequest(body)) {
    return Response.json({ error: "Invalid push subscription details." }, { status: 400 });
  }

  const key = subscriptionKey(body.subscription.endpoint);
  const record = createPushSubscription(
    body.timezone,
    body.locale,
    body.activityDate,
    body.hasLoggedExpense,
    body.subscription
  );

  try {
    const redis = getPushRedis();
    const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
    if (forwardedIp) {
      const ipHash = createHash("sha256").update(forwardedIp).digest("hex");
      const rateKey = `finspace:push:registration-limit:${ipHash}`;
      const requests = await redis.incr(rateKey);
      if (requests === 1) await redis.expire(rateKey, 3600);
      if (requests > 30) {
        return Response.json({ error: "Too many device subscriptions. Try again later." }, { status: 429 });
      }
    }
    await redis.set(key, record);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to save push subscription:", error);
    return Response.json({ error: "Could not save this device subscription." }, { status: 503 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }
  if (!isPushServerConfigured()) return configurationError();

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
    !isValidPushEndpoint(body.endpoint)
  ) {
    return Response.json({ error: "Invalid push subscription endpoint." }, { status: 400 });
  }

  try {
    await getPushRedis().del(subscriptionKey(body.endpoint));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to remove push subscription:", error);
    return Response.json({ error: "Could not remove this device subscription." }, { status: 503 });
  }
}
