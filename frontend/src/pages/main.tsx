import { useState, useEffect } from "react"
import { Routes, Route, useLocation, useNavigate } from "react-router-dom"
import { AppSidebar } from "@/components/sidebar/app-sidebar.tsx"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb.tsx"
import { Separator } from "@/components/ui/separator.tsx"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Menu, PanelLeftIcon, X } from "lucide-react"
import { ModeToggle } from "@/components/shadcn-composed/mode-toggle.tsx"
import { cn } from "@/lib/utils.ts"

// Import all content components
import Dashboard from "@/pages/dashboard.tsx"
import Search from "@/pages/search.tsx"
import ForYou from "@/pages/for-you.tsx"
import Tracks from "@/pages/reviewed-tracks.tsx"
import Albums from "@/pages/albums.tsx"
import Artists from "@/components/Artists.tsx"
import TopTracksAndArtists from "@/pages/top-tracks-and-artists.tsx"
import RecentActivity from "@/pages/recent-activity.tsx"
import YourFriends from "@/pages/your-friends.tsx"
import ManageFriends from "@/pages/manage-friends.tsx"
import ProfileInfo from "@/pages/profile-info.tsx"
import ProfileActivity from "@/pages/profile-activity.tsx"
import GeneralSettings from "@/pages/general-settings.tsx"
import AccountSettings from "@/pages/account-settings.tsx"
import RecentlyPlayed from "@/pages/recently-played.tsx"

// Mobile Sidebar Trigger component
function MobileSidebarTrigger() {
  const { toggleSidebar, isMobile, openMobile } = useSidebar()
  
  if (!isMobile) return null
  
  return (
    <Button
      onClick={toggleSidebar}
      className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
        openMobile ? 'bg-destructive text-destructive-foreground rotate-90' : 'bg-primary text-primary-foreground'
      }`}
      size="icon"
      variant="default"
      aria-label="Toggle Menu"
    >
      {openMobile ? (
        <X className="h-6 w-6 transition-transform duration-300" />
      ) : (
        <Menu className="h-6 w-6 transition-transform duration-300" />
      )}
      <span className="sr-only">{openMobile ? 'Close' : 'Open'} Menu</span>
    </Button>
  )
}

// Define content types for type safety
export type ContentView = 
  | "dashboard" 
  | "search" 
  | "forYou" 
  | "tracks" 
  | "albums" 
  | "artists" 
  | "topTracksAndArtists"
  | "recentlyPlayed"
  | "recentActivity" 
  | "yourFriends" 
  | "manageFriends" 
  | "profile"  // Parent-level view
  | "profileInfo" 
  | "profileActivity" 
  | "settings"  // Parent-level view
  | "generalSettings" 
  | "accountSettings"

export default function Main() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ContentView>("search");
  
  // Update activeView based on current location
  useEffect(() => {
    const path = location.pathname.slice(1); // Remove leading slash
    if (path && path !== activeView) {
      setActiveView(path as ContentView);
    }
  }, [location.pathname]);
  
  // Function to change the active view - pass this to your sidebar
  const handleViewChange = (view: ContentView) => {
    console.log("Main received view change:", view);
    setActiveView(view);
    navigate(`/${view}`);
  }
  
  // Function to get the parent category and subcategory for breadcrumbs
  const getBreadcrumbInfo = () => {
    // Map views to their parent categories
    const viewToCategory: Record<ContentView, { category: string, subcategory: string }> = {
      // Discover category
      "dashboard": { category: "Dashboard", subcategory: "" },
      "search": { category: "Discover", subcategory: "Search" },
      "forYou": { category: "Discover", subcategory: "For You" },
      
      // Your Reviews category
      "tracks": { category: "Your Reviews", subcategory: "Tracks" },
      "albums": { category: "Your Reviews", subcategory: "Albums" },
      "artists": { category: "Your Reviews", subcategory: "Artists" },
      
      // Spotify category
      "topTracksAndArtists": { category: "Spotify", subcategory: "Top Tracks & Artists" },
      "recentlyPlayed": { category: "Spotify", subcategory: "Recently Played" },
      // Friends category
      "recentActivity": { category: "Friends", subcategory: "Recent Activity" },
      "yourFriends": { category: "Friends", subcategory: "Your Friends" },
      "manageFriends": { category: "Friends", subcategory: "Manage Friends" },
      
      // Profile category
      "profile": { category: "Profile", subcategory: "" },
      "profileInfo": { category: "Profile", subcategory: "Info" },
      "profileActivity": { category: "Profile", subcategory: "Recent Activity" },
      
      // Settings category
      "settings": { category: "Settings", subcategory: "" },
      "generalSettings": { category: "Settings", subcategory: "General" },
      "accountSettings": { category: "Settings", subcategory: "Account" }
    };
    
    return viewToCategory[activeView] || { category: "Dashboard", subcategory: "" };
  };

  return (
    <SidebarProvider>
      {/* Pass the view change handler to your sidebar */}
      <AppSidebar onViewChange={handleViewChange} activeView={activeView} />
      <SidebarInset className="w-1/2 text-primary">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 md:flex hidden" />
            <ModeToggle />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {/* Updated breadcrumb based on category and subcategory */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink>{getBreadcrumbInfo().category}</BreadcrumbLink>
                </BreadcrumbItem>
                {getBreadcrumbInfo().subcategory && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{getBreadcrumbInfo().subcategory}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="w-full flex flex-1 flex-col gap-4 p-4 pt-0 overflow-hidden h-[calc(100vh-4rem)]">
          <div className="overflow-y-auto overflow-x-hidden h-full">
            <Routes>
              <Route path="/" element={<Search />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/search" element={<Search />} />
              <Route path="/forYou" element={<ForYou />} />
              <Route path="/tracks" element={<Tracks />} />
              <Route path="/albums" element={<Albums />} />
              <Route path="/artists" element={<Artists />} />
              <Route path="/topTracksAndArtists" element={<TopTracksAndArtists />} />
              <Route path="/recentlyPlayed" element={<RecentlyPlayed />} />
              <Route path="/recentActivity" element={<RecentActivity />} />
              <Route path="/yourFriends" element={<YourFriends />} />
              <Route path="/manageFriends" element={<ManageFriends />} />
              <Route path="/profile" element={<ProfileInfo />} />
              <Route path="/profileInfo" element={<ProfileInfo />} />
              <Route path="/profileActivity" element={<ProfileActivity />} />
              <Route path="/settings" element={<GeneralSettings />} />
              <Route path="/generalSettings" element={<GeneralSettings />} />
              <Route path="/accountSettings" element={<AccountSettings />} />
            </Routes>
          </div>
        </div>
      </SidebarInset>
      
      {/* Add the mobile sidebar trigger */}
      <MobileSidebarTrigger />
    </SidebarProvider>
  )
}
