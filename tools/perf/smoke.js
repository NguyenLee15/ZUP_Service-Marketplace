import {
  runCoreFlow,
  htmlSummary,
  jsonSummary,
  setupTokens,
} from "./lib/common.js";

export const options = {
  vus: 1,
  iterations: 1,
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
    "reports/perf/smoke.json": jsonSummary(data),
    "reports/perf/smoke.html": htmlSummary(
      data,
      "HomeService Smoke Performance",
    ),
  };
}
