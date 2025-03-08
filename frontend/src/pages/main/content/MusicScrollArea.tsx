import React, { useState } from "react";
import { ScrollArea, ScrollBar } from "../../../components/ui/scroll-area";
import RankingDialog from "./RankingDialog";
import MusicItem from "./MusicItem";

interface Track {
  albumImageUrl: string;
  albumName: string;
  artistName: string;
  trackName: string;
  spotifyId: string;
  albumId: string;
}

interface Artist {
  artistImageUrl: string;
  artistName: string;
  spotifyId: string;
}

interface Album {
  albumImageUrl: string;
  albumName: string;
  artistName: string;
  spotifyId: string;
}

interface MusicScrollAreaProps {
  items: Track[] | Artist[] | Album[]; // support for albums and artists in the future
  itemType: 'track' | 'album' | 'artist';
}

const MusicScrollArea: React.FC<MusicScrollAreaProps> = ({ items, itemType }) => {
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);

  const handleDialogOpen = (id: string) => {
    setOpenDialogId(id);
  };

  const handleDialogClose = () => {
    setOpenDialogId(null);
  };

  const handleReviewSaved = () => {
    handleDialogClose();
    // Add any additional logic needed after saving the review
  };

  return (
    <div className="w-full">
      <ScrollArea className="w-full">
        <div className="flex gap-4 p-4">
          {items.map((item) => (
            <RankingDialog 
              key={item.spotifyId} 
              isOpen={openDialogId === item.spotifyId}
              onClose={handleDialogClose}
              item={item}
              itemType={itemType}
              existingReviewId={undefined}
              onAlbumReviewSaved={handleReviewSaved}
            >
              <div onClick={() => handleDialogOpen(item.spotifyId)}>
                <MusicItem item={item} itemType={itemType} />
              </div>
            </RankingDialog>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default MusicScrollArea; 