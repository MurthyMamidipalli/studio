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
    <Sidebar collapsible="offcanvas" side="left" className="border-r bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight">
            FitStride
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 mt-4">
        <SidebarMenu className="gap-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.href}
                tooltip={item.label}
                className={`flex items-center gap-3 py-6 px-4 rounded-xl transition-colors ${
                  pathname === item.href 
                    ? 'bg-primary text-primary-foreground font-bold' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <Link href={item.href}>
                  <item.icon className={`h-5 w-5 ${pathname === item.href ? 'text-primary-foreground' : 'text-sidebar-foreground/70'}`} />
                  <span className="text-base">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator className="my-4 opacity-10" />
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              tooltip="Logout" 
              onClick={handleLogout}
              className="flex items-center gap-3 py-6 px-4 rounded-xl text-sidebar-foreground/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-base">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}