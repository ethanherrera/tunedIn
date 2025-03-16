import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { spotifyApi, Track, Album, Artist } from "@/api/apiClient";
import { SearchIcon } from "lucide-react";
import { TrackScrollArea } from "@/components/TrackScrollArea";
import { AlbumScrollArea } from "@/components/AlbumScrollArea";
import { ArtistScrollArea } from "@/components/ArtistScrollArea";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { Separator } from "@/components/ui/separator";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Only search if we have a query
  const shouldSearch = debouncedSearchQuery.trim().length > 0;

  // React Query for search results
  const { 
    data: searchResults, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['spotifySearch', debouncedSearchQuery],
    queryFn: () => spotifyApi.search({
      q: debouncedSearchQuery,
      type: 'track,album,artist',
      limit: 20
    }),
    enabled: shouldSearch,
  });

  // Extract results by type
  const tracks = searchResults?.tracks?.items || [];
  const albums = searchResults?.albums?.items || [];
  const artists = searchResults?.artists?.items || [];

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="content-container">
      {/* Large Search Bar */}
      <div className="w-full max-w-3xl mx-auto mb-8 mt-4">
        <div className={cn(
          "flex h-14 items-center gap-3 rounded-lg border px-4 shadow-sm",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        )}>
          <SearchIcon className="h-5 w-5 shrink-0 opacity-50" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search for tracks, albums, or artists..."
            className="flex h-12 w-full bg-transparent py-3 text-lg outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            autoFocus
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-8">
        {isLoading && shouldSearch && (
          <div className="flex justify-center items-center h-32">
            <p>Searching...</p>
          </div>
        )}

        {error && (
          <div className="flex justify-center items-center h-32 text-red-500">
            <p>Error: {(error as Error).message}</p>
          </div>
        )}

        {!shouldSearch && (
          <div className="flex justify-center items-center h-64 text-muted-foreground">
            <p>Start typing to search for music</p>
          </div>
        )}

        {shouldSearch && !isLoading && !error && (
          <>
            {/* Tracks Section */}
            {tracks.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Tracks</h2>
                <Separator />
                <TrackScrollArea items={tracks} />
              </div>
            )}

            {/* Albums Section */}
            {albums.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Albums</h2>
                <Separator />
                <AlbumScrollArea items={albums} />
              </div>
            )}

            {/* Artists Section */}
            {artists.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Artists</h2>
                <Separator />
                <ArtistScrollArea items={artists} />
              </div>
            )}

            {/* No Results */}
            {tracks.length === 0 && albums.length === 0 && artists.length === 0 && (
              <div className="flex justify-center items-center h-32 text-muted-foreground">
                <p>No results found for "{debouncedSearchQuery}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 