import http from "k6/http";
import { check, sleep } from "k6";

export const BASE_URL = __ENV.BASE_URL || "http://host.docker.internal:3001";

export const accounts = {
  customer: {
    email: __ENV.CUSTOMER_EMAIL || "customer@demo.com",
    password: __ENV.CUSTOMER_PASSWORD || "password123",
  },
  provider: {
    email: __ENV.PROVIDER_EMAIL || "provider1@demo.com",
    password: __ENV.PROVIDER_PASSWORD || "password123",
  },
  admin: {
    email: __ENV.ADMIN_EMAIL || "admin@system.com",
    password: __ENV.ADMIN_PASSWORD || "password123",
  },
};

export function login(account) {
  const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify(account), {
    headers: { "Content-Type": "application/json" },
  });
  check(res, {
    "login status 200": (r) => r.status === 200 || r.status === 201,
    "login has token": (r) => Boolean(r.json("data.accessToken")),
  });
  return res.json("data.accessToken");
}

export function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
}

export function setupTokens() {
  return {
    customerToken: login(accounts.customer),
    providerToken: login(accounts.provider),
    adminToken: login(accounts.admin),
  };
}

export function runCoreFlow(tokens) {
  const health = http.get(`${BASE_URL}/health`);
  check(health, { "health ok": (r) => r.status === 200 });

  const customerToken = tokens?.customerToken || login(accounts.customer);
  const providerToken = tokens?.providerToken || login(accounts.provider);
  const adminToken = tokens?.adminToken || login(accounts.admin);

  const services = http.get(`${BASE_URL}/services/search?limit=5`);
  check(services, { "service search ok": (r) => r.status === 200 });
  const serviceId = Number(services.json("data.0.id") || 1);

  const detail = http.get(`${BASE_URL}/services/${serviceId}`);
  check(detail, { "service detail ok": (r) => r.status === 200 });

  const chat = http.post(
    `${BASE_URL}/chats/conversations`,
    JSON.stringify({ serviceId }),
    authHeaders(customerToken),
  );
  check(chat, {
    "chat conversation ok": (r) => r.status === 200 || r.status === 201,
  });

  const customerBookings = http.get(
    `${BASE_URL}/bookings?page=1&limit=10`,
    authHeaders(customerToken),
  );
  check(customerBookings, { "customer bookings ok": (r) => r.status === 200 });

  const providerStats = http.get(
    `${BASE_URL}/provider/dashboard/stats?groupBy=week`,
    authHeaders(providerToken),
  );
  check(providerStats, { "provider stats ok": (r) => r.status === 200 });

  const adminStats = http.get(
    `${BASE_URL}/admin/dashboard/stats?groupBy=week`,
    authHeaders(adminToken),
  );
  check(adminStats, { "admin stats ok": (r) => r.status === 200 });

  sleep(1);
}

function metric(data, name, path, fallback = 0) {
  return (
    path.reduce((value, key) => value?.[key], data.metrics[name]) ?? fallback
  );
}

export function htmlSummary(data, title) {
  const p95 = metric(data, "http_req_duration", ["values", "p(95)"]);
  const failed = metric(data, "http_req_failed", ["values", "rate"]);
  const requests = metric(data, "http_reqs", ["values", "count"]);
  const checks = metric(data, "checks", ["values", "passes"]);
  const failedChecks = metric(data, "checks", ["values", "fails"]);
  const passed = p95 < 1000 && failed < 0.01;
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:32px;background:#f7f9fc;color:#102033}
    .card{max-width:860px;background:white;border:1px solid #d8e2ef;border-radius:16px;padding:24px;box-shadow:0 18px 45px rgba(15,35,60,.08)}
    h1{margin:0 0 8px;font-size:24px}.status{display:inline-block;padding:6px 10px;border-radius:999px;font-weight:700;color:white;background:${passed ? "#059669" : "#dc2626"}}
    table{width:100%;border-collapse:collapse;margin-top:20px}td,th{border-bottom:1px solid #e6edf5;text-align:left;padding:12px}
  </style>
</head>
<body>
  <main class="card">
    <span class="status">${passed ? "PASS" : "FAIL"}</span>
    <h1>${title}</h1>
    <p>Mục tiêu demo: p95 API &lt; 1000ms, error rate &lt; 1%.</p>
    <table>
      <tr><th>Chỉ số</th><th>Kết quả</th></tr>
      <tr><td>HTTP requests</td><td>${requests}</td></tr>
      <tr><td>p95 latency</td><td>${p95.toFixed(2)} ms</td></tr>
      <tr><td>Error rate</td><td>${(failed * 100).toFixed(2)}%</td></tr>
      <tr><td>Checks passed/failed</td><td>${checks}/${failedChecks}</td></tr>
    </table>
  </main>
</body>
</html>`;
}

export function jsonSummary(data) {
  const summary = JSON.parse(JSON.stringify(data));
  if (summary.setup_data) {
    summary.setup_data = { redacted: true };
  }
  return JSON.stringify(summary, null, 2);
}
