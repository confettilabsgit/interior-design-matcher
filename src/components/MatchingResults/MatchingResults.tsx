import React from 'react';
import { MatchedItem } from '../../types/furniture';
import ItemCard from '../ItemCard';

interface MatchingResultsProps {
  selectedItem: string;
  matchedItems: MatchedItem[];
  isLoading?: boolean;
}

const MatchingResults: React.FC<MatchingResultsProps> = ({ 
  selectedItem, 
  matchedItems, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finding matching items...</p>
        </div>
      </div>
    );
  }

  if (matchedItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg">No matching items found</p>
          <p className="text-sm mt-2">Try selecting a different item or adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Items that match "{selectedItem}"
        </h2>
        <p className="text-gray-600">
          Found {matchedItems.length} matching items sorted by compatibility
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matchedItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            showMatchScore={true}
            onSelect={(item) => window.open(item.url, '_blank')}
          />
        ))}
      </div>
    </div>
  );
};

export default MatchingResults;