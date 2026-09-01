// Kenya 2027 Elections — seeded aspirants per seat.
// Augmented at runtime by banner_campaigns (category='politician').

export type Position = "governor" | "senator" | "women-rep" | "mp" | "mca";

export const POSITION_LABEL: Record<Position, string> = {
  governor: "Governor",
  senator: "Senator",
  "women-rep": "Woman Representative",
  mp: "Member of Parliament",
  mca: "Member of County Assembly",
};

export const POSITION_PLURAL: Record<Position, string> = {
  governor: "Governors",
  senator: "Senators",
  "women-rep": "Woman Representatives",
  mp: "Members of Parliament",
  mca: "Members of County Assembly",
};

export const ALL_POSITIONS: Position[] = ["governor", "senator", "women-rep", "mp", "mca"];

export const COUNTIES: string[] = [
  "Mombasa","Kwale","Kilifi","Tana River","Lamu","Taita Taveta","Garissa","Wajir","Mandera","Marsabit",
  "Isiolo","Meru","Tharaka-Nithi","Embu","Kitui","Machakos","Makueni","Nyandarua","Nyeri","Kirinyaga",
  "Murang'a","Kiambu","Turkana","West Pokot","Samburu","Trans-Nzoia","Uasin Gishu","Elgeyo-Marakwet","Nandi","Baringo",
  "Laikipia","Nakuru","Narok","Kajiado","Kericho","Bomet","Kakamega","Vihiga","Bungoma","Busia",
  "Siaya","Kisumu","Homa Bay","Migori","Kisii","Nyamira","Nairobi",
];

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const countyFromSlug = (slug: string) =>
  COUNTIES.find((c) => slugify(c) === slug) || null;

export type Aspirant = {
  name: string;
  party: string;
  bio?: string;
  incumbent?: boolean;
  note?: string;
};

type CountySeats = Partial<Record<Position, Aspirant[]>>;

