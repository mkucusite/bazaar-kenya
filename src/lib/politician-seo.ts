type PoliticianLike = {
  name?: string | null;
  position?: string | null;
  region?: string | null;
  county?: string | null;
  party_name?: string | null;
  party_abbr?: string | null;
};

const unique = (items: Array<string | null | undefined>) =>
  Array.from(new Set(items.map((item) => item?.replace(/\s+/g, " ").trim()).filter(Boolean) as string[]));

export const buildPoliticianCampaignKeywords = (person: PoliticianLike, max = 28) => {
  const name = person.name?.trim() || "Kenya aspirant";
  const firstName = name.split(/\s+/)[0] || name;
  const position = person.position?.trim() || "aspirant";
  const positionLower = position.toLowerCase();
  const county = person.county?.trim();
  const region = person.region?.trim();
  const place = county || region || "Kenya";
  const party = person.party_abbr || person.party_name;

  return unique([
    name,
    `${name} 2027`,
    `${name} campaign`,
    `${name} campaign 2027`,
    `vote ${name}`,
    `vote ${name} 2027`,
    `vote ${name} ${place}`,
    `${name} vote`,
    `${firstName} vote`,
    `${firstName} campaign`,
    `${firstName} ${positionLower}`,
    `${name} ${positionLower}`,
    `${name} ${positionLower} 2027`,
    `${name} political profile`,
    `${name} manifesto`,
    `${name} pledges`,
    `${position} ${place}`,
    `${position} ${place} 2027`,
    `vote ${position} ${place}`,
    `${place} ${positionLower} profiles`,
    `${name} ${place}`,
    party && `${name} ${party}`,
    party && `${party} ${positionLower} ${place}`,
  ]).slice(0, max);
};

export const politicianSearchText = (person: PoliticianLike) =>
  buildPoliticianCampaignKeywords(person, 40).join(" ").toLowerCase();

export const matchesPoliticianSearch = (person: PoliticianLike, query: string) => {
  const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalizedQuery) return true;

  const haystack = unique([
    person.name,
    person.position,
    person.region,
    person.county,
    person.party_name,
    person.party_abbr,
    politicianSearchText(person),
  ]).join(" ").toLowerCase();

  if (haystack.includes(normalizedQuery)) return true;

  const tokens = normalizedQuery.split(" ").filter((token) => token.length > 1);
  return tokens.length > 0 && tokens.every((token) => haystack.includes(token));
};