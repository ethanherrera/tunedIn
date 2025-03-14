import React from "react";
import {Track, Album, Artist, TrackReview, AlbumReview} from "@/api/apiClient";
import TrackScrollArea from "@/components/TrackScrollArea.tsx";
// import AlbumMusicScrollArea from "@/components/AlbumMusicScrollArea";
import ArtistScrollArea from "@/components/ArtistScrollArea.tsx";

interface MusicScrollAreaProps {
  items: Track[] | Album[] | Artist[];
  itemType: 'track' | 'album' | 'artist';
  reviews?: TrackReview[] | AlbumReview[];
  showRating?: boolean;
}

export const MusicScrollArea: React.FC<MusicScrollAreaProps> = ({ items=[], itemType='track', reviews = []}) => {
  return (
    <div>
      {itemType === 'track' && <TrackScrollArea items={items as Track[]} reviews={reviews as TrackReview[]}/>}
      {/* {itemType === 'album' && <AlbumMusicScrollArea items={items} reviews={reviews}/>} */}
      { itemType === 'artist' && <ArtistScrollArea items={items as Artist[]}/>}
    </div>
  );
};

export default MusicScrollArea; 