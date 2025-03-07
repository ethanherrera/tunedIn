import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Compass,
  Frame,
  GalleryVerticalEnd,
  Map,
  Music,
  PieChart,
  Settings,
  Settings2,
  SquareTerminal,
  Star,
  User,
} from "lucide-react"

import { NavMain } from "@/pages/main/components/sidebar/nav-main"
import { NavUser } from "@/pages/main/components/sidebar/nav-user"
import { TeamSwitcher } from "@/pages/main/components/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { userApi } from "@/api/apiClient"
import { type ContentView } from "@/pages/main/pages/Main"
import "@/index.css" 

// Default data values
const defaultUser = {
  name: "user",
  avatar: "/avatars/shadcn.jpg",
}

const defaultTeams = [
  {
    name: "tunedIn",
    logo: AudioWaveform,
    plan: "Enterprise",
  },
  {
    name: "Acme Corp.",
    logo: AudioWaveform,
    plan: "Startup",
  },
  {
    name: "Evil Corp.",
    logo: Command,
    plan: "Free",
  },
]

const defaultNavMain = [
  {
    title: "Discover",
    url: "#",
    icon: Compass,
    items: [
      {
        title: "Search",
        view: "search",
      },
      {
        title: "For You",
        view: "forYou",
      },
    ],
  },
  {
    title: "Your Reviews",
    icon: Star,
    items: [
      {
        title: "Tracks",
        view: "tracks",
      },
      {
        title: "Albums",
        view: "albums",
      },
      {
        title: "Artists",
        view: "artists",
      },
    ],
  },
  {
    title: "Spotify",
    icon: Music,
    items: [
      {
        title: "Top Tracks",
        view: "topTracks",
      },
      {
        title: "Top Artists",
        view: "topArtists",
      },
    ]
  },
  {
    title: "Friends",
    icon: BookOpen,
    items: [
      {
        title: "Recent Activity",
        view: "recentActivity",
      },
      {
        title: "Your Friends",
        view: "yourFriends",
      },
      {
        title: "Manage Friends",
        view: "manageFriends",
      }
    ],
  },
  {
    title: "Profile",
    icon: User,
    items: [
      {
        title: "Info",
        view: "profileInfo",
      },
      {
        title: "Recent Activity",
        view: "profileActivity",
      },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    items: [
      {
        title: "General",
        view: "generalSettings",
      },
      {
        title: "Account",
        view: "accountSettings",
      },
    ],
  },
]

const defaultProjects = [
  {
    name: "Design Engineering",
    url: "#",
    icon: Frame,
  },
  {
    name: "Sales & Marketing",
    url: "#",
    icon: PieChart,
  },
  {
    name: "Travel",
    url: "#",
    icon: Map,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onViewChange: (view: ContentView) => void
  activeView: ContentView
}

export function AppSidebar({ onViewChange, activeView, ...props }: AppSidebarProps) {
  // State variables with default values
  const [user, setUser] = React.useState<{ name: string; avatar: string } | null>(null);
  const [teams, setTeams] = React.useState(defaultTeams);
  const [navMain, setNavMain] = React.useState(defaultNavMain);
  const [projects, setProjects] = React.useState(defaultProjects);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch user profile on component mount
  React.useEffect(() => {
    let isMounted = true;
    
    const fetchUserProfile = async () => {
      try {
        const userProfile = await userApi.getProfile();
        
        // Only update state if component is still mounted
        if (isMounted) {
          // Update user state with data from API
          setUser({
            name: userProfile.display_name,
            avatar: userProfile.images.length > 0 ? userProfile.images[0].url : defaultUser.avatar,
          });
          // Set loading to false after state is updated
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // Keep default user data on error
        if (isMounted) {
          setUser(defaultUser);
          setIsLoading(false);
        }
      }
    };

    fetchUserProfile();
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, []);

  // Determine which nav item should be active based on activeView
  React.useEffect(() => {
    const updatedNavMain = defaultNavMain.map(item => ({
      ...item,
      isActive: item.items?.some(subItem => subItem.view === activeView)
    }));
    
    setNavMain(updatedNavMain);
  }, [activeView]);

  // Log the activeView to debug
  React.useEffect(() => {
    console.log("Active view in AppSidebar:", activeView);
  }, [activeView]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain 
          items={navMain as any} 
          onViewChange={onViewChange} 
          activeView={activeView}
        />
      </SidebarContent>
      <SidebarFooter>
        {/* Only render NavUser when user data is fully loaded */}
        {!isLoading && user && <NavUser user={user} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
