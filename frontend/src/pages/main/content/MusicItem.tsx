import React from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { UITrack, UIAlbum, UIArtist } from "../../../types/spotify";

interface MusicItemProps {
  item: UITrack | UIAlbum | UIArtist;
  itemType: 'track' | 'album' | 'artist';
}

const MusicItem: React.FC<MusicItemProps> = ({ item, itemType }) => {
  const renderTrackCard = (track: UITrack) => (
    <Card className="group w-[15vh] h-[22vh] flex-shrink-0 transform transition-transform duration-400 hover:scale-105 border-none shadow-none py-0">
      <CardContent className="p-2">
        <div className="overflow-hidden rounded-md group-hover:shadow-sm group-hover:shadow-primary">
          <img
            src={track.albumImageUrl}
            alt={`${track.trackName} album cover`}
            className="aspect-square h-auto w-full object-cover"
          />
        </div>
        <div className="pt-2">
          <h3 className="font-medium truncate text-sm">{track.trackName}</h3>
          <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
          <p className="text-xs text-muted-foreground truncate">{track.albumName}</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderAlbumCard = (album: UIAlbum) => (
    <Card className="group w-[15vh] h-[22vh] flex-shrink-0 transform transition-transform duration-400 hover:scale-105 border-none shadow-none py-0">
      <CardContent className="p-2">
        <div className="overflow-hidden rounded-md group-hover:shadow-sm group-hover:shadow-primary">
          <img
            src={album.albumImageUrl}
            alt={`${album.albumName} cover`}
            className="aspect-square h-auto w-full object-cover"
          />
        </div>
        <div className="pt-2">
          <h3 className="font-medium truncate text-sm">{album.albumName}</h3>
          <p className="text-xs text-muted-foreground truncate">{album.artistName}</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderArtistCard = (artist: UIArtist) => (
    <Card className="group w-[15vh] h-[22vh] flex-shrink-0 transform transition-transform duration-400 hover:scale-105 border-none shadow-none py-0">
      <CardContent className="p-2">
        <div className="overflow-hidden rounded-md group-hover:shadow-sm group-hover:shadow-primary">
          <img
            src={artist.artistImageUrl}
            alt={`${artist.artistName} profile`}
            className="aspect-square h-auto w-full object-cover"
          />
        </div>
        <div className="pt-2">
          <h3 className="font-medium truncate text-sm">{artist.artistName}</h3>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      {itemType === 'track' && renderTrackCard(item as UITrack)}
      {itemType === 'album' && renderAlbumCard(item as UIAlbum)}
      {itemType === 'artist' && renderArtistCard(item as UIArtist)}
    </div>
  );
};

export default MusicItem; 