import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { friendsApi } from '@/api/apiClient'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function ManageFriends() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('friends')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<{ exists: boolean } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const queryClient = useQueryClient()
  
  // Alert dialog state
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    description: string;
    action: () => void;
  }>({
    title: '',
    description: '',
    action: () => {},
  })
  
  // Fetch friends list
  const { 
    data: friends, 
    isLoading: isLoadingFriends, 
    isError: isErrorFriends,
    error: friendsError
  } = useQuery({
    queryKey: ['friends'],
    queryFn: friendsApi.getFriendsList
  })
  
  // Fetch sent friend requests
  const { 
    data: sentRequests, 
    isLoading: isLoadingSentRequests, 
    isError: isErrorSentRequests,
    error: sentRequestsError
  } = useQuery({
    queryKey: ['sentRequests'],
    queryFn: friendsApi.getSentRequests
  })
  
  // Fetch received friend requests
  const { 
    data: receivedRequests, 
    isLoading: isLoadingReceivedRequests, 
    isError: isErrorReceivedRequests,
    error: receivedRequestsError
  } = useQuery({
    queryKey: ['receivedRequests'],
    queryFn: friendsApi.getPendingRequests
  })
  
  // Function to refresh all friend-related data
  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['friends'] }),
        queryClient.invalidateQueries({ queryKey: ['sentRequests'] }),
        queryClient.invalidateQueries({ queryKey: ['receivedRequests'] })
      ])
      toast.success("Data refreshed", {
        description: "Friend information has been updated"
      })
    } catch (error) {
      toast.error("Refresh failed", {
        description: "Failed to refresh data"
      })
    } finally {
      setIsRefreshing(false)
    }
  }
  
  // Mutation for sending friend requests
  const sendRequestMutation = useMutation({
    mutationFn: friendsApi.sendFriendRequest,
    onSuccess: () => {
      toast.success("Friend request sent", {
        description: `Request sent to ${searchQuery}`
      })
      // Invalidate all friend-related queries
      queryClient.invalidateQueries({ queryKey: ['sentRequests'] })
      queryClient.invalidateQueries({ queryKey: ['receivedRequests'] })
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      setSearchQuery('')
      setSearchResult(null)
    },
    onError: (error: any) => {
      toast.error("Failed to send request", {
        description: error.message || "An error occurred"
      })
    }
  })
  
  // Mutation for removing friends
  const removeFriendMutation = useMutation({
    mutationFn: friendsApi.removeFriend,
    onSuccess: () => {
      toast.success("Friend removed", {
        description: "Friend has been removed from your list"
      })
      // Invalidate all friend-related queries
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      queryClient.invalidateQueries({ queryKey: ['sentRequests'] })
      queryClient.invalidateQueries({ queryKey: ['receivedRequests'] })
    },
    onError: (error: any) => {
      toast.error("Failed to remove friend", {
        description: error.message || "An error occurred"
      })
    }
  })
  
  // Mutation for canceling friend requests
  const cancelRequestMutation = useMutation({
    mutationFn: (requestId: string) => friendsApi.declineFriendRequest(requestId),
    onSuccess: () => {
      toast.success("Request canceled", {
        description: "Friend request has been canceled"
      })
      // Invalidate all friend-related queries
      queryClient.invalidateQueries({ queryKey: ['sentRequests'] })
      queryClient.invalidateQueries({ queryKey: ['receivedRequests'] })
      queryClient.invalidateQueries({ queryKey: ['friends'] })
    },
    onError: (error: any) => {
      toast.error("Failed to cancel request", {
        description: error.message || "An error occurred"
      })
    }
  })
  
  // Mutation for accepting friend requests
  const acceptRequestMutation = useMutation({
    mutationFn: friendsApi.acceptFriendRequest,
    onSuccess: () => {
      toast.success("Friend request accepted", {
        description: "You are now friends!"
      })
      // Invalidate all friend-related queries
      queryClient.invalidateQueries({ queryKey: ['receivedRequests'] })
      queryClient.invalidateQueries({ queryKey: ['sentRequests'] })
      queryClient.invalidateQueries({ queryKey: ['friends'] })
    },
    onError: (error: any) => {
      toast.error("Failed to accept request", {
        description: error.message || "An error occurred"
      })
    }
  })
  
  // Mutation for declining friend requests
  const declineRequestMutation = useMutation({
    mutationFn: friendsApi.declineFriendRequest,
    onSuccess: () => {
      toast.success("Friend request declined", {
        description: "Request has been declined"
      })
      // Invalidate all friend-related queries
      queryClient.invalidateQueries({ queryKey: ['receivedRequests'] })
      queryClient.invalidateQueries({ queryKey: ['sentRequests'] })
      queryClient.invalidateQueries({ queryKey: ['friends'] })
    },
    onError: (error: any) => {
      toast.error("Failed to decline request", {
        description: error.message || "An error occurred"
      })
    }
  })
  
  // Helper function to show confirmation dialog
  const showConfirmation = (title: string, description: string, action: () => void) => {
    setAlertConfig({
      title,
      description,
      action
    })
    setAlertOpen(true)
  }
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const result = await friendsApi.checkUserExists(searchQuery)
      setSearchResult(result)
      
      if (result.exists) {
        // Check if already friends or request already sent
        const isFriend = friends?.some(friend => friend.userId === searchQuery)
        const isRequestSent = sentRequests?.some(request => request.receiverId === searchQuery)
        
        if (isFriend) {
          toast.info("Already friends", {
            description: `You are already friends with ${searchQuery}`
          })
        } else if (isRequestSent) {
          toast.info("Request already sent", {
            description: `You already sent a request to ${searchQuery}`
          })
        } else {
          // Show confirmation dialog for sending request
          showConfirmation(
            "Send Friend Request",
            `Are you sure you want to send a friend request to ${searchQuery}?`,
            () => sendRequestMutation.mutate(searchQuery)
          )
        }
      } else {
        toast.error("User not found", {
          description: `No user found with ID: ${searchQuery}`
        })
      }
    } catch (error) {
      toast.error("Search failed", {
        description: "Failed to search for user"
      })
    } finally {
      setIsSearching(false)
    }
  }
  
  const handleRemoveFriend = (friendId: string, friendName: string) => {
    showConfirmation(
      "Remove Friend",
      `Are you sure you want to remove ${friendName} from your friends list?`,
      () => removeFriendMutation.mutate(friendId)
    )
  }
  
  const handleCancelRequest = (requestId: string, receiverName: string) => {
    showConfirmation(
      "Cancel Request",
      `Are you sure you want to cancel your friend request to ${receiverName}?`,
      () => cancelRequestMutation.mutate(requestId)
    )
  }
  
  const handleAcceptRequest = (requestId: string) => {
    acceptRequestMutation.mutate(requestId)
  }
  
  const handleDeclineRequest = (requestId: string, senderName: string) => {
    showConfirmation(
      "Decline Request",
      `Are you sure you want to decline the friend request from ${senderName}?`,
      () => declineRequestMutation.mutate(requestId)
    )
  }
  
  return (
    <div className="content-container">
      <PageHeader 
        title="Manage Friends" 
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
        isLoading={isLoadingFriends || isLoadingSentRequests || isLoadingReceivedRequests}
      />
      
      {/* Confirmation Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertConfig.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              alertConfig.action();
              setAlertOpen(false);
            }}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Your Connections</CardTitle>
          <CardDescription>Manage your friends and friend requests</CardDescription>
          
          <form onSubmit={handleSearch} className="mt-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter your friend's id here"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-24"
                disabled={isSearching}
              />
              <Button 
                type="submit"
                className="absolute right-0 top-0 rounded-l-none"
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </form>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="friends" className="flex-1">Friends</TabsTrigger>
              <TabsTrigger value="received" className="flex-1">Received Requests</TabsTrigger>
              <TabsTrigger value="sent" className="flex-1">Sent Requests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="friends">
              {isLoadingFriends ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : isErrorFriends ? (
                <div className="p-4 bg-red-100 text-red-700 rounded-md">
                  <p className="font-medium">Error loading friends</p>
                  <p className="text-sm">{(friendsError as Error)?.message || 'Please try again later'}</p>
                </div>
              ) : friends && friends.length > 0 ? (
                <ul className="space-y-2">
                  {friends.map(friend => (
                    <li key={friend.id} className="p-3 border rounded-md flex justify-between items-center">
                      <div>
                        <p className="font-medium">{friend.displayName || friend.userId}</p>
                        <p className="text-sm text-gray-500">@{friend.userId}</p>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleRemoveFriend(friend.id, friend.displayName || friend.userId)}
                        disabled={removeFriendMutation.isPending}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center py-8 text-gray-500">You don't have any friends yet</p>
              )}
            </TabsContent>
            
            <TabsContent value="received">
              {isLoadingReceivedRequests ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : isErrorReceivedRequests ? (
                <div className="p-4 bg-red-100 text-red-700 rounded-md">
                  <p className="font-medium">Error loading received requests</p>
                  <p className="text-sm">{(receivedRequestsError as Error)?.message || 'Please try again later'}</p>
                </div>
              ) : receivedRequests && receivedRequests.length > 0 ? (
                <ul className="space-y-2">
                  {receivedRequests.map(request => (
                    <li key={request.id} className="p-3 border rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-medium">{request.senderName || request.senderId}</p>
                          <p className="text-sm text-gray-500">@{request.senderId}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleAcceptRequest(request.id)}
                            disabled={acceptRequestMutation.isPending}
                          >
                            Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeclineRequest(request.id, request.senderName || request.senderId)}
                            disabled={declineRequestMutation.isPending}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center py-8 text-gray-500">You don't have any pending friend requests</p>
              )}
            </TabsContent>
            
            <TabsContent value="sent">
              {isLoadingSentRequests ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : isErrorSentRequests ? (
                <div className="p-4 bg-red-100 text-red-700 rounded-md">
                  <p className="font-medium">Error loading sent requests</p>
                  <p className="text-sm">{(sentRequestsError as Error)?.message || 'Please try again later'}</p>
                </div>
              ) : sentRequests && sentRequests.length > 0 ? (
                <ul className="space-y-2">
                  {sentRequests.map(request => (
                    <li key={request.id} className="p-3 border rounded-md flex justify-between items-center">
                      <div>
                        <p className="font-medium">{request.receiverName || request.receiverId}</p>
                        <p className="text-sm text-gray-500">@{request.receiverId}</p>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleCancelRequest(request.id, request.receiverName || request.receiverId)}
                        disabled={cancelRequestMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center py-8 text-gray-500">You haven't sent any friend requests</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 