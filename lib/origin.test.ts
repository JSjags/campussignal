import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedOrigin } from "./origin";

test("accepts the browser Host when Next reconstructs the URL with localhost", () => {
  assert.equal(
    isAllowedOrigin(
      "http://127.0.0.1:3002",
      "http://localhost:3002/api/auth/demo",
      "127.0.0.1:3002",
    ),
    true,
  );
  assert.equal(
    isAllowedOrigin(
      "http://localhost:3002",
      "http://localhost:3002/api/auth/demo",
      "localhost:3002",
    ),
    true,
  );
});
test("requires an exact origin, including scheme and port", () => {
  for (const origin of [
    "https://evil.example",
    "http://127.0.0.1:3003",
    "https://127.0.0.1:3002",
    "null",
    "http://127.0.0.1:3002/path",
  ]) {
    assert.equal(
      isAllowedOrigin(
        origin,
        "http://localhost:3002/api/auth/demo",
        "127.0.0.1:3002",
      ),
      false,
    );
  }
});
test("supports a configured public origin and clients without Origin", () => {
  assert.equal(
    isAllowedOrigin(
      "https://campus.example",
      "http://localhost:3000/api/home",
      "localhost:3000",
      "https://campus.example/",
    ),
    true,
  );
  assert.equal(
    isAllowedOrigin(null, "http://localhost:3000/api/home", "localhost:3000"),
    true,
  );
});
