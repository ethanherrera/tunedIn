import axios from 'axios';
import { env } from 'process';

// Types for Spotify API responses
export interface Image {
  url: string;
  height?: number;
  width?: number;
}

export interface User {
  id: string;
  display_name?: string;
  href: string;
  uri: string;
}

export interface Artist {
  id: string;
  name: string;
  uri: string;
  href: string;
  popularity?: number;
  genres?: string[];
  images?: Image[];
}

export interface Album {
  id: string;
  name: string;
  uri: string;
  href: string;
  album_type: string;
  release_date: string;
  images: Image[];
  artists: Artist[];
  tracks?: {
    href: string;
    items: Array<{
      id: string;
      name: string;
      artists: Artist[];
      uri: string;
      href: string;
    }>;
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
  };
}

export interface Track {
  id: string;
  name: string;
  uri: string;
  href: string;
  popularity: number;
  preview_url?: string;
  explicit: boolean;
  artists: Artist[];
  album: Album;
}

export interface Playlist {
  id: string;
  name: string;
  uri: string;
  href: string;
  description?: string;
  owner: User;
  images: Image[];
}

export interface PagingObject<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

export interface SpotifySearchResponse {
  tracks?: PagingObject<Track>;
  artists?: PagingObject<Artist>;
  albums?: PagingObject<Album>;
  playlists?: PagingObject<Playlist>;
}

// Review types
export interface SaveReviewRequest {
  trackId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  description: string;
  rating: number | null;
  ranking: number | null;
  id?: string;  // Optional ID for updates
}

export interface TrackReview {
  id: string;
  userId: string;
  trackId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  description: string;
  rating: number;
  ranking: number;
  createdAt: number;
  updatedAt: number;
  genres: string[];
}

// Add User Profile interface
export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  images: Image[];
  country: string;
  product: string;
  uri: string;
  href: string;
}

// Add RecentActivity interface
interface RecentActivity {
  id: string;
  trackReview: TrackReview;
  timestamp: number;
}

export interface PlayHistoryItem {
  track: Track;
  played_at: string;
  context?: {
    type: string;
    href: string;
    external_urls: { spotify: string };
    uri: string;
  };
}

export interface RecentlyPlayedResponse {
  href: string;
  limit: number;
  next: string | null;
  cursors: {
    after: string;
    before: string;
  };
  total: number;
  items: PlayHistoryItem[];
}

