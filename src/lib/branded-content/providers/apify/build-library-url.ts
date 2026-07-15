import type { BrandedContentSearchInput } from "../../contracts/search-input";
import { normalizeFacebookPageUrl, normalizeInstagramUsername } from "@/lib/meta/branded-content/normalize";

// Required by the Apify Actor for every Meta Branded Content Library start URL.
const META_BRANDED_CONTENT_LIBRARY_ID = "17841400436448271";

export function buildMetaBrandedContentLibraryUrl(input: BrandedContentSearchInput) {
  const url = new URL("https://www.facebook.com/ads/library/branded_content/");
  const params = new URLSearchParams();
  params.set("id", META_BRANDED_CONTENT_LIBRARY_ID);
  if (input.platform === "instagram") {
    const username = normalizeInstagramUsername(input.username || "");
    params.set("query", username);
    params.set("target", "instagram");
  } else {
    const page = normalizeFacebookPageUrl(input.pageUrl || "");
    params.set("query", new URL(page).pathname.slice(1));
    params.set("target", "facebook");
  }
  params.set("start_date", input.dateMin);
  params.set("end_date", input.dateMax);
  url.search = params.toString();
  return url.toString();
}
