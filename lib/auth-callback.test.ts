import test from "node:test";
import assert from "node:assert/strict";
import { authCallbackMessage } from "./auth-callback";
test("missing browser verifier is not mislabeled as an expired email", () => {
  const message = authCallbackMessage(
    undefined,
    "AuthPKCECodeVerifierMissingError",
  );
  assert.match(message, /same browser/);
  assert.doesNotMatch(message, /expired/);
});
test("expired, malformed and network callbacks have distinct recovery guidance", () => {
  assert.match(
    authCallbackMessage("otp_expired"),
    /expired or was already used/,
  );
  assert.match(authCallbackMessage("missing_code"), /did not contain/);
  assert.match(authCallbackMessage("network_error"), /could not reach/);
  assert.doesNotMatch(
    authCallbackMessage("untrusted-external-error"),
    /untrusted-external-error/,
  );
});
