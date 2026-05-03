
"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, "users", user.uid, "profile");
  }, [db, user?.uid]);

  const { data: profile } = useDoc(profileRef);
  const displayName = profile?.name || user?.displayName || "User";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
          <SidebarTrigger />
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium hidden sm:inline-block">Welcome back, {displayName}</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
