// Per-category field definitions for the Post Ad form.
// All values are stored in the ads.attributes JSONB column.

export type FieldType = "text" | "number" | "date" | "time" | "select" | "textarea";

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  /** Span the full row on mobile + desktop. */
  fullWidth?: boolean;
  required?: boolean;
}

const ELECTRONICS_PHONES: FieldConfig[] = [
  { key: "brand", label: "Brand", type: "select", options: ["Samsung", "Apple", "Tecno", "Infinix", "Xiaomi", "Oppo", "Huawei", "Nokia", "Realme", "Other"] },
  { key: "model", label: "Model", type: "text", placeholder: "e.g. Galaxy S24 Ultra" },
  { key: "storage", label: "Storage", type: "select", options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"] },
  { key: "ram", label: "RAM", type: "select", options: ["2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB"] },
  { key: "color", label: "Color", type: "text", placeholder: "e.g. Phantom Black" },
  { key: "warranty", label: "Warranty", type: "text", placeholder: "e.g. 1 year" },
];

const ELECTRONICS_LAPTOPS: FieldConfig[] = [
  { key: "brand", label: "Brand", type: "select", options: ["HP", "Dell", "Lenovo", "Apple", "Asus", "Acer", "MSI", "Microsoft", "Samsung", "Other"] },
  { key: "model", label: "Model", type: "text", placeholder: "e.g. HP EliteBook 840" },
  { key: "processor", label: "Processor", type: "select", options: ["Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "Apple M1", "Apple M2", "Apple M3", "Other"] },
  { key: "ram", label: "RAM", type: "select", options: ["4GB", "8GB", "16GB", "32GB", "64GB"] },
  { key: "storage_type", label: "Storage Type", type: "select", options: ["HDD", "SSD", "Hybrid"] },
  { key: "storage", label: "Storage Size", type: "select", options: ["128GB", "256GB", "512GB", "1TB", "2TB"] },
  { key: "screen_size", label: "Screen Size", type: "text", placeholder: "e.g. 15.6 inches" },
  { key: "operating_system", label: "Operating System", type: "select", options: ["Windows 11", "Windows 10", "macOS", "Linux", "Chrome OS"] },
];

const ELECTRONICS_TVS: FieldConfig[] = [
  { key: "brand", label: "Brand", type: "select", options: ["Samsung", "LG", "Sony", "Hisense", "TCL", "Vitron", "Skyworth", "Other"] },
  { key: "screen_size", label: "Screen Size (inches)", type: "number", placeholder: "e.g. 55" },
  { key: "resolution", label: "Resolution", type: "select", options: ["HD", "Full HD", "4K UHD", "8K UHD"] },
  { key: "smart", label: "Smart TV", type: "select", options: ["Yes", "No"] },
];

const ELECTRONICS_DEFAULT: FieldConfig[] = [
  { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Samsung" },
  { key: "model", label: "Model", type: "text", placeholder: "e.g. Model number" },
  { key: "warranty", label: "Warranty", type: "text", placeholder: "e.g. 1 year" },
];

const VEHICLES_CARS: FieldConfig[] = [
  { key: "make", label: "Make", type: "select", options: ["Toyota", "Nissan", "Subaru", "Mazda", "Honda", "Mitsubishi", "Mercedes-Benz", "BMW", "Volkswagen", "Ford", "Isuzu", "Land Rover", "Other"] },
  { key: "model", label: "Model", type: "text", placeholder: "e.g. Vitz, Premio" },
  { key: "year", label: "Year of Manufacture", type: "number", placeholder: "e.g. 2018" },
  { key: "mileage", label: "Mileage (km)", type: "number", placeholder: "e.g. 85000" },
  { key: "transmission", label: "Transmission", type: "select", options: ["Automatic", "Manual", "CVT"] },
  { key: "fuel", label: "Fuel Type", type: "select", options: ["Petrol", "Diesel", "Hybrid", "Electric"] },
  { key: "engine_cc", label: "Engine (cc)", type: "number", placeholder: "e.g. 1500" },
  { key: "color", label: "Color", type: "text", placeholder: "e.g. Pearl White" },
  { key: "body_type", label: "Body Type", type: "select", options: ["Sedan", "Hatchback", "SUV", "Wagon", "Pickup", "Van", "Coupe", "Convertible"] },
  { key: "drive_type", label: "Drive Type", type: "select", options: ["2WD", "4WD", "AWD"] },
];

const VEHICLES_MOTORCYCLES: FieldConfig[] = [
  { key: "make", label: "Make", type: "select", options: ["Honda", "Yamaha", "Suzuki", "Bajaj", "TVS", "Boxer", "Captain", "Other"] },
  { key: "model", label: "Model", type: "text", placeholder: "e.g. CG 125" },
  { key: "year", label: "Year of Manufacture", type: "number", placeholder: "e.g. 2022" },
  { key: "engine_cc", label: "Engine (cc)", type: "number", placeholder: "e.g. 125" },
  { key: "mileage", label: "Mileage (km)", type: "number", placeholder: "e.g. 12000" },
];

const VEHICLES_DEFAULT: FieldConfig[] = [
  { key: "make", label: "Make", type: "text", placeholder: "e.g. Isuzu" },
  { key: "model", label: "Model", type: "text", placeholder: "e.g. NPR" },
  { key: "year", label: "Year", type: "number", placeholder: "e.g. 2018" },
  { key: "mileage", label: "Mileage (km)", type: "number" },
];

const PROPERTY_RENT: FieldConfig[] = [
  { key: "property_type", label: "Property Type", type: "select", options: ["Bedsitter", "Single Room", "1 Bedroom", "2 Bedroom", "3 Bedroom", "4 Bedroom", "5+ Bedroom", "Studio", "Maisonette", "Penthouse"] },
  { key: "bedrooms", label: "Bedrooms", type: "number", placeholder: "e.g. 2" },
  { key: "bathrooms", label: "Bathrooms", type: "number", placeholder: "e.g. 2" },
  { key: "furnished", label: "Furnished", type: "select", options: ["Fully Furnished", "Semi-Furnished", "Unfurnished"] },
  { key: "parking", label: "Parking", type: "select", options: ["Yes", "No"] },
  { key: "deposit", label: "Deposit (KSh)", type: "number", placeholder: "e.g. 30000" },
  { key: "amenities", label: "Amenities", type: "text", placeholder: "e.g. WiFi, Borehole, Gym", fullWidth: true },
];

const PROPERTY_SALE: FieldConfig[] = [
  { key: "property_type", label: "Property Type", type: "select", options: ["Apartment", "Bungalow", "Maisonette", "Townhouse", "Villa", "Land", "Commercial"] },
  { key: "bedrooms", label: "Bedrooms", type: "number", placeholder: "e.g. 3" },
  { key: "bathrooms", label: "Bathrooms", type: "number", placeholder: "e.g. 2" },
  { key: "land_size", label: "Land/Plinth Size", type: "text", placeholder: "e.g. 1/8 acre" },
  { key: "title_deed", label: "Title Deed", type: "select", options: ["Available", "Processing", "Share Certificate"] },
];

const PROPERTY_LAND: FieldConfig[] = [
  { key: "land_size", label: "Land Size", type: "text", placeholder: "e.g. 50x100, 1 acre" },
  { key: "title_deed", label: "Title Deed", type: "select", options: ["Ready", "Processing", "Share Certificate"] },
  { key: "zoning", label: "Zoning", type: "select", options: ["Residential", "Commercial", "Agricultural", "Industrial", "Mixed Use"] },
  { key: "access_road", label: "Access Road", type: "select", options: ["Tarmac", "Murram", "Earth"] },
];

const JOBS: FieldConfig[] = [
  { key: "job_type", label: "Job Type", type: "select", options: ["Full Time", "Part Time", "Contract", "Internship", "Freelance", "Remote"] },
  { key: "experience", label: "Experience Level", type: "select", options: ["Entry Level", "Mid Level", "Senior Level", "Manager", "Executive"] },
  { key: "salary_min", label: "Minimum Salary (KSh)", type: "number", placeholder: "e.g. 30000" },
  { key: "salary_max", label: "Maximum Salary (KSh)", type: "number", placeholder: "e.g. 50000" },
  { key: "education", label: "Minimum Education", type: "select", options: ["KCSE", "Certificate", "Diploma", "Bachelors Degree", "Masters Degree", "PhD"] },
  { key: "application_deadline", label: "Application Deadline", type: "date", fullWidth: true },
];

const EVENTS: FieldConfig[] = [
  { key: "event_date", label: "Event Date", type: "date" },
  { key: "event_time", label: "Event Time", type: "time" },
  { key: "venue", label: "Venue", type: "text", placeholder: "e.g. KICC, Nairobi", fullWidth: true },
  { key: "ticket_type", label: "Ticket Type", type: "select", options: ["Free Entry", "Regular", "VIP", "VVIP", "Early Bird", "Group"] },
  { key: "ticket_price", label: "Ticket Price (KSh)", type: "number", placeholder: "0 for free" },
  { key: "organizer", label: "Organizer", type: "text", placeholder: "Event organizer name" },
];

const TRAVEL: FieldConfig[] = [
  { key: "destination", label: "Destination", type: "text", placeholder: "e.g. Diani, Mombasa" },
  { key: "departure_point", label: "Departure Point", type: "text", placeholder: "e.g. Nairobi CBD" },
  { key: "departure_date", label: "Departure Date", type: "date" },
  { key: "return_date", label: "Return Date", type: "date" },
  { key: "transport_mode", label: "Transport Mode", type: "select", options: ["Bus", "Matatu", "Shuttle", "Flight", "Train", "Cruise", "Self-Drive"] },
  { key: "trip_duration", label: "Trip Duration", type: "text", placeholder: "e.g. 3 days 2 nights" },
  { key: "includes", label: "Package Includes", type: "text", placeholder: "e.g. Accommodation, Meals", fullWidth: true },
];

const GAMING: FieldConfig[] = [
  { key: "platform", label: "Platform", type: "select", options: ["PlayStation 5", "PlayStation 4", "Xbox Series X", "Xbox One", "Nintendo Switch", "PC", "Mobile"] },
  { key: "game_title", label: "Game Title", type: "text", placeholder: "e.g. FIFA 25" },
  { key: "genre", label: "Genre", type: "select", options: ["Sports", "Action", "Adventure", "RPG", "Racing", "Strategy", "Shooter", "Puzzle"] },
];

const SPORTS: FieldConfig[] = [
  { key: "equipment_type", label: "Equipment Type", type: "text", placeholder: "e.g. Football, Treadmill" },
  { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Nike, Adidas" },
  { key: "size", label: "Size", type: "text", placeholder: "e.g. 9 UK, Medium" },
];

const FASHION_CLOTHING: FieldConfig[] = [
  { key: "gender", label: "Gender", type: "select", options: ["Men", "Women", "Unisex", "Kids"] },
  { key: "size", label: "Size", type: "text", placeholder: "e.g. M, L, 32, 38" },
  { key: "color", label: "Color", type: "text", placeholder: "e.g. Black, Navy Blue" },
  { key: "material", label: "Material", type: "text", placeholder: "e.g. Cotton, Denim" },
  { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Nike, Zara" },
];

const FASHION_SHOES: FieldConfig[] = [
  { key: "gender", label: "Gender", type: "select", options: ["Men", "Women", "Unisex", "Kids"] },
  { key: "size", label: "Shoe Size", type: "text", placeholder: "e.g. 42 EU / 9 UK" },
  { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Nike, Adidas" },
  { key: "type", label: "Type", type: "select", options: ["Sneakers", "Boots", "Heels", "Flats", "Sandals", "Loafers", "Official", "Sports"] },
  { key: "color", label: "Color", type: "text" },
];

const SERVICES: FieldConfig[] = [
  { key: "service_type", label: "Service Type", type: "text", placeholder: "e.g. Plumbing, Web Design" },
  { key: "experience_years", label: "Years of Experience", type: "number", placeholder: "e.g. 5" },
  { key: "availability", label: "Availability", type: "select", options: ["24/7", "Weekdays Only", "Weekends Only", "On Appointment"] },
  { key: "service_area", label: "Service Area", type: "text", placeholder: "e.g. Nairobi & Kiambu", fullWidth: true },
];

const FARMING_LIVESTOCK: FieldConfig[] = [
  { key: "animal_type", label: "Animal Type", type: "select", options: ["Cattle", "Goats", "Sheep", "Pigs", "Poultry", "Rabbits", "Bees", "Fish", "Other"] },
  { key: "breed", label: "Breed", type: "text", placeholder: "e.g. Friesian, Boran" },
  { key: "age", label: "Age", type: "text", placeholder: "e.g. 2 years, 6 months" },
  { key: "quantity", label: "Quantity", type: "number", placeholder: "e.g. 10" },
];

const FARMING_DEFAULT: FieldConfig[] = [
  { key: "type", label: "Type / Variety", type: "text", placeholder: "e.g. Hybrid Maize, DAP Fertilizer" },
  { key: "quantity", label: "Quantity", type: "text", placeholder: "e.g. 50kg, 100 bags" },
  { key: "brand", label: "Brand / Supplier", type: "text", placeholder: "e.g. Kenya Seed" },
];

const PETS: FieldConfig[] = [
  { key: "animal_type", label: "Animal Type", type: "select", options: ["Dog", "Cat", "Bird", "Fish", "Rabbit", "Reptile", "Other"] },
  { key: "breed", label: "Breed", type: "text", placeholder: "e.g. German Shepherd" },
  { key: "age", label: "Age", type: "text", placeholder: "e.g. 6 months" },
  { key: "gender", label: "Gender", type: "select", options: ["Male", "Female"] },
  { key: "vaccinated", label: "Vaccinated", type: "select", options: ["Yes", "No", "In Progress"] },
];

const HOME_FURNITURE: FieldConfig[] = [
  { key: "furniture_type", label: "Furniture Type", type: "text", placeholder: "e.g. Sofa Set, Dining Table" },
  { key: "material", label: "Material", type: "text", placeholder: "e.g. Mahogany, Fabric" },
  { key: "color", label: "Color", type: "text" },
  { key: "dimensions", label: "Dimensions", type: "text", placeholder: "e.g. 7 seater, 6x4 ft", fullWidth: true },
];

const BUILDING: FieldConfig[] = [
  { key: "material_type", label: "Material Type", type: "text", placeholder: "e.g. Cement, Mabati" },
  { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Bamburi, Mabati Rolling Mills" },
  { key: "quantity", label: "Quantity", type: "text", placeholder: "e.g. 50 bags, 100 pieces" },
  { key: "unit_price", label: "Unit Price (KSh)", type: "number", placeholder: "e.g. 750" },
];

const CAR_PARTS: FieldConfig[] = [
  { key: "part_type", label: "Part Type", type: "text", placeholder: "e.g. Brake Pads, Headlight" },
  { key: "compatible_make", label: "Compatible Make", type: "text", placeholder: "e.g. Toyota" },
  { key: "compatible_model", label: "Compatible Model", type: "text", placeholder: "e.g. Vitz, Premio" },
  { key: "year_range", label: "Year Range", type: "text", placeholder: "e.g. 2010-2018" },
  { key: "oem_number", label: "OEM Part Number", type: "text", placeholder: "Optional" },
];

const COMMERCIAL: FieldConfig[] = [
  { key: "item_type", label: "Item Type", type: "text", placeholder: "e.g. Office Chair, Printer" },
  { key: "brand", label: "Brand", type: "text" },
  { key: "quantity", label: "Quantity Available", type: "number", placeholder: "e.g. 20" },
  { key: "min_order", label: "Minimum Order", type: "number", placeholder: "e.g. 1" },
];

/**
 * Resolve the right field set for a category + subcategory combination.
 */
export function getFieldsForCategory(category: string, subcategory: string): FieldConfig[] {
  const cat = (category || "").toLowerCase();
  const sub = (subcategory || "").toLowerCase();

  // Electronics
  if (cat.includes("electronic")) {
    if (sub.includes("phone") || sub.includes("tablet")) return ELECTRONICS_PHONES;
    if (sub.includes("laptop") || sub.includes("computer")) return ELECTRONICS_LAPTOPS;
    if (sub.includes("tv") || sub.includes("audio")) return ELECTRONICS_TVS;
    return ELECTRONICS_DEFAULT;
  }

  // Vehicles
  if (cat === "vehicles" || cat.startsWith("vehicle")) {
    if (sub.includes("car")) return VEHICLES_CARS;
    if (sub.includes("motor") || sub.includes("bike")) return VEHICLES_MOTORCYCLES;
    return VEHICLES_DEFAULT;
  }

  // Car Parts
  if (cat.includes("car parts")) return CAR_PARTS;

  // Property
  if (cat.includes("property")) {
    if (sub.includes("rent")) return PROPERTY_RENT;
    if (sub.includes("land")) return PROPERTY_LAND;
    if (sub.includes("sale") || sub.includes("commercial") || sub.includes("short")) return PROPERTY_SALE;
    return PROPERTY_RENT;
  }

  // Jobs
  if (cat === "jobs") return JOBS;

  // Entertainment / Sports / Travel
  if (cat.includes("entertainment") || cat.includes("sports") || cat.includes("travel")) {
    if (sub.includes("event")) return EVENTS;
    if (sub.includes("travel")) return TRAVEL;
    if (sub.includes("gaming")) return GAMING;
    if (sub.includes("sport") || sub.includes("musical")) return SPORTS;
    return SPORTS;
  }

  // Commercial supplies
  if (cat.includes("commercial")) return COMMERCIAL;

  // Farming
  if (cat.includes("farming") || cat.includes("agriculture")) {
    if (sub.includes("livestock")) return FARMING_LIVESTOCK;
    return FARMING_DEFAULT;
  }

  // Services
  if (cat === "services") return SERVICES;

  // Building
  if (cat.includes("building")) return BUILDING;

  // Fashion
  if (cat.includes("fashion") || cat.includes("beauty")) {
    if (sub.includes("shoe")) return FASHION_SHOES;
    if (sub.includes("cloth") || sub.includes("dress")) return FASHION_CLOTHING;
    return FASHION_CLOTHING;
  }

  // Home, Garden & Kids
  if (cat.includes("home") || cat.includes("garden")) {
    if (sub.includes("furniture")) return HOME_FURNITURE;
    return HOME_FURNITURE;
  }

  // Pets (no top-level pets category currently, but support if added)
  if (cat.includes("pet")) return PETS;

  return [];
}

/** Format raw attribute values into human-friendly display strings. */
export function formatAttributeValue(field: FieldConfig, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  const str = String(value);
  if (field.type === "date") {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
    }
  }
  if (field.type === "number") {
    const n = Number(str);
    if (!isNaN(n)) return n.toLocaleString();
  }
  return str;
}
