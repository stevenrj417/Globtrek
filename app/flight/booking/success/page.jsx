import { BookingReturnPage } from "../../../components/BookingReturnPage";
export const metadata = { title: "Flight booked | GlobTrek", description: "Return to your GlobTrek itinerary after completing your flight booking.", robots: { index: false, follow: false } };
export default function FlightBookingSuccessPage() { return <BookingReturnPage state="success" />; }
