import { useState, useEffect } from "react"
import { AppSidebar } from "@/pages/main/components/sidebar/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// Import all content components
import Dashboard from "@/pages/main/content/Dashboard"
import Search from "@/pages/main/content/Search"
import ForYou from "@/pages/main/content/ForYou"
import Tracks from "@/pages/main/content/Tracks"
import Albums from "@/pages/main/content/Albums"
import Artists from "@/pages/main/content/Artists"
import TopTracks from "@/pages/main/content/TopTracks"
import TopArtists from "@/pages/main/content/TopArtists"
import RecentActivity from "@/pages/main/content/RecentActivity"
import YourFriends from "@/pages/main/content/YourFriends"
import ManageFriends from "@/pages/main/content/ManageFriends"
import ProfileInfo from "@/pages/main/content/ProfileInfo"
import ProfileActivity from "@/pages/main/content/ProfileActivity"
import GeneralSettings from "@/pages/main/content/GeneralSettings"
import AccountSettings from "@/pages/main/content/AccountSettings"
import { ModeToggle } from "@/components/mode-toggle"
// Define content types for type safety
export type ContentView = 
  | "dashboard" 
  | "search" 
  | "forYou" 
  | "tracks" 
  | "albums" 
  | "artists" 
  | "topTracks" 
  | "topArtists" 
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
  // State to track which content to display
  const [activeView, setActiveView] = useState<ContentView>("search")
  
  // Function to change the active view - pass this to your sidebar
  const handleViewChange = (view: ContentView) => {
    console.log("Main received view change:", view);
    setActiveView(view)
  }
  
  // Debug effect to log when activeView changes
  useEffect(() => {
    console.log("Active view in Main is now:", activeView);
  }, [activeView]);
  
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
      "topTracks": { category: "Spotify", subcategory: "Top Tracks" },
      "topArtists": { category: "Spotify", subcategory: "Top Artists" },
      
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
  
  // Render the appropriate content based on activeView
  const renderContent = () => {
    console.log("Rendering content for view:", activeView);
    
    switch (activeView) {
      case "dashboard":
        return <Dashboard />
      case "search":
        return <Search />
      case "forYou":
        return <ForYou />
      case "tracks":
        return <Tracks />
      case "albums":
        return <Albums />
      case "artists":
        return <Artists />
      case "topTracks":
        return <TopTracks />
      case "topArtists":
        return <TopArtists />
      case "recentActivity":
        return <RecentActivity />
      case "yourFriends":
        return <YourFriends />
      case "manageFriends":
        return <ManageFriends />
      case "profile": // Handle parent-level "profile" view
        return <ProfileInfo /> // Default to ProfileInfo for parent view
      case "profileInfo":
        return <ProfileInfo />
      case "profileActivity":
        return <ProfileActivity />
      case "settings": // Handle parent-level "settings" view
        return <GeneralSettings /> // Default to GeneralSettings for parent view
      case "generalSettings":
        return <GeneralSettings />
      case "accountSettings":
        return <AccountSettings />
      default:
        console.log("Default case hit with activeView:", activeView);
        return <Dashboard />
    }
  }

  return (
    <SidebarProvider>
      {/* Pass the view change handler to your sidebar */}
      <AppSidebar onViewChange={handleViewChange} activeView={activeView} />
      <SidebarInset className="w-1/2 text-primary">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
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
            {/* Render the active content */}
            {renderContent()}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
