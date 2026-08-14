import { HotelInventoryProvider } from "./HotelInventoryProvider.js";
import { hotelsFor } from "../../data/hotels.js";
import { rankHotels } from "../recommendation/hotelEngine.js";

export class CuratedHotelProvider extends HotelInventoryProvider {
  async searchHotels({ destination, profile, budgetPlan, limit = 12 }) {
    const hotels = hotelsFor(destination, { answers: profile.otherExistingQuizPreferences }, { limit: Number.MAX_SAFE_INTEGER });
    return rankHotels(hotels, profile, budgetPlan).slice(0, limit);
  }

  async getProperty({ destination, id }) {
    return hotelsFor(destination, {}, { limit: Number.MAX_SAFE_INTEGER }).find((hotel) => hotel.id === id) || null;
  }
}
