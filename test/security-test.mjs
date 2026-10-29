import assert from "node:assert";

const WS = globalThis.WebSocket;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSecurityTests() {
  console.log("🔒 Running Loopin Security, Rate-Limiting & Edge-Case Audit...\n");

  const roomName = `sec-test-${Date.now()}`;
  const baseUrl = process.argv[2] || "http://127.0.0.1:8787";
  const wsProto = baseUrl.startsWith("https") ? "wss:" : "ws:";
  const host = baseUrl.replace(/^https?:\/\//, "");
  const wsUrl = `${wsProto}//${host}/api/room/${roomName}/ws`;

  // 1. Connect Client
  console.log("Step 1: Connecting Client...");
  const client = new WS(wsUrl);
  const received = [];
  client.onmessage = (e) => received.push(JSON.parse(e.data));

  await new Promise((r) => (client.onopen = r));
  client.send(
    JSON.stringify({
      type: "join",
      user: { id: "sec-user-1", name: "SecurityTester", color: "#38bdf8", avatar: "🛡️", joinedAt: Date.now() },
    })
  );
  await sleep(150);
  assert(received.some((m) => m.type === "init"), "Init received");
  console.log("✓ Connected & initialized");

  // 2. Test SVG XSS payload rejection
  console.log("\nStep 2: Testing Malicious SVG XSS Payload Rejection...");
  const maliciousSvg = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxzY3JpcHQ+YWxlcnQoMSk8L3NjcmlwdD48L3N2Zz4=";
  client.send(
    JSON.stringify({
      type: "send_message",
      imageBase64: maliciousSvg,
    })
  );
  await sleep(150);
  const svgRejection = received.find((m) => m.type === "error" && m.message.includes("Invalid image format"));
  assert(svgRejection, "SVG Image payload should be rejected with an error");
  console.log("✓ Malicious SVG XSS payload correctly rejected:", svgRejection.message);

  // 3. Test Rate Limiting on Rapid Message Flood
  console.log("\nStep 3: Testing Token-Bucket Rate Limiter on Message Flooding...");
  received.length = 0; // reset
  for (let i = 0; i < 10; i++) {
    client.send(
      JSON.stringify({
        type: "send_message",
        text: `Spam packet #${i}`,
      })
    );
  }
  await sleep(250);
  const rateLimitError = received.find((m) => m.type === "error" && m.message.includes("too quickly"));
  assert(rateLimitError, "Rapid spam should trigger rate limit error");
  console.log("✓ Rate limiting verified! Server throttled message flood:", rateLimitError.message);

  // 4. Test Text Sanitization
  console.log("\nStep 4: Testing Text Sanitization & Safe Display...");
  received.length = 0;
  await sleep(1000); // wait for rate limiter to refill
  client.send(
    JSON.stringify({
      type: "send_message",
      text: "Normal text with <script>console.log('test')</script> tags",
    })
  );
  await sleep(150);
  const msgReceived = received.find((m) => m.type === "new_message");
  assert(msgReceived && msgReceived.message.text.includes("<script>"), "Raw text retained without executing");
  console.log("✓ Text correctly passed through without execution sink sinks");

  // 5. Test Disconnect & Memory Wipe
  console.log("\nStep 5: Testing Disconnect & Ephemeral Purge...");
  client.close();
  await sleep(350);

  // Re-join with a new client
  const client2 = new WS(wsUrl);
  const rec2 = [];
  client2.onmessage = (e) => rec2.push(JSON.parse(e.data));
  await new Promise((r) => (client2.onopen = r));
  client2.send(
    JSON.stringify({
      type: "join",
      user: { id: "sec-user-2", name: "Auditor", color: "#34d399", avatar: "🔍", joinedAt: Date.now() },
    })
  );
  await sleep(200);
  const init2 = rec2.find((m) => m.type === "init");
  assert(init2 && init2.messages.length === 0, "Messages must be 0 after room evacuated");
  console.log("✓ Ephemeral zero-data wipe confirmed: 0 residual messages found");

  client2.close();
  console.log("\n🎉 ALL SECURITY & RATE LIMITING AUDIT CHECKS PASSED!");
}

runSecurityTests().catch((err) => {
  console.error("❌ Security test failed:", err);
  process.exit(1);
});
