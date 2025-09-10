import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Terms of Service - EcomBuildr"
        description="Read the terms and conditions that govern your use of the EcomBuildr platform."
        metaRobots="index,follow"
        keywords={["terms of service", "tos", "ecombuildr terms"]}
      />
      <Navbar />
      <main className="flex-1">
        <section className="container mx-auto px-6 py-12 pt-24 max-w-4xl space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold">Terms of Service</h1>
            <p className="text-sm text-muted-foreground">Last updated: September 10, 2025</p>
          </header>

          <p>These Terms of Service ("Terms") govern your access to and use of the EcomBuildr platform, websites, and services ("Services"). By using the Services you agree to be bound by these Terms.</p>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">1. Service Description</h2>
            <p>EcomBuildr provides tools to build e-commerce websites, funnels, and related features such as product management, checkout, and analytics.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">2. Accounts and Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate registration information and keep your credentials secure.</li>
              <li>You are responsible for activity that occurs under your account.</li>
              <li>Notify us immediately of any unauthorized use or security incident.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">3. Acceptable Use</h2>
            <p>You agree not to misuse the Services. Prohibited activities include illegal content or activity, infringing intellectual property, harmful code, abusive behavior, and attempts to disrupt or circumvent platform security.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">4. Plans, Payments, and Taxes</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Some features require a paid subscription. Pricing may change; we will notify of material changes.</li>
              <li>Fees are billed per your selected plan and payment method. Taxes may apply.</li>
              <li>Unless required by law, fees are non-refundable once the billing period has started.</li>
              <li>We may suspend or terminate access for unpaid invoices.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">5. Store Owner Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are solely responsible for the content and products you publish using the Services.</li>
              <li>You are the controller for any customer data you collect via your store; you must comply with applicable data protection and e-commerce laws.</li>
              <li>You must maintain policies (e.g., shipping, returns, privacy) that reflect your own operations and legal obligations.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">6. Third-Party Services</h2>
            <p>Certain features may rely on third-party tools (e.g., payment processors, analytics, CRM). Your use of those tools is subject to their terms and privacy policies.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">7. Intellectual Property</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We retain all rights to the platform, software, and brand assets.</li>
              <li>You retain rights to your content. You grant us a limited license to host, display, and process your content solely to provide the Services.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">8. Termination</h2>
            <p>You may stop using the Services at any time. We may suspend or terminate access for breach of these Terms, non-payment, security risks, or unlawful activity. Upon termination, your right to use the Services ceases immediately, but certain sections survive (e.g., IP, disclaimers, liability, indemnity).</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">9. Disclaimers</h2>
            <p>The Services are provided on an "as is" and "as available" basis. We disclaim all warranties to the fullest extent permitted by law.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">10. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, EcomBuildr will not be liable for indirect, incidental, special, consequential, or exemplary damages. Our aggregate liability for any claim related to the Services will not exceed the amounts paid by you to us in the 12 months preceding the event giving rise to the claim.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">11. Indemnification</h2>
            <p>You agree to indemnify and hold harmless EcomBuildr and its affiliates from claims arising from your use of the Services, your content, or your violation of these Terms or applicable law.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">12. Governing Law</h2>
            <p>These Terms are governed by applicable local laws where EcomBuildr operates, without regard to conflict of laws principles. Disputes will be resolved in the courts with proper jurisdiction in that location.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">13. Changes to the Terms</h2>
            <p>We may update these Terms from time to time. If changes are material, we will provide notice by reasonable means. Continued use after changes become effective constitutes acceptance of the new Terms.</p>
          </section>

          <section className="space-y-1">
            <h2 className="text-2xl font-semibold">14. Contact</h2>
            <p>Email: support@ecombuildr.com</p>
            <p>Address: Barakota, 311, Dakuarhat, Wazirpur Barisal</p>
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;