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
  Users,
  LineChart,
  Zap,
  Utensils
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Zap, label: "Actions", href: "/actions" },
  { icon: LineChart, label: "Activity", href: "/activity" },
  { icon: Dumbbell, label: "Workouts", href: "/workouts" },
  { icon: Apple, label: "Nutrition", href: "/nutrition" },
  { icon: Utensils, label: "Food Advisor", href: "/food-advisor" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: Sparkles, label: "AI Coach", href: "/coach" },
  { icon: Users, label: "Social", href: "/social" },
  { icon: Trophy, label: "Achievements", href: "/achievements" },
  { icon: User, label: "Profile", href: "/profile" },
];

const SIDEBAR_WIDTH_MOBILE = "18rem";

export function AppSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { openMobile, setOpenMobile } = useSidebar();

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

  const SidebarInner = (
    <div className="flex h-full w-full flex-col bg-sidebar">
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
      <SidebarContent className="px-3 mt-4 overflow-hidden flex-1">
        <ScrollArea className="h-full pr-2">
          <SidebarMenu className="gap-2 pb-4">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  onClick={() => isMobile && setOpenMobile(false)}
                  className={`flex items-center gap-3 py-6 px-4 rounded-xl transition-all duration-200 ${
                    pathname === item.href 
                      ? 'bg-primary text-primary-foreground font-bold shadow-lg scale-[1.02] hover:bg-primary/90' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Link href={item.href}>
                    <item.icon className={`h-5 w-5 shrink-0 ${pathname === item.href ? 'text-primary-foreground' : 'text-sidebar-foreground'}`} />
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
              className="flex items-center gap-3 py-6 px-4 rounded-xl text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-all"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="text-base font-medium truncate">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side="left"
          className="p-0 border-none bg-sidebar w-[--sidebar-width]"
          style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Access your fitness dashboard, logs, and community challenges.</SheetDescription>
          </SheetHeader>
          {SidebarInner}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sidebar collapsible="offcanvas" side="left" className="bg-sidebar border-r border-sidebar-border shadow-xl">
      {SidebarInner}
    </Sidebar>
  );
}
