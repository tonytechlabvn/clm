// Pipe openzca --raw output to CLM webhook — forwards ALL messages including groups
import { createInterface } from "readline";
import http from "http";

const WEBHOOK_URL = process.env.WEBHOOK_URL || "http://clm.tonytechlab.com:3000/api/webhooks/zalo";
const url = new URL(WEBHOOK_URL);

const rl = createInterface({ input: process.stdin });

rl.on("line", (line) => {
  if (!line.startsWith("{")) {
    process.stderr.write(line + "\n"); // pass non-JSON lines to stderr (logs)
    return;
  }

  const req = http.request({
    hostname: url.hostname,
    port: url.port || 80,
    path: url.pathname,
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  req.on("error", (err) => process.stderr.write(`[webhook-pipe] Error: ${err.message}\n`));
  req.on("response", (res) => process.stderr.write(`[webhook-pipe] ${res.statusCode}\n`));
  req.write(line);
  req.end();
});

process.stderr.write("[webhook-pipe] Started — forwarding all messages to webhook\n");
