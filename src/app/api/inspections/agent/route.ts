import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { agentPayloadSchema, checksum, verifySignature } from "@/lib/agent-payload";
import { db } from "@/lib/db";
import { inspectionReports, inspections } from "@/lib/db/schema";

/**
 * Ingestion endpoint for the SWAP Inspect desktop agent (preview).
 * Disabled unless INSPECTION_AGENT_ENABLED=true. Requests are HMAC-signed (X-Swap-Signature).
 * The agent can only attach data to an existing *draft* inspection whose verification code the seller entered.
 */
export async function POST(req: Request) {
  const secret = process.env.INSPECTION_AGENT_SECRET;
  if (process.env.INSPECTION_AGENT_ENABLED !== "true" || !secret) {
    return NextResponse.json({ error: "agent_disabled" }, { status: 503 });
  }
  const raw = await req.text();
  if (raw.length > 256_000) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  if (!verifySignature(raw, req.headers.get("x-swap-signature"), secret)) return NextResponse.json({ error: "bad_signature" }, { status: 401 });

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = agentPayloadSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload", issues: parsed.error.issues.slice(0, 5) }, { status: 422 });
  const p = parsed.data;

  const [insp] = await db
    .select({ id: inspections.id })
    .from(inspections)
    .where(and(eq(inspections.id, p.inspectionId), eq(inspections.verificationCode, p.verificationCode), eq(inspections.status, "draft")))
    .limit(1);
  if (!insp) return NextResponse.json({ error: "inspection_not_found" }, { status: 404 });

  const hw = p.hardware;
  await db.transaction(async (tx) => {
    await tx.update(inspections).set({ source: "platform_tool", requestedLevel: "platform_checked", inspectedAt: new Date(p.collectedAt) }).where(eq(inspections.id, insp.id));
    await tx
      .update(inspectionReports)
      .set({
        cpuModel: hw.cpu?.name, gpuModel: hw.gpu?.[0]?.name, motherboard: hw.motherboard, os: p.os,
        ramCapacityGb: hw.memory ? Math.round(hw.memory.totalGb) : undefined, ramSpeedMhz: hw.memory?.speedMhz,
        storage: hw.storage ?? [], temperatures: p.sensors ?? {}, batteryHealthPct: hw.battery?.healthPct, batteryCycles: hw.battery?.cycles,
        stressTest: p.stress ?? {}, rawPayload: json as object, agentVersion: p.agentVersion, checksum: checksum(raw),
      })
      .where(eq(inspectionReports.inspectionId, insp.id));
  });
  return NextResponse.json({ ok: true, inspectionId: insp.id });
}
