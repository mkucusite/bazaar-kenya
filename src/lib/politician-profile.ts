export type PoliticianProfile = Record<string, any> & {
  name: string;
  position?: string;
  region?: string;
  county?: string;
  bio?: string;
  tagline?: string;
  party_name?: string;
  party_abbr?: string;
};

const PROFILE_CORRECTIONS: Record<string, Partial<PoliticianProfile>> = {
  "moses-wetangula-bungoma": {
    position: "Speaker of the National Assembly",
    region: "Kenya",
    county: "Bungoma",
    region_type: "National",
    tagline: "Speaker of the National Assembly of Kenya",
    party_name: "FORD–Kenya",
    party_abbr: "FORD–Kenya",
    bio: "Moses Wetangula is a Kenyan politician serving as Speaker of the National Assembly. He previously represented Bungoma County in the Senate and served as Minister for Foreign Affairs. He is the party leader of FORD–Kenya.",
  },
};

export const getAccuratePoliticianProfile = <T extends PoliticianProfile>(profile: T): T => {
  const correction = PROFILE_CORRECTIONS[String(profile.slug || "")];
  return correction ? ({ ...profile, ...correction } as T) : profile;
};

export const politicianRoleLabel = (profile: PoliticianProfile) =>
  profile.position?.trim() || "Political profile";