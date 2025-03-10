import React, { useState, useEffect } from "react"
import { Button } from "../../../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { spotifyApi, reviewApi } from "../../../api/apiClient"
import { Skeleton } from "../../../components/ui/skeleton"
import MusicScrollArea from "./MusicScrollArea"
import { Separator } from "../../../components/ui/separator"
import { UITrack, UIArtist, transformTrackForUI, transformArtistForUI, Track, Artist, PagingObject } from "../../../types/spotify"

interface FilterOptions {
  timeRange: 'short_term' | 'medium_term' | 'long_term';
  limit: number;
  offset: number;
}

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

export default function TopTracks() {
  const [tracks, setTracks] = useState<UITrack[]>([]);
  const [artists, setArtists] = useState<UIArtist[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
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
    fetchUserReviews();
    setLoading(false);
  }, []);

  const fetchUserReviews = async () => {
    try {
      const reviews = await reviewApi.getUserReviews();
      setUserReviews(reviews);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
    }
  };

  const fetchTopTracks = async () => {
    setTracksLoading(true);
    setTracksError(null);
    try {
      const response = await spotifyApi.getTopItems('tracks', {
        timeRange: tracksFilters.timeRange,
        limit: tracksFilters.limit,
        offset: tracksFilters.offset
      });
      
      // Cast the response to the correct type and transform the tracks
      const tracksResponse = response as PagingObject<Track>;
      const uiTracks = tracksResponse.items.map(track => transformTrackForUI(track));
      setTracks(uiTracks);
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      setTracksError('Failed to load top tracks. Please try again later.');
    } finally {
      setTracksLoading(false);
    }
  };

  const fetchTopArtists = async () => {
    setArtistsLoading(true);
    setArtistsError(null);
    try {
      const response = await spotifyApi.getTopItems('artists', {
        timeRange: artistsFilters.timeRange,
        limit: artistsFilters.limit,
        offset: artistsFilters.offset
      });
      
      // Cast the response to the correct type and transform the artists
      const artistsResponse = response as PagingObject<Artist>;
      const uiArtists = artistsResponse.items.map(artist => transformArtistForUI(artist));
      setArtists(uiArtists);
    } catch (error) {
      console.error('Error fetching top artists:', error);
      setArtistsError('Failed to load top artists. Please try again later.');
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

  // Get track-related reviews
  const getTrackReviews = () => {
    return userReviews.filter(review => 
      tracks.some(track => track.spotifyId === review.spotifyTrackId)
    );
  };

  // Get artist-related reviews
  const getArtistReviews = () => {
    return userReviews.filter(review => 
      artists.some(artist => artist.spotifyId === review.spotifyTrackId)
    );
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
            onClick={() => {
              fetchTopTracks();
              fetchUserReviews();
            }}
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
              <MusicScrollArea items={tracks} itemType="track" reviews={getTrackReviews()} showRating={true}/>
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
            onClick={() => {
              fetchTopArtists();
              fetchUserReviews();
            }}
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
              <MusicScrollArea items={artists} itemType="artist" reviews={getArtistReviews()}/>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 