import React from "react";
import { Track, Album, Artist } from "../../../types/spotify";
import TrackCard from "./TrackCard.tsx";
import AlbumCard from "./AlbumCard.tsx";
import ArtistCard from "./ArtistCard.tsx";
import { TrackReview, AlbumReview } from "../../../api/apiClient";

interface MusicCardProps {
  item: Track | Album | Artist;
  items: (Track | Album | Artist)[];
  itemType: 'track' | 'album' | 'artist';
  review?: TrackReview | AlbumReview;
  reviews?: (TrackReview | AlbumReview)[];
  showRating?: boolean;
}

const MusicCard: React.FC<MusicCardProps> = ({ item, items=[], itemType, review, reviews=[] }) => {
  return (
    <div>
      {itemType === 'track' && <TrackCard item={item as Track} reviews={reviews as TrackReview[]} review={review as TrackReview} />}
      {itemType === 'album' && <AlbumCard item={item as Album} reviews={reviews as AlbumReview[]} review={review as AlbumReview} />}
      {itemType === 'artist' && <ArtistCard item={item as Artist} />}
    </div>
  );
};

export default MusicCard;