import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Mock API functions
const fetchFriends = async () => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Randomly throw an error for demonstration
  if (Math.random() < 0.2) {
    throw new Error('Failed to fetch friends')
  }
  
  return [
    { id: '1', name: 'Alex Johnson', userId: 'alex_j' },
    { id: '2', name: 'Sam Smith', userId: 'samsmith' },
    { id: '3', name: 'Taylor Wilson', userId: 'taylor_w' },
  ]
}

const fetchSentRequests = async () => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Randomly throw an error for demonstration
  if (Math.random() < 0.2) {
    throw new Error('Failed to fetch sent requests')
  }
  
  return [
    { id: '4', name: 'Jamie Lee', userId: 'jamie_l' },
    { id: '5', name: 'Morgan Chen', userId: 'mchen' },
  ]
}

export default function ManageFriends() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('friends')
  
  const { 
    data: friends, 
    isLoading: isLoadingFriends, 
    isError: isErrorFriends,
    error: friendsError
  } = useQuery({
    queryKey: ['friends'],
    queryFn: fetchFriends
  })
  
  const { 
    data: sentRequests, 
    isLoading: isLoadingSentRequests, 
    isError: isErrorSentRequests,
    error: sentRequestsError
  } = useQuery({
    queryKey: ['sentRequests'],
    queryFn: fetchSentRequests
  })
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Searching for:', searchQuery)
    // Search functionality would be implemented here
  }
  
  return (
    <div className="content-container">
      <h1 className="text-2xl font-bold mb-4">Manage Friends</h1>
      
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
              />
              <Button 
                type="submit"
                className="absolute right-0 top-0 rounded-l-none"
              >
                Search
              </Button>
            </div>
          </form>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="friends" className="flex-1">Friends</TabsTrigger>
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
                        <p className="font-medium">{friend.name}</p>
                        <p className="text-sm text-gray-500">@{friend.userId}</p>
                      </div>
                      <Button variant="destructive" size="sm">Remove</Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center py-8 text-gray-500">You don't have any friends yet</p>
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
                        <p className="font-medium">{request.name}</p>
                        <p className="text-sm text-gray-500">@{request.userId}</p>
                      </div>
                      <Button variant="destructive" size="sm">Cancel</Button>
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