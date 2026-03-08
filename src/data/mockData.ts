export const KENYA_COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa",
  "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi",
  "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos",
  "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a",
  "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri",
  "Samburu", "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans-Nzoia",
  "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
];

export interface CategoryIcon {
  name: string;
  lucideIcon: string;
  color: string;
  subcategories: string[];
  adCount: number;
}

// Keep old interface for compatibility
export interface Category {
  name: string;
  icon: string;
  color: string;
  subcategories: string[];
}

export const CATEGORIES: Category[] = [
  { name: "Electronics", icon: "Monitor", color: "bg-blue-100 text-blue-600", subcategories: ["Phones & Tablets", "Laptops & Computers", "TVs & Audio", "Cameras", "Accessories"] },
  { name: "Home, Garden & Kids", icon: "Home", color: "bg-emerald-100 text-emerald-600", subcategories: ["Furniture", "Kitchen", "Baby & Kids", "Garden", "Home Decor"] },
  { name: "Vehicles", icon: "Car", color: "bg-red-100 text-red-600", subcategories: ["Cars", "Motorcycles", "Trucks", "Buses", "Spare Parts"] },
  { name: "Car Parts & Accessories", icon: "Wrench", color: "bg-orange-100 text-orange-600", subcategories: ["Engine Parts", "Body Parts", "Tyres & Rims", "Audio Systems", "Interior"] },
  { name: "Property Rentals & Sales", icon: "Building2", color: "bg-violet-100 text-violet-600", subcategories: ["Houses for Sale", "Houses for Rent", "Land", "Commercial", "Short Stay"] },
  { name: "Jobs", icon: "Briefcase", color: "bg-indigo-100 text-indigo-600", subcategories: ["Full Time", "Part Time", "Remote", "Internships", "Freelance"] },
  { name: "Entertainment, Sports & Travel", icon: "Trophy", color: "bg-pink-100 text-pink-600", subcategories: ["Sports Equipment", "Musical Instruments", "Travel", "Events", "Gaming"] },
  { name: "Commercial Supplies", icon: "Package", color: "bg-amber-100 text-amber-600", subcategories: ["Office Equipment", "Industrial", "Wholesale", "Raw Materials"] },
  { name: "Farming & Agriculture", icon: "Tractor", color: "bg-lime-100 text-lime-700", subcategories: ["Farm Equipment", "Seeds & Fertilizer", "Livestock", "Produce", "Agri Services"] },
  { name: "Services", icon: "Settings", color: "bg-teal-100 text-teal-600", subcategories: ["Repairs", "Transport", "Cleaning", "IT Services", "Beauty"] },
  { name: "Building Supplies", icon: "Hammer", color: "bg-stone-200 text-stone-600", subcategories: ["Cement & Sand", "Roofing", "Plumbing", "Electrical", "Paint"] },
  { name: "Fashion, Health & Beauty", icon: "Shirt", color: "bg-rose-100 text-rose-600", subcategories: ["Clothing", "Shoes", "Bags", "Jewellery", "Health Products"] },
  { name: "Deals", icon: "Tag", color: "bg-yellow-100 text-yellow-700", subcategories: ["Flash Sales", "Clearance", "Bundle Deals", "Coupons"] },
  { name: "Business Profiles", icon: "Store", color: "bg-cyan-100 text-cyan-600", subcategories: ["Shops", "Dealers", "Service Providers", "Agencies"] },
  { name: "Classifieds", icon: "FileText", color: "bg-gray-100 text-gray-600", subcategories: ["Announcements", "Lost & Found", "Community", "Miscellaneous"] },
];

export interface Ad {
  id: string;
  title: string;
  price: number;
  location: string;
  county: string;
  image: string;
  category: string;
  date: string;
  badge?: "gold" | "silver";
  condition?: "New" | "Used" | "Refurbished";
  phone: string;
  whatsapp?: string;
  views: number;
  slug?: string;
}

