import { HotelInventoryProvider } from "./HotelInventoryProvider.js";

// Placeholder for Booking.com's Demand API: date-specific availability, rates,
// taxes and cancellation terms. GlobTrek has no Demand API access, so this stays
// disabled and never simulates results. Enable it only with real credentials and
// documented access, by implementing getRates() against the API.
export class BookingComDemandHotelProvider extends HotelInventoryProvider {
  static isConfigured() {
    return false;
  }

  async searchHotels() {
    throw new Error("booking_com_demand_not_configured");
  }

  async getProperty() {
    throw new Error("booking_com_demand_not_configured");
  }

  async getRates() {
    return { available: false, reason: "booking_com_demand_not_configured" };
  }
}
