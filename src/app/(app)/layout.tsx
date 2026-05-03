
"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, "users", user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(profileRef);
  
  const displayName = profile?.name || user?.displayName || user?.email?.split('@')[0] || "User";
  const photoURL = profile?.photoURL || user?.photoURL || `https://picsum.photos/seed/${user?.uid}/200/200`;

  if (!mounted || isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-md md:px-6">
          <SidebarTrigger className="text-primary hover:bg-primary/10 rounded-lg p-2" />
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium hidden sm:inline-block">Welcome back, {displayName}</span>
            <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-primary/20 shadow-sm">
              <img src={photoURL} alt={displayName} className="h-full w-full object-cover" />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden w-full max-w-full">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
