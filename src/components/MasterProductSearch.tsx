// src/components/MasterProductSearch.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import masterProductsSeed from '../database/master_products_seed.json'; // direct import

interface MasterProduct {
  gtin: string;
  brand: string;
  product_name: string;
  variant?: string;
  size?: string;
  category?: string;
  suggested_retail_price?: number;
  // ... other fields as in your seed
}

export const MasterProductSearch: React.FC<{ onSelect: (product: MasterProduct) => void; className?: string }> = ({ onSelect, className }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MasterProduct[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the imported JSON directly
  const masterList = Array.isArray(masterProductsSeed) 
    ? masterProductsSeed 
    : (masterProductsSeed as any).default || [];

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    
    // Prioritize results that START with the query
    const startsWithMatches: MasterProduct[] = [];
    const containsMatches: MasterProduct[] = [];
    
    masterList.forEach(p => {
      const brand = p.brand?.toLowerCase() || '';
      const name = p.product_name?.toLowerCase() || '';
      const variant = p.variant?.toLowerCase() || '';
      const gtin = p.gtin || '';
      
      if (brand.startsWith(lowerQuery) || name.startsWith(lowerQuery)) {
        startsWithMatches.push(p);
      } else if (
        brand.includes(lowerQuery) || 
        name.includes(lowerQuery) || 
        variant.includes(lowerQuery) || 
        gtin.includes(query)
      ) {
        containsMatches.push(p);
      }
    });
    
    const combined = [...startsWithMatches, ...containsMatches];
    setResults(combined.slice(0, 10));
  }, [query]);

  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (product: MasterProduct) => {
    onSelect(product);
    setQuery('');
    setIsOpen(false);
  };

  const formatDisplay = (product: MasterProduct) => {
    const name = `${product.brand} ${product.product_name}`;
    const variant = product.variant ? ` (${product.variant})` : '';
    const size = product.size ? ` - ${product.size}` : '';
    return `${name}${variant}${size}`;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search common items (e.g. Coke, Lucky Me)"
          className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
        />
      </div>
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-auto py-2">
          {results.map((product, idx) => (
            <li
              key={idx}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors"
              onClick={() => handleSelect(product)}
            >
              <div className="font-medium text-gray-900">{formatDisplay(product)}</div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-xs text-gray-500 font-mono">{product.gtin}</div>
                <div className="text-xs font-bold text-blue-600">₱{product.suggested_retail_price ?? 0}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
