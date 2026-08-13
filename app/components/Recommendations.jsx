/**
 * Normalized recommendation fields accepted by RecommendationSection:
 * provider, providerDisplayName, affiliateUrl, type, name, destination, image,
 * price, currency, priceType, rating, reviewCount, amenities, categories,
 * matchScore, matchReasons, and availabilityStatus. Omitted values are not rendered.
 */
export function PartnerAttribution({ providerDisplayName }) {
  return (
    <p className="mt-3 text-xs leading-5 text-[#707070]">
      {providerDisplayName
        ? `You’ll continue to ${providerDisplayName} to review final pricing, availability, and terms.`
        : "You’ll continue to the booking provider to review final pricing, availability, and terms."}
    </p>
  );
}

export function ExternalBookingButton({ affiliateUrl, label, providerDisplayName }) {
  let safeUrl = null;
  try {
    const parsedUrl = new URL(affiliateUrl);
    if (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:") {
      safeUrl = parsedUrl.toString();
    }
  } catch {
    safeUrl = null;
  }

  if (!safeUrl) {
    return null;
  }

  return (
    <div className="mt-6">
      <a
        className="inline-flex min-h-12 items-center bg-[#171717] px-6 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-black"
        href={safeUrl}
        rel="noopener sponsored"
        target="_blank"
      >
        {label} <span aria-hidden="true" className="ml-2">↗</span>
      </a>
      <PartnerAttribution providerDisplayName={providerDisplayName} />
    </div>
  );
}

export function RecommendationSection({ eyebrow, title, items = [], emptyMessage }) {
  return (
    <section className="border-t border-black/10 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#707070]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{title}</h2>
      {items.length ? (
        <div className="mt-8 divide-y divide-black/10 border-y border-black/10">
          {items.map((item) => (
            <article className="py-8" key={`${item.provider || "provider"}-${item.name}`}>
              <h3 className="text-2xl font-semibold tracking-[-0.03em]">{item.name}</h3>
              {item.location ? <p className="mt-2 text-sm text-[#707070]">{item.location}</p> : null}
              {item.price != null && item.currency ? (
                <p className="mt-3 text-sm text-[#171717]">
                  {item.priceType === "estimated" ? "Est. " : ""}
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: item.currency }).format(item.price)}
                </p>
              ) : null}
              {item.rating != null ? (
                <p className="mt-3 text-xs text-[#707070]">
                  {item.rating} rating{item.reviewCount != null ? ` · ${item.reviewCount} reviews` : ""}
                  {item.providerDisplayName ? ` · Supplied by ${item.providerDisplayName}` : ""}
                </p>
              ) : null}
              {item.amenities?.length || item.categories?.length ? (
                <p className="mt-4 text-sm leading-6 text-[#666]">
                  {[...(item.amenities || []), ...(item.categories || [])].join(" · ")}
                </p>
              ) : null}
              {item.matchReasons?.length ? (
                <p className="mt-4 max-w-2xl text-base leading-7 text-[#444]">
                  {item.matchReasons.join(" · ")}
                </p>
              ) : null}
              <ExternalBookingButton
                affiliateUrl={item.affiliateUrl}
                label={item.type === "experience" ? "View experience" : "View stay"}
                providerDisplayName={item.providerDisplayName}
              />
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 border-y border-black/10 py-8">
          <p className="max-w-2xl text-base leading-7 text-[#555]">{emptyMessage}</p>
          <p className="mt-3 max-w-2xl text-xs leading-5 text-[#777]">
            No live price, rating, availability, or booking relationship is implied.
          </p>
        </div>
      )}
    </section>
  );
}
