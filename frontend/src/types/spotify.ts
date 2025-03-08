// Export standardized Spotify types from apiClient
import { 
  Image, 
  User, 
  Artist, 
  Album, 
  Track, 
  Playlist, 
  PagingObject, 
  SpotifySearchResponse,
  TrackReview,
  AlbumReview,
  AlbumReviewRequest,
  SaveReviewRequest,
  UserProfile
} from '../api/apiClient';

// Re-export the types
export type { 
  Image, 
  User, 
  Artist, 
  Album, 
  Track, 
  Playlist, 
  PagingObject, 
  SpotifySearchResponse,
  TrackReview,
  AlbumReview,
  AlbumReviewRequest,
  SaveReviewRequest,
  UserProfile
};

// UI-friendly simplified types that match the current component expectations
export interface UITrack {
  spotifyId: string;
  trackName: string;
  artistName: string;
  albumName: string;
  albumImageUrl: string;
  albumId: string;
}

export interface UIAlbum {
  spotifyId: string;
  albumName: string;
  artistName: string;
  albumImageUrl: string;
}

export interface UIArtist {
  spotifyId: string;
  artistName: string;
  artistImageUrl: string;
}

// Helper functions to transform Spotify objects into simplified formats for UI components
export const transformTrackForUI = (track: Track): UITrack => ({
  spotifyId: track.id,
  trackName: track.name,
  artistName: track.artists.map(artist => artist.name).join(', '),
  albumName: track.album.name,
  albumImageUrl: track.album.images[0]?.url || '',
  albumId: track.album.id
});

export const transformAlbumForUI = (album: Album): UIAlbum => ({
  spotifyId: album.id,
  albumName: album.name,
  artistName: album.artists.map(artist => artist.name).join(', '),
  albumImageUrl: album.images[0]?.url || ''
});

export const transformArtistForUI = (artist: Artist): UIArtist => ({
  spotifyId: artist.id,
  artistName: artist.name,
  artistImageUrl: artist.images?.[0]?.url || ''
}); 