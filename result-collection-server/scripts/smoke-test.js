const fs = require("fs");
const path = require("path");

const SERVER_URL = process.env.SERVER_URL || "http://127.0.0.1:8787";
const API_TOKEN = process.env.API_TOKEN || "";
const samplesDir = path.join(__dirname, "..", "samples");
const samples = ["completed.json", "abandoned.json", "error.json"];

function headers() {
  const base = { "Content-Type": "application/json" };
  if (API_TOKEN) {
    base.Authorization = `Bearer ${API_TOKEN}`;
  }
  return base;
}

async function request(pathname, options = {}) {
  const response = await fetch(`${SERVER_URL}${pathname}`, {
    ...options,
    headers: { ...headers(), ...(options.headers || {}) },
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${pathname} failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return body;
}

async function main() {
  await request("/health");

  for (const file of samples) {
    const sample = JSON.parse(fs.readFileSync(path.join(samplesDir, file), "utf8"));
    const saved = await request("/api/v1/game-results", {
      method: "POST",
      body: JSON.stringify(sample),
    });
    const fetched = await request(`/api/v1/game-results/${encodeURIComponent(sample.session_id)}`);
    if (!fetched.result || fetched.result.session_id !== sample.session_id) {
      throw new Error(`saved result was not returned for ${sample.session_id}`);
    }
    if (!Array.isArray(fetched.result.question_logs)) {
      throw new Error(`question_logs missing for ${sample.session_id}`);
    }
    console.log(`${file}: ${saved.status} (${sample.session_id})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
