import React from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { UITrack, UIAlbum, UIArtist } from "../../../types/spotify";
import { Star, ThumbsUp, ThumbsDown, Minus } from "lucide-react";

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

const MusicItem: React.FC<MusicItemProps> = ({ item, itemType, review, showRating=false }) => {
  // Function to render the opinion icon
  const renderOpinionIcon = () => {
    if (!review) return null;
    
    switch (review.opinion) {
      case 'LIKED':
        return <ThumbsUp className="h-3 w-3 text-green-500 mr-1" />;
      case 'DISLIKE':
        return <ThumbsDown className="h-3 w-3 text-red-500 mr-1" />;
      case 'NEUTRAL':
        return <Minus className="h-3 w-3 text-yellow-500 mr-1" />;
      default:
        return null;
    }
  };

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
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate text-xs sm:text-sm">{track.trackName}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{track.artistName}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{track.albumName}</p>
            </div>
            {review && (
              <div className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 rounded-full text-primary font-bold text-[10px] sm:text-xs ml-1
                ${review.opinion === 'LIKED' ? 'bg-green-500' : 
                  review.opinion === 'DISLIKE' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                {review.rating.toFixed(1)}
              </div>)
            }
            {
              !review && showRating && (<div className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 rounded-full text-primary font-bold text-[10px] sm:text-xs ml-1 bg-gray-500`}>
                {'~'}
              </div>)
            }
          </div>
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
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate text-xs sm:text-sm">{album.albumName}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{album.artistName}</p>
            </div>
            {review && (
              <div className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full text-primary text-[10px] sm:text-xs ml-1
                ${review.opinion === 'LIKED' ? 'bg-green-500' : 
                  review.opinion === 'DISLIKE' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                {review.rating.toFixed(1)}
              </div>
            )}
          </div>
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
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate text-xs sm:text-sm">{artist.artistName}</h3>
            </div>
            {review && (
              <div className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full text-primary text-[10px] sm:text-xs ml-1
                ${review.opinion === 'LIKED' ? 'bg-green-500' : 
                  review.opinion === 'DISLIKE' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                {review.rating.toFixed(1)}
              </div>
            )}
          </div>
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