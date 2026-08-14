export class CjLinkProvider {
  constructor(trackingBaseUrl) {
    this.trackingBaseUrl = trackingBaseUrl;
  }

  propertyUrl(propertyUrl, params = {}) {
    if (!this.trackingBaseUrl || !propertyUrl) return null;
    const target = new URL(propertyUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") target.searchParams.set(key, String(value));
    });
    return `${this.trackingBaseUrl}?url=${encodeURIComponent(target.toString())}`;
  }
}
