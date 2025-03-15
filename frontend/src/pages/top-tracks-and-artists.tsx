import React, { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import MusicScrollArea from "@/components/MusicScrollArea.tsx"
import { Separator } from "@/components/ui/separator"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { spotifyApi, reviewApi, Track, Artist } from "@/api/apiClient"
import { PageHeader } from "@/components/ui/page-header"
import { toast } from "sonner"
import { SearchBar } from "@/components/ui/search-bar"

interface FilterOptions {
  timeRange: 'short_term' | 'medium_term' | 'long_term';
  limit: number;
  offset: number;
}

export default function TopTracksAndArtists() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const queryClient = useQueryClient()
  
  const [tracksFilters, setTracksFilters] = React.useState<FilterOptions>({
    timeRange: 'medium_term',
    limit: 50,
    offset: 0
  });

  const [artistsFilters, setArtistsFilters] = React.useState<FilterOptions>({
    timeRange: 'medium_term',
    limit: 50,
    offset: 0
  });

  // React Query for top tracks
  const { 
    data: tracksData, 
    isLoading: tracksLoading, 
    error: tracksError, 
    isError: isTracksError 
  } = useQuery({
    queryKey: ['topTracks', tracksFilters],
    queryFn: () => spotifyApi.getTopItems('tracks', tracksFilters),
  });

  // React Query for top artists
  const { 
    data: artistsData, 
    isLoading: artistsLoading, 
    error: artistsError, 
    isError: isArtistsError 
  } = useQuery({
    queryKey: ['topArtists', artistsFilters],
    queryFn: () => spotifyApi.getTopItems('artists', artistsFilters),
  });

  // React Query for all track reviews
  const { data: trackReviews } = useQuery({
    queryKey: ['trackReviews'],
    queryFn: () => reviewApi.getUserReviews(),
  });
  
  // Filter tracks based on search query
  const filteredTracks = useMemo(() => {
    if (!tracksData?.items || !searchQuery.trim()) {
      return tracksData?.items;
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    // Filter function to check if a track matches the search query
    return (tracksData.items as Track[]).filter((track) => {
      return (
        // Search in track name
        track.name.toLowerCase().includes(query) ||
        // Search in artist names
        track.artists.some(artist => artist.name.toLowerCase().includes(query)) ||
        // Search in album name
        track.album.name.toLowerCase().includes(query)
      );
    });
  }, [tracksData?.items, searchQuery]);
  
  // Filter artists based on search query
  const filteredArtists = useMemo(() => {
    if (!artistsData?.items || !searchQuery.trim()) {
      return artistsData?.items;
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    // Filter function to check if an artist matches the search query
    return (artistsData.items as Artist[]).filter((artist) => {
      return (
        // Search in artist name
        artist.name.toLowerCase().includes(query) ||
        // Search in genres if available
        (artist.genres && artist.genres.some(genre => genre.toLowerCase().includes(query)))
      );
    });
  }, [artistsData?.items, searchQuery]);
  
  // Combined function to refresh all data
  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['topTracks'] }),
        queryClient.invalidateQueries({ queryKey: ['topArtists'] }),
        queryClient.invalidateQueries({ queryKey: ['trackReviews'] })
      ])
      toast.success("Data refreshed", {
        description: "Your top tracks and artists have been updated"
      })
    } catch (error) {
      toast.error("Refresh failed", {
        description: "Failed to refresh your data"
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleTracksTimeRangeChange = (value: string) => {
    setTracksFilters(prev => ({
      ...prev,
      timeRange: value as 'short_term' | 'medium_term' | 'long_term'
    }));
  };

  const handleArtistsTimeRangeChange = (value: string) => {
    setArtistsFilters(prev => ({
      ...prev,
      timeRange: value as 'short_term' | 'medium_term' | 'long_term'
    }));
  };

  const timeRangeLabels = {
    'short_term': 'Last 4 Weeks',
    'medium_term': 'Last 6 Months',
    'long_term': 'Last Year'
  };

  // Helper function to render a section
  const renderSection = (title: string, content: React.ReactNode, filterControl: React.ReactNode) => {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">{title}</h2>
          {filterControl}
        </div>
        {content}
      </div>
    );
  };

  // Determine if we're still loading
  const isLoading = tracksLoading || artistsLoading;
  
  // Check if there are any items after filtering
  const hasFilteredTracks = filteredTracks && filteredTracks.length > 0;
  const hasFilteredArtists = filteredArtists && filteredArtists.length > 0;
  
  // Track section filter control
  const tracksFilterControl = (
    <Select
      value={tracksFilters.timeRange}
      onValueChange={handleTracksTimeRangeChange}
    >
      <SelectTrigger className="w-[12vw] min-w-[130px]">
        <SelectValue placeholder="Time range" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="short_term">{timeRangeLabels.short_term}</SelectItem>
        <SelectItem value="medium_term">{timeRangeLabels.medium_term}</SelectItem>
        <SelectItem value="long_term">{timeRangeLabels.long_term}</SelectItem>
      </SelectContent>
    </Select>
  );

  // Artist section filter control
  const artistsFilterControl = (
    <Select
      value={artistsFilters.timeRange}
      onValueChange={handleArtistsTimeRangeChange}
    >
      <SelectTrigger className="w-[12vw] min-w-[130px]">
        <SelectValue placeholder="Time range" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="short_term">{timeRangeLabels.short_term}</SelectItem>
        <SelectItem value="medium_term">{timeRangeLabels.medium_term}</SelectItem>
        <SelectItem value="long_term">{timeRangeLabels.long_term}</SelectItem>
      </SelectContent>
    </Select>
  );

  // Tracks content
  const tracksContent = (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Your top Spotify tracks from the last 4 weeks, 6 months, or all time.
      </p>
      
      {isTracksError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 shrink-0">
          {(tracksError as Error)?.message || 'Failed to load top tracks. Please try again later.'}
        </div>
      )}
      
      <div className="flex-1 w-full">
        {tracksLoading ? (
          <div className="w-full">
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : !hasFilteredTracks && searchQuery.trim() ? (
          <div className="flex justify-center items-center h-32 text-muted-foreground">
            <p>No tracks match your search.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Separator />
            <MusicScrollArea 
              items={filteredTracks as Track[]} 
              itemType="track" 
              reviews={trackReviews} 
              showRating={true}
            />
          </div>
        )}
      </div>
    </div>
  );

  // Artists content
  const artistsContent = (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Your top Spotify artists from the last 4 weeks, 6 months, or all time.
      </p>

      {isArtistsError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 shrink-0">
          {(artistsError as Error)?.message || 'Failed to load top artists. Please try again later.'}
        </div>
      )}
      
      <div className="flex-1 w-full">
        {artistsLoading ? (
          <div className="w-full">
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : !hasFilteredArtists && searchQuery.trim() ? (
          <div className="flex justify-center items-center h-32 text-muted-foreground">
            <p>No artists match your search.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Separator />
            <MusicScrollArea 
              items={filteredArtists as Artist[]} 
              itemType="artist"
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="content-container">
      <div className="flex flex-col gap-4">
        <PageHeader 
          title="Your Top Spotify Tracks & Artists" 
          onRefresh={refreshData}
          isRefreshing={isRefreshing}
          isLoading={isLoading}
          className="flex-wrap"
        />
        
        <div className="w-full mb-2">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search tracks and artists..."
            className="w-full max-w-[300px]"
          />
        </div>
      </div>
      
      <div className="mt-6">
        {renderSection("Your Top Tracks", tracksContent, tracksFilterControl)}
        {renderSection("Your Top Artists", artistsContent, artistsFilterControl)}
      </div>
    </div>
  );
} 