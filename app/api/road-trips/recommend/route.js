import { roadTripQuizForRecommendations } from "../../../data/roadTripQuiz";
import { selectRoadTrip } from "../../../data/roadTripRoutes";

function publicDestination(destination) {
  return {
    id: destination.id || destination.airport, airport: destination.airport, city: destination.city, name: destination.name,
    country: destination.country, latitude: destination.latitude, longitude: destination.longitude, image: destination.image || null, style: destination.style, placeId: destination.placeId || null, verificationSource: destination.verificationSource || null,
  };
}

export async function POST(request) {
  const answers = await request.json().catch(() => null);
  if (!answers || Number(answers.budget) < 500 || !answers.originDetails?.city || !answers.originDetails?.countryCode || !Number.isFinite(Number(answers.originDetails?.latitude)) || !Number.isFinite(Number(answers.originDetails?.longitude))) return Response.json({ error: "Incomplete road-trip profile" }, { status: 400 });
  const selected = selectRoadTrip(answers);
  if (!selected) return Response.json({ error: "No grounded route available" }, { status: 404 });
  const route = {
    id: selected.id, title: selected.title, dek: selected.dek, distanceMiles: selected.distanceMiles, days: selected.days,
    landscapes: selected.landscapes, kinds: selected.kinds, driving: selected.driving, heroImage: selected.heroImage,
    hotelDestinationId: selected.hotelDestinationId, estimate: selected.estimate, compatibility: selected.compatibility, requested: selected.id === answers.requestedRouteId,
    stops: selected.stops.map(publicDestination),
  };
  return Response.json({ route, quiz: roadTripQuizForRecommendations(answers) });
}
