import React from "react";
import { Track, Album, Artist } from "../../../types/spotify";
import { TrackReview, AlbumReview } from "../../../api/apiClient";
import TrackMusicItemUI from "./TrackMusicItemUI";
import AlbumCardUI from "./AlbumCardUI.tsx";

interface MusicCardUIProps {
  item: Track | Album | Artist;
  itemType: 'track' | 'album' | 'artist';
  review?: TrackReview | AlbumReview;
  showRating?: boolean;
}

const MusicCardUI: React.FC<MusicCardUIProps> = ({ item, itemType }) => {
  return (
    <div>
      {itemType === 'track' && <TrackMusicItemUI item={item as Track} />}
      {itemType === 'album' && <AlbumCardUI item={item as Album}/>}
    {/* //   {itemType === 'artist' && <ArtistMusicItem item={item as Artist} />}} */}
    </div>
  );
};

export default MusicCardUI;