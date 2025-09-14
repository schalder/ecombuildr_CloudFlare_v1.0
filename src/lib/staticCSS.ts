// Complete CSS generator for static HTML
export async function generateCompleteCSS(customPageStyles?: string): Promise<string> {
  return `
    /* CSS Variables - Design System */
    :root {
      --background: 0 0% 100%;
      --foreground: 215 25% 15%;
      --primary: 185 85% 25%;
      --primary-foreground: 0 0% 98%;
      --primary-glow: 185 85% 35%;
      --accent: 25 95% 55%;
      --accent-foreground: 0 0% 98%;
      --success: 142 76% 36%;
      --muted: 220 30% 96%;
      --muted-foreground: 215 20% 50%;
      --border: 220 25% 90%;
      --ring: 185 85% 25%;
      --radius: 0.5rem;
    }

    /* Base Styles */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      line-height: 1.6;
      color: hsl(var(--foreground));
      background-color: hsl(var(--background));
    }

    /* Typography */
    h1, h2, h3, h4, h5, h6 {
      font-weight: 600;
      line-height: 1.2;
      margin-bottom: 1rem;
    }

    h1 { font-size: 2.5rem; }
    h2 { font-size: 2rem; }
    h3 { font-size: 1.5rem; }
    h4 { font-size: 1.25rem; }
    h5 { font-size: 1.125rem; }
    h6 { font-size: 1rem; }

    p {
      margin-bottom: 1rem;
      line-height: 1.6;
    }

    /* Layout Classes */
    .container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .section {
      padding: 4rem 0;
    }

    .grid {
      display: grid;
      gap: 1.5rem;
    }

    .grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
    .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

    /* Responsive Grid */
    @media (min-width: 768px) {
      .md\\:grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
      .md\\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
      .md\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
      .md\\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
    }

    /* Utility Classes */
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }

    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }

    .text-sm { font-size: 0.875rem; }
    .text-lg { font-size: 1.125rem; }
    .text-xl { font-size: 1.25rem; }
    .text-2xl { font-size: 1.5rem; }
    .text-3xl { font-size: 1.875rem; }
    .text-4xl { font-size: 2.25rem; }
    .text-5xl { font-size: 3rem; }
    .text-6xl { font-size: 3.75rem; }

    /* Spacing */
    .p-4 { padding: 1rem; }
    .p-8 { padding: 2rem; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .px-8 { padding-left: 2rem; padding-right: 2rem; }
    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
    .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
    .py-16 { padding-top: 4rem; padding-bottom: 4rem; }

    .m-4 { margin: 1rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-8 { margin-bottom: 2rem; }
    .mb-12 { margin-bottom: 3rem; }
    .mt-2 { margin-top: 0.5rem; }

    /* Colors */
    .text-gray-600 { color: hsl(var(--muted-foreground)); }
    .text-gray-700 { color: hsl(215 20% 45%); }
    .text-gray-900 { color: hsl(var(--foreground)); }
    .text-green-600 { color: hsl(var(--success)); }

    /* Layout */
    .min-h-screen { min-height: 100vh; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .max-w-2xl { max-width: 42rem; }
    .max-w-4xl { max-width: 56rem; }
    .max-w-6xl { max-width: 72rem; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .w-full { width: 100%; }
    .h-auto { height: auto; }
    .block { display: block; }
    .inline-block { display: inline-block; }

    /* Borders */
    .rounded-lg { border-radius: 0.5rem; }
    .rounded { border-radius: 0.25rem; }
    .border { border-width: 1px; border-style: solid; }
    .border-gray-300 { border-color: hsl(var(--border)); }

    /* Component Styles */
    .btn-primary {
      background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)));
      color: hsl(var(--primary-foreground));
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius);
      font-weight: 600;
      text-decoration: none;
      display: inline-block;
      transition: all 0.2s ease;
      border: none;
      cursor: pointer;
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 25px hsl(var(--primary) / 0.3);
    }

    .card {
      background: hsl(var(--background));
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px hsl(var(--primary) / 0.1);
      border: 1px solid hsl(var(--border));
    }

    /* Product Grid */
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2rem;
      padding: 2rem 0;
    }

    .product-card {
      background: hsl(var(--background));
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px hsl(var(--primary) / 0.1);
      transition: transform 0.3s, box-shadow 0.3s;
      border: 1px solid hsl(var(--border));
    }

    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 25px -5px hsl(var(--primary) / 0.15);
    }

    .product-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .product-info {
      padding: 1.5rem;
    }

    .product-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: hsl(var(--foreground));
    }

    .product-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: hsl(var(--primary));
    }

    /* Forms */
    input, textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid hsl(var(--border));
      border-radius: var(--radius);
      font-size: 1rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    input:focus, textarea:focus {
      outline: none;
      border-color: hsl(var(--ring));
      box-shadow: 0 0 0 3px hsl(var(--ring) / 0.1);
    }

    label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: hsl(var(--foreground));
    }

    /* Form Spacing */
    .space-y-6 > * + * {
      margin-top: 1.5rem;
    }

    /* Animations */
    .animate-fade-in {
      animation: fadeIn 0.6s ease-out;
    }

    .animate-slide-up {
      animation: slideUp 0.8s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(40px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-on-scroll {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }

    .animate-on-scroll.animate-fade-in {
      opacity: 1;
      transform: translateY(0);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .container {
        padding: 0 1rem;
      }

      .py-16 {
        padding-top: 2rem;
        padding-bottom: 2rem;
      }

      .text-4xl {
        font-size: 1.875rem;
      }

      .text-5xl {
        font-size: 2.25rem;
      }

      .text-6xl {
        font-size: 2.5rem;
      }

      .px-responsive {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      .text-responsive {
        font-size: 1.25rem;
        line-height: 1.75rem;
      }

      .grid {
        gap: 1rem;
      }

      .product-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
      }
    }

    @media (max-width: 480px) {
      .product-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Hero Section */
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 4rem 1rem;
      background: linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%);
    }

    /* Additional utility classes */
    .col-span-full { grid-column: 1 / -1; }
    .leading-relaxed { line-height: 1.625; }
    .max-w-full { max-width: 100%; }
    .overflow-hidden { overflow: hidden; }

    /* Page container styles */
    .page-container {
      min-height: 100vh;
    }

    .row {
      padding: 1rem 0;
    }

    .column {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* Custom page styles will be inserted here */
    ${customPageStyles || ''}
  `;
}