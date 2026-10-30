import assert from "node:assert";

const WS = globalThis.WebSocket;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log("🧪 Running Loopin New Features, Global Chat & Name Conflict Test Suite...\n");

  const baseUrl = process.argv[2] || "http://127.0.0.1:8787";
  const wsProto = baseUrl.startsWith("https") ? "wss:" : "ws:";
  const host = baseUrl.replace(/^https?:\/\//, "");

  // -------------------------------------------------------------
  // Test 1: Performance Mode & Random Identity on First Launch
  // -------------------------------------------------------------
  console.log("Step 1: Testing Performance Mode & Random Identity logic...");
  const fs = await import("node:fs");
  const useSettingsSrc = fs.readFileSync(new URL("../src/client/hooks/useSettings.tsx", import.meta.url), "utf8");
  assert(
    /performanceMode:\s*true/.test(useSettingsSrc),
    "DEFAULT_SETTINGS must configure performanceMode: true for first launch"
  );
  console.log("✓ DEFAULT_SETTINGS.performanceMode is true by default on first launch");

  const useUserSrc = fs.readFileSync(new URL("../src/client/hooks/useUser.ts", import.meta.url), "utf8");
  assert(
    useUserSrc.includes("isUserOnboarded") && useUserSrc.includes("markUserOnboarded"),
    "useUser must export onboarding state checks"
  );
  console.log("✓ Onboarding first launch helper hooks verified");

  // -------------------------------------------------------------
  // Test 2: Global Chat Room (#global)
  // -------------------------------------------------------------
  console.log("\nStep 2: Testing Global Chat room (#global)...");
  const globalWsUrl = `${wsProto}//${host}/api/room/global/ws`;
  const globalClient = new WS(globalWsUrl);
  const globalMessages = [];
  globalClient.onmessage = (e) => globalMessages.push(JSON.parse(e.data));

  await new Promise((resolve) => (globalClient.onopen = resolve));
  globalClient.send(
    JSON.stringify({
      type: "join",
      user: {
        id: "global-user-1",
        name: "GlobalPioneer",
        color: "#facc15",
        joinedAt: Date.now(),
      },
    })
  );

  await sleep(150);
  const initMsg = globalMessages.find((m) => m.type === "init");
  assert(initMsg, "Global chat client should receive init message");
  assert.strictEqual(initMsg.roomId, "global", "Room ID must be 'global'");
  console.log("✓ Global chat initialized successfully with room ID #global");

  // Send message in global chat
  globalClient.send(
    JSON.stringify({
      type: "send_message",
      text: "Hello, Global Chat!",
    })
  );
  await sleep(150);
  const sent = globalMessages.find((m) => m.type === "new_message" && m.message.text === "Hello, Global Chat!");
  assert(sent, "Message should be broadcast in global room");
  console.log("✓ Message successfully broadcasted in #global chat");

  globalClient.close();
  await sleep(200);

  // Check room status after disconnect
  const checkRes = await fetch(`${baseUrl}/api/room/global/check`);
  const checkData = await checkRes.json();
  console.log("✓ Global chat status after disconnect (ephemeral wipe):", checkData);

  // -------------------------------------------------------------
  // Test 3: Duplicate Name Conflict Prevention
  // -------------------------------------------------------------
  console.log("\nStep 3: Testing Name Conflict Rejection in Room...");
  const testRoom = `conflict-test-${Date.now()}`;
  const roomWsUrl = `${wsProto}//${host}/api/room/${testRoom}/ws`;

  // Connect Alice
  const clientAlice = new WS(roomWsUrl);
  const msgsAlice = [];
  clientAlice.onmessage = (e) => msgsAlice.push(JSON.parse(e.data));
  await new Promise((r) => (clientAlice.onopen = r));

  clientAlice.send(
    JSON.stringify({
      type: "join",
      user: {
        id: "user-alice-1",
        name: "Alice",
        color: "#38bdf8",
        joinedAt: Date.now(),
      },
    })
  );
  await sleep(150);
  assert(msgsAlice.some((m) => m.type === "init"), "Alice should successfully join and receive init");
  console.log("✓ Alice successfully joined room with name 'Alice'");

  // Connect Bob trying to use the name "Alice" (exact match)
  const clientBob = new WS(roomWsUrl);
  const msgsBob = [];
  clientBob.onmessage = (e) => msgsBob.push(JSON.parse(e.data));
  await new Promise((r) => (clientBob.onopen = r));

  clientBob.send(
    JSON.stringify({
      type: "join",
      user: {
        id: "user-bob-2",
        name: "Alice",
        color: "#facc15",
        joinedAt: Date.now(),
      },
    })
  );
  await sleep(150);
  const conflictBob = msgsBob.find((m) => m.type === "name_taken");
  assert(conflictBob, "Bob should receive name_taken event when joining with existing name 'Alice'");
  assert.strictEqual(conflictBob.name, "Alice");
  assert(conflictBob.suggestedName && conflictBob.suggestedName.startsWith("Alice-"), "Should offer suggested name");
  assert(!msgsBob.some((m) => m.type === "init"), "Bob should NOT receive init while name is conflicting");
  console.log("✓ Exact duplicate name correctly rejected with suggested name:", conflictBob.suggestedName);

  // Connect Charlie trying to use "alice" (case-insensitive match)
  const clientCharlie = new WS(roomWsUrl);
  const msgsCharlie = [];
  clientCharlie.onmessage = (e) => msgsCharlie.push(JSON.parse(e.data));
  await new Promise((r) => (clientCharlie.onopen = r));

  clientCharlie.send(
    JSON.stringify({
      type: "join",
      user: {
        id: "user-charlie-3",
        name: "alice",
        color: "#34d399",
        joinedAt: Date.now(),
      },
    })
  );
  await sleep(150);
  const conflictCharlie = msgsCharlie.find((m) => m.type === "name_taken");
  assert(conflictCharlie, "Case-insensitive duplicate 'alice' must be rejected");
  console.log("✓ Case-insensitive duplicate name 'alice' correctly rejected!");

  // -------------------------------------------------------------
  // Test 4: Reconnect & Multi-tab with Same User ID (Not a conflict)
  // -------------------------------------------------------------
  console.log("\nStep 4: Testing Reconnect/Multi-tab with same userId...");
  const clientAliceTab2 = new WS(roomWsUrl);
  const msgsAliceTab2 = [];
  clientAliceTab2.onmessage = (e) => msgsAliceTab2.push(JSON.parse(e.data));
  await new Promise((r) => (clientAliceTab2.onopen = r));

  clientAliceTab2.send(
    JSON.stringify({
      type: "join",
      user: {
        id: "user-alice-1", // SAME userId as Alice
        name: "Alice",
        color: "#38bdf8",
        joinedAt: Date.now(),
      },
    })
  );
  await sleep(150);
  assert(msgsAliceTab2.some((m) => m.type === "init"), "Alice Tab 2 with same userId should NOT conflict with herself");
  assert(!msgsAliceTab2.some((m) => m.type === "name_taken"), "Alice should not receive name_taken for her own session");
  console.log("✓ Reconnect/Multi-tab with same user ID verified (no self-conflict)");

  clientAliceTab2.close();
  await sleep(100);

  // -------------------------------------------------------------
  // Test 5: In-Room Rename (update_profile) Conflict Check
  // -------------------------------------------------------------
  console.log("\nStep 5: Testing In-Room Rename (update_profile) conflict detection...");
  // Bob joins as "Bob"
  clientBob.send(
    JSON.stringify({
      type: "join",
      user: {
        id: "user-bob-2",
        name: "Bob",
        color: "#facc15",
        joinedAt: Date.now(),
      },
    })
  );
  await sleep(150);
  assert(msgsBob.some((m) => m.type === "init"), "Bob should join as 'Bob'");

  // Bob attempts to rename himself to "Alice"
  clientBob.send(
    JSON.stringify({
      type: "update_profile",
      name: "Alice",
    })
  );
  await sleep(150);
  const renameConflict = msgsBob.filter((m) => m.type === "name_taken");
  assert(renameConflict.length > 0, "Renaming to active user 'Alice' should be rejected with name_taken");
  console.log("✓ In-room profile update collision properly prevented");

  // Bob renames to "Bob-The-Builder"
  clientBob.send(
    JSON.stringify({
      type: "update_profile",
      name: "BobBuilder",
    })
  );
  await sleep(150);
  const userUpdated = msgsAlice.find((m) => m.type === "user_updated" && m.user.name === "BobBuilder");
  assert(userUpdated, "Unique rename should be accepted and broadcast");
  console.log("✓ Unique rename to 'BobBuilder' successfully broadcasted");

  // -------------------------------------------------------------
  // Test 6: Sudden Disconnection & Ghost User Pruning
  // -------------------------------------------------------------
  console.log("\nStep 6: Testing sudden disconnection and ghost user pruning...");
  // Close Alice abruptly
  clientAlice.close();
  await sleep(250);

  // Now Charlie joins with name "Alice" after Alice disconnected
  clientCharlie.send(
    JSON.stringify({
      type: "join",
      user: {
        id: "user-charlie-3",
        name: "Alice",
        color: "#34d399",
        joinedAt: Date.now(),
      },
    })
  );
  await sleep(150);
  const charlieInit = msgsCharlie.find((m) => m.type === "init");
  assert(charlieInit, "Charlie should successfully claim 'Alice' once the previous Alice has disconnected");
  console.log("✓ Name released and claimable after sudden disconnect (no ghost lockout)");

  // Clean up
  clientBob.close();
  clientCharlie.close();
  await sleep(200);

  console.log("\n🎉 ALL NEW FEATURE, PERFORMANCE MODE, GLOBAL CHAT & NAME CONFLICT TESTS PASSED 100%!");
}

runTests().catch((err) => {
  console.error("\n❌ Test Failed:", err);
  process.exit(1);
});
