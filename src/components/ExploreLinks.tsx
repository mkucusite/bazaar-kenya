const ExploreLinks = () => (
  <section className="container-app py-10 border-t border-border/40">
    <h2 className="font-heading font-bold text-lg text-foreground mb-4">Explore KenyaAdvert</h2>
    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
      <li><a href="/" className="text-primary hover:underline font-medium">Home</a></li>
      <li><a href="/blog" className="text-primary hover:underline font-medium">Blog</a></li>
      <li><a href="/events" className="text-primary hover:underline font-medium">Events</a></li>
      <li><a href="/banners" className="text-primary hover:underline font-medium">Banners & Campaigns</a></li>
      <li><a href="/advertise" className="text-primary hover:underline font-medium">Advertise</a></li>
      <li><a href="/search" className="text-primary hover:underline font-medium">Browse Listings</a></li>
      <li><a href="/politics" className="text-primary hover:underline font-medium">Politics</a></li>
      <li><a href="/safety-tips" className="text-primary hover:underline font-medium">Safety Tips</a></li>
    </ul>
  </section>
);

export default ExploreLinks;
