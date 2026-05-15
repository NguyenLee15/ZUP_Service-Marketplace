import {
  runCoreFlow,
  htmlSummary,
  jsonSummary,
  setupTokens,
} from "./lib/common.js";

export const options = {
  stages: [
    { duration: "1m", target: 100 },
    { duration: "2m", target: 200 },
    { duration: "2m", target: 300 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.03"],
    http_req_duration: ["p(95)<2000"],
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
    "reports/perf/stress-optional.json": jsonSummary(data),
    "reports/perf/stress-optional.html": htmlSummary(
      data,
      "HomeService Optional Stress Test",
    ),
  };
}
