export function getSafeCallbackUrl(
  callbackUrl: string | null,
  currentOrigin: string,
  fallback = '/'
): string {
  if (!callbackUrl) {
    return fallback
  }

  if (callbackUrl.startsWith('/')) {
    return callbackUrl
  }

  try {
    const url = new URL(callbackUrl)
    if (url.origin !== currentOrigin) {
      return fallback
    }

    return `${url.pathname}${url.search}${url.hash}` || fallback
  } catch {
    return fallback
  }
}
