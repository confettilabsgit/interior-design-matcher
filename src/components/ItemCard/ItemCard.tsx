import React from 'react';
import { FurnitureItem, MatchedItem } from '../../types/furniture';

interface ItemCardProps {
  item: FurnitureItem | MatchedItem;
  onSelect?: (item: FurnitureItem) => void;
  showMatchScore?: boolean;
  isSelected?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ 
  item, 
  onSelect, 
  showMatchScore = false,
  isSelected = false 
}) => {
  const isMatchedItem = (item: FurnitureItem | MatchedItem): item is MatchedItem => {
    return 'matchScore' in item;
  };

  const getSourceBadgeColor = (source: FurnitureItem['source']) => {
    switch (source) {
      case 'facebook': return 'bg-blue-100 text-blue-800';
      case 'westelm': return 'bg-green-100 text-green-800';
      case 'cb2': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 ${
        isSelected ? 'border-blue-500' : 'border-transparent'
      }`}
      onClick={() => onSelect?.(item)}
    >
      <div className="aspect-w-4 aspect-h-3 bg-gray-200 rounded-t-lg overflow-hidden">
        <img
          src={`${item.imageUrl}${item.imageUrl.includes('?') ? '&' : '?'}cb=${Date.now()}`}
          alt={item.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            console.warn('Image failed to load:', item.imageUrl);
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=200&fit=crop&auto=format&q=80';
          }}
        />
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {item.title}
          </h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceBadgeColor(item.source)}`}>
            {item.source === 'facebook' ? 'FB' : item.source.toUpperCase()}
          </span>
        </div>
        
        <p className="text-xl font-bold text-gray-900 mb-2">
          {formatPrice(item.price)}
        </p>
        
        {item.location && (
          <p className="text-sm text-gray-600 mb-2">
            📍 {item.location}
          </p>
        )}
        
        {item.category && (
          <p className="text-sm text-gray-500 mb-2">
            Category: {item.category}
          </p>
        )}
        
        {showMatchScore && isMatchedItem(item) && (
          <div className="mt-3 p-2 bg-green-50 rounded">
            <p className="text-sm font-medium text-green-800">
              Match Score: {Math.round((item.colorMatchScore || item.matchScore?.overall || 0) * 100)}%
            </p>
            <div className="text-xs text-green-600 mt-1">
              {item.matchReason || `Style: ${Math.round((item.matchScore?.styleScore || 0) * 100)}% | Color: ${Math.round((item.matchScore?.colorScore || 0) * 100)}%`}
            </div>
            {item.harmonies?.type && (
              <div className="text-xs text-purple-600 mt-1 italic">
                ✨ {item.harmonies.type} harmony
              </div>
            )}
          </div>
        )}
        
        {item.colors.length > 0 && (
          <div className="mt-2 flex space-x-1">
            {item.colors.slice(0, 4).map((color, index) => (
              <div
                key={index}
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemCard;