import logo from "@/assets/kenyaadvert-logo.png";

const ManualPage = () => {
  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-white text-gray-900 print:text-black">
      {/* Print button - hidden when printing */}
      <div className="fixed top-4 right-4 z-50 print:hidden">
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-green-700 text-white rounded-lg font-semibold shadow-lg hover:bg-green-800 transition-colors"
        >
          📥 Save as PDF / Print
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12 print:px-4 print:py-2">
        {/* Cover Page */}
        <div className="text-center mb-16 print:mb-8 print:break-after-page">
          <img src={logo} alt="KenyaAdvert" className="w-24 h-24 mx-auto mb-6 rounded-2xl" />
          <h1 className="text-4xl font-bold text-green-800 mb-2">KenyaAdvert</h1>
          <p className="text-xl text-gray-600 mb-1">Complete User Manual</p>
          <p className="text-sm text-gray-400">Version 1.0 — March 2026</p>
          <p className="text-sm text-gray-400">www.kenyaadverts.co.ke</p>
          <div className="mt-8 border-t-2 border-green-700 pt-6 max-w-md mx-auto">
            <p className="text-sm text-gray-500">Kenya's Trusted Classifieds Marketplace</p>
            <p className="text-xs text-gray-400 mt-1">Buy & Sell Across All 47 Counties</p>
          </div>
        </div>

        {/* Table of Contents */}
        <section className="mb-12 print:break-after-page">
          <h2 className="text-2xl font-bold text-green-800 border-b-2 border-green-700 pb-2 mb-6">📑 Table of Contents</h2>
          <ol className="space-y-2 text-sm">
            {[
              "Getting Started",
              "Creating an Account",
              "Posting an Ad",
              "Managing Your Ads",
              "Boosting Ads (Silver & Gold)",
              "Credits System",
              "Messaging & Chat",
              "Search & Browse",
              "Favourites & Alerts",
              "Business Profiles",
              "Banner Advertising Campaigns",
              "Blog",
              "Notifications & Settings",
              "Payments (M-Pesa)",
              "Safety Tips",
              "SEO & Sharing",
              "PWA / Mobile App",
              "Admin Panel",
              "Troubleshooting & FAQs",
              "Contact & Support",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="font-bold text-green-700 w-6">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Section 1 */}
        <section className="mb-10 print:break-before-page">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">1. Getting Started</h2>
          <p className="mb-3">KenyaAdvert is Kenya's trusted online classifieds marketplace. You can buy and sell phones, cars, electronics, property, services, and more across all 47 counties.</p>
          <h3 className="font-semibold mt-4 mb-2">Key Features:</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Free ad posting for all users</li>
            <li>M-Pesa payments for premium features</li>
            <li>Real-time chat between buyers and sellers</li>
            <li>Smart search with filters (county, category, price range)</li>
            <li>Gold & Silver boost packages for more visibility</li>
            <li>Business profiles for professional sellers</li>
            <li>Blog with marketplace tips and guides</li>
            <li>PWA — installable as a mobile app</li>
            <li>Dark mode support</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">2. Creating an Account</h2>
          <h3 className="font-semibold mb-2">Registration:</h3>
          <ol className="list-decimal pl-6 space-y-1 text-sm mb-4">
            <li>Go to <strong>/register</strong></li>
            <li>Enter your full name, email, phone number, and create a password</li>
            <li>Click "Create Account"</li>
            <li>Check your email for a verification link and click it</li>
            <li>You can now log in at <strong>/login</strong></li>
          </ol>
          <h3 className="font-semibold mb-2">Password Reset:</h3>
          <ol className="list-decimal pl-6 space-y-1 text-sm">
            <li>Go to <strong>/reset-password</strong></li>
            <li>Enter your registered email address</li>
            <li>Check your email for a reset link</li>
            <li>Set a new password</li>
          </ol>
        </section>

        {/* Section 3 */}
        <section className="mb-10 print:break-before-page">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">3. Posting an Ad</h2>
          <p className="mb-3">Posting an ad is free and follows a simple 4-step wizard:</p>
          <h3 className="font-semibold mb-2">Step 1 — Category</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm mb-3">
            <li>Choose a category (e.g., Phones, Vehicles, Electronics)</li>
            <li>Select a subcategory if available</li>
            <li>Can't find your category? Use "Suggest a Category" feature</li>
          </ul>
          <h3 className="font-semibold mb-2">Step 2 — Photos</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm mb-3">
            <li>Upload up to 5 photos of your item</li>
            <li>Images are automatically compressed for fast loading</li>
            <li>Drag to reorder — first image becomes the cover photo</li>
          </ul>
          <h3 className="font-semibold mb-2">Step 3 — Details</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm mb-3">
            <li>Enter title, description, price, condition (New/Used)</li>
            <li>Select your county and town</li>
            <li>Add phone number and WhatsApp (optional)</li>
            <li>Use "AI Generate" button for automatic description writing</li>
            <li>Toggle "Negotiable" if price is flexible</li>
          </ul>
          <h3 className="font-semibold mb-2">Step 4 — Package</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Standard (Free)</strong> — Basic listing</li>
            <li><strong>Silver (KSh 299)</strong> — Priority listing + Silver badge + 7-day boost</li>
            <li><strong>Gold (KSh 599)</strong> — Top placement + Gold badge + 14-day boost + Featured section</li>
            <li>Pay via M-Pesa STK Push or use credits</li>
          </ul>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3 text-sm">
            <strong>💡 Tip:</strong> Your ad gets a unique SEO-friendly URL like <code>/ads/iphone-15-pro-max-256gb</code> — share it anywhere!
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">4. Managing Your Ads</h2>
          <p className="mb-3">Access <strong>/my-ads</strong> to manage all your listings.</p>
          <h3 className="font-semibold mb-2">Available Actions:</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Edit</strong> — Change title, description, price, images, location</li>
            <li><strong>Delete</strong> — Permanently remove your ad</li>
            <li><strong>Mark as Sold</strong> — Change status to sold</li>
            <li><strong>Boost</strong> — Upgrade to Silver or Gold</li>
            <li><strong>Preview</strong> — See how your ad appears to buyers</li>
            <li><strong>Share</strong> — Copy link or share via WhatsApp/social media</li>
          </ul>
          <p className="mt-3 text-sm">Each ad shows view count and contact count to track performance.</p>
        </section>

        {/* Section 5 */}
        <section className="mb-10 print:break-before-page">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">5. Boosting Ads (Silver & Gold)</h2>
          <table className="w-full text-sm border-collapse border border-gray-300 mb-4">
            <thead>
              <tr className="bg-green-50">
                <th className="border border-gray-300 px-3 py-2 text-left">Feature</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Standard</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Silver 🥈</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Gold 🥇</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Price", "Free", "KSh 299", "KSh 599"],
                ["Badge", "None", "Silver", "Gold"],
                ["Duration", "Standard", "7 days", "14 days"],
                ["Priority listing", "❌", "✅", "✅"],
                ["Featured section", "❌", "❌", "✅"],
                ["Top placement", "❌", "❌", "✅"],
              ].map(([feature, std, silver, gold], i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                  <td className="border border-gray-300 px-3 py-2 font-medium">{feature}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{std}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{silver}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{gold}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="font-semibold mb-2">How to Boost:</h3>
          <ol className="list-decimal pl-6 space-y-1 text-sm">
            <li>Go to My Ads → click "Boost" on any ad</li>
            <li>Select Silver or Gold tier</li>
            <li>Optionally apply credits for a discount</li>
            <li>Enter your M-Pesa phone number</li>
            <li>Confirm the STK push on your phone</li>
            <li>Your ad is immediately boosted!</li>
          </ol>
        </section>

        {/* Section 6 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">6. Credits System</h2>
          <p className="mb-3">Credits are a virtual currency that can be used to reduce the cost of Silver and Gold boosts.</p>
          <h3 className="font-semibold mb-2">Buying Credits:</h3>
          <ol className="list-decimal pl-6 space-y-1 text-sm mb-3">
            <li>Go to <strong>/credits</strong></li>
            <li>Select a credit bundle</li>
            <li>Pay via M-Pesa</li>
            <li>Credits are added to your account instantly</li>
          </ol>
          <h3 className="font-semibold mb-2">Using Credits:</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>When boosting an ad, toggle "Apply Credits" to reduce the M-Pesa amount</li>
            <li>If your credits fully cover the cost, no M-Pesa payment is needed</li>
            <li>Credits can also be earned through promotions</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="mb-10 print:break-before-page">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">7. Messaging & Chat</h2>
          <p className="mb-3">KenyaAdvert offers three ways to contact sellers:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm mb-3">
            <li><strong>Call</strong> — Direct phone call to the seller</li>
            <li><strong>WhatsApp</strong> — Opens WhatsApp with a pre-filled message</li>
            <li><strong>In-app Chat</strong> — Real-time messaging within KenyaAdvert</li>
          </ul>
          <h3 className="font-semibold mb-2">In-App Chat:</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Click "Chat" on any ad to start a conversation</li>
            <li>Access all chats at <strong>/chats</strong></li>
            <li>Conversations are linked to the specific ad</li>
            <li>You receive notifications for new messages</li>
          </ul>
        </section>

        {/* Section 8 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">8. Search & Browse</h2>
          <h3 className="font-semibold mb-2">Search Features:</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm mb-3">
            <li>Keyword search with instant results</li>
            <li>Filter by <strong>category</strong>, <strong>subcategory</strong>, <strong>county</strong></li>
            <li>Filter by <strong>price range</strong> (min/max)</li>
            <li>Filter by <strong>condition</strong> (New/Used)</li>
            <li>Sort by: Newest, Oldest, Price Low→High, Price High→Low</li>
          </ul>
          <h3 className="font-semibold mb-2">Browse by:</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Categories on the homepage</li>
            <li>Popular locations (Nairobi, Mombasa, Kisumu, etc.)</li>
            <li>Trending ads section</li>
            <li>Featured/Premium ads section</li>
          </ul>
        </section>

        {/* Section 9 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">9. Favourites & Alerts</h2>
          <h3 className="font-semibold mb-2">Favourites:</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm mb-3">
            <li>Click the heart icon on any ad to save it</li>
            <li>Access saved ads at <strong>/favourites</strong></li>
            <li>Remove from favourites anytime</li>
          </ul>
          <h3 className="font-semibold mb-2">Alerts:</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Set up alerts at <strong>/alerts</strong></li>
            <li>Choose a keyword, category, and/or county</li>
            <li>Get notified when matching ads are posted</li>
            <li>Toggle alerts on/off anytime</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section className="mb-10 print:break-before-page">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">10. Business Profiles</h2>
          <p className="mb-3">Professional sellers can create a business profile at <strong>/business-profile</strong>.</p>
          <h3 className="font-semibold mb-2">Business Profile Includes:</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Business name and description</li>
            <li>Logo and cover photo</li>
            <li>Location, phone, WhatsApp, website</li>
            <li>Verification badge (admin-approved)</li>
            <li>All your ads displayed on your profile page</li>
          </ul>
        </section>

        {/* Section 11 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">11. Banner Advertising Campaigns</h2>
          <p className="mb-3">Businesses can run banner ad campaigns to reach thousands of buyers.</p>
          <h3 className="font-semibold mb-2">How to Advertise:</h3>
          <ol className="list-decimal pl-6 space-y-1 text-sm mb-3">
            <li>Go to <strong>/advertise</strong></li>
            <li>Fill in business details and select a package</li>
            <li>Upload your banner image</li>
            <li>Set your target URL (where clicks go)</li>
            <li>Submit for review</li>
          </ol>
          <h3 className="font-semibold mb-2">Campaign Packages:</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm mb-3">
            <li><strong>Basic Banner</strong> — Homepage placement</li>
            <li><strong>Featured Business</strong> — Enhanced visibility</li>
            <li><strong>Category Sponsor</strong> — Sponsor a category page</li>
          </ul>
          <h3 className="font-semibold mb-2">Campaign Dashboard (<strong>/my-campaigns</strong>):</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>View impressions and clicks</li>
            <li>Track campaign status (active, pending, expired)</li>
            <li>See start/end dates</li>
          </ul>
        </section>

        {/* Section 12 */}
        <section className="mb-10 print:break-before-page">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">12. Blog</h2>
          <p className="mb-3">The blog at <strong>/blog</strong> features marketplace tips, guides, and news.</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Articles organized by category</li>
            <li>SEO-friendly URLs (<code>/blog/your-article-slug</code>)</li>
            <li>Share articles on WhatsApp, Twitter, Facebook, or email</li>
            <li>Related articles suggested at the bottom</li>
            <li>View count tracking for each post</li>
          </ul>
        </section>

        {/* Section 13 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">13. Notifications & Settings</h2>
          <h3 className="font-semibold mb-2">Notifications (<strong>/notifications</strong>):</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm mb-3">
            <li>New message alerts</li>
            <li>Ad expiry reminders</li>
            <li>Payment confirmations</li>
            <li>System announcements</li>
          </ul>
          <h3 className="font-semibold mb-2">Settings (<strong>/settings</strong>):</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Edit profile (name, phone, avatar)</li>
            <li>Privacy settings (show/hide phone & email)</li>
            <li>Notification preferences (email & push toggles)</li>
            <li>Dark mode toggle</li>
          </ul>
        </section>

        {/* Section 14 */}
        <section className="mb-10 print:break-before-page">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">14. Payments (M-Pesa)</h2>
          <p className="mb-3">All payments are processed securely via M-Pesa STK Push through PayHero.</p>
          <h3 className="font-semibold mb-2">Payment Flow:</h3>
          <ol className="list-decimal pl-6 space-y-1 text-sm mb-3">
            <li>Enter your M-Pesa phone number (Safaricom)</li>
            <li>Click "Pay" — an STK Push is sent to your phone</li>
            <li>Enter your M-Pesa PIN on your phone</li>
            <li>The system automatically confirms payment (polling every 5 seconds)</li>
            <li>Your ad is upgraded or credits are added instantly</li>
          </ol>
          <h3 className="font-semibold mb-2">Payment Use Cases:</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Boosting ads to Silver or Gold</li>
            <li>Buying credit bundles</li>
            <li>Selecting premium packages during ad posting</li>
            <li>Banner advertising campaigns</li>
          </ul>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3 text-sm">
            <strong>🔒 Security:</strong> Payments are handled server-side via encrypted edge functions. Your M-Pesa PIN is never stored. Each transaction gets a unique reference code.
          </div>
        </section>

        {/* Section 15 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">15. Safety Tips</h2>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Always meet in a public place for transactions</li>
            <li>Never pay before seeing the item in person</li>
            <li>Beware of deals that seem too good to be true</li>
            <li>Use M-Pesa for secure payments — never send cash</li>
            <li>Check the seller's profile and verification status</li>
            <li>Report suspicious ads using the "Report" button</li>
            <li>Trust your instincts — if something feels wrong, walk away</li>
          </ul>
          <h3 className="font-semibold mt-4 mb-2">Reporting Ads:</h3>
          <ol className="list-decimal pl-6 space-y-1 text-sm">
            <li>Open any ad detail page</li>
            <li>Click "Report this ad"</li>
            <li>Enter your reason</li>
            <li>Our AI moderation system reviews it automatically</li>
            <li>Admins take final action</li>
          </ol>
        </section>

        {/* Section 16 */}
        <section className="mb-10 print:break-before-page">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">16. SEO & Sharing</h2>
          <p className="mb-3">KenyaAdvert is fully optimized for Google and social media sharing.</p>
          <h3 className="font-semibold mb-2">SEO Features:</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm mb-3">
            <li>Every page has unique meta title, description, and canonical URL</li>
            <li>Ads get SEO-friendly slug URLs (e.g., <code>/ads/iphone-15-pro-max-256gb</code>)</li>
            <li>JSON-LD Product schema on ad pages (Google rich snippets)</li>
            <li>Static sitemap + dynamic sitemap (auto-includes all ads & blog posts)</li>
            <li>Server-rendered OG tags via edge function for social sharing</li>
            <li>Custom OG images for every page type</li>
          </ul>
          <h3 className="font-semibold mb-2">Sharing Ads:</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Click "Share" on any ad → native share dialog or clipboard copy</li>
            <li>WhatsApp share includes title + description + link</li>
            <li>Social platforms show rich preview with image and description</li>
          </ul>
        </section>

        {/* Section 17 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">17. PWA / Mobile App</h2>
          <p className="mb-3">KenyaAdvert is a Progressive Web App (PWA) — installable as a native app.</p>
          <h3 className="font-semibold mb-2">Installing the App:</h3>
          <ol className="list-decimal pl-6 space-y-1 text-sm mb-3">
            <li>Visit <strong>www.kenyaadverts.co.ke</strong> in Chrome/Safari</li>
            <li>Click the "Download App" button (bottom-right) or use browser's "Add to Home Screen"</li>
            <li>The app installs instantly — no app store needed</li>
            <li>Opens in standalone mode (no browser bar)</li>
          </ol>
          <h3 className="font-semibold mb-2">PWA Benefits:</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Fast loading with offline caching</li>
            <li>Home screen icon like a native app</li>
            <li>Works on Android, iOS, and desktop</li>
            <li>Automatic updates</li>
          </ul>
        </section>

        {/* Section 18 */}
        <section className="mb-10 print:break-before-page">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">18. Admin Panel</h2>
          <p className="mb-3">Admins access the dashboard at <strong>/admin</strong> (role-based access control).</p>
          <h3 className="font-semibold mb-2">Admin Features:</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Dashboard</strong> — Overview of ads, users, payments, reports</li>
            <li><strong>Ad Management</strong> — View, edit, delete any ad</li>
            <li><strong>User Management</strong> — View profiles, assign roles</li>
            <li><strong>Reports</strong> — Review AI-moderated ad reports</li>
            <li><strong>Payments</strong> — View all transactions</li>
            <li><strong>Blog Management</strong> — Create, edit, publish articles (AI-assisted)</li>
            <li><strong>SEO Settings</strong> — Override meta tags for any page</li>
            <li><strong>Site Config</strong> — Update pricing, banners, site settings</li>
            <li><strong>Category Management</strong> — Review category suggestions</li>
            <li><strong>Alert Requests</strong> — Manage user alert requests</li>
            <li><strong>Banner Campaigns</strong> — Approve/manage advertiser campaigns</li>
            <li><strong>AI Chat</strong> — Admin AI assistant for insights</li>
            <li><strong>Page Editor</strong> — Edit static site pages (About, Terms, etc.)</li>
          </ul>
          <h3 className="font-semibold mt-4 mb-2">Roles:</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Admin</strong> — Full access to all features</li>
            <li><strong>Moderator</strong> — Can review reports and manage content</li>
            <li><strong>User</strong> — Standard user access</li>
          </ul>
        </section>

        {/* Section 19 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">19. Troubleshooting & FAQs</h2>
          <div className="space-y-4 text-sm">
            {[
              ["Q: I can't log in", "A: Check your email and password. If you forgot your password, use the Reset Password page. Make sure you've verified your email address."],
              ["Q: My ad isn't showing", "A: Make sure your ad status is 'active'. Ads may take a moment to appear. Check your My Ads page for the current status."],
              ["Q: M-Pesa payment didn't go through", "A: Ensure you have sufficient M-Pesa balance and entered the correct phone number. If the STK push didn't arrive, try again. If money was deducted but the boost didn't apply, contact support."],
              ["Q: How do I delete my ad?", "A: Go to My Ads, click the menu on your ad, and select 'Delete'. This action is permanent."],
              ["Q: Can I edit my ad after posting?", "A: Yes! Go to My Ads and click 'Edit' on any of your ads."],
              ["Q: How do I contact support?", "A: Email support@kenyaadverts.co.ke or use the chat feature for general inquiries."],
              ["Q: How do I install the app?", "A: Visit the website in Chrome or Safari and click 'Download App' or use your browser's 'Add to Home Screen' option."],
            ].map(([q, a], i) => (
              <div key={i}>
                <p className="font-semibold text-green-800">{q}</p>
                <p className="text-gray-700">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 20 */}
        <section className="mb-10 print:break-before-page">
          <h2 className="text-xl font-bold text-green-800 border-b border-green-200 pb-2 mb-4">20. Contact & Support</h2>
          <table className="w-full text-sm">
            <tbody>
              {[
                ["Website", "www.kenyaadverts.co.ke"],
                ["Email", "support@kenyaadverts.co.ke"],
                ["Domain", "kenyaadverts.co.ke"],
              ].map(([label, value], i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-2 font-semibold w-32">{label}</td>
                  <td className="py-2">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-6 mt-12">
          <p>© {new Date().getFullYear()} KenyaAdvert. All rights reserved.</p>
          <p className="mt-1">This manual is confidential and intended for authorized use only.</p>
        </div>
      </div>
    </div>
  );
};

export default ManualPage;
