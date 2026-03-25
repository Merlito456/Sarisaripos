// src/components/Common/PremiumFeature.tsx

import React from 'react';
import { Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumFeatureProps {
  feature: string;
  children: React.ReactNode;
  isPremium: boolean;
}

export const PremiumFeature: React.FC<PremiumFeatureProps> = ({
  feature,
  children,
  isPremium
}) => {
  const navigate = useNavigate();
  
  if (isPremium) {
    return <>{children}</>;
  }
  
  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg z-10">
        <button
          onClick={() => navigate('/premium')}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 shadow-lg active:opacity-90 transition-all"
        >
          <Crown size={16} />
          <span>Unlock {feature}</span>
        </button>
      </div>
    </div>
  );
};
