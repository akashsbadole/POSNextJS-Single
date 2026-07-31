// ponytail: single GSP provider via env vars. Add provider-specific adapters if multiple GSPs needed.

export interface GspResponse {
  success: boolean;
  irn?: string;
  ackNo?: string;
  ackDt?: string;
  error?: string;
}

const GSP_API_URL = process.env.GSP_API_URL;
const GSP_USERNAME = process.env.GSP_USERNAME;
const GSP_PASSWORD = process.env.GSP_PASSWORD;
const GSP_CLIENT_ID = process.env.GSP_CLIENT_ID;
const GSP_CLIENT_SECRET = process.env.GSP_CLIENT_SECRET;

let authToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (authToken && Date.now() < tokenExpiry) return authToken;
  const res = await fetch(`${GSP_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: GSP_USERNAME,
      password: GSP_PASSWORD,
      client_id: GSP_CLIENT_ID,
      client_secret: GSP_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`GSP auth failed: ${res.status}`);
  const data = await res.json();
  authToken = data.token || data.access_token;
  tokenExpiry = Date.now() + ((data.expires_in || 1800) - 60) * 1000;
  return authToken!;
}

export async function submitEInvoice(payload: Record<string, unknown>): Promise<GspResponse> {
  if (!GSP_API_URL || !GSP_USERNAME) {
    return { success: false, error: "GSP not configured" };
  }
  try {
    const token = await getToken();
    const res = await fetch(`${GSP_API_URL}/einvoice/api/v1/irn/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ payload }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `GSP submission failed: ${res.status} — ${err}` };
    }
    const data = await res.json();
    return {
      success: true,
      irn: data.Irn || data.irn,
      ackNo: data.AckNo || data.ackNo,
      ackDt: data.AckDt || data.ackDt,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "GSP submission error" };
  }
}

export async function cancelEInvoice(irn: string): Promise<GspResponse> {
  if (!GSP_API_URL || !GSP_USERNAME) {
    return { success: false, error: "GSP not configured" };
  }
  try {
    const token = await getToken();
    const res = await fetch(`${GSP_API_URL}/einvoice/api/v1/irn/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        Irn: irn,
        CnlRsn: "1",
        CnlRem: "Sales return / cancellation",
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `GSP cancellation failed: ${res.status} — ${err}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "GSP cancellation error" };
  }
}
