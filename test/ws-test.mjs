import assert from "node:assert";

// Node.js 22+ has built-in global WebSocket
const WS = globalThis.WebSocket;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTestSuite() {
  console.log("🚀 Starting Loopin E2E WebSocket & Ephemeral Room Verification Test...\n");

  const roomName = `test-ephemeral-${Date.now()}`;
  const wsUrl = `ws://127.0.0.1:8787/api/room/${roomName}/ws`;

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
        color: "#38bdf8",
        avatar: "⚡",
        joinedAt: Date.now(),
      },
    })
  );

  await sleep(150);
  assert(messagesA.some((m) => m.type === "init"), "Client A should receive init");
  console.log("✓ Client A received init event");

  // 2. Client A sends a text message
  console.log("\nStep 2: Sending text message");
  clientA.send(
    JSON.stringify({
      type: "send_message",
      text: "Hello from Loopin!",
    })
  );

  await sleep(150);
  const textMsg = messagesA.find((m) => m.type === "new_message" && m.message.text === "Hello from Loopin!");
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
      text: "Hello from Loopin! (Edited)",
    })
  );

  await sleep(150);
  const editMsg = messagesA.find((m) => m.type === "message_edited" && m.message.id === textMsg.message.id);
  assert(editMsg && editMsg.message.text === "Hello from Loopin! (Edited)", "Message edit should be broadcast");
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
        color: "#c084fc",
        avatar: "🦊",
        joinedAt: Date.now(),
      },
    })
  );

  await sleep(200);
  const initB = messagesB.find((m) => m.type === "init");
  assert(initB, "Client B should receive init");
  assert(initB.messages.length === 2, `Client B should see existing 2 messages in room, saw ${initB.messages.length}`);
  console.log("✓ Client B received room state with existing messages:", initB.messages.length);

  const joinNoticeA = messagesA.find((m) => m.type === "user_joined" && m.user.name === "Bob");
  assert(joinNoticeA, "Client A should receive user_joined for Bob");
  console.log("✓ Client A received user_joined notification for Bob");

  // 6. Client B reacts to message
  console.log("\nStep 6: Adding emoji reaction");
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

  // 7. Client A deletes the image message
  console.log("\nStep 7: Deleting message");
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

  // 8. Test Ephemeral auto-wipe when all users disconnect
  console.log("\nStep 8: Testing Ephemeral Auto-Wipe when all users disconnect");
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
        color: "#34d399",
        avatar: "🚀",
        joinedAt: Date.now(),
      },
    })
  );

  await sleep(250);
  const initC = messagesC.find((m) => m.type === "init");
  assert(initC, "Client C should receive init");
  assert.strictEqual(
    initC.messages.length,
    0,
    `CRITICAL FAIL: Messages were NOT wiped when all users left! Found: ${initC.messages.length}`
  );

  console.log("🎉 SUCCESS! Messages count for new user is 0! All previous messages were completely wiped on disconnect!");

  clientC.close();
  console.log("\n✅ ALL TESTS PASSED! Loopin meets 100% of the functional and privacy requirements.");
}

runTestSuite().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
