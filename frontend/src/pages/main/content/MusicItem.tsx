import React from "react";
import { UITrack, UIAlbum, UIArtist } from "../../../types/spotify";
import TrackMusicItem from "./TrackMusicItem";
import AlbumMusicItem from "./AlbumMusicItem";
import ArtistMusicItem from "./ArtistMusicItem";

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

interface MusicItemProps {
  item: UITrack | UIAlbum | UIArtist;
  itemType: 'track' | 'album' | 'artist';
  review?: Review;
  showRating?: boolean;
}

const MusicItem: React.FC<MusicItemProps> = ({ item, itemType, review, showRating = false }) => {
  return (
    <div>
      {itemType === 'track' && <TrackMusicItem item={item as UITrack} review={review} showRating={showRating} />}
      {itemType === 'album' && <AlbumMusicItem item={item as UIAlbum} review={review} showRating={showRating} />}
      {itemType === 'artist' && <ArtistMusicItem item={item as UIArtist} review={review} showRating={showRating} />}
    </div>
  );
};

export default MusicItem; 