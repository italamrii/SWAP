# SWAP Inspect — desktop agent integration (preview)

The platform side is ready. The native agent (Windows first, macOS later) is a separate deliverable.

## Pairing
1. The seller opens **التوثيق والفحص → [listing]**, which creates a *draft* inspection with a unique
   verification code (`SW-XXXX`) and shows `inspectionId` (encoded in a QR in a later UI iteration).
2. The seller runs the agent and enters the code. The agent collects hardware data, SMART health,
   sensors and runs a short stress test.

## Request
```
POST /api/inspections/agent
Content-Type: application/json
X-Swap-Signature: hex(HMAC_SHA256(INSPECTION_AGENT_SECRET, rawBody))
```
Body (validated by `agentPayloadSchema` in `src/lib/agent-payload.ts`):
```json
{
  "inspectionId": "uuid",
  "verificationCode": "SW-7K2Q",
  "agentVersion": "swap-inspect 0.9.2",
  "collectedAt": "2026-10-13T10:00:00Z",
  "os": "Windows 11 Pro 23H2",
  "hardware": {
    "cpu": { "name": "AMD Ryzen 7 7800X3D" },
    "gpu": [{ "name": "NVIDIA GeForce RTX 4070 SUPER", "vramGb": 12 }],
    "motherboard": "MSI MAG B650 TOMAHAWK WIFI",
    "memory": { "totalGb": 32, "speedMhz": 6000 },
    "storage": [{ "model": "Samsung SSD 990 PRO 2TB", "type": "NVMe", "capacityGb": 2048, "healthPct": 98, "powerOnHours": 2140 }],
    "battery": { "healthPct": 91, "cycles": 186 }
  },
  "sensors": { "cpuIdle": 38, "cpuLoad": 79, "gpuIdle": 31, "gpuLoad": 64 },
  "stress": { "tool": "SWAP Inspect stress", "durationMin": 20, "passed": true }
}
```

## Server behavior
- Returns `503` unless `INSPECTION_AGENT_ENABLED=true` and a secret is configured.
- Verifies the signature in constant time, and only attaches data to a **draft** whose code matches.
- Stores `raw_payload`, `agent_version`, and `checksum = sha256(rawBody)`, then sets `source = platform_tool`.
- Only inspections that have `raw_payload` can be granted **فحص المنصة**. This is enforced in `reviewInspection`.
  A JSON file imported manually in the form only pre-fills fields and stays at the seller-report level.

## Hardening before GA
- Replace the shared secret with per-install keys (device registration plus Ed25519 signatures).
- Add nonce and timestamp replay protection.
- Attest the stress-test run, for example by signing the sensor time series.
