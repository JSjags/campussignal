export function authCallbackMessage(code?: string, name?: string) {
  if (
    code === "pkce_code_verifier_not_found" ||
    name === "AuthPKCECodeVerifierMissingError" ||
    code === "bad_code_verifier"
  )
    return "This browser cannot finish that sign-in request. Request a fresh link here, then open the newest email link in this same browser and on this same device.";
  if (
    ["otp_expired", "flow_state_expired", "flow_state_not_found"].includes(
      code || "",
    )
  )
    return "This sign-in link has expired or was already used. Request a new link and open only the newest email.";
  if (code === "missing_code")
    return "The sign-in callback did not contain a sign-in code. Return to login and request a fresh email link.";
  if (code === "network_error")
    return "We could not reach the sign-in service. Please check your connection and request a fresh link.";
  return "We could not complete this sign-in. Request a fresh link and open it in the same browser where you requested it.";
}
