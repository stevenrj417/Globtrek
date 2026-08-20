import { BookingReturnPage } from "../../../components/BookingReturnPage";
export const metadata = { title: "Flight booking not completed | GlobTrek", description: "Return to your GlobTrek itinerary or retry your flight booking.", robots: { index: false, follow: false } };
export default function FlightBookingFailedPage() { return <BookingReturnPage state="failed" />; }
