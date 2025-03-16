import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { Track, TrackReview } from "@/api/apiClient.ts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import RankingDialog from "@/components/RankingDialog.tsx";
import { useDominantColor } from "@/lib/colorExtractor";

interface TrackCardProps {
  item: Track;
  items?: (Track)[];
  reviews?: (TrackReview)[];
  review?: TrackReview;
  disableInteraction?: boolean;
}

const TrackCard: React.FC<TrackCardProps> = ({ item, items=[], reviews=[], review, disableInteraction=false}) => {
  const [showRankingDialog, setShowRankingDialog] = useState(false);
  const { color } = useDominantColor(item.album.images[0]?.url);
  const [isHovered, setIsHovered] = useState(false);

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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Card 
            className="group w-[15vh] h-[22vh] flex-shrink-0 transform transition-transform duration-400 hover:scale-105 border-none shadow-none py-0 cursor-pointer relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              boxShadow: isHovered ? `0 0 15px 5px ${color}` : 'none',
              transition: 'box-shadow 0.3s ease, transform 0.4s ease'
            }}
          >
            <CardContent className="p-2">
              <div className="overflow-hidden rounded-md">
                <img
                  src={item.album.images[0].url}
                  alt={`${item.album.name} album cover`}
                  className="aspect-square h-auto w-full object-cover"
                />
              </div>
              <div className="pt-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate text-xs sm:text-sm">{item.name}</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.artists[0].name}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.album.name}</p>
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
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="bottom" className="w-40">
          <DropdownMenuItem onSelect={(e) => {
            e.preventDefault();
            setShowRankingDialog(true);
          }}>
            Review this track
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showRankingDialog && !disableInteraction && (
        <RankingDialog
          item={item}
          items={items as Track[]}
          itemType="track"
          review={review as TrackReview}
          reviews={reviews as TrackReview[]}
          onOpenChange={(open) => setShowRankingDialog(open)}
        >
          <></>
        </RankingDialog>
      )}
    </>
  );
};

export default TrackCard;