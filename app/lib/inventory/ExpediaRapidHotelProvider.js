import { HotelInventoryProvider } from "./HotelInventoryProvider.js";

export class ExpediaRapidHotelProvider extends HotelInventoryProvider {
  async searchHotels() {
    throw new Error("expedia_rapid_not_configured");
  }

  async getProperty() {
    throw new Error("expedia_rapid_not_configured");
  }

  async getRates() {
    return { available: false, reason: "expedia_rapid_not_configured" };
  }
}
