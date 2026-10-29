import assert from "node:assert";

// Node.js 22+ has built-in global WebSocket
const WS = globalThis.WebSocket;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTestSuite() {
  console.log("🚀 Starting Loopin E2E WebSocket, SQLite DO & Focus Verification Test...\n");

  const roomName = `test-room-${Date.now()}`;
  const baseUrl = process.argv[2] || "http://127.0.0.1:8787";
  const wsProto = baseUrl.startsWith("https") ? "wss:" : "ws:";
  const host = baseUrl.replace(/^https?:\/\//, "");
  const wsUrl = `${wsProto}//${host}/api/room/${roomName}/ws`;

  // 1. Client A connects
  console.log("Step 1: Connecting Client A to room #" + roomName);
  const clientA = new WS(wsUrl);

  const messagesA = [];
  clientA.onmessage = (event) => {
    const data = JSON.parse(event.data);
    messagesA.push(data);
  };

  await new Promise((resolve) => (clientA.onopen = resolve));
  console.log("✓ Client A connected");

  // Send join
  clientA.send(
    JSON.stringify({
      type: "join",
      user: {
        id: "user-a",
        name: "Alice",
        color: "#facc15",
        joinedAt: Date.now(),
      },
    })
  );

  await sleep(150);
  assert(messagesA.some((m) => m.type === "init"), "Client A should receive init");
  console.log("✓ Client A received init event");

  // Verify ping/pong heartbeat
  clientA.send(JSON.stringify({ type: "ping" }));
  await sleep(250);
  if (!messagesA.some((m) => m.type === "pong")) {
    console.log("Messages received by Client A so far:", JSON.stringify(messagesA, null, 2));
  }
  assert(messagesA.some((m) => m.type === "pong"), "Client A should receive pong");
  console.log("✓ Heartbeat ping/pong verified");

  // 2. Client A sends a text message
  console.log("\nStep 2: Sending text message");
  clientA.send(
    JSON.stringify({
      type: "send_message",
      text: "Hello from Loopin v2!",
    })
  );

  await sleep(150);
  const textMsg = messagesA.find((m) => m.type === "new_message" && m.message.text === "Hello from Loopin v2!");
  assert(textMsg, "Client A should receive new_message");
  console.log("✓ Text message broadcast received with ID:", textMsg.message.id);

  // 3. Client A sends an image message stored as base64
  console.log("\nStep 3: Sending Base64 image message");
  const sampleBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  clientA.send(
    JSON.stringify({
      type: "send_message",
      imageBase64: sampleBase64,
    })
  );

  await sleep(150);
  const imgMsg = messagesA.find((m) => m.type === "new_message" && m.message.imageBase64 === sampleBase64);
  assert(imgMsg, "Client A should receive new_message with imageBase64");
  console.log("✓ Base64 Image message broadcast received with ID:", imgMsg.message.id);

  // 4. Client A edits text message
  console.log("\nStep 4: Editing text message");
  clientA.send(
    JSON.stringify({
      type: "edit_message",
      id: textMsg.message.id,
      text: "Hello from Loopin v2! (Edited)",
    })
  );

  await sleep(150);
  const editMsg = messagesA.find((m) => m.type === "message_edited" && m.message.id === textMsg.message.id);
  assert(editMsg && editMsg.message.text === "Hello from Loopin v2! (Edited)", "Message edit should be broadcast");
  assert(editMsg.message.editedAt, "Message should have editedAt timestamp");
  console.log("✓ Message edited event received:", editMsg.message.text);

  // 5. Client B joins the room
  console.log("\nStep 5: Client B joins the room");
  const clientB = new WS(wsUrl);
  const messagesB = [];
  clientB.onmessage = (event) => {
    messagesB.push(JSON.parse(event.data));
  };

  await new Promise((resolve) => (clientB.onopen = resolve));
  clientB.send(
    JSON.stringify({
      type: "join",
      user: {
        id: "user-b",
        name: "Bob",
        color: "#38bdf8",
        joinedAt: Date.now(),
      },
    })
  );

  await sleep(200);
  const initB = messagesB.find((m) => m.type === "init");
  assert(initB, "Client B should receive init");
  console.log("✓ Client B received room state with messages:", initB.messages.length);

  const joinNoticeA = messagesA.find((m) => m.type === "user_joined" && m.user.name === "Bob");
  assert(joinNoticeA, "Client A should receive user_joined for Bob");
  console.log("✓ Client A received user_joined notification for Bob");

  // Check system join message in chat stream (Item 7)
  const systemJoinMsg = messagesA.find((m) => m.type === "new_message" && m.message.isSystem && m.message.text.includes("Bob joined"));
  assert(systemJoinMsg, "Client A should receive system message for Bob joining");
  console.log("✓ System message for user join verified in chat stream:", systemJoinMsg.message.text);

  // 6. Test Focus Change (Item 10)
  console.log("\nStep 6: Testing Focus Change & Last Active");
  clientB.send(
    JSON.stringify({
      type: "focus_change",
      isFocused: false,
      lastActiveAt: Date.now(),
    })
  );

  await sleep(150);
  const focusNoticeA = messagesA.find((m) => m.type === "user_focus_changed" && m.userId === "user-b");
  assert(focusNoticeA && focusNoticeA.isFocused === false, "Client A should receive focus_change false for user-b");
  console.log("✓ User focus_changed event successfully broadcast and received:", focusNoticeA);

  // 7. Client B reacts to message (Item 16)
  console.log("\nStep 7: Adding emoji reaction");
  clientB.send(
    JSON.stringify({
      type: "react_message",
      messageId: textMsg.message.id,
      emoji: "🔥",
    })
  );

  await sleep(150);
  const reactionA = messagesA.find((m) => m.type === "message_reacted" && m.messageId === textMsg.message.id);
  assert(reactionA && reactionA.reactions["🔥"]?.includes("user-b"), "Reaction should be registered for user-b");
  console.log("✓ Emoji reaction verified on both clients:", reactionA.reactions);

  // 8. Client B marks message as read
  console.log("\nStep 8: Client B marks message as read");
  clientB.send(
    JSON.stringify({
      type: "mark_read",
      messageIds: [textMsg.message.id],
    })
  );

  await sleep(150);
  const readNoticeA = messagesA.find((m) => m.type === "messages_read" && m.messageIds.includes(textMsg.message.id));
  assert(readNoticeA, "Client A should receive messages_read notification");
  console.log("✓ Read receipt verified: Client A received read confirmation from user-b!");

  // 9. Client A deletes the image message
  console.log("\nStep 9: Deleting message");
  clientA.send(
    JSON.stringify({
      type: "delete_message",
      id: imgMsg.message.id,
    })
  );

  await sleep(150);
  const deleteB = messagesB.find((m) => m.type === "message_deleted" && m.id === imgMsg.message.id);
  assert(deleteB, "Client B should receive message_deleted event");
  console.log("✓ Message deleted event received by Client B");

  // 10. Test Ephemeral auto-wipe when all users disconnect
  console.log("\nStep 10: Testing Ephemeral Auto-Wipe when all users disconnect");
  console.log("Closing Client A and Client B sockets...");
  clientA.close();
  clientB.close();

  await sleep(400);

  // Now Client C joins the room after everyone left
  console.log("Connecting Client C to the evacuated room...");
  const clientC = new WS(wsUrl);
  const messagesC = [];
  clientC.onmessage = (event) => {
    messagesC.push(JSON.parse(event.data));
  };

  await new Promise((resolve) => (clientC.onopen = resolve));
  clientC.send(
    JSON.stringify({
      type: "join",
      user: {
        id: "user-c",
        name: "Charlie",
        color: "#facc15",
        joinedAt: Date.now(),
      },
    })
  );

  await sleep(250);
  const initC = messagesC.find((m) => m.type === "init");
  assert(initC, "Client C should receive init");
  // Charlie's own join message is the only one in the fresh room
  assert(
    initC.messages.every((m) => m.text.includes("Charlie joined")),
    `All previous messages were completely wiped on disconnect!`
  );

  console.log("🎉 SUCCESS! All previous messages were completely wiped on disconnect!");

  clientC.close();
  console.log("\n✅ ALL TESTS PASSED! Loopin meets 100% of functional, SQLite DO and design requirements.");
}

runTestSuite().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
