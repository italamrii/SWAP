import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/** SWAP Inspect agent payload (v1 preview). See docs/05-INSPECTION-AGENT.md. */
export const agentPayloadSchema = z.object({
  inspectionId: z.string().uuid(),
  verificationCode: z.string().regex(/^SW-[A-Z0-9]{4}$/),
  agentVersion: z.string().max(40),
  collectedAt: z.string().datetime(),
  os: z.string().max(80).optional(),
  hardware: z.object({
    cpu: z.object({ name: z.string().max(120) }).optional(),
    gpu: z.array(z.object({ name: z.string().max(120), vramGb: z.number().optional() })).max(4).optional(),
    motherboard: z.string().max(120).optional(),
    memory: z.object({ totalGb: z.number().max(2048), speedMhz: z.number().max(15000).optional() }).optional(),
    storage: z.array(z.object({ model: z.string().max(120), type: z.string().max(20).optional(), capacityGb: z.number().optional(), healthPct: z.number().min(0).max(100).optional(), powerOnHours: z.number().optional() })).max(8).optional(),
    battery: z.object({ healthPct: z.number().min(0).max(100), cycles: z.number().optional() }).optional(),
  }),
  sensors: z.object({ cpuIdle: z.number().optional(), cpuLoad: z.number().optional(), gpuIdle: z.number().optional(), gpuLoad: z.number().optional() }).optional(),
  stress: z.object({ tool: z.string().max(60), durationMin: z.number().max(1440), passed: z.boolean(), notes: z.string().max(300).optional() }).optional(),
});
export type AgentPayload = z.infer<typeof agentPayloadSchema>;

export function signPayload(rawBody: string, secret: string) {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function verifySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature || !/^[a-f0-9]{64}$/.test(signature)) return false;
  const expected = Buffer.from(signPayload(rawBody, secret), "hex");
  const given = Buffer.from(signature, "hex");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export const checksum = (rawBody: string) => `sha256:${createHash("sha256").update(rawBody).digest("hex")}`;
