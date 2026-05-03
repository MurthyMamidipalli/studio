
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Dumbbell, 
  Target, 
  Sparkles, 
  User, 
  LogOut,
  Activity,
  Apple,
  Trophy,
  Users
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Dumbbell, label: "Workouts", href: "/workouts" },
  { icon: Apple, label: "Nutrition", href: "/nutrition" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: Sparkles, label: "AI Coach", href: "/coach" },
  { icon: Users, label: "Social", href: "/social" },
  { icon: Trophy, label: "Achievements", href: "/achievements" },
  { icon: User, label: "Profile", href: "/profile" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully signed out.",
      });
      router.push("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Logout Error",
        description: error.message,
      });
    }
  };

  return (
    <Sidebar collapsible="offcanvas" side="left" className="bg-sidebar border-r border-sidebar-border shadow-xl">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl shadow-lg shrink-0">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight text-sidebar-foreground truncate">
            FitStride
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 mt-4 overflow-hidden">
        <ScrollArea className="h-full">
          <SidebarMenu className="gap-2 pb-4">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  className={`flex items-center gap-3 py-6 px-4 rounded-xl transition-all duration-200 ${
                    pathname === item.href 
                      ? 'bg-primary text-primary-foreground font-bold shadow-lg scale-[1.02] hover:bg-primary/90' 
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Link href={item.href}>
                    <item.icon className={`h-5 w-5 shrink-0 ${pathname === item.href ? 'text-primary-foreground' : 'text-sidebar-foreground/60'}`} />
                    <span className="text-base font-medium truncate">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
      <SidebarSeparator className="my-4 bg-sidebar-border opacity-50" />
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              tooltip="Logout" 
              onClick={handleLogout}
              className="flex items-center gap-3 py-6 px-4 rounded-xl text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive transition-all"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="text-base font-medium truncate">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
