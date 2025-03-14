import React from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { Album, AlbumReview } from "../../../api/apiClient";

interface AlbumCardUIProps {
  item: Album;
  items?: (Album)[];
  reviews?: (AlbumReview)[];
  review?: AlbumReview;
}

const AlbumCardUI: React.FC<AlbumCardUIProps> = ({ item }) => {

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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlbumCardUI;