import React from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { Album, AlbumReview } from "../../../api/apiClient";

interface AlbumMusicItemProps {
  item: Album;
  items?: (Album)[];
  reviews?: (AlbumReview)[];
  review?: AlbumReview;
}

const AlbumMusicItem: React.FC<AlbumMusicItemProps> = ({ item, items=[], reviews=[], review }) => {
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

  return (
    <Card className="group w-[15vh] h-[22vh] flex-shrink-0 transform transition-transform duration-400 hover:scale-105 border-none shadow-none py-0">
      <CardContent className="p-2">
        <div className="overflow-hidden rounded-md group-hover:shadow-sm group-hover:shadow-primary">
          <img
            src={item.images && item.images.length > 0 ? item.images[0].url : ''}
            alt={`${item.name} cover`}
            className="aspect-square h-auto w-full object-cover"
          />
        </div>
        <div className="pt-2">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate text-xs sm:text-sm">{item.name}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.artists && item.artists.length > 0 ? item.artists[0].name : ''}</p>
            </div>
            {review && (
              <div className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 rounded-full text-primary font-bold text-[10px] sm:text-xs ml-1
                ${review.opinion === 'LIKED' ? 'bg-green-500' : 
                  review.opinion === 'DISLIKE' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                {review.rating.toFixed(1)}
              </div>)
            }
            {
              !review && (<div className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 rounded-full text-primary font-bold text-[10px] sm:text-xs ml-1 bg-gray-500`}>
                {'~'}
              </div>)
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlbumMusicItem; 