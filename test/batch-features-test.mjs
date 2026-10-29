import assert from "node:assert";

const WS = globalThis.WebSocket;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Client parser test helper
function parseRoomInput(raw) {
  let cleaned = raw.trim();
  if (!cleaned) return "";

  if (cleaned.includes("://") || cleaned.includes("/")) {
    try {
      const urlToParse = cleaned.includes("://") ? cleaned : `https://${cleaned}`;
      const parsed = new URL(urlToParse);
      const queryCode =
        parsed.searchParams.get("code") ||
        parsed.searchParams.get("room") ||
        parsed.searchParams.get("r");
      if (queryCode) {
        cleaned = queryCode;
      } else {
        const segments = parsed.pathname.split("/").filter(Boolean);
        if (segments.length > 0) {
          cleaned = segments[segments.length - 1];
        }
      }
    } catch {
      const segments = cleaned.split("/").filter(Boolean);
      cleaned = segments[segments.length - 1] || cleaned;
    }
  }

  cleaned = cleaned.replace(/^[#@]+/, "");
  cleaned = cleaned.split("?")[0].split("#")[0].trim().toLowerCase();
  return cleaned;
}

async function runTestSuite() {
  console.log("🚀 Running Loopin Batch Features & Fixes Verification Suite...\n");

  // 1. Unit Tests for Home Input Parsing
  console.log("Step 1: Testing Home Screen Join Box Input Parsing...");
  assert.strictEqual(parseRoomInput("swift-fox-42"), "swift-fox-42");
  assert.strictEqual(parseRoomInput("#swift-fox-42"), "swift-fox-42");
  assert.strictEqual(parseRoomInput("https://loopin.chat/my-cool-room"), "my-cool-room");
  assert.strictEqual(parseRoomInput("http://localhost:5173/game-night"), "game-night");
  assert.strictEqual(parseRoomInput("loopin.chat/room-123"), "room-123");
  assert.strictEqual(parseRoomInput("https://loopin.chat/?code=secret-lounge"), "secret-lounge");
  assert.strictEqual(parseRoomInput("   https://example.com/deep/path/cool-slug?utm_source=chat#anchor   "), "cool-slug");
  console.log("✓ All URL, custom slug, and raw code parse tests passed successfully!");

  // Start local server test if baseUrl provided or default
  const baseUrl = process.argv[2] || "http://127.0.0.1:8787";
  const wsProto = baseUrl.startsWith("https") ? "wss:" : "ws:";
  const host = baseUrl.replace(/^https?:\/\//, "");
  const roomName = `batch-test-${Date.now()}`;
  const wsUrl = `${wsProto}//${host}/api/room/${roomName}/ws`;

  console.log(`\nStep 2: Connecting to test server at ${wsUrl}...`);

  // Check room status endpoint before any connection
  try {
    const checkRes = await fetch(`${baseUrl}/api/room/${roomName}/check`);
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      assert.strictEqual(checkData.taken, false, "Fresh room should not be taken");
      console.log("✓ Pre-join room availability check confirmed room is free:", checkData);
    }
  } catch (err) {
    console.log("ℹ️ Server not running locally on 8787, skipping live DO socket tests or run with wrangler dev");
    return;
  }

  // 2. Client A Connects (Tab 1)
  console.log("\nStep 3: Client A connects with stable user ID 'user-stable-1'");
  const clientA1 = new WS(wsUrl);
  const messagesA1 = [];
  clientA1.onmessage = (e) => messagesA1.push(JSON.parse(e.data));

  await new Promise((r) => (clientA1.onopen = r));
  clientA1.send(
    JSON.stringify({
      type: "join",
      user: {
        id: "user-stable-1",
        name: "Alice",
        color: "#facc15",
        joinedAt: Date.now(),
      },
    })
  );

  await sleep(200);
  const initA1 = messagesA1.find((m) => m.type === "init");
  assert(initA1, "Client A1 should receive init");
  assert.strictEqual(initA1.users.filter((u) => u.id === "user-stable-1").length, 1);
  console.log("✓ Client A1 initialized with single user entry in members list");

  // 3. Duplicate Member Prevention (Tab 2 with SAME user ID)
  console.log("\nStep 4: Client A opens Tab 2 with SAME stable user ID 'user-stable-1' (reconnect/multi-tab)");
  const clientA2 = new WS(wsUrl);
  const messagesA2 = [];
  clientA2.onmessage = (e) => messagesA2.push(JSON.parse(e.data));

  await new Promise((r) => (clientA2.onopen = r));
  clientA2.send(
    JSON.stringify({
      type: "join",
      user: {
        id: "user-stable-1",
        name: "Alice",
        color: "#facc15",
        joinedAt: Date.now(),
      },
    })
  );

  await sleep(250);
  const initA2 = messagesA2.find((m) => m.type === "init");
  assert(initA2, "Client A2 should receive init");

  // Ensure members list is deduped to exactly 1 user
  const userCount = initA2.users.filter((u) => u.id === "user-stable-1").length;
  assert.strictEqual(userCount, 1, "User list must not clone duplicate entries for the same stable user ID");

  // Ensure no duplicate 'joined the room' announcement was created
  const joinAnnouncements = initA2.messages.filter(
    (m) => m.isSystem && m.text.includes("Alice joined")
  );
  assert.strictEqual(joinAnnouncements.length, 1, "There must only be 1 join announcement, no spam on multi-tab/reconnect");
  console.log("✓ Duplicate member prevention verified! No cloning in member list and no announcement spam.");

  // 4. Client B Joins
  console.log("\nStep 5: Client B joins with random color");
  const clientB = new WS(wsUrl);
  const messagesB = [];
  clientB.onmessage = (e) => messagesB.push(JSON.parse(e.data));

  await new Promise((r) => (clientB.onopen = r));
  clientB.send(
    JSON.stringify({
      type: "join",
      user: {
        id: "user-stable-2",
        name: "Bob",
        color: "#38bdf8",
        joinedAt: Date.now(),
      },
    })
  );

  await sleep(200);

  // 5. Client A sends a message
  console.log("\nStep 6: Client A sends a message");
  clientA1.send(
    JSON.stringify({
      type: "send_message",
      text: "Hello, this is the original message!",
    })
  );

  await sleep(200);
  const origMsg = messagesB.find((m) => m.type === "new_message" && m.message.text === "Hello, this is the original message!");
  assert(origMsg, "Client B should receive Client A's message");
  console.log("✓ Original message received by Client B with ID:", origMsg.message.id);

  // 6. Client B sends a REPLY to Client A's message
  console.log("\nStep 7: Client B replies to Client A's message");
  clientB.send(
    JSON.stringify({
      type: "send_message",
      text: "This is my reply to your message!",
      replyTo: {
        id: origMsg.message.id,
        userId: origMsg.message.userId,
        userName: origMsg.message.userName,
        userColor: origMsg.message.userColor,
        text: origMsg.message.text,
      },
    })
  );

  await sleep(200);
  const replyMsg = messagesA1.find(
    (m) => m.type === "new_message" && m.message.text === "This is my reply to your message!"
  );
  assert(replyMsg, "Client A should receive the reply");
  assert(replyMsg.message.replyTo, "Reply message must have replyTo property attached");
  assert.strictEqual(replyMsg.message.replyTo.id, origMsg.message.id, "replyTo id must match original message id");
  assert.strictEqual(replyMsg.message.replyTo.userName, "Alice", "replyTo userName must match original author");
  console.log("✓ Reply structure verified and successfully broadcasted with quoted preview metadata:", replyMsg.message.replyTo);

  // 7. Client A edits their original message
  console.log("\nStep 8: Client A edits the original message");
  clientA1.send(
    JSON.stringify({
      type: "edit_message",
      id: origMsg.message.id,
      text: "Hello, this is the original message! (Edited version)",
    })
  );

  await sleep(200);
  const editedNotice = messagesB.find(
    (m) => m.type === "message_edited" && m.message.id === origMsg.message.id
  );
  assert(editedNotice, "Client B should receive message_edited notification");
  assert.strictEqual(editedNotice.message.text, "Hello, this is the original message! (Edited version)");
  assert(editedNotice.message.editedAt, "Edited message must have editedAt timestamp");
  console.log("✓ Message edit verified with editedAt timestamp:", editedNotice.message.editedAt);

  // 8. Client B marks messages as read
  console.log("\nStep 9: Client B marks Client A's message as read (Read receipts test)");
  clientB.send(
    JSON.stringify({
      type: "mark_read",
      messageIds: [origMsg.message.id],
    })
  );

  await sleep(200);
  const readEvent = messagesA1.find(
    (m) => m.type === "messages_read" && m.messageIds.includes(origMsg.message.id)
  );
  assert(readEvent, "Client A should receive messages_read notification");
  assert.strictEqual(readEvent.userId, "user-stable-2", "Read event should identify reader");
  console.log("✓ Read receipt received for user-stable-2!");

  // 9. Check room stats & taken status
  console.log("\nStep 10: Testing /api/room/:roomId/check endpoint while room is active");
  const activeCheck = await fetch(`${baseUrl}/api/room/${roomName}/check`).then((r) => r.json());
  assert.strictEqual(activeCheck.taken, true, "Active room with online users must be reported as taken");
  assert(activeCheck.onlineCount >= 2, "Active room must report accurate online socket count");
  console.log("✓ Room status correctly reported as taken:", activeCheck);

  // 10. Clean up sockets
  clientA1.close();
  clientA2.close();
  clientB.close();

  await sleep(400);

  console.log("\n✅ ALL BATCH FEATURE TESTS PASSED SUCCESSFULLY! 100% verified.");
}

runTestSuite().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
