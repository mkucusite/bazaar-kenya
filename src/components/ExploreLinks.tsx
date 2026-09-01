import { Link } from "react-router-dom";

const ExploreLinks = () => (
  <section className="container-app py-10 border-t border-border/40">
    <h2 className="font-heading font-bold text-lg text-foreground mb-4">Explore KenyaAdvert</h2>
    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
      <li><Link to="/" className="text-primary hover:underline font-medium">Home</Link></li>
      <li><Link to="/blog" className="text-primary hover:underline font-medium">Blog</Link></li>
      <li><Link to="/events" className="text-primary hover:underline font-medium">Events</Link></li>
      <li><Link to="/banners" className="text-primary hover:underline font-medium">Banners & Campaigns</Link></li>
      <li><Link to="/advertise" className="text-primary hover:underline font-medium">Advertise</Link></li>
      <li><Link to="/search" className="text-primary hover:underline font-medium">Browse Listings</Link></li>
      <li><Link to="/politics" className="text-primary hover:underline font-medium">Politics</Link></li>
      <li><Link to="/safety-tips" className="text-primary hover:underline font-medium">Safety Tips</Link></li>
    </ul>
  </section>
);

export default ExploreLinks;
