import React from 'react';
import { SearchFilters, FurnitureItem } from '../../types/furniture';

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  isVisible?: boolean;
  onToggle?: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFiltersChange, isVisible = true, onToggle }) => {
  const categories = ['sofa', 'chair', 'table', 'bed', 'dresser', 'bookshelf', 'lamp', 'rug'];
  const styles = ['modern', 'rustic', 'minimalist', 'industrial', 'traditional', 'scandinavian', 'bohemian', 'mediterranean'];
  const sources: FurnitureItem['source'][] = ['facebook', 'westelm', 'cb2'];
  const roomTypes = ['living', 'bedroom', 'kitchen', 'dining', 'office', 'bathroom'];
  
  const popularColors = [
    '#FFFFFF', '#000000', '#808080', '#8B4513', '#2F4F4F',
    '#4682B4', '#32CD32', '#FF69B4', '#FFD700', '#FF6347'
  ];

  const handleSourceToggle = (source: FurnitureItem['source']) => {
    const currentSources = filters.source || [];
    const newSources = currentSources.includes(source)
      ? currentSources.filter(s => s !== source)
      : [...currentSources, source];
    
    onFiltersChange({ ...filters, source: newSources });
  };

  const handleColorToggle = (color: string) => {
    const currentColors = filters.colors || [];
    const newColors = currentColors.includes(color)
      ? currentColors.filter(c => c !== color)
      : [...currentColors, color];
    onFiltersChange({ ...filters, colors: newColors });
  };

  const handleStyleToggle = (style: string) => {
    const currentStyles = filters.styles || [];
    const newStyles = currentStyles.includes(style)
      ? currentStyles.filter(s => s !== style)
      : [...currentStyles, style];
    onFiltersChange({ ...filters, styles: newStyles });
  };

  if (!isVisible) return null;

  return (
    <div style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
          🔧 Advanced Filters
        </h3>
        {onToggle && (
          <button
            onClick={onToggle}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        )}
      </div>
      
      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          value={filters.category || ''}
          onChange={(e) => onFiltersChange({ ...filters, category: e.target.value || undefined })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              minPrice: e.target.value ? Number(e.target.value) : undefined 
            })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              maxPrice: e.target.value ? Number(e.target.value) : undefined 
            })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Style Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Style
        </label>
        <select
          value={filters.style || ''}
          onChange={(e) => onFiltersChange({ ...filters, style: e.target.value || undefined })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Styles</option>
          {styles.map(style => (
            <option key={style} value={style}>
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Source Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sources
        </label>
        <div className="space-y-2">
          {sources.map(source => (
            <label key={source} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.source?.includes(source) || false}
                onChange={() => handleSourceToggle(source)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                {source === 'facebook' ? 'Facebook Marketplace' : 
                 source === 'westelm' ? 'West Elm' : 'CB2'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Room Type Filter */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
          🏠 Room Type
        </label>
        <select
          value={filters.roomType || ''}
          onChange={(e) => onFiltersChange({ ...filters, roomType: e.target.value || undefined })}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            background: 'white'
          }}
        >
          <option value="">Any Room</option>
          {roomTypes.map(room => (
            <option key={room} value={room}>
              {room.charAt(0).toUpperCase() + room.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Style Filter - Multiple Selection */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
          🎨 Styles
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
          {styles.map(style => (
            <button
              key={style}
              onClick={() => handleStyleToggle(style)}
              style={{
                padding: '0.5rem',
                border: `1px solid ${(filters.styles || []).includes(style) ? '#3b82f6' : '#d1d5db'}`,
                background: (filters.styles || []).includes(style) ? '#eff6ff' : 'white',
                color: (filters.styles || []).includes(style) ? '#3b82f6' : '#6b7280',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textAlign: 'center' as const
              }}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Color Palette */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
          🌈 Color Preferences
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
          {popularColors.map(color => (
            <button
              key={color}
              onClick={() => handleColorToggle(color)}
              style={{
                width: '2.5rem',
                height: '2.5rem',
                backgroundColor: color,
                border: `3px solid ${(filters.colors || []).includes(color) ? '#3b82f6' : '#e5e7eb'}`,
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => onFiltersChange({})}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          fontSize: '0.875rem',
          color: '#6b7280',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => {
          (e.target as HTMLButtonElement).style.background = '#f3f4f6';
        }}
        onMouseOut={(e) => {
          (e.target as HTMLButtonElement).style.background = '#f9fafb';
        }}
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterPanel;