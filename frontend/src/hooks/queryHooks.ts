import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendsApi, spotifyApi, reviewApi, userApi } from '@/api/apiClient';
import { Track, TrackReview, Artist } from '@/api/apiClient';
import { toast } from 'sonner';

// User hooks
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: userApi.getProfile,
  });
};

// Friends hooks
export const useFriendsList = () => {
  return useQuery({
    queryKey: ['friends'],
    queryFn: friendsApi.getFriendsList
  });
};
export const useSentRequests = () => {
  return useQuery({
    queryKey: ['sentRequests'],
    queryFn: friendsApi.getSentRequests
  });
};

export const useReceivedRequests = () => {
  return useQuery({
    queryKey: ['receivedRequests'],
    queryFn: friendsApi.getPendingRequests
  });
};

// Friend mutations
export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: friendsApi.sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['receivedRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (error: any) => {
      toast.error("Failed to send request", {
        description: error.message || "An error occurred"
      });
    }
  });
};

export const useRemoveFriend = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: friendsApi.removeFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['sentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['receivedRequests'] });
    },
    onError: (error: any) => {
      toast.error("Failed to remove friend", {
        description: error.message || "An error occurred"
      });
    }
  });
};

export const useCancelFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => friendsApi.declineFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['receivedRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (error: any) => {
      toast.error("Failed to cancel request", {
        description: error.message || "An error occurred"
      });
    }
  });
};

export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: friendsApi.acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivedRequests'] });
      queryClient.invalidateQueries({ queryKey: ['sentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (error: any) => {
      toast.error("Failed to accept request", {
        description: error.message || "An error occurred"
      });
    }
  });
};

export const useDeclineFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: friendsApi.declineFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivedRequests'] });
      queryClient.invalidateQueries({ queryKey: ['sentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (error: any) => {
      toast.error("Failed to decline request", {
        description: error.message || "An error occurred"
      });
    }
  });
};

// Hook to refresh friend-related data
export const useRefreshManageFriends = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['friends'] }),
        queryClient.invalidateQueries({ queryKey: ['sentRequests'] }),
        queryClient.invalidateQueries({ queryKey: ['receivedRequests'] })
      ]);
    },
    onSuccess: () => {
      toast.success("Data refreshed", {
        description: "Friend information has been updated"
      });
    },
    onError: () => {
      toast.error("Refresh failed", {
        description: "Failed to refresh data"
      });
    }
  });

  return {
    refreshData: mutation.mutate,
    isRefreshing: mutation.isPending
  };
};

// Hook to refresh top items data
export const useRefreshTopItems = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['topTracks'] }),
        queryClient.invalidateQueries({ queryKey: ['topArtists'] }),
        queryClient.invalidateQueries({ queryKey: ['trackReviews'] })
      ]);
    },
    onSuccess: () => {
      toast.success("Data refreshed", {
        description: "Your top tracks and artists have been updated"
      });
    },
    onError: (error: any) => {
      toast.error("Refresh failed", {
        description: error.message || "Failed to refresh your data"
      });
    }
  });

  return {
    refreshData: mutation.mutate,
    isRefreshing: mutation.isPending
  };
};

// Hook to refresh reviewed tracks data
export const useRefreshReviewedTracks = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trackReviews'] }),
        queryClient.invalidateQueries({ queryKey: ['tracks'] })
      ]);
    },
    onSuccess: () => {
      toast.success("Data refreshed", {
        description: "Your reviewed tracks have been updated"
      });
    },
    onError: () => {
      toast.error("Refresh failed", {
        description: "Failed to refresh your reviewed tracks"
      });
    }
  });

  return {
    refreshData: mutation.mutate,
    isRefreshing: mutation.isPending
  };
};

// Hook to refresh recently played data
export const useRefreshRecentlyPlayed = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['recentlyPlayed'] }),
        queryClient.invalidateQueries({ queryKey: ['trackReviews'] })
      ]);
    },
    onSuccess: () => {
      toast.success("Data refreshed", {
        description: "Recently played tracks have been updated"
      });
    },
    onError: () => {
      toast.error("Refresh failed", {
        description: "Failed to refresh data"
      });
    }
  });

  return {
    refreshData: mutation.mutate,
    isRefreshing: mutation.isPending,
  };
};

// Track and Artist hooks
export const useRecentlyPlayed = (limit: number = 50) => {
  return useQuery({
    queryKey: ['recentlyPlayed'],
    queryFn: () => spotifyApi.getRecentlyPlayed({ limit })
  });
};

export const useTrackReviews = () => {
  return useQuery({
    queryKey: ['trackReviews'],
    queryFn: () => reviewApi.getUserReviews()
  });
};

export const useTrackReviewMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewData: any) => {
      return reviewApi.saveTrackReview({
        ...reviewData,
      });
    },
    onSuccess: () => {
      toast.success("Review saved successfully!");
      queryClient.invalidateQueries({ queryKey: ['trackReviews'] });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
    onError: (error) => {
      console.error("Error saving review:", error);
      toast.error("Failed to save review");
    }
  });
};

export const useTracksBatch = (trackIds: string[]) => {
  const { data: trackReviews } = useTrackReviews();
  
  return useQuery({
    queryKey: ['tracks', trackIds],
    queryFn: async () => {
      const response = await spotifyApi.getTracksBatch(trackIds);
      const tracks = response.tracks || [];
      
      // Create a map of track reviews for quick lookup
      const reviewsMap: Record<string, TrackReview> = {};
      if (trackReviews) {
        trackReviews.forEach(review => {
          reviewsMap[review.trackId] = review;
        });
      }
      
      // Group tracks by opinion
      const grouped = {
        liked: [] as Track[],
        neutral: [] as Track[],
        disliked: [] as Track[],
        reviewsMap
      };
      
      // Group tracks based on their reviews
      tracks.forEach(track => {
        const review = reviewsMap[track.id];
        if (review) {
          switch (review.opinion) {
            case 'LIKED':
              grouped.liked.push(track);
              break;
            case 'NEUTRAL':
              grouped.neutral.push(track);
              break;
            case 'DISLIKE':
              grouped.disliked.push(track);
              break;
          }
        }
      });
      
      return grouped;
    },
    enabled: trackIds.length > 0
  });
};

export const useSpotifySearch = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['spotifySearch', query],
    queryFn: () => spotifyApi.search({
      q: query,
      type: 'track,album,artist',
      limit: 20
    }),
    enabled: enabled && query.trim().length > 0
  });
};

interface TopItemsOptions {
  timeRange: 'short_term' | 'medium_term' | 'long_term';
  limit: number;
  offset: number;
}

export const useTopTracks = (options: TopItemsOptions) => {
  return useQuery({
    queryKey: ['topTracks', options],
    queryFn: () => spotifyApi.getTopItems('tracks', options)
  });
};

export const useTopArtists = (options: TopItemsOptions) => {
  return useQuery({
    queryKey: ['topArtists', options],
    queryFn: () => spotifyApi.getTopItems('artists', options)
  });
};