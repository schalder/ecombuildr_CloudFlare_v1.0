import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Privacy Policy - EcomBuildr"
        description="Learn how EcomBuildr collects, uses, stores, and protects your personal data. This Privacy Policy explains your rights and our data practices."
        metaRobots="index,follow"
        keywords={["privacy policy", "data protection", "EcomBuildr privacy"]}
      />
      <Navbar />
      <main className="flex-1">
        <section className="container mx-auto px-6 py-12 pt-24 max-w-4xl space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: September 10, 2025</p>
          </header>

          <p>
            This Privacy Policy explains how EcomBuildr ("we", "us", "our") collects, uses, discloses, and safeguards information when you visit our website, use our platform, and interact with related services. If you do not agree with the terms of this policy, please discontinue use of our services.
          </p>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
            <p>We collect information in the following categories:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><span className="font-medium">Account Information:</span> name, email, phone (optional), profile details you provide.</li>
              <li><span className="font-medium">Business & Store Data:</span> store name, website content, product and collection details, pricing, media, and settings you create in the platform.</li>
              <li><span className="font-medium">Customer Data (Controller vs Processor):</span> for store owners, you may process your customers' personal data in EcomBuildr. You are the controller of that data and we act as a processor, processing the data on your instructions to provide the service.</li>
              <li><span className="font-medium">Usage & Device Data:</span> log data, IP address, browser, pages viewed, referring URLs, and timestamps to help operate and secure our platform.</li>
              <li><span className="font-medium">Cookies & Similar Technologies:</span> cookies, local storage, and similar tools to keep you signed in, remember preferences, and analyze usage. See our Cookie Policy for details.</li>
              <li><span className="font-medium">Payment & Billing:</span> subscription-related information such as plan, payment reference, and billing details. We may use third-party providers to process payments. Sensitive payment card data is handled by those providers and not stored by us.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">2. How We Use Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our services.</li>
              <li>Authenticate users and secure accounts.</li>
              <li>Operate store, website, funnel, and checkout features you configure.</li>
              <li>Process payments, subscriptions, and invoices.</li>
              <li>Analyze usage to enhance performance and reliability.</li>
              <li>Communicate about updates, security, and transactional notices.</li>
              <li>Comply with legal obligations and enforce our Terms of Service.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">3. Legal Bases (EEA/UK)</h2>
            <p>If you are in the EEA/UK, we process personal data on the following legal bases: performance of a contract, legitimate interests (e.g., product improvement, security), compliance with legal obligations, and consent where required (e.g., certain cookies or marketing).</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">4. Sharing of Information</h2>
            <p>We may share information with service providers who help us operate our platform, including cloud hosting, databases, analytics, payment processing, email, and support tools. Key categories include:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cloud & Database infrastructure (e.g., providers like Supabase or equivalent).</li>
              <li>Analytics and performance monitoring.</li>
              <li>Payment processors and invoicing tools.</li>
              <li>Customer support and communications tools.</li>
              <li>Fraud prevention and security tools.</li>
            </ul>
            <p>We may disclose data to comply with law, protect rights and safety, or in connection with a business transaction. We do not sell personal information.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">5. Data Retention</h2>
            <p>We retain personal data for as long as needed to provide the service, comply with legal obligations, resolve disputes, and enforce agreements. Store owners can request deletion of their data; customers should contact the relevant store owner regarding customer data processed through a store.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">6. Security</h2>
            <p>We implement technical and organizational measures to protect personal data. No method of transmission or storage is 100 percent secure, and we cannot guarantee absolute security.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">7. International Transfers</h2>
            <p>Your data may be transferred to and processed in countries other than your own. Where required, we implement appropriate safeguards for such transfers.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">8. Your Rights</h2>
            <p>Depending on your location, you may have rights to access, correct, delete, or restrict processing of your personal data, and to portability and objection. To exercise rights regarding data controlled by a store owner, contact that store owner directly.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">9. Children's Privacy</h2>
            <p>Our services are not directed to children under 13 (or the relevant age of consent in your jurisdiction), and we do not knowingly collect personal data from children.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will post the new version on this page and update the "Last updated" date.</p>
          </section>

          <section className="space-y-1">
            <h2 className="text-2xl font-semibold">11. Contact Us</h2>
            <p>Email: support@ecombuildr.com</p>
            <p>Address: Barakota, 311, Dakuarhat, Wazirpur Barisal</p>
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;