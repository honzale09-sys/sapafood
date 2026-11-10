import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const api = axios.create({ baseURL: `${BACKEND_URL}/api`, withCredentials: true });

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const cfg = err.config || {};
    const skip = ["/auth/login", "/auth/refresh"].some((u) => (cfg.url || "").includes(u));
    if (err.response?.status === 401 && !cfg._retry && !skip) {
      cfg._retry = true;
      try {
        await api.post("/auth/refresh");
        return api(cfg);
      } catch (_) {
        /* fall through */
      }
    }
    return Promise.reject(err);
  },
);

export const imgUrl = (p) => (!p ? "" : p.startsWith("http") ? p : `${BACKEND_URL}${p}`);

export function errMsg(e, fallback = "Něco se pokazilo. Zkuste to prosím znovu.") {
  const d = e?.response?.data?.detail;
  if (d == null) return e?.response ? fallback : "Nelze se spojit se serverem. Zkontrolujte připojení.";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg || JSON.stringify(x)).join(" ");
  return d.msg || String(d);
}
