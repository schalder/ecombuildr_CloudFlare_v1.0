import { Package, ShoppingCart, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'product' | 'order' | 'customer';
  url: string;
}

interface SearchDropdownProps {
  results: SearchResult[];
  loading: boolean;
  query: string;
  onClose: () => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'product':
      return <Package className="h-4 w-4 text-blue-500" />;
    case 'order':
      return <ShoppingCart className="h-4 w-4 text-green-500" />;
    case 'customer':
      return <Users className="h-4 w-4 text-purple-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'product':
      return 'Product';
    case 'order':
      return 'Order';
    case 'customer':
      return 'Customer';
    default:
      return type;
  }
};

export function SearchDropdown({ results, loading, query, onClose }: SearchDropdownProps) {
  const navigate = useNavigate();

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    onClose();
  };

  if (!query || query.length < 2) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg mt-1 z-50 max-h-80 overflow-y-auto">
      {loading ? (
        <div className="p-4 text-center text-muted-foreground">
          <Clock className="h-4 w-4 animate-spin mx-auto mb-2" />
          Searching...
        </div>
      ) : results.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          No results found for "{query}"
        </div>
      ) : (
        <div className="py-2">
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleResultClick(result)}
              className={cn(
                "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors duration-150",
                "flex items-start gap-3 group cursor-pointer"
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(result.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {result.title}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
                    {getTypeLabel(result.type)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {result.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}