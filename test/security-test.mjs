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
  await sleep(350);
  const rateLimitError = received.find((m) => m.type === "error" && m.message.includes("too quickly"));
  if (!rateLimitError) {
    console.log("Received messages during rate limit test:", received.map(m => m.type));
  }
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
  assert(init2, "Init message must be received");
  assert(
    !init2.messages.some((m) => !m.isSystem),
    "Previous user messages must be 0 after room evacuated"
  );
  console.log("✓ Ephemeral zero-data wipe confirmed: 0 residual user messages found");

  // 6. Test 16-character username limit & 2000-character message limit
  console.log("\nStep 6: Testing 16-char Username & 2000-char Message Limits...");
  const longName = "A".repeat(40);
  const client3 = new WS(wsUrl);
  const rec3 = [];
  client3.onmessage = (e) => rec3.push(JSON.parse(e.data));
  await new Promise((r) => (client3.onopen = r));
  client3.send(
    JSON.stringify({
      type: "join",
      user: { id: "sec-user-3", name: longName, color: "#eab308", joinedAt: Date.now() },
    })
  );
  await sleep(200);
  const joinMsg = rec2.find((m) => m.type === "user_joined" && m.user.id === "sec-user-3");
  assert(joinMsg, "User join event received");
  assert.strictEqual(joinMsg.user.name.length, 16, `Username must be trimmed to 16 chars, got ${joinMsg.user.name.length}`);
  console.log("✓ Username strictly truncated to 16 chars:", joinMsg.user.name);

  // Send message longer than 2000 chars
  const longText = "X".repeat(2500);
  client3.send(
    JSON.stringify({
      type: "send_message",
      text: longText,
    })
  );
  await sleep(200);
  const msgOverLimit = rec3.find((m) => m.type === "new_message" && m.message.userId === "sec-user-3");
  assert(msgOverLimit, "Message received");
  assert.strictEqual(msgOverLimit.message.text.length, 2000, `Message must be trimmed to 2000 chars, got ${msgOverLimit.message.text.length}`);
  console.log("✓ Message text strictly capped at 2000 chars");

  client2.close();
  client3.close();
  console.log("\n🎉 ALL SECURITY, RATE LIMITING & PAYLOAD AUDIT CHECKS PASSED!");
}

runSecurityTests().catch((err) => {
  console.error("❌ Security test failed:", err);
  process.exit(1);
});
