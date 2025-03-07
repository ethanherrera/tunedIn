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
  // Add a debug log when a menu item is clicked
  const handleViewChange = (view?: ContentView) => {
    if (view) {
      console.log("Changing view to:", view);
      onViewChange(view);
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