export const ASPIRANTS: Record<string, CountySeats> = {
  Nairobi: {
    governor: [
      { name: "Johnson Sakaja", party: "UDA", incumbent: true, bio: "Incumbent Nairobi Governor seeking re-election." },
      { name: "Evans Kidero", party: "UDA", bio: "Former Nairobi Governor returning for the seat." },
      { name: "Moses Kuria", party: "Independent / CCK", bio: "Former Cabinet Secretary, declared aspirant." },
      { name: "Babu Owino", party: "ODM", bio: "Embakasi East MP eyeing City Hall." },
      { name: "Tony Gachoka", party: "KANU", bio: "Journalist and political analyst." },
      { name: "Irungu Nyakera", party: "DCP", bio: "Former Principal Secretary." },
      { name: "George Aladwa", party: "ODM", bio: "Makadara MP." },
    ],
    senator: [{ name: "Edwin Sifuna", party: "ODM", incumbent: true, bio: "Incumbent Senator seeking re-election." }],
    "women-rep": [
      { name: "Esther Passaris", party: "ODM", incumbent: true, bio: "Incumbent Women Rep seeking re-election." },
      { name: "Millicent Omanga", party: "UDA", bio: "Former nominated Senator, second attempt." },
    ],
  },
  Mombasa: {
    governor: [
      { name: "Abdulswamad Nassir", party: "ODM", incumbent: true, bio: "Incumbent Mombasa Governor." },
      { name: "Hassan Omar Hassan", party: "UDA", bio: "UDA Secretary General leading early polls." },
      { name: "Mohamed Ali (Jicho Pevu)", party: "UDA", bio: "Nyali MP and former investigative journalist." },
    ],
    senator: [{ name: "Mohamed Faki", party: "ODM", incumbent: true }],
  },
  Nakuru: {
    governor: [
      { name: "Susan Kihika", party: "UDA", incumbent: true },
      { name: "Hillary Kipngeno", party: "UDA" },
      { name: "Joseph Rotich", party: "UDA" },
    ],
    senator: [{ name: "Tabitha Karanja", party: "UDA", incumbent: true, note: "13 UDA challengers registered." }],
    "women-rep": [{ name: "Liza Chelule", party: "UDA", incumbent: true, note: "12 UDA challengers registered." }],
  },
  Kiambu: {
    governor: [
      { name: "Kimani Wamatangi", party: "UDA", incumbent: true },
      { name: "Alice Ng'ang'a", party: "UDA", bio: "Thika Town MP." },
      { name: "Kimani Waceke", party: "UDA" },
      { name: "Robert Ndirangu", party: "UDA" },
    ],
    senator: [{ name: "Karungo Thang'wa", party: "UDA", incumbent: true, note: "10 UDA aspirants registered." }],
  },
  Nandi: {
    governor: [
      { name: "Stephen Sang", party: "UDA", incumbent: true },
      { name: "Cleophas Lagat", party: "UDA", bio: "Former Governor." },
      { name: "Julius Melly", party: "UDA", bio: "Tinderet MP." },
    ],
  },
  Bungoma: {
    governor: [
      { name: "Ken Lusaka", party: "Ford Kenya", incumbent: true },
      { name: "Didmus Barasa", party: "UDA", bio: "Kimilili MP." },
      { name: "Tim Wanyonyi", party: "ODM", bio: "Westlands MP." },
      { name: "Wycliffe Wangamati", party: "Independent", bio: "Former Bungoma Governor." },
    ],
  },
  Bomet: {
    governor: [
      { name: "Hillary Barchok", party: "UDA", incumbent: true },
      { name: "Isaac Rutto", party: "UDA" },
    ],
    "women-rep": [{ name: "Linet Toto", party: "UDA", note: "May move to Senator race." }],
  },
  Kakamega: {
    governor: [
      { name: "Fernandes Barasa", party: "ODM", incumbent: true },
      { name: "Ayub Savula", party: "ANC", bio: "Deputy Governor eyeing top seat." },
    ],
    senator: [{ name: "Boni Khalwale", party: "UDA", incumbent: true }],
    "women-rep": [{ name: "Elsie Muhanda", party: "ODM", incumbent: true }],
  },
  Siaya: {
    governor: [
      { name: "James Orengo", party: "ODM", incumbent: true },
      { name: "Nicholas Gumbo", party: "UDA", bio: "Former Rarieda MP." },
    ],
  },
  "Taita Taveta": {
    governor: [
      { name: "Andrew Mwadime", party: "Independent", incumbent: true },
      { name: "Granton Samboja", party: "UDA", bio: "Former Governor." },
    ],
  },
  Kitui: {
    governor: [
      { name: "Julius Malombe", party: "Wiper", incumbent: true },
      { name: "Peninah Malonza", party: "UDA", bio: "Former Cabinet Secretary." },
    ],
  },
  "West Pokot": {
    governor: [
      { name: "Simon Kachapin", party: "UDA", incumbent: true },
      { name: "David Pkosing", party: "UDA", bio: "Pokot South MP." },
    ],
  },
  "Tharaka-Nithi": {
    governor: [
      { name: "Muthomi Njuki", party: "UDA", incumbent: true },
      { name: "George Murugara", party: "UDA", bio: "Tharaka MP." },
      { name: "Kareke Mbiuki", party: "UDA", bio: "Maara MP." },
    ],
  },
  Vihiga: {
    governor: [
      { name: "Wilber Ottichilo", party: "ODM", incumbent: true, note: "Term-limited; cannot re-run." },
    ],
  },
  Kirinyaga: {
    governor: [
      { name: "Anne Waiguru", party: "UDA", incumbent: true, note: "Term-limited; cannot re-run." },
    ],
  },
  Nyamira: {
    governor: [
      { name: "Amos Nyaribo", party: "UPA", incumbent: true },
      { name: "Fred Matiang'i", party: "Jubilee", note: "May run for President instead." },
    ],
  },
  "Trans-Nzoia": {
    governor: [
      { name: "George Natembeya", party: "DAP-K", incumbent: true, note: "May run for President." },
    ],
  },
  Busia: {
    senator: [{ name: "Okiya Omtatah", party: "NRA", incumbent: true, note: "May run for President." }],
  },
  Kisumu: {
    senator: [{ name: "Tom Ojienda", party: "ODM", incumbent: true }],
    "women-rep": [{ name: "Ruth Odinga", party: "ODM", incumbent: true }],
  },
  Meru: {
    senator: [{ name: "Kathuri Murungi", party: "UDA", note: "May vacate for governor race." }],
  },
  "Uasin Gishu": {
    "women-rep": [{ name: "Gladys Shollei", party: "UDA", incumbent: true }],
  },
};

export const getAspirants = (county: string, position: Position): Aspirant[] =>
  ASPIRANTS[county]?.[position] || [];

export const countySeo = (county: string, position: Position, names: string[]) => {
  const label = POSITION_LABEL[position];
  const n = names.length;
  const list = names.length ? names.join(", ") : "to be announced";
  return `The ${county} County ${label} seat for the 2027 Kenya general elections has attracted ${n || "several"} aspirants. ${county} ${label} candidates 2027 include: ${list}. View campaign adverts for all ${county} ${label} candidates on Kenya Adverts. Are you vying for ${county} ${label} 2027? Post your campaign advert here.`;
};
