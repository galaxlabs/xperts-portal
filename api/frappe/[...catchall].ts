import type { VercelRequest, VercelResponse } from "@vercel/node";

const FRAPPE_URL = process.env.VITE_FRAPPE_URL || "https://btm.digihoopoe.com";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.url.replace(/^\/api\/frappe\//, "/api/");
  const url = `${FRAPPE_URL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": req.headers["content-type"] || "application/json",
  };
  if (req.headers["x-frappe-csrf-token"]) {
    headers["X-Frappe-CSRF-Token"] = req.headers["x-frappe-csrf-token"] as string;
  }
  if (req.headers["cookie"]) {
    headers["Cookie"] = req.headers["cookie"] as string;
  }

  try {
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        res.setHeader("Set-Cookie", value);
      }
    });

    res.status(response.status).send(data);
  } catch (error: any) {
    res.status(502).json({ error: "Proxy error", message: error.message });
  }
}