// Use VITE_ prefixed env var or fallback to environment variable or default
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Spotify authentication endpoints
export const spotifyApi = {
  login: async () => {
    const response = await apiClient.get<{ url: string }>('/spotify/login');
    return response.data;
  },
  
  callback: async (code: string, state: string) => {
    const response = await apiClient.get<{
      accessToken: string;
      tokenType: string;
      scope: string;
      expiresIn: number;
      refreshToken: string;
    }>('/spotify/callback', {
      params: { code, state }
    });
    return response.data;
  },

  search: async (params: {
    q: string;
    type?: string;
    limit?: number;
    offset?: number;
    market?: string;
  }) => {
    const response = await apiClient.get<SpotifySearchResponse>('/spotify/search', {
      params: {
        q: params.q,
        type: params.type || 'track,album',
        limit: params.limit || 20,
        offset: params.offset || 0,
        market: params.market
      }
    });
    return response.data;
  },
  
  getTrack: async (trackId: string) => {
    const response = await apiClient.get<Track>(`/spotify/tracks/${trackId}`);
    return response.data;
  },
  
  getTracksBatch: async (trackIds: string[]) => {
    if (trackIds.length === 0) {
      return { tracks: [] };
    }
    
    if (trackIds.length > 50) {
      throw new Error('Maximum of 50 track IDs allowed per request');
    }
    
    const response = await apiClient.get<{ tracks: Track[] }>('/spotify/tracks', {
      params: {
        ids: trackIds.join(',')
      }
    });
    return response.data;
  },
  
  getMe: async () => {
    const response = await apiClient.get<UserProfile>('/spotify/me');
    return response.data;
  },
  
  getTopItems: async (type: 'artists' | 'tracks', params?: {
    timeRange?: 'short_term' | 'medium_term' | 'long_term';
    limit?: number;
    offset?: number;
  }) => {
    const response = await apiClient.get<PagingObject<Track | Artist>>(`/spotify/me/top/${type}`, {
      params: {
        timeRange: params?.timeRange || 'medium_term',
        limit: params?.limit || 20,
        offset: params?.offset || 0
      }
    });
    return response.data;
  },
  
  getAlbumsBatch: async (albumIds: string[], market?: string) => {
    if (albumIds.length === 0) {
      return { albums: [] };
    }
    
    if (albumIds.length > 20) {
      throw new Error('Maximum of 20 album IDs allowed per request');
    }
    
    const params: { ids: string; market?: string } = {
      ids: albumIds.join(',')
    };
    
    if (market) {
      params.market = market;
    }
    
    const response = await apiClient.get<{ albums: Album[] }>('/spotify/albums', { params });
    return response.data;
  },
  
  getAlbum: async (albumId: string, market?: string) => {
    const response = await apiClient.get<Album>(`/spotify/albums/${albumId}`, {
      params: market ? { market } : undefined
    });
    return response.data;
  },

  getArtist: async (artistId: string) => {
    const response = await apiClient.get<Artist>(`/spotify/artists/${artistId}`);
    return response.data;
  },
  
  getRecentlyPlayed: async (params?: {
    limit?: number;
    after?: number;
    before?: number;
  }) => {
    const response = await apiClient.get<RecentlyPlayedResponse>('/spotify/me/player/recently-played', {
      params: {
        limit: params?.limit || 20,
        after: params?.after,
        before: params?.before
      }
    });
    return response.data;
  }
};

export const reviewApi = {
  saveTrackReview: async (reviewData: SaveReviewRequest): Promise<TrackReview> => {
    const response = await apiClient.post<TrackReview>('/reviews', reviewData);
    return response.data;
  },
  
  getUserReviews: async (opinions?: ('DISLIKE' | 'NEUTRAL' | 'LIKED')[]): Promise<TrackReview[]> => {
    const params = opinions ? { opinions: opinions.join(',') } : undefined;
    const response = await apiClient.get<TrackReview[]>('/reviews/user', { params });
    return response.data;
  },
  
  getFriendTrackReviews: async (friendId: string): Promise<TrackReview[]> => {
    const response = await apiClient.get<TrackReview[]>(`/reviews/user/${friendId}`);
    return response.data;
  },
  
  deleteReview: async (reviewId: string): Promise<{ success: boolean, message: string }> => {
    const response = await apiClient.delete<{ success: boolean, message: string }>(`/reviews/${reviewId}`);
    return response.data;
  },
  
  deleteReviewByTrackId: async (trackId: string): Promise<{ success: boolean, message: string }> => {
    const response = await apiClient.delete<{ success: boolean, message: string }>(`/reviews/track/${trackId}`);
    return response.data;
  },
  
  // For backward compatibility
  createReview: async (reviewData: SaveReviewRequest): Promise<TrackReview> => {
    return reviewApi.saveTrackReview(reviewData);
  },
  
  // For backward compatibility
  updateReview: async (reviewId: string, reviewData: SaveReviewRequest): Promise<TrackReview> => {
    return reviewApi.saveTrackReview({ ...reviewData, id: reviewId });
  },
  
  /**
   * Get the current user's reviews for multiple tracks in a single request
   * @param trackIds Array of Spotify track IDs to get reviews for
   * @returns Map of track IDs to the list of reviews for that track
   */
  getTrackReviewsBatch: async (trackIds: string[]): Promise<Record<string, TrackReview[]>> => {
    if (trackIds.length === 0) {
      return {};
    }
    
    const response = await apiClient.post<Record<string, TrackReview[]>>('/reviews/batch/tracks', trackIds);
    return response.data;
  }
};

