const FRAPPE_URL = process.env.VITE_FRAPPE_URL || "https://btm.digihoopoe.com";

module.exports = async (req, res) => {
  const targetUrl = FRAPPE_URL + "/api" + req.url.replace("/api/frappe", "");

  const headers = { "Content-Type": "application/json" };
  if (req.headers["cookie"]) headers["Cookie"] = req.headers["cookie"];
  if (req.headers["x-frappe-csrf-token"]) headers["X-Frappe-CSRF-Token"] = req.headers["x-frappe-csrf-token"];

  let body;
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (req.body && typeof req.body === "object") {
      body = JSON.stringify(req.body);
    } else {
      body = await new Promise((r) => { let d = ""; req.on("data", c => d += c); req.on("end", () => r(d || undefined)); });
    }
  }

  try {
    const resp = await fetch(targetUrl, { method: req.method, headers, body, redirect: "manual" });
    const cookies = typeof resp.headers.getSetCookie === "function"
      ? resp.headers.getSetCookie()
      : resp.headers.get("set-cookie");
    if (cookies) res.setHeader("Set-Cookie", cookies);
    const text = await resp.text();
    res.status(resp.status).setHeader("Content-Type", "application/json").send(text);
  } catch (e) {
    res.status(502).json({ error: "Proxy error", message: e.message });
  }
};
