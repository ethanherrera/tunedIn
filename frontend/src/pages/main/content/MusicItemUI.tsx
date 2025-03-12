import React from "react";
import { UITrack, UIAlbum, UIArtist, Track, Album, Artist } from "../../../types/spotify";
import TrackMusicItem from "./TrackMusicItem";
import AlbumMusicItem from "./AlbumMusicItem";
import ArtistMusicItem from "./ArtistMusicItem";
import { TrackReview, AlbumReview } from "../../../api/apiClient";
import TrackMusicItemUI from "./TrackMusicItemUI";
import AlbumMusicItemUI from "./AlbumMusicItemUI";
interface MusicItemUIProps {
  item: Track | Album | Artist;
  itemType: 'track' | 'album' | 'artist';
  review?: TrackReview | AlbumReview;
  showRating?: boolean;
}

const MusicItemUI: React.FC<MusicItemUIProps> = ({ item, itemType }) => {
  return (
    <div>
      {itemType === 'track' && <TrackMusicItemUI item={item as Track} />}
      {itemType === 'album' && <AlbumMusicItemUI item={item as Album}/>}
    {/* //   {itemType === 'artist' && <ArtistMusicItem item={item as Artist} />}} */}
    </div>
  );
};

export default MusicItemUI; 