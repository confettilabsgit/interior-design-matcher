import React, { useState, useEffect } from 'react';
import { FurnitureItem, MatchedItem, SearchFilters } from './types/furniture';
import apiService from './services/api';
import FilterPanel from './components/FilterPanel/FilterPanel';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FurnitureItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<FurnitureItem | null>(null);
  const [matchedItems, setMatchedItems] = useState<MatchedItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [roomStyle, setRoomStyle] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<FurnitureItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [roomSuggestions, setRoomSuggestions] = useState<any>(null);

  // Test API connection and load session info
  useEffect(() => {
    apiService.healthCheck()
      .then(result => console.log('API Health Check:', result))
      .catch(error => console.error('API Health Check failed:', error));
    
    // Load user preferences after a short delay to allow session creation
    setTimeout(() => {
      apiService.getUserPreferences()
        .then(prefs => {
          console.log('User preferences loaded:', prefs);
          setSessionInfo(prefs);
        })
        .catch(error => console.log('No existing session'));
    }, 1000);
  }, []);


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Clear everything first
    setSearchResults([]);
    setSelectedItem(null);
    setMatchedItems([]);
    setIsSearching(true);
    
    try {
      console.log('Calling API with query:', searchQuery);
      const results = await apiService.searchItems(searchQuery, filters);
      console.log('API results:', results);
      console.log('Setting search results to:', results);
      setSearchResults(results);
      setLastUpdate(Date.now());
      
      // Refresh session info after search
      setTimeout(() => {
        apiService.getUserPreferences()
          .then(prefs => setSessionInfo(prefs))
          .catch(error => console.log('Session refresh failed'));
      }, 500);
    } catch (error) {
      console.error('Search error:', error);
      console.log('API call failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleItemSelect = async (item: FurnitureItem) => {
    setSelectedItem(item);
    setIsMatching(true);
    
    // Add to selected items for room style analysis
    const newSelectedItems = [...selectedItems, item];
    setSelectedItems(newSelectedItems);
    
    try {
      const matches = await apiService.findMatches(item);
      setMatchedItems(matches);
      
      // Analyze room style with all selected items
      if (newSelectedItems.length > 0) {
        const styleAnalysis = await apiService.analyzeRoomStyle(newSelectedItems);
        setRoomStyle(styleAnalysis);
        
        // Get room completion suggestions
        if (newSelectedItems.length >= 2) {
          const suggestions = await apiService.getStyleSuggestions(filters.roomType || 'living');
          setRoomSuggestions(suggestions);
        }
      }
    } catch (error) {
      console.error('Matching error:', error);
      setMatchedItems([]);
    } finally {
      setIsMatching(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header className="header">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1>Interior Design Matcher</h1>
              <p>Find furniture and discover matching pieces for your space</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.875rem', color: '#64748b' }}>
              {sessionInfo && (
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '0.5rem', minWidth: '200px' }}>
                  <div style={{ marginBottom: '0.25rem' }}>Session: ✅ Active</div>
                  <div style={{ marginBottom: '0.25rem' }}>Searches: {sessionInfo.stats?.totalSearches || 0}</div>
                  <div style={{ marginBottom: '0.25rem' }}>Matches: {sessionInfo.stats?.totalMatches || 0}</div>
                  {sessionInfo.preferences?.topCategories?.length > 0 && (
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Favorites: {sessionInfo.preferences.topCategories.slice(0, 2).join(', ')}
                    </div>
                  )}
                </div>
              )}
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.75rem',
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="search-section">
        <div className="container">
          <form onSubmit={handleSearch} className="search-bar">
            <div style={{ position: 'relative' }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for furniture..."
                className="search-input"
                disabled={isSearching}
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                style={{
                  position: 'absolute',
                  right: '4rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '0.25rem 0.75rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '0.25rem 0.5rem',
                  background: showFilters ? '#10b981' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                🔧
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Advanced Panel */}
      {showAdvanced && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div className="container">
            <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem' }}>🧠 AI-Powered Features</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.5rem' }}>🎨 Color Theory</h4>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', margin: 0 }}>
                  Advanced HSL color space matching with complementary, triadic, and analogous harmonies
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.5rem' }}>🏠 Style Recognition</h4>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', margin: 0 }}>
                  AI detection of 8 interior design styles with compatibility scoring
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.5rem' }}>🧠 Learning System</h4>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', margin: 0 }}>
                  Personalized recommendations that improve based on your preferences
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.5rem' }}>🔄 Room Completion</h4>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', margin: 0 }}>
                  Smart recommendations for complementary furniture that completes your space
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Style Indicator */}
      {roomStyle && roomStyle.style !== 'unknown' && (
        <section style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                background: '#3b82f6',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                🎨 Detected Style: {roomStyle.style.charAt(0).toUpperCase() + roomStyle.style.slice(1)}
              </div>
              <div style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}>
                Confidence: {Math.round(roomStyle.confidence * 100)}%
              </div>
              {roomStyle.analysis?.colorPalette?.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Colors:</span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {roomStyle.analysis.colorPalette.slice(0, 5).map((color: string, index: number) => (
                      <div
                        key={index}
                        style={{
                          width: '1.5rem',
                          height: '1.5rem',
                          backgroundColor: color,
                          borderRadius: '50%',
                          border: '2px solid white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main style={{ padding: '0 0 3rem', position: 'relative' }}>
        {/* Filter Panel Sidebar */}
        {showFilters && (
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '400px',
            height: '100vh',
            background: 'white',
            boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
            zIndex: 1000,
            overflowY: 'auto',
            padding: '1.5rem'
          }}>
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              isVisible={showFilters}
              onToggle={() => setShowFilters(false)}
            />
          </div>
        )}

        <div className="container">
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                Search Results ({searchResults.length})
              </h2>
              
              {isSearching ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <p>Searching for items...</p>
                </div>
              ) : (
                <div className="grid grid-cols-3" key={`search-${lastUpdate}`}>
                  {searchResults.map((item) => (
                    <div 
                      key={item.id}
                      className="card"
                      onClick={() => handleItemSelect(item)}
                      style={{
                        border: selectedItem?.id === item.id ? '2px solid #3b82f6' : 'none'
                      }}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image';
                        }}
                      />
                      <div className="card-content">
                        <h3 className="card-title">{item.title}</h3>
                        <p className="card-price">{formatPrice(item.price)}</p>
                        {item.location && <p className="card-location">📍 {item.location}</p>}
                        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '1rem',
                            background: item.source === 'facebook' ? '#e3f2fd' : item.source === 'westelm' ? '#e8f5e8' : '#f3e5f5',
                            color: item.source === 'facebook' ? '#1976d2' : item.source === 'westelm' ? '#388e3c' : '#7b1fa2'
                          }}>
                            {item.source === 'facebook' ? 'FB' : item.source.toUpperCase()}
                          </span>
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.75rem',
                              color: '#3b82f6',
                              textDecoration: 'none',
                              border: '1px solid #3b82f6',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Listing
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Matching Results */}
          {selectedItem && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                Items that match "{selectedItem.title}"
              </h2>
              
              {isMatching ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <p>Finding matching items...</p>
                </div>
              ) : matchedItems.length > 0 ? (
                <div className="grid grid-cols-3" key={`search-${lastUpdate}`}>
                  {matchedItems.map((item) => (
                    <div 
                      key={item.id}
                      className="card"
                      onClick={() => window.open(item.url, '_blank')}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image';
                        }}
                      />
                      <div className="card-content">
                        <h3 className="card-title">{item.title}</h3>
                        <p className="card-price">{formatPrice(item.price)}</p>
                        <div style={{
                          marginTop: '0.75rem',
                          padding: '0.5rem',
                          background: '#f0f9ff',
                          borderRadius: '0.375rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0369a1', margin: 0 }}>
                              Match Score: {Math.round((item.colorMatchScore || item.matchScore?.overall || 0) * 100)}%
                            </p>
                            <div style={{
                              width: '40px',
                              height: '4px',
                              background: '#e5e7eb',
                              borderRadius: '2px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${Math.round((item.colorMatchScore || item.matchScore?.overall || 0) * 100)}%`,
                                height: '100%',
                                background: `hsl(${Math.round((item.colorMatchScore || item.matchScore?.overall || 0) * 120)}, 70%, 50%)`,
                                borderRadius: '2px'
                              }} />
                            </div>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#0284c7', margin: '0.25rem 0 0' }}>
                            {item.matchReason || `Style: ${Math.round((item.matchScore?.styleScore || 0) * 100)}% | Color: ${Math.round((item.matchScore?.colorScore || 0) * 100)}%`}
                          </p>
                          {item.harmonies?.type && (
                            <p style={{ fontSize: '0.7rem', color: '#059669', margin: '0.25rem 0 0', fontStyle: 'italic' }}>
                              ✨ {item.harmonies.type} harmony detected
                            </p>
                          )}
                          {roomStyle && roomStyle.style !== 'unknown' && (
                            <p style={{ fontSize: '0.7rem', color: '#7c3aed', margin: '0.25rem 0 0', fontStyle: 'italic' }}>
                              🏠 Compatible with {roomStyle.style} style
                            </p>
                          )}
                        </div>
                        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '1rem',
                            background: item.source === 'facebook' ? '#e3f2fd' : item.source === 'westelm' ? '#e8f5e8' : '#f3e5f5',
                            color: item.source === 'facebook' ? '#1976d2' : item.source === 'westelm' ? '#388e3c' : '#7b1fa2'
                          }}>
                            {item.source === 'facebook' ? 'FB' : item.source.toUpperCase()}
                          </span>
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.75rem',
                              color: '#3b82f6',
                              textDecoration: 'none',
                              border: '1px solid #3b82f6',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Listing
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No matching items found</p>
                </div>
              )}
            </div>
          )}

          {/* Room Completion Suggestions */}
          {roomSuggestions && selectedItems.length >= 2 && (
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                🏠 Complete Your Room
              </h2>
              <div style={{
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #0ea5e9',
                marginBottom: '1rem'
              }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#0369a1', marginBottom: '0.75rem' }}>
                  Recommended Additions
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#0284c7', marginBottom: '1rem' }}>
                  Based on your {roomStyle?.style || 'selected'} style, here are some pieces that would complete your space:
                </p>
                
                {roomSuggestions.slice(0, 3).map((suggestion: any, index: number) => (
                  <div key={index} style={{
                    background: 'white',
                    padding: '1rem',
                    borderRadius: '0.375rem',
                    marginBottom: '0.75rem',
                    border: '1px solid #e0f2fe'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '500', color: '#0369a1', margin: '0 0 0.25rem 0' }}>
                          {suggestion.style?.charAt(0).toUpperCase() + suggestion.style?.slice(1) || 'Recommended'} Style Pieces
                        </h4>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                          {suggestion.definition?.description || 'Perfect complement to your existing selection'}
                        </p>
                      </div>
                      <div style={{
                        padding: '0.5rem 1rem',
                        background: '#0ea5e9',
                        color: 'white',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        Score: {Math.round((suggestion.score || 0.5) * 100)}%
                      </div>
                    </div>
                    
                    {suggestion.definition?.colors && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Suggested colors:</span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {suggestion.definition.colors.slice(0, 4).map((color: string, colorIndex: number) => (
                            <div
                              key={colorIndex}
                              style={{
                                width: '1.25rem',
                                height: '1.25rem',
                                backgroundColor: color,
                                borderRadius: '50%',
                                border: '2px solid white',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                              }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({ ...filters, styles: [roomStyle?.style] });
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#0ea5e9',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Search for {roomStyle?.style} pieces
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {searchResults.length === 0 && !isSearching && (
            <div className="empty-state">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Start your search
              </h3>
              <p>Search for furniture items to find matching pieces for your space</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;