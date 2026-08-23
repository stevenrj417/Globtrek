import { cruiseQuizForRecommendations, selectCruise } from "../../../data/cruiseRoutes";

function publicDestination(destination) { return { id: destination.id, airport: destination.airport, city: destination.city, name: destination.name, country: destination.country, latitude: destination.latitude, longitude: destination.longitude, image: destination.image || null, style: destination.style, placeId: destination.placeId || null, verificationSource: destination.verificationSource || null }; }

export async function POST(request) {
  const answers = await request.json().catch(() => null);
  if (!answers || Number(answers.budget) < 1000 || !answers.originDetails?.city || !answers.originDetails?.countryCode || !Number.isFinite(Number(answers.originDetails?.latitude)) || !Number.isFinite(Number(answers.originDetails?.longitude)) || !answers.experience || !answers.mood || !answers.priority || !answers.duration || !answers.travelers) return Response.json({ error: "Incomplete cruise profile" }, { status: 400 });
  const selected = selectCruise(answers);
  if (!selected) return Response.json({ error: "No grounded route concept available" }, { status: 404 });
  return Response.json({ route: { id: selected.id, title: selected.title, dek: selected.dek, experience: selected.experience, heroImage: selected.heroImage, cabinPreference: selected.cabinPreference, embarkation: publicDestination(selected.embarkation), hotelDestination: publicDestination(selected.hotelDestination), ports: selected.ports.map(publicDestination), logistics: selected.logistics, conceptOnly: true, requested: selected.id === answers.requestedRouteId }, quiz: cruiseQuizForRecommendations(answers) });
}
