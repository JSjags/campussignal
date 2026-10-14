/** Compare browser origins against the public Host, not only Next's internal URL. */
export function isAllowedOrigin(
  origin: string | null,
  requestUrl: string,
  host: string | null,
  configuredUrl?: string,
): boolean {
  if (!origin) return true; // Non-browser clients may omit Origin.
  try {
    const parsed = new URL(origin);
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.origin !== origin
    )
      return false;
    const internal = new URL(requestUrl);
    const allowed = new Set([internal.origin]);
    if (host) {
      const publicUrl = new URL(`${internal.protocol}//${host}`);
      if (publicUrl.host === host && !publicUrl.username && !publicUrl.password)
        allowed.add(publicUrl.origin);
    }
    if (configuredUrl) allowed.add(new URL(configuredUrl).origin);
    return allowed.has(origin);
  } catch {
    return false;
  }
}