// Interface for album review request
export interface AlbumReviewRequest {
  spotifyAlbumId: string;
  description: string;
  ranking?: number;
  genres?: string[];
  trackIds: string[];
}

// Interface for album review response
export interface AlbumReview {
  id: string;
  userId: string;
  spotifyAlbumId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED' | 'UNDEFINED';
  description: string;
  rating: number;
  ranking: number;
  createdAt: number;
  genres: string[];
  trackIds: string[];
}

export const albumReviewApi = {
  saveAlbumReview: async (reviewData: AlbumReviewRequest): Promise<AlbumReview> => {
    const response = await apiClient.post<AlbumReview>('/album-reviews/save', reviewData);
    return response.data;
  },
  
  getAlbumReviews: async (spotifyAlbumId: string): Promise<AlbumReview[]> => {
    const response = await apiClient.get<AlbumReview[]>(`/album-reviews/album/${spotifyAlbumId}`);
    return response.data;
  },
  
  getUserAlbumReview: async (spotifyAlbumId: string): Promise<AlbumReview | null> => {
    try {
      const response = await apiClient.get<AlbumReview>(`/album-reviews/user/album/${spotifyAlbumId}`);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },
  
  getUserAlbumReviews: async (): Promise<AlbumReview[]> => {
    const response = await apiClient.get<AlbumReview[]>(`/album-reviews/user`);
    return response.data;
  },
  
  deleteAlbumReview: async (reviewId: string): Promise<void> => {
    await apiClient.delete(`/album-reviews/${reviewId}`);
  }
};

export const userApi = {
  getProfile: async () => {
    const response = await apiClient.get<UserProfile>('/users/profile');
    return response.data;
  },
  
  getUserProfileById: async (userId: string): Promise<UserProfile | null> => {
    try {
      const response = await apiClient.get<UserProfile>(`/users/profile/${userId}`);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },
  
  getMe: async () => {
    const response = await fetch('/api/users/me');
    if (!response.ok) {
      throw new Error('Failed to get current user profile');
    }
    return response.json();
  },
  
  getRecentActivities: async () => {
    const response = await apiClient.get<RecentActivity[]>('/users/recent-activities');
    return response.data;
  }
};

export const friendsApi = {
  checkUserExists: async (userId: string): Promise<{ exists: boolean }> => {
    const response = await apiClient.get<{ exists: boolean }>(`/friends/check-user/${userId}`);
    return response.data;
  },
  
  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    try {
      const response = await apiClient.get<UserProfile>(`/friends/user/${userId}`);
      return response.data;
    } catch (error: any) {
      // If user not found, return null
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },
  
  sendFriendRequest: async (receiverId: string): Promise<any> => {
    const response = await apiClient.post(`/friends/request/${receiverId}`);
    return response.data;
  },
  
  acceptFriendRequest: async (requestId: string): Promise<any> => {
    const response = await apiClient.put(`/friends/request/${requestId}/accept`);
    return response.data;
  },
  
  declineFriendRequest: async (requestId: string): Promise<any> => {
    const response = await apiClient.put(`/friends/request/${requestId}/decline`);
    return response.data;
  },
  
  getPendingRequests: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>(`/friends/requests/pending`);
    return response.data;
  },
  
  getSentRequests: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>(`/friends/requests/sent`);
    return response.data;
  },
  
  getFriendsList: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>(`/friends/list`);
    return response.data;
  },
  
  removeFriend: async (friendId: string): Promise<void> => {
    await apiClient.delete(`/friends/${friendId}`);
  },
  
  getFriendReviews: async (friendId: string): Promise<any[]> => {
    const response = await apiClient.get<any[]>(`/reviews/user/${friendId}`);
    return response.data;
  }
};