export const PREMIUM_ADS: Ad[] = [
  { id: "1", title: "Samsung Galaxy S24 Ultra 256GB", price: 145000, location: "Nairobi CBD", county: "Nairobi", image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop", category: "Electronics", date: "2025-03-06", badge: "gold", condition: "New", phone: "+254712345678", whatsapp: "+254712345678", views: 342 },
  { id: "2", title: "Toyota Vitz 2018 Model", price: 850000, location: "Westlands", county: "Nairobi", image: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=300&fit=crop", category: "Vehicles", date: "2025-03-05", badge: "gold", condition: "Used", phone: "+254723456789", whatsapp: "+254723456789", views: 567 },
  { id: "3", title: "3 Bedroom Apartment Kilimani", price: 45000, location: "Kilimani", county: "Nairobi", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop", category: "Property Rentals & Sales", date: "2025-03-06", badge: "gold", condition: "New", phone: "+254734567890", views: 890 },
  { id: "4", title: "HP Laptop Core i7 16GB RAM", price: 78000, location: "Mombasa", county: "Mombasa", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop", category: "Electronics", date: "2025-03-04", badge: "gold", condition: "New", phone: "+254745678901", whatsapp: "+254745678901", views: 234 },
  { id: "5", title: "Sofa Set 7 Seater Premium", price: 55000, location: "Nakuru", county: "Nakuru", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop", category: "Home, Garden & Kids", date: "2025-03-06", badge: "gold", condition: "New", phone: "+254756789012", views: 156 },
  { id: "6", title: "iPhone 15 Pro Max 256GB", price: 189000, location: "Karen", county: "Nairobi", image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop", category: "Electronics", date: "2025-03-05", badge: "gold", condition: "New", phone: "+254767890123", whatsapp: "+254767890123", views: 445 },
];

export const LATEST_ADS: Ad[] = [
  { id: "7", title: "Mountain Bike 21 Speed", price: 25000, location: "Thika", county: "Kiambu", image: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400&h=300&fit=crop", category: "Entertainment, Sports & Travel", date: "2025-03-06", condition: "Used", phone: "+254712111111", views: 45 },
  { id: "8", title: "Office Desk + Chair Set", price: 18000, location: "Kisumu", county: "Kisumu", image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=300&fit=crop", category: "Commercial Supplies", date: "2025-03-06", condition: "New", phone: "+254723222222", views: 67 },
  { id: "9", title: "Ladies Dress Collection", price: 2500, location: "Eldoret", county: "Uasin Gishu", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=300&fit=crop", category: "Fashion, Health & Beauty", date: "2025-03-05", badge: "silver", condition: "New", phone: "+254734333333", views: 123 },
  { id: "10", title: "Water Tank 5000L", price: 35000, location: "Machakos", county: "Machakos", image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=300&fit=crop", category: "Building Supplies", date: "2025-03-05", condition: "New", phone: "+254745444444", views: 89 },
  { id: "11", title: "Maize Seeds Certified 10kg", price: 4500, location: "Nanyuki", county: "Laikipia", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop", category: "Farming & Agriculture", date: "2025-03-04", condition: "New", phone: "+254756555555", views: 34 },
  { id: "12", title: "Plumbing Services Nairobi", price: 0, location: "Nairobi", county: "Nairobi", image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&h=300&fit=crop", category: "Services", date: "2025-03-06", phone: "+254767666666", views: 210 },
  { id: "13", title: "Samsung 55\" Smart TV", price: 62000, location: "Mombasa", county: "Mombasa", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop", category: "Electronics", date: "2025-03-05", badge: "silver", condition: "New", phone: "+254778777777", whatsapp: "+254778777777", views: 178 },
  { id: "14", title: "Bedsitter Roysambu Monthly", price: 8000, location: "Roysambu", county: "Nairobi", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop", category: "Property Rentals & Sales", date: "2025-03-06", condition: "New", phone: "+254789888888", views: 456 },
  { id: "15", title: "Honda Civic 2019 Pearl White", price: 1950000, location: "Parklands", county: "Nairobi", image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop", category: "Vehicles", date: "2025-03-06", badge: "gold", condition: "Used", phone: "+254790123456", whatsapp: "+254790123456", views: 312 },
  { id: "16", title: "Gaming Laptop ASUS ROG", price: 135000, location: "Nyali", county: "Mombasa", image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=300&fit=crop", category: "Electronics", date: "2025-03-06", condition: "New", phone: "+254701234567", views: 98 },
];

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  author: string;
  date: string;
  slug: string;
  readTime: string;
}

export const BLOG_POSTS: BlogPost[] = [
  { id: "1", title: "Best Cars to Buy in Kenya Under KSh 1 Million", excerpt: "Looking for an affordable car in Kenya? Here are the top picks that offer great value for money, fuel efficiency, and reliability on Kenyan roads.", image: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=300&fit=crop", category: "Vehicles", author: "KenyaAdvert Team", date: "2025-03-01", slug: "best-cars-kenya-under-1-million", readTime: "5 min" },
  { id: "2", title: "How to Rent a House in Nairobi: Complete Guide", excerpt: "A comprehensive guide to finding and renting the perfect home in Nairobi. From budgeting to neighbourhood selection, we cover everything.", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop", category: "Property", author: "KenyaAdvert Team", date: "2025-02-28", slug: "how-to-rent-house-nairobi", readTime: "7 min" },
  { id: "3", title: "Top 10 Electronics Shops in Nairobi", excerpt: "Discover the best electronics shops in Nairobi for phones, laptops, and gadgets. We compare prices, warranty policies and customer reviews.", image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=400&h=300&fit=crop", category: "Electronics", author: "KenyaAdvert Team", date: "2025-02-25", slug: "top-10-electronics-shops-nairobi", readTime: "6 min" },
  { id: "4", title: "How to Sell Your Phone Online Safely in Kenya", excerpt: "Selling your phone online? Follow these safety tips to avoid scams, get the best price, and complete your sale securely on KenyaAdvert.", image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop", category: "Tips", author: "KenyaAdvert Team", date: "2025-02-20", slug: "sell-phone-online-safely-kenya", readTime: "4 min" },
  { id: "5", title: "Farming in Kenya: Best Equipment for Small Scale Farmers", excerpt: "Essential farming equipment and tools for small-scale farmers in Kenya. From ploughs to irrigation systems, find the right gear for your farm.", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop", category: "Agriculture", author: "KenyaAdvert Team", date: "2025-02-15", slug: "farming-kenya-best-equipment", readTime: "8 min" },
];
