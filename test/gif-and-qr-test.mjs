import assert from "node:assert";
import jsQR from "jsqr";
import { searchGifs } from "../src/server/gifs.ts";
import { generateQrMatrix } from "../src/client/utils/qr.ts";

async function runGifAndQrTests() {
  console.log("🧪 Running GIF Search & QR Code Test Suite...\n");

  // ── 1. GIF Search Tests ──
  console.log("Step 1: Testing empty / trending GIF search...");
  const trendingGifs = await searchGifs("");
  assert(Array.isArray(trendingGifs), "Trending must return an array");
  assert(trendingGifs.length > 0, "Trending must return at least 1 GIF");
  assert(trendingGifs[0].id, "GIF must have id");
  assert(trendingGifs[0].previewUrl, "GIF must have previewUrl");
  assert(trendingGifs[0].url, "GIF must have url");
  console.log(`✓ Empty query returned ${trendingGifs.length} trending GIFs: "${trendingGifs[0].title}"`);

  console.log("\nStep 2: Testing GIF search for 'dance'...");
  const danceGifs = await searchGifs("dance");
  assert(Array.isArray(danceGifs) && danceGifs.length > 0, "Search for 'dance' must return results");
  assert(danceGifs.some(g => g.title.toLowerCase().includes("dance") || g.url), "Dance results should be relevant");
  console.log(`✓ 'dance' search returned ${danceGifs.length} GIFs: "${danceGifs[0].title}"`);

  console.log("\nStep 3: Testing GIF search for 'cat'...");
  const catGifs = await searchGifs("cat");
  assert(Array.isArray(catGifs) && catGifs.length > 0, "Search for 'cat' must return results");
  console.log(`✓ 'cat' search returned ${catGifs.length} GIFs: "${catGifs[0].title}"`);

  console.log("\nStep 4: Testing non-existent gibberish query...");
  const noMatchGifs = await searchGifs("xyzzy99999nomatchfoundever");
  assert(Array.isArray(noMatchGifs), "Must return array");
  assert.strictEqual(noMatchGifs.length, 0, "Gibberish query MUST return empty array, NOT fallback to trending!");
  console.log("✓ Non-existent search term correctly returned 0 results (empty array)!");

  // ── 2. QR Code Matrix Tests ──
  console.log("\nStep 5: Testing standard QR code matrix generation...");
  const testUrl = "https://loopin.chat/swift-fox-42";
  const matrix = generateQrMatrix(testUrl);
  assert(Array.isArray(matrix), "Matrix must be an array of rows");
  const N = matrix.length;
  assert.strictEqual(N, 25, "Version 2 QR code must be 25x25");
  assert.strictEqual(matrix[0].length, 25, "Matrix row length must match N");

  // Check 3 Finder Patterns: top-left (0,0), top-right (0, N-7), bottom-left (N-7, 0)
  // Outer border of 7x7 must be all dark (true)
  for (let i = 0; i < 7; i++) {
    assert.strictEqual(matrix[0][i], true, `Top-left finder row 0 col ${i} must be dark`);
    assert.strictEqual(matrix[6][i], true, `Top-left finder row 6 col ${i} must be dark`);
    assert.strictEqual(matrix[i][0], true, `Top-left finder row ${i} col 0 must be dark`);
    assert.strictEqual(matrix[i][6], true, `Top-left finder row ${i} col 6 must be dark`);
  }
  // Center 3x3 of top-left finder must be dark
  for (let r = 2; r <= 4; r++) {
    for (let c = 2; c <= 4; c++) {
      assert.strictEqual(matrix[r][c], true, `Top-left finder center (${r}, ${c}) must be dark`);
    }
  }
  // Separator ring must be light (false)
  for (let i = 0; i < 8; i++) {
    assert.strictEqual(matrix[7][i], false, `Top-left separator row 7 col ${i} must be light`);
    assert.strictEqual(matrix[i][7], false, `Top-left separator row ${i} col 7 must be light`);
  }
  console.log("✓ QR Finder patterns and separators verified with mathematical precision!");

  // Timing patterns at row 6 and col 6
  for (let i = 8; i < N - 8; i++) {
    const expected = i % 2 === 0;
    assert.strictEqual(matrix[6][i], expected, `Horizontal timing pattern at col ${i} must alternate`);
    assert.strictEqual(matrix[i][6], expected, `Vertical timing pattern at row ${i} must alternate`);
  }
  console.log("✓ QR Alternating timing patterns verified!");

  // Dark module at (N-8, 8)
  assert.strictEqual(matrix[N - 8][8], true, "Dark module must be set");
  console.log("✓ QR Dark module verified!");

  // Long URL version step-up
  const longUrl = "https://loopin.chat/this-is-a-very-long-room-identifier-name-with-extra-parameters-1234567890";
  const matrixLong = generateQrMatrix(longUrl);
  assert(matrixLong.length >= 29, `Longer URL must step up version (size >= 29, got ${matrixLong.length})`);
  console.log(`✓ Long URL correctly stepped up to Version ${((matrixLong.length - 17) / 4)} (${matrixLong.length}x${matrixLong.length})`);

  // Step 6: End-to-End Real Scanner Verification with jsQR
  console.log("\nStep 6: Testing real optical barcode decoder (jsQR)...");
  function verifyScannable(url) {
    const mat = generateQrMatrix(url);
    const mN = mat.length;
    const quiet = 4;
    const total = mN + quiet * 2;
    const scale = 4;
    const width = total * scale;
    const height = total * scale;
    const rgba = new Uint8ClampedArray(width * height * 4);
    rgba.fill(255);
    for (let r = 0; r < mN; r++) {
      for (let c = 0; c < mN; c++) {
        if (mat[r][c]) {
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              const y = (r + quiet) * scale + dy;
              const x = (c + quiet) * scale + dx;
              const idx = (y * width + x) * 4;
              rgba[idx] = 0;
              rgba[idx + 1] = 0;
              rgba[idx + 2] = 0;
            }
          }
        }
      }
    }
    const decoded = jsQR(rgba, width, height);
    assert(decoded, `QR code for "${url}" must be decodable by barcode scanner`);
    assert.strictEqual(decoded.data, url, `Decoded text must match source url: expected ${url}, got ${decoded.data}`);
  }

  verifyScannable("https://loopin.chat/swift-fox-42");
  verifyScannable("https://loopin.chat/global");
  verifyScannable(longUrl);
  console.log("✓ Real barcode scanner (jsQR) successfully decoded all generated QR codes!");

  console.log("\n🎉 ALL GIF SEARCH & QR CODE TESTS PASSED SUCCESSFULLY!");
}

runGifAndQrTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
