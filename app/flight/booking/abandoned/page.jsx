import { BookingReturnPage } from "../../../components/BookingReturnPage";
export const metadata = { title: "Flight checkout paused | GlobTrek", description: "Return to your saved GlobTrek itinerary after leaving flight checkout.", robots: { index: false, follow: false } };
export default function FlightBookingAbandonedPage() { return <BookingReturnPage state="abandoned" />; }
