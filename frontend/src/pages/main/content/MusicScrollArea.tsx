import React from "react";
import { UITrack, UIAlbum, UIArtist } from "../../../types/spotify";
import TrackMusicScrollArea from "./TrackMusicScrollArea";
import AlbumMusicScrollArea from "./AlbumMusicScrollArea";
import ArtistMusicScrollArea from "./ArtistMusicScrollArea";

// Define the review interface
interface Review {
  id: string;
  userId: string;
  spotifyTrackId: string;
  opinion: 'DISLIKE' | 'NEUTRAL' | 'LIKED';
  description: string;
  rating: number;
  ranking: number;
  createdAt: number;
  genres: string[];
}

interface MusicScrollAreaProps {
  items: UITrack[] | UIAlbum[] | UIArtist[];
  itemType: 'track' | 'album' | 'artist';
  reviews?: Review[];
  showRating?: boolean;
}

export const MusicScrollArea: React.FC<MusicScrollAreaProps> = ({ items, itemType, reviews = [], showRating = false }) => {
  return (
    <div>
      {itemType === 'track' && <TrackMusicScrollArea items={items as UITrack[]} reviews={reviews} showRating={showRating} />}
      {itemType === 'album' && <AlbumMusicScrollArea items={items as UIAlbum[]} reviews={reviews} showRating={showRating} />}
      {itemType === 'artist' && <ArtistMusicScrollArea items={items as UIArtist[]} reviews={reviews} showRating={showRating} />}
    </div>
  );
};

export default MusicScrollArea; 