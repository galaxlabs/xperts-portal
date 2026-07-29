const BACKEND = import.meta.env.VITE_FRAPPE_URL || "https://btm.digihoopoe.com";
// Route API calls through Vercel so the Frappe session becomes a first-party cookie.
export const API_PREFIX = "/api/frappe";

function getCsrfToken(): string | null {
  const match = document.cookie.match(/X-Frappe-CSRF-Token=([^;]+)/);
  return match ? match[1] : null;
}

let csrfPromise: Promise<string | null> | null = null;

async function ensureCsrfToken(): Promise<string | null> {
  const existing = getCsrfToken();
  if (existing) return existing;
  if (csrfPromise) return csrfPromise;
  csrfPromise = (async () => {
    try {
      await fetch(`${API_PREFIX}/method/frappe.ping`, { credentials: "include" });
      return getCsrfToken();
    } catch {
      return null;
    }
  })();
  const result = await csrfPromise;
  csrfPromise = null;
  return result;
}

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Backend returned non-JSON response");
  }
  if (!response.ok || data.exc) {
    const msg = data._server_messages
      ? extractServerMessage(data._server_messages)
      : data.message || data.exception || `Request failed (${response.status})`;
    throw new Error(msg);
  }
  return data.message ?? data as T;
}

function extractServerMessages(raw: string): string {
  try {
    const msgs = JSON.parse(raw);
    const first = Array.isArray(msgs) ? msgs[0] : msgs;
    if (typeof first === "string") {
      try {
        return JSON.parse(first)?.message || first;
      } catch {
        return first;
      }
    }
    return first?.message || String(first);
  } catch {
    return raw;
  }
}

export function extractServerMessage(raw: string): string {
  return extractServerMessages(raw).replace(/<[^>]+>/g, "").trim();
}

export async function login(username: string, password: string) {
  return parse<{ full_name?: string; home_page?: string }>(
    await fetch(`${API_PREFIX}/method/cclms.api.portal_auth.login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usr: username, pwd: password }),
    })
  );
}

export async function logout() {
  const csrf = getCsrfToken();
  return parse(
    await fetch(`${API_PREFIX}/method/logout`, {
      method: "POST",
      credentials: "include",
      headers: { ...(csrf ? { "X-Frappe-CSRF-Token": csrf } : {}) },
    })
  );
}

export async function getSession() {
  try {
    const userResult = await call<{
      is_authenticated: boolean;
      user: string | null;
      full_name?: string;
      roles?: string[];
      role_type?: string;
      company?: string;
      is_manager?: boolean;
    }>("cclms.api.auth.get_current_user", undefined, { mutation: false });

    const portalConfig = await call<{
      branding?: {
        brand_name: string;
        brand_subtitle: string;
        logo: string | null;
        primary_color: string;
        secondary_color: string;
      };
      available_pages?: string[];
      dashboard_method?: string;
    }>("cclms.api.portal_api_v2.get_portal_config", undefined, { mutation: false }).catch(() => null);

    if (!userResult || !userResult.is_authenticated) return null;

    return {
      user: userResult.user || "",
      full_name: userResult.full_name,
      roles: userResult.roles,
      role_type: userResult.role_type,
      company: userResult.company,
      is_manager: userResult.is_manager,
      available_pages: portalConfig?.available_pages || [],
      dashboard_method: "cclms.api.portal_api_v2.get_dashboard",
      branding: portalConfig?.branding,
    };
  } catch {
    return null;
  }
}

export async function getBranding() {
  try {
    const result = await call<{
      branding?: { brand_name: string; brand_subtitle: string; logo: string | null; primary_color: string; secondary_color: string };
    }>("cclms.api.portal_api_v2.get_portal_config", undefined, { mutation: false });
    return result?.branding || null;
  } catch {
    return null;
  }
}

export async function call<T = any>(
  method: string,
  args?: Record<string, any>,
  options?: { mutation?: boolean }
): Promise<T> {
  const isMutation = options?.mutation ?? true;
  const endpoint = `${API_PREFIX}/method/${method}`;

  if (isMutation) {
    let csrf = getCsrfToken();
    if (!csrf) {
      csrf = await ensureCsrfToken();
    }
    return parse<T>(
      await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "X-Frappe-CSRF-Token": csrf } : {}),
        },
        body: JSON.stringify(args || {}),
      })
    );
  }

  const params = new URLSearchParams();
  if (args) {
    for (const [k, v] of Object.entries(args)) {
      if (v !== undefined && v !== null && v !== "") {
        params.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
      }
    }
  }
  params.set("_t", Date.now().toString());
  const qs = params.toString();
  return parse<T>(
    await fetch(`${endpoint}?${qs}`, {
      credentials: "include",
    })
  );
}

export async function uploadFile(file: File, doctype?: string, docname?: string) {
  const form = new FormData();
  form.append("file", file);
  if (doctype) form.append("doctype", doctype);
  if (docname) form.append("docname", docname);
  form.append("is_private", "1");
  return parse<{ file_url: string; name: string }>(
    await fetch(`${API_PREFIX}/method/upload_file`, {
      method: "POST",
      credentials: "include",
      body: form,
    })
  );
}

export function deskUrl(doctype: string, name?: string) {
  const slug = doctype.toLowerCase().replace(/\s+/g, "-");
  return `${BACKEND}/app/${slug}${name ? `/${encodeURIComponent(name)}` : ""}`;
}
