"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

// Import ContentView type
import { type ContentView } from "@/pages/main/pages/Main"

interface NavMainProps {
  items: {
    title: string
    view?: ContentView
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      view: ContentView
    }[]
  }[]
  onViewChange: (view: ContentView) => void
  activeView: ContentView
}

export function NavMain({ items, onViewChange, activeView }: NavMainProps) {
  // Get sidebar context to access mobile state and close function
  const { isMobile, setOpenMobile } = useSidebar();
  
  // Handle view change and automatically collapse sidebar on mobile
  const handleViewChange = (view?: ContentView) => {
    if (view) {
      console.log("Changing view to:", view);
      onViewChange(view);
      
      // If on mobile, close the sidebar after selecting a menu item
      if (isMobile) {
        setTimeout(() => {
          setOpenMobile(false);
        }, 150); // Small delay for better UX
      }
    }
  };

  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>Platform</SidebarGroupLabel> */}
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton 
                  tooltip={item.title}
                  data-active={item.items?.some(subItem => subItem.view === activeView) ? "true" : undefined}
                  onClick={() => item.view && handleViewChange(item.view)}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton 
                        onClick={() => handleViewChange(subItem.view)}
                        data-active={subItem.view === activeView ? "true" : undefined}
                      >
                        <span>{subItem.title}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
