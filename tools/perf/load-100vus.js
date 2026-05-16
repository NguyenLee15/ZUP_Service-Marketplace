import {
  runCoreFlow,
  htmlSummary,
  jsonSummary,
  setupTokens,
} from "./lib/common.js";

export const options = {
  stages: [
    { duration: "30s", target: 25 },
    { duration: "1m", target: 100 },
    { duration: "2m", target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};

export function setup() {
  return setupTokens();
}

export default function (tokens) {
  runCoreFlow(tokens);
}

export function handleSummary(data) {
  return {
    "reports/perf/load-100vus.json": jsonSummary(data),
    "reports/perf/load-100vus.html": htmlSummary(
      data,
      "HomeService Load Test 100 VUs",
    ),
  };
}
