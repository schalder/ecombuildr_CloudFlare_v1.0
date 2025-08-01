import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';

export const StorefrontFooter: React.FC = () => {
  const { store } = useStore();

  if (!store) return null;

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Store Info */}
          <div className="md:col-span-2">
            <Link to={`/store/${store.slug}`} className="flex items-center space-x-3 mb-4">
              {store.logo_url && (
                <img 
                  src={store.logo_url} 
                  alt={store.name}
                  className="h-8 w-8 object-contain"
                />
              )}
              <span className="text-lg font-bold text-foreground">{store.name}</span>
            </Link>
            {store.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {store.description}
              </p>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to={`/store/${store.slug}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to={`/store/${store.slug}/products`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link 
                  to={`/store/${store.slug}/about`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link 
                  to={`/store/${store.slug}/contact`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to={`/store/${store.slug}/shipping`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link 
                  to={`/store/${store.slug}/returns`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Returns
                </Link>
              </li>
              <li>
                <Link 
                  to={`/store/${store.slug}/faq`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link 
                  to={`/store/${store.slug}/privacy`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 {store.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};