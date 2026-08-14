import { HotelInventoryProvider } from "./HotelInventoryProvider.js";

export class BookingComDemandHotelProvider extends HotelInventoryProvider {
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
