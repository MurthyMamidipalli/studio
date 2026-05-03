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
    <Sidebar collapsible="offcanvas" side="left" className="border-r border-sidebar-border bg-sidebar shadow-xl">
      <SidebarHeader className="p-4 sm:p-6 bg-sidebar">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-1.5 sm:p-2 rounded-xl shadow-lg shadow-black/20">
            <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
          <span className="font-headline font-bold text-lg sm:text-xl tracking-tight text-sidebar-foreground">
            FitStride
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 sm:px-3 bg-sidebar mt-4">
        <SidebarMenu className="gap-1 sm:gap-1.5">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.href}
                tooltip={item.label}
                className={`transition-all duration-200 py-5 sm:py-6 rounded-xl ${pathname === item.href ? 'bg-white/10 text-white hover:bg-white/15' : 'hover:bg-white/5 text-sidebar-foreground/80 hover:text-white'}`}
              >
                <Link href={item.href} className="flex items-center gap-3 sm:gap-4">
                  <item.icon className={`h-5 w-5 ${pathname === item.href ? 'text-primary' : 'text-sidebar-foreground/60'}`} />
                  <span className="font-medium text-sm sm:text-base">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator className="my-2 sm:my-4 opacity-10 bg-white" />
      <SidebarFooter className="p-2 sm:p-4 bg-sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              tooltip="Logout" 
              onClick={handleLogout}
              className="hover:bg-destructive/20 hover:text-destructive-foreground text-sidebar-foreground/60 py-5 sm:py-6 rounded-xl"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium text-sm sm:text-base">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}