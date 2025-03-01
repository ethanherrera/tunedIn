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
  userId: string;
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
  createdAt: number;
}

const BASE_URL = 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
    accessToken: string;
  }) => {
    const response = await apiClient.get<SpotifySearchResponse>('/spotify/search', {
      params: {
        q: params.q,
        type: params.type || 'track,album,artist,playlist',
        limit: params.limit || 20,
        offset: params.offset || 0,
        market: params.market,
        accessToken: params.accessToken
      }
    });
    return response.data;
  }
};

export const reviewApi = {
  createReview: async (reviewData: CreateReviewRequest): Promise<TrackReview> => {
    const response = await apiClient.post<TrackReview>('/reviews', reviewData);
    return response.data;
  }
};