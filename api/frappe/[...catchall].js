const FRAPPE_URL = process.env.VITE_FRAPPE_URL || "https://btm.digihoopoe.com";

module.exports = async (req, res) => {
  try {
    const path = req.url.replace(/^\/api\/frappe\//, "/api/");
    const url = `${FRAPPE_URL}${path}`;

    const headers = { "Content-Type": req.headers["content-type"] || "application/json" };
    if (req.headers["x-frappe-csrf-token"]) {
      headers["X-Frappe-CSRF-Token"] = req.headers["x-frappe-csrf-token"];
    }
    if (req.headers["cookie"]) {
      headers["Cookie"] = req.headers["cookie"];
    }

    const body = req.method !== "GET" && req.body ? JSON.stringify(req.body) : undefined;

    const response = await fetch(url, { method: req.method, headers, body });
    const data = await response.text();

    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        res.setHeader("Set-Cookie", value);
      }
    });

    res.status(response.status).send(data);
  } catch (error) {
    res.status(502).json({ error: "Proxy failed", message: error.message });
  }
};
