import Image from "next/image";

// Official Booking.com wordmark (used with the owner's permission). Keep it small and
// only beside a mention of Booking.com.
export function BookingLogo({ className = "h-3.5 w-auto" }) {
  return <Image src="/partners/booking-com.svg" alt="Booking.com" width={119} height={20} unoptimized className={`inline-block align-[-0.15em] ${className}`} />;
}
