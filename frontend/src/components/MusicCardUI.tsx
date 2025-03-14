import React from "react";
import { Track, Album, Artist } from "@/types/spotify.ts";
import { TrackReview, AlbumReview } from "@/api/apiClient.ts";
import TrackCardUI from "@/components/TrackCardUI.tsx";
import AlbumCardUI from "@/components/AlbumCardUI.tsx";

interface MusicCardUIProps {
  item: Track | Album | Artist;
  itemType: 'track' | 'album' | 'artist';
  review?: TrackReview | AlbumReview;
  showRating?: boolean;
}

const MusicCardUI: React.FC<MusicCardUIProps> = ({ item, itemType }) => {
  return (
    <div>
      {itemType === 'track' && <TrackCardUI item={item as Track} />}
      {itemType === 'album' && <AlbumCardUI item={item as Album}/>}
    {/* //   {itemType === 'artist' && <ArtistMusicItem item={item as Artist} />}} */}
    </div>
  );
};

export default MusicCardUI;