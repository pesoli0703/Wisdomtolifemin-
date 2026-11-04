import "server-only";

/**
 * Flutterwave Standard integration helpers (server-side only).
 *
 * Environment variables:
 *   FLW_SECRET_KEY   — secret key from the Flutterwave dashboard (NEVER public)
 *   FLW_PUBLIC_KEY   — public key (NEXT_PUBLIC_FLW_PUBLIC_KEY for the client)
 *   FLW_WEBHOOK_HASH — secret hash used to verify webhook signatures
 *
 * Flow:
 *   1. /api/donations/initiate creates a pending donation row (via the
 *      service-role client) and calls Flutterwave to obtain a checkout link.
 *   2. The donor is redirected to Flutterwave's hosted checkout.
 *   3. Flutterwave redirects back to /give/callback?tx_ref=...
 *   4. /api/donations/verify re-checks the transaction against the
 *      Flutterwave API and only then marks the donation "completed".
 *      Nothing is ever marked successful without verification.
 */

const FLW_API = "https://api.flutterwave.com/v3";

export function isFlutterwaveConfigured(): boolean {
  return Boolean(process.env.FLW_SECRET_KEY);
}

export interface InitiatePaymentInput {
  txRef: string;
  amount: number;
  currency: string;
  email: string;
  name?: string;
  phone?: string;
  redirectUrl: string;
  title?: string;
}

export async function initiatePayment(
  input: InitiatePaymentInput
): Promise<{ ok: true; link: string } | { ok: false; error: string }> {
  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) return { ok: false, error: "flutterwave-not-configured" };

  try {
    const res = await fetch(`${FLW_API}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: input.txRef,
        amount: input.amount,
        currency: input.currency,
        redirect_url: input.redirectUrl,
        customer: {
          email: input.email,
          ...(input.name ? { name: input.name } : {}),
          ...(input.phone ? { phone_number: input.phone } : {}),
        },
        customizations: {
          title: input.title || "Wisdom To Life Ministry",
          description: `Donation — ${input.txRef}`,
        },
      }),
    });

    const json = await res.json();
    if (res.ok && json?.status === "success" && json?.data?.link) {
      return { ok: true, link: json.data.link as string };
    }
    console.error("[flutterwave] initiate failed:", json);
    return { ok: false, error: json?.message || "initiate-failed" };
  } catch (err) {
    console.error("[flutterwave] initiate error:", err);
    return { ok: false, error: "network" };
  }
}

export interface VerifiedTransaction {
  status: "successful" | "failed" | "pending";
  amount: number;
  currency: string;
  txId: number | null;
  flwTxRef: string;
}

/**
 * Verifies a transaction reference directly against the Flutterwave API.
 * This is the single source of truth — the local record is only marked
 * completed when Flutterwave confirms status "successful" and the amount
 * and currency match what was initiated.
 */
export async function verifyTransaction(
  txRef: string
): Promise<VerifiedTransaction | { error: string }> {
  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) return { error: "flutterwave-not-configured" };

  try {
    const res = await fetch(
      `${FLW_API}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
      { headers: { Authorization: `Bearer ${secret}` } }
    );
    const json = await res.json();
    if (!res.ok || json?.status !== "success" || !json?.data) {
      return { error: json?.message || "verify-failed" };
    }
    const d = json.data;
    const status =
      d.status === "successful"
        ? "successful"
        : d.status === "failed"
          ? "failed"
          : "pending";
    return {
      status,
      amount: Number(d.amount ?? 0),
      currency: String(d.currency ?? ""),
      txId: d.id ? Number(d.id) : null,
      flwTxRef: String(d.tx_ref ?? txRef),
    };
  } catch (err) {
    console.error("[flutterwave] verify error:", err);
    return { error: "network" };
  }
}

/** Validates the x-verif-hash header Flutterwave sends on webhooks. */
export function validateWebhookHash(headerHash: string | null): boolean {
  const expected = process.env.FLW_WEBHOOK_HASH;
  if (!expected) return false;
  return headerHash === expected;
}

export function generateTxRef(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `wtlm-${Date.now()}-${rand}`;
}
