export class HotelInventoryProvider {
  async searchHotels() { throw new Error("searchHotels must be implemented"); }
  async getProperty() { throw new Error("getProperty must be implemented"); }
  async getRates() { return { available: false, reason: "live_provider_not_configured" }; }
}

export const hotelProviderCapabilities = Object.freeze({
  curatedSupabase: { content: true, estimatedPrices: true, liveRates: false, availability: false, bookingRedirects: true },
  expediaRapidFuture: { content: true, photos: true, rooms: true, liveRates: true, availability: true, bookingTokens: true },
  bookingComDemandFuture: { content: true, photos: true, rooms: true, liveRates: true, availability: true, bookingRedirects: true },
});
