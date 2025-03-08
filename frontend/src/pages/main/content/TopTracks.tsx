import React, { useState, useEffect } from "react"
import { Button } from "../../../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { spotifyApi } from "../../../api/apiClient"
import { Skeleton } from "../../../components/ui/skeleton"
import MusicScrollArea from "./MusicScrollArea"
import { Separator } from "../../../components/ui/separator"
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

interface FilterOptions {
  timeRange: 'short_term' | 'medium_term' | 'long_term';
  limit: number;
  offset: number;
}

export default function TopTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tracksLoading, setTracksLoading] = useState<boolean>(true);
  const [artistsLoading, setArtistsLoading] = useState<boolean>(true);
  const [tracksError, setTracksError] = useState<string | null>(null);
  const [artistsError, setArtistsError] = useState<string | null>(null);
  const [tracksFilters, setTracksFilters] = useState<FilterOptions>({
    timeRange: 'medium_term',
    limit: 50,
    offset: 0
  });
  const [artistsFilters, setArtistsFilters] = useState<FilterOptions>({
    timeRange: 'medium_term',
    limit: 50,
    offset: 0
  });

  useEffect(() => {
    fetchTopTracks();
    fetchTopArtists();
    setLoading(false);
  }, []);

  const fetchTopTracks = async () => {
    setTracksLoading(true);
    setTracksError(null);
    
    try {
      const response = await spotifyApi.getTopItems('tracks', {
        timeRange: tracksFilters.timeRange,
        limit: tracksFilters.limit,
        offset: tracksFilters.offset
      });
      
      // Transform the response to match our Track interface
      const fetchedTracks: Track[] = response.items.map((item: any) => ({
        spotifyId: item.id,
        trackName: item.name,
        artistName: item.artists[0].name,
        albumName: item.album.name,
        albumImageUrl: item.album.images[0]?.url || 'https://via.placeholder.com/300',
        albumId: item.album.id
      }));
      
      setTracks(fetchedTracks);
    } catch (err: any) {
      console.error('Failed to fetch top tracks:', err);
      setTracksError(err.message || 'Failed to load your top tracks');
    } finally {
      setTracksLoading(false);
    }
  };

  const fetchTopArtists = async () => {
    setArtistsLoading(true);
    setTracksError(null);
    
    try {
      const response = await spotifyApi.getTopItems('artists', {
        timeRange: artistsFilters.timeRange,
        limit: artistsFilters.limit,
        offset: artistsFilters.offset
      });
      
      // Transform the response to match our Track interface
      const fetchedArtists: Artist[] = response.items.map((item: any) => ({
        spotifyId: item.id,
        artistName: item.name,
        artistImageUrl: item.images[0]?.url || 'https://via.placeholder.com/300',
      }));
      
      setArtists(fetchedArtists);
    } catch (err: any) {
      console.error('Failed to fetch top tracks:', err);
      setArtistsError(err.message || 'Failed to load your top tracks');
    } finally {
      setArtistsLoading(false);
    }
  };

  const handleTracksTimeRangeChange = (value: string) => {
    setTracksFilters(prev => ({
      ...prev,
      timeRange: value as 'short_term' | 'medium_term' | 'long_term'
    }));
    fetchTopTracks();
    setLoading(false);
  };

  const handleArtistsTimeRangeChange = (value: string) => {
    setArtistsFilters(prev => ({
      ...prev,
      timeRange: value as 'short_term' | 'medium_term' | 'long_term'
    }));
    fetchTopArtists();
    setLoading(false);
  };

  const timeRangeLabels = {
    'short_term': 'Last 4 Weeks',
    'medium_term': 'Last 6 Months',
    'long_term': 'Last Year'
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 shrink-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-primary">Your Top Tracks</h1>
          <h2 className="text-sm text-muted-foreground">You can see your top spotify tracks from the last 4 weeks, 6 months, or all time.</h2>
        </div>
        <div className="flex items-center gap-2 text-primary">
          <Select
            value={tracksFilters.timeRange}
            onValueChange={handleTracksTimeRangeChange}
          >
            <SelectTrigger className="w-[12vw] min-w-[130px] p-2">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short_term">{timeRangeLabels.short_term}</SelectItem>
              <SelectItem value="medium_term">{timeRangeLabels.medium_term}</SelectItem>
              <SelectItem value="long_term">{timeRangeLabels.long_term}</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={() => fetchTopTracks()}
            disabled={loading || tracksLoading}
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </div>
      
      {tracksError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 shrink-0">
          {tracksError}
        </div>
      )}
      
      <div className="flex-1 w-full">
        {loading || tracksLoading ? (
          <div className="w-full h-full">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : (
          <div>
            <div className="flex flex-col gap-2">
              <Separator />
              <MusicScrollArea items={tracks} itemType="track"/>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 shrink-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-primary">Your Top Artists</h1>
          <h2 className="text-sm text-muted-foreground">You can see your top spotify artists from the last 4 weeks, 6 months, or all time.</h2>
        </div>
        <div className="flex items-center gap-2 text-primary">
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
          
          <Button 
            variant="outline" 
            onClick={() => fetchTopArtists()}
            disabled={loading || artistsLoading}
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </div>
      {artistsError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 shrink-0">
          {artistsError}
        </div>
      )}
      
      <div className="flex-1 w-full">
        {loading || artistsLoading ? (
          <div className="w-full h-full">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : (
          <div>
            <div className="flex flex-col gap-2">
              <Separator />
              <MusicScrollArea items={artists} itemType="artist"/>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 