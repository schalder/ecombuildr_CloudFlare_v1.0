import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Cookie Policy - EcomBuildr"
        description="Learn how EcomBuildr uses cookies and similar technologies to provide core functionality, remember preferences, and analyze performance."
        metaRobots="index,follow"
        keywords={["cookie policy", "cookies", "ecombuildr cookies"]}
      />
      <Navbar />
      <main className="flex-1">
        <section className="container mx-auto px-6 py-12 pt-24 max-w-4xl space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold">Cookie Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: September 10, 2025</p>
          </header>

          <p>This Cookie Policy explains how EcomBuildr uses cookies and similar technologies when you visit our website and use our platform.</p>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">1. What Are Cookies?</h2>
            <p>Cookies are small text files stored on your device by your browser. They help websites remember your actions and preferences over time.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">2. How We Use Cookies</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><span className="font-medium">Strictly Necessary:</span> required for login, session management, and security.</li>
              <li><span className="font-medium">Preferences:</span> remember settings and interface choices.</li>
              <li><span className="font-medium">Analytics & Performance:</span> measure usage and improve features and reliability.</li>
              <li><span className="font-medium">Marketing (where enabled):</span> store owners may enable third-party pixels or tags that set their own cookies subject to their policies.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">3. Third-Party Cookies</h2>
            <p>We may use third-party services for analytics, performance monitoring, payments, and support. These providers may set their own cookies subject to their privacy policies. Store owners may also add third-party tags to their sites.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">4. Managing Cookies</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Most browsers allow you to delete or block cookies in settings.</li>
              <li>Blocking certain cookies may impact core functionality such as login or checkout.</li>
              <li>You can typically opt out of certain analytics or advertising cookies via provider opt-out pages where available.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">5. Changes</h2>
            <p>We may update this Cookie Policy from time to time. We will post the new version on this page and update the "Last updated" date.</p>
          </section>

          <section className="space-y-1">
            <h2 className="text-2xl font-semibold">6. Contact</h2>
            <p>Email: support@ecombuildr.com</p>
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePolicy;