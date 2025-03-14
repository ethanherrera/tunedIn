import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { Track, TrackReview } from "@/api/apiClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RankingDialog from "@/components/RankingDialog.tsx";

interface TrackCardUIProps {
  item: Track;
  disableInteraction?: boolean;
}

const TrackCardUI: React.FC<TrackCardUIProps> = ({ item }) => {

  return (
    <>
          <Card className="group w-[15vh] h-[22vh] flex-shrink-0 transform transition-transform duration-400 hover:scale-105 border-none shadow-none py-0 cursor-pointer">
            <CardContent className="p-2">
              <div className="overflow-hidden rounded-md group-hover:shadow-sm group-hover:shadow-primary">
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
                </div>
              </div>
            </CardContent>
          </Card>
    </>
  );
};

export default TrackCardUI;