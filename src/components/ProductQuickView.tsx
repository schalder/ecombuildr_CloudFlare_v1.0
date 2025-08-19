import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Package, DollarSign, Calculator, ExternalLink } from 'lucide-react';

interface ProductLibraryItem {
  id: string;
  name: string;
  description: string;
  short_description: string;
  suggested_price: number;
  base_cost?: number;
  shipping_cost?: number;
  category: string;
  tags: string[];
  images: any;
  is_trending: boolean;
  supplier_link?: string;
  ad_copy?: string;
  video_url?: string;
  variations: any;
  created_at: string;
}

interface ProductQuickViewProps {
  product: ProductLibraryItem | null;
  isOpen: boolean;
  onClose: () => void;
  isImported?: boolean;
  showProfitCalculation?: boolean;
}

export function ProductQuickView({ 
  product, 
  isOpen, 
  onClose, 
  isImported = false,
  showProfitCalculation = true 
}: ProductQuickViewProps) {
  if (!product) return null;

  const baseCost = product.base_cost || 0;
  const shippingCost = product.shipping_cost || 0;
  const totalCost = baseCost + shippingCost;
  const suggestedPrice = product.suggested_price || 0;
  const potentialProfit = suggestedPrice - totalCost;
  const profitMargin = suggestedPrice > 0 ? ((potentialProfit / suggestedPrice) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            {product.name}
            {product.is_trending && (
              <Badge variant="secondary" className="ml-2">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
            {isImported && (
              <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                ✓ Imported
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Images */}
          <div className="space-y-4">
            {product.images && product.images.length > 0 && (
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.slice(1).map((image: string, index: number) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.name} ${index + 2}`}
                    className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            {/* Basic Info */}
            <div>
              <h3 className="font-semibold mb-2">Product Details</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description || product.short_description}
              </p>
            </div>

            {/* Pricing & Profit Calculation */}
            {showProfitCalculation && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-4 w-4" />
                    <h4 className="font-semibold">Profit Analysis</h4>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Cost:</span>
                      <span className="font-medium">${baseCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping Cost:</span>
                      <span className="font-medium">${shippingCost.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Cost:</span>
                      <span className="font-semibold">${totalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Suggested Price:</span>
                      <span className="font-semibold text-green-600">${suggestedPrice.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Potential Profit:</span>
                      <span className={`font-bold ${potentialProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${potentialProfit.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit Margin:</span>
                      <span className={`font-bold ${profitMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Category and Tags */}
            <div>
              <h4 className="font-semibold mb-2">Category & Tags</h4>
              <div className="flex flex-wrap gap-2">
                {product.category && (
                  <Badge variant="secondary">
                    {product.category}
                  </Badge>
                )}
                {product.tags && product.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Variations */}
            {product.variations && product.variations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Available Variations</h4>
                <div className="text-sm text-muted-foreground">
                  {product.variations.length} variation{product.variations.length !== 1 ? 's' : ''} available
                </div>
              </div>
            )}

            {/* Additional Info */}
            {(product.supplier_link || product.video_url) && (
              <div>
                <h4 className="font-semibold mb-2">Additional Resources</h4>
                <div className="flex flex-wrap gap-2">
                  {product.supplier_link && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={product.supplier_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Supplier Link
                      </a>
                    </Button>
                  )}
                  {product.video_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={product.video_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Product Video
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Ad Copy */}
            {product.ad_copy && (
              <div>
                <h4 className="font-semibold mb-2">Marketing Copy</h4>
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  "{product.ad_copy}"
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}