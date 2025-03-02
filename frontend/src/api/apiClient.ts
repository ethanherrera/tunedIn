import axios from 'axios';

// Types for Spotify API responses
interface Image {
  url: string;
  height?: number;
  width?: number;
}

interface User {
  id: string;
  display_name?: string;
  href: string;
  uri: string;
}

interface Artist {
  id: string;
  name: string;
  uri: string;
  href: string;
  popularity?: number;
  genres?: string[];
  images?: Image[];
}

interface Album {
  id: string;
  name: string;
  uri: string;
  href: string;
  album_type: string;
  release_date: string;
  images: Image[];
  artists: Artist[];
}

interface Track {
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

interface Playlist {
  id: string;
  name: string;
  uri: string;
  href: string;
  description?: string;
  owner: User;
  images: Image[];
}

interface PagingObject<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

interface SpotifySearchResponse {
  tracks?: PagingObject<Track>;
  artists?: PagingObject<Artist>;
  albums?: PagingObject<Album>;
  playlists?: PagingObject<Playlist>;
}

// Review types
interface CreateReviewRequest {
  spotifyTrackId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  description: string;
}

interface TrackReview {
  id: string;
  userId: string;
  spotifyTrackId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  description: string;
  rating: number;
  ranking: number;
  createdAt: number;
}

// Add User Profile interface
interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  images: Image[];
  country: string;
  product: string;
  uri: string;
  href: string;
}

const BASE_URL = 'http://localhost:8000/api';

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
        type: params.type || 'track,album,artist,playlist',
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
        time_range: params?.timeRange || 'medium_term',
        limit: params?.limit || 20,
        offset: params?.offset || 0
      }
    });
    return response.data;
  }
};

export const reviewApi = {
  createReview: async (reviewData: CreateReviewRequest): Promise<TrackReview> => {
    const response = await apiClient.post<TrackReview>('/reviews', reviewData);
    return response.data;
  },
  
  getUserReviews: async (opinions?: ('DISLIKE' | 'NEUTRAL' | 'LIKED')[]): Promise<TrackReview[]> => {
    const params = opinions ? { opinions: opinions.join(',') } : undefined;
    const response = await apiClient.get<TrackReview[]>('/reviews/user', { params });
    return response.data;
  },
  
  getTrackReviews: async (spotifyTrackId: string): Promise<TrackReview[]> => {
    const response = await apiClient.get<TrackReview[]>(`/reviews/track/${spotifyTrackId}`);
    return response.data;
  },
  
  deleteReview: async (reviewId: string): Promise<{ success: boolean, message: string }> => {
    const response = await apiClient.delete<{ success: boolean, message: string }>(`/reviews/${reviewId}`);
    return response.data;
  },
  
  deleteReviewByTrackId: async (spotifyTrackId: string): Promise<{ success: boolean, message: string }> => {
    const response = await apiClient.delete<{ success: boolean, message: string }>(`/reviews/track/${spotifyTrackId}`);
    return response.data;
  },

  updateReview: async (reviewId: string, reviewData: CreateReviewRequest): Promise<TrackReview> => {
    const response = await apiClient.put<TrackReview>(`/reviews/${reviewId}`, reviewData);
    return response.data;
  }
};