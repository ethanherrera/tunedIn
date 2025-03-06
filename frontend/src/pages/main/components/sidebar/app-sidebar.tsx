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
  PieChart,
  Settings,
  Settings2,
  SquareTerminal,
  Star,
  User,
} from "lucide-react"

import { NavMain } from "@/pages/main/components/sidebar/nav-main"
import { NavProjects } from "@/pages/main/components/sidebar/nav-projects"
import { NavUser } from "@/pages/main/components/sidebar/nav-user"
import { TeamSwitcher } from "@/pages/main/components/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/pages/main/components/sidebar/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "sinistercode",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
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
  ],
  navMain: [
    {
      title: "Discover",
      url: "#",
      icon: Compass,
      isActive: true,
      items: [
        {
          title: "Search",
          url: "#",
        },
        {
          title: "For You",
          url: "#",
        },
      ],
    },
    {
      title: "Your Reviews",
      url: "#",
      icon: Star,
      items: [
        {
          title: "Tracks",
          url: "#",
        },
        {
          title: "Albums",
          url: "#",
        },
        {
          title: "Artists",
          url: "#",
        },
      ],
    },
    {
      title: "Friends",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Recent Activity",
          url: "#",
        },
        {
          title: "Your Friends",
          url: "#",
        },
        {
          title: "Manage Friends",
          url: "#",
        }
      ],
    },
    {
      title: "Profile",
      url: "#",
      icon: User,
      items: [
        {
          title: "Info",
          url: "#",
        },
        {
          title: "Recent Activity",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Account",
          url: "#",
        },
      ],
    },
  ],
  projects: [
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
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
