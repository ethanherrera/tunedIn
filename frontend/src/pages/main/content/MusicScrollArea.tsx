import React from "react";
import {Track, Album, Artist, TrackReview, AlbumReview} from "../../../api/apiClient";
import TrackMusicScrollArea from "./TrackMusicScrollArea";
// import AlbumMusicScrollArea from "./AlbumMusicScrollArea";
import ArtistMusicScrollArea from "./ArtistMusicScrollArea";

interface MusicScrollAreaProps {
  items: Track[] | Album[] | Artist[];
  itemType: 'track' | 'album' | 'artist';
  reviews?: TrackReview[] | AlbumReview[];
  showRating?: boolean;
}

export const MusicScrollArea: React.FC<MusicScrollAreaProps> = ({ items=[], itemType='track', reviews = []}) => {
  return (
    <div>
      {itemType === 'track' && <TrackMusicScrollArea items={items as Track[]} reviews={reviews as TrackReview[]}/>}
      {/* {itemType === 'album' && <AlbumMusicScrollArea items={items} reviews={reviews}/>} */}
      { itemType === 'artist' && <ArtistMusicScrollArea items={items as Artist[]}/>}
    </div>
  );
};

export default MusicScrollArea; 