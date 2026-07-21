const slugPattern = /^[A-Za-z0-9]{4,32}$/;

export function isSafeEncurtaShortUrl(value: string) {
  try {
    const url = new URL(value);
    const slug = url.pathname.slice(1);
    return url.protocol === "https:"
      && url.hostname.replace(/^www\./, "") === "encurta.io"
      && slugPattern.test(slug)
      && !url.search
      && !url.hash
      && !url.username
      && !url.password;
  } catch {
    return false;
  }
}

export function isValidEncurtaSlug(value: string) {
  return slugPattern.test(value);
}
