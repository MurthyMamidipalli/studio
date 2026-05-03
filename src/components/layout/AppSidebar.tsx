
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
    <Sidebar collapsible="offcanvas" side="left" className="border-r">
      <SidebarHeader className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-1.5 sm:p-2 rounded-xl shadow-lg shadow-primary/20">
            <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
          <span className="font-headline font-bold text-lg sm:text-xl tracking-tight text-primary">
            FitStride
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 sm:px-3">
        <SidebarMenu className="gap-1 sm:gap-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.href}
                tooltip={item.label}
                className={`transition-all duration-200 py-4 sm:py-6 ${pathname === item.href ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'hover:bg-muted'}`}
              >
                <Link href={item.href} className="flex items-center gap-3 sm:gap-4">
                  <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-medium text-sm sm:text-base">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator className="my-2 sm:my-4 opacity-50" />
      <SidebarFooter className="p-2 sm:p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              tooltip="Logout" 
              onClick={handleLogout}
              className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground py-4 sm:py-6"
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-medium text-sm sm:text-base">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
