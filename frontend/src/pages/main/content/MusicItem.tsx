import React from "react";
import { UITrack, UIAlbum, UIArtist, Track, Album, Artist } from "../../../types/spotify";
import TrackMusicItem from "./TrackMusicItem";
import AlbumMusicItem from "./AlbumMusicItem";
import ArtistMusicItem from "./ArtistMusicItem";
import { TrackReview, AlbumReview } from "../../../api/apiClient";
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
  item: Track | Album | Artist;
  items: (Track | Album | Artist)[];
  itemType: 'track' | 'album' | 'artist';
  review?: TrackReview | AlbumReview;
  reviews?: (TrackReview | AlbumReview)[];
  showRating?: boolean;
}

const MusicItem: React.FC<MusicItemProps> = ({ item, items=[], itemType, review, reviews=[] }) => {
  return (
    <div>
      {itemType === 'track' && <TrackMusicItem item={item as Track} reviews={reviews as TrackReview[]} review={review as TrackReview} />}
      {itemType === 'album' && <AlbumMusicItem item={item as Album} reviews={reviews as AlbumReview[]} review={review as AlbumReview} />}
      {itemType === 'artist' && <ArtistMusicItem item={item as Artist} />}
    </div>
  );
};

export default MusicItem; 