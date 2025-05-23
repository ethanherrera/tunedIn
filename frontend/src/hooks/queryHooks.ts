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
    queryFn: async () => {
      const reviews = await reviewApi.getUserReviews();
      const trackIds = reviews.map(review => review.trackId);
      const tracksResponse = await spotifyApi.getTracksBatch(trackIds);
      const tracks = tracksResponse.tracks || [];
      
      // Create a map of tracks for quick lookup
      const tracksMap: Record<string, Track> = {};
      tracks.forEach(track => {
        tracksMap[track.id] = track;
      });
      
      // Attach track data to each review
      return reviews.map(review => ({
        ...review,
        track: tracksMap[review.trackId]
      }));
    },
    staleTime: 0,
    gcTime: Infinity
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
    onMutate: async (newReview) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['trackReviews'] });

      // Snapshot the previous value
      const previousReviews = queryClient.getQueryData(['trackReviews']);

      // Optimistically update to the new value
      queryClient.setQueryData(['trackReviews'], (old: any[]) => {
        const reviews = [...(old || [])];
        const index = reviews.findIndex(r => r.trackId === newReview.trackId);
        if (index >= 0) {
          reviews[index] = { ...reviews[index], ...newReview };
        } else {
          reviews.push(newReview);
        }
        return reviews;
      });

      // Return a context object with the snapshotted value
      return { previousReviews };
    },
    onError: (err, newReview, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousReviews) {
        queryClient.setQueryData(['trackReviews'], context.previousReviews);
      }
      console.error("Error saving review:", err);
      toast.error("Failed to save review");
    },
    onSettled: () => {
      // Always refetch after error or success to make sure our optimistic update is correct
      queryClient.invalidateQueries({ queryKey: ['trackReviews'] });
    }
  });
};

export const useTracksBatch = (trackIds: string[]) => {
  const { data: trackReviews } = useTrackReviews();
  
  return useQuery({
    queryKey: ['tracks', trackIds],
    queryFn: async () => {
      const response = await spotifyApi.getTracksBatch(trackIds);
      return response.tracks || [];
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