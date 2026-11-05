import Image from "next/image";

// Official Booking.com wordmark, used with the owner's permission.
export function BookingLogo({ className = "h-3.5 w-auto" }) {
  return <Image src="/partners/booking-com.svg" alt="Booking.com" width={119} height={20} unoptimized className={`inline-block align-[-0.15em] ${className}`} />;
}

export function BookingPartnerBadge({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <BookingLogo className="h-4 w-auto sm:h-[18px]" />
      <span className="border-l border-black/15 pl-3 text-micro font-semibold uppercase tracking-caps text-muted">
        Affiliate partner
      </span>
    </span>
  );
}
