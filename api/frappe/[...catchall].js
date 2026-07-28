const FRAPPE_URL = process.env.VITE_FRAPPE_URL || "https://btm.digihoopoe.com";

module.exports = async (req, res) => {
  const frappePath = req.url;
  const apiPath = frappePath.replace("/api/frappe", "/api");
  const targetUrl = FRAPPE_URL + apiPath;

  const headers = { ...req.headers };
  delete headers.host;
  delete headers["x-forwarded-host"];
  delete headers["x-vercel-id"];
  delete headers["x-vercel-deployment-url"];
  delete headers["x-vercel-proxy-signature"];
  delete headers["x-forwarded-proto"];
  delete headers["x-forwarded-for"];

  // Read raw body for POST/PUT
  let body;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data || undefined));
    });
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
    });

    // Forward cookies
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        res.setHeader("Set-Cookie", value);
      }
    });

    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    res.status(502).json({ error: "Proxy error", detail: err.message, url: targetUrl });
  }
};
