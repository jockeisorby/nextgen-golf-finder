import type { DistrictOption } from "./types";

type DistrictCenter = {
  match: string;
  latitude: number;
  longitude: number;
};

const DISTRICT_CENTERS: DistrictCenter[] = [
  { match: "Blekinge", latitude: 56.18, longitude: 15.59 },
  { match: "Bohuslän", latitude: 58.35, longitude: 11.7 },
  { match: "Dalarna", latitude: 60.61, longitude: 15.63 },
  { match: "Gotland", latitude: 57.62, longitude: 18.3 },
  { match: "Gästrike", latitude: 61.3, longitude: 16.15 },
  { match: "Göteborg", latitude: 57.71, longitude: 11.97 },
  { match: "Halland", latitude: 56.67, longitude: 12.86 },
  { match: "Jämtland", latitude: 63.18, longitude: 14.64 },
  { match: "Medelpad", latitude: 62.39, longitude: 17.31 },
  { match: "Norr", latitude: 64.75, longitude: 20.95 },
  { match: "Skåne", latitude: 55.99, longitude: 13.6 },
  { match: "Småland", latitude: 57.16, longitude: 14.75 },
  { match: "Stockholm", latitude: 59.33, longitude: 18.07 },
  { match: "Södermanland", latitude: 59.04, longitude: 16.75 },
  { match: "Uppland", latitude: 60.0, longitude: 17.7 },
  { match: "Värmland", latitude: 59.55, longitude: 13.5 },
  { match: "Västergötland", latitude: 58.28, longitude: 13.5 },
  { match: "Västmanland", latitude: 59.61, longitude: 16.54 },
  { match: "Ångermanland", latitude: 63.29, longitude: 18.72 },
  { match: "Örebro", latitude: 59.28, longitude: 15.22 },
  { match: "Östergötland", latitude: 58.41, longitude: 15.62 },
];

function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const earthRadiusKm = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function findNearestDistrict(
  position: { latitude: number; longitude: number },
  districts: DistrictOption[],
) {
  const candidates = districts
    .map((district) => {
      const center = DISTRICT_CENTERS.find((item) =>
        district.name.toLocaleLowerCase("sv-SE").includes(
          item.match.toLocaleLowerCase("sv-SE"),
        ),
      );

      if (!center) return null;

      return {
        district,
        distanceKm: distanceKm(position, center),
      };
    })
    .filter((item): item is { district: DistrictOption; distanceKm: number } =>
      Boolean(item),
    )
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return candidates[0];
}
