export type MobileOS = "ios" | "android" | "other";

/**
 * Best-effort device OS detection from the User-Agent string.
 * Used only to decide which app store badge / deep-link scheme to try —
 * never for anything security sensitive.
 */
export function getMobileOS(): MobileOS {
  if (typeof navigator === "undefined") return "other";

  const ua = navigator.userAgent || (navigator as any).vendor || (window as any).opera || "";

  if (/android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "ios";

  return "other";
}