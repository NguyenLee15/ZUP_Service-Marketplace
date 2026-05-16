# HomeService Performance Tests

Chạy bằng Docker để không cần cài k6 global.

```powershell
New-Item -ItemType Directory -Force reports/perf
docker run --rm -i `
  --network service-marketplace_app-network `
  -e BASE_URL=http://backend:3001 `
  -v ${PWD}:/workspace `
  -w /workspace `
  grafana/k6 run tools/perf/smoke.js
```

Load test mục tiêu demo:

```powershell
New-Item -ItemType Directory -Force reports/perf
docker run --rm -i `
  --network service-marketplace_app-network `
  -e BASE_URL=http://backend:3001 `
  -v ${PWD}:/workspace `
  -w /workspace `
  grafana/k6 run tools/perf/load-100vus.js
```

Kết quả được ghi vào:

- `reports/perf/*.json`
- `reports/perf/*.html`

Mục tiêu pass phase này:

- `http_req_duration p(95) < 1000ms`
- `http_req_failed rate < 1%`
