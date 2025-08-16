import { FurnitureItem, MatchedItem, SearchFilters } from '../types/furniture';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');

class ApiService {
  private sessionId: string | null = null;

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Add session ID if available
    if (this.sessionId) {
      headers['X-Session-ID'] = this.sessionId;
    }
    
    const response = await fetch(url, {
      headers,
      ...options,
    });

    // Capture session ID from response
    const responseSessionId = response.headers.get('X-Session-ID');
    if (responseSessionId) {
      this.sessionId = responseSessionId;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async searchItems(query: string, filters?: SearchFilters): Promise<FurnitureItem[]> {
    const response = await this.request<{
      success: boolean;
      results: FurnitureItem[];
    }>('/search', {
      method: 'POST',
      body: JSON.stringify({ query, filters }),
    });

    return response.results;
  }

  async findMatches(selectedItem: FurnitureItem, filters?: SearchFilters): Promise<MatchedItem[]> {
    const response = await this.request<{
      success: boolean;
      matches: MatchedItem[];
    }>('/matching/find-matches', {
      method: 'POST',
      body: JSON.stringify({ selectedItem, filters }),
    });

    return response.matches;
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>('/health');
  }

  async getSources(): Promise<{ sources: Array<{ id: string; name: string; enabled: boolean }> }> {
    return this.request<{ sources: Array<{ id: string; name: string; enabled: boolean }> }>('/search/sources');
  }

  async getUserPreferences(): Promise<any> {
    return this.request<any>('/sessions/preferences');
  }

  async getPersonalizedRecommendations(category?: string): Promise<{ recommendations: FurnitureItem[]; count: number }> {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.request<{ recommendations: FurnitureItem[]; count: number }>(`/sessions/recommendations${params}`);
  }

  async getSearchHistory(): Promise<{ searchHistory: any[]; stats: any }> {
    return this.request<{ searchHistory: any[]; stats: any }>('/sessions/history');
  }

  async analyzeRoomStyle(items: FurnitureItem[], roomType?: string): Promise<any> {
    return this.request<any>('/room-style/analyze', {
      method: 'POST',
      body: JSON.stringify({ items, roomType }),
    });
  }

  async getStyleSuggestions(roomType: string): Promise<any> {
    return this.request<any>(`/room-style/suggestions/${roomType}`);
  }

  async analyzeCompatibility(item1: FurnitureItem, item2: FurnitureItem): Promise<any> {
    return this.request<any>('/room-style/compatibility', {
      method: 'POST',
      body: JSON.stringify({ item1, item2 }),
    });
  }

  async getColorPalette(style: string, roomType?: string): Promise<any> {
    const params = roomType ? `?roomType=${encodeURIComponent(roomType)}` : '';
    return this.request<any>(`/room-style/palettes/${style}${params}`);
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}

const apiService = new ApiService();
export default apiService;