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
    `${name} vying 2027`,
    `${name} aspirant`,
    `${name} manifesto`,
    `${name} pledges`,
    `${position} ${place}`,
    `${position} ${place} 2027`,
    `vote ${position} ${place}`,
    `${place} ${positionLower} aspirants`,
    `${place} ${positionLower} candidates 2027`,
    `${name} ${place}`,
    party && `${name} ${party}`,
    party && `${party} ${positionLower} ${place}`,
  ]).slice(0, max);
};

export const politicianSearchText = (person: PoliticianLike) =>
  buildPoliticianCampaignKeywords(person, 40).join(" ").toLowerCase();