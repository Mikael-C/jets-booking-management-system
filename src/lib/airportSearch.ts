import { Airport } from "@/types/aviation";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function matchScore(value: string, query: string, scores: number[]): number | null {
  const normalized = normalize(value);
  if (!normalized) return null;
  if (normalized === query) return scores[0];
  if (normalized.startsWith(query)) return scores[1];
  if (normalized.split(/\s+/).some((word) => word.startsWith(query))) {
    return scores[2];
  }
  if (normalized.includes(query)) return scores[3];
  return null;
}

export function rankAirports(
  airports: Airport[],
  searchQuery: string,
  includeFboDetails = false,
): Airport[] {
  const query = normalize(searchQuery);
  if (!query) return airports;

  const queryTokens = query.split(/\s+/);

  return airports
    .map((airport, index) => {
      const fields: Array<{ value: string; scores: number[] }> = [
        { value: airport.icao || "", scores: [0, 10, 20, 40] },
        { value: airport.iata || "", scores: [0, 10, 20, 40] },
        { value: airport.name || "", scores: [1, 20, 25, 50] },
        { value: airport.city || "", scores: [2, 30, 35, 60] },
        { value: airport.country || "", scores: [3, 65, 68, 70] },
      ];

      if (includeFboDetails) {
        for (const fbo of airport.fbos || []) {
          fields.push(
            { value: fbo.name || "", scores: [4, 75, 78, 80] },
            { value: fbo.phone || "", scores: [4, 75, 78, 80] },
            { value: fbo.email || "", scores: [4, 75, 78, 80] },
            ...(fbo.languages || []).map((language) => ({
              value: language,
              scores: [4, 75, 78, 80],
            })),
          );
        }
      }

      const phraseScore = fields.reduce<number | null>((best, field) => {
        const score = matchScore(field.value, query, field.scores);
        return score === null ? best : best === null ? score : Math.min(best, score);
      }, null);
      if (phraseScore !== null) return { airport, index, score: phraseScore };

      const tokenScores = queryTokens.map((token) =>
        fields.reduce<number | null>((best, field) => {
          const score = matchScore(field.value, token, field.scores);
          return score === null ? best : best === null ? score : Math.min(best, score);
        }, null),
      );
      if (tokenScores.some((score) => score === null)) return null;

      return {
        airport,
        index,
        score: 90 + tokenScores.reduce<number>((total, score) => total + (score || 0), 0),
      };
    })
    .filter((match): match is { airport: Airport; index: number; score: number } => match !== null)
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map(({ airport }) => airport);
}
