
"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Flame, 
  ChevronRight,
  Trophy,
  Loader2,
  Star,
  Calendar,
  Activity as ActivityIcon,
  TrendingUp,
  PlusCircle,
  PlayCircle,
  BarChart3,
  Sparkles
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, doc, Timestamp } from "firebase/firestore";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, "users", user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const workoutsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "users", user.uid, "workoutSessions"),
      orderBy("sessionDateTime", "desc"),
      limit(5)
    );
  }, [db, user?.uid]);

  const { data: workouts, isLoading: isWorkoutsLoading } = useCollection(workoutsQuery);

  const processedData = useMemo(() => {
    if (!mounted) return { weeklyData: [], recent: [] };

    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      const dateStr = d.toDateString();
      let cals = 0;
      if (workouts) {
        workouts.forEach(w => {
          const workoutDate = w.sessionDateTime instanceof Timestamp ? w.sessionDateTime.toDate() : new Date(w.sessionDateTime);
          if (workoutDate.toDateString() === dateStr) {
            cals += Number(w.estimatedCaloriesBurned) || 0;
          }
        });
      }
      return { 
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: cals 
      };
    });

    return {
      weeklyData: last7Days,
      recent: workouts || [],
    };
  }, [workouts, mounted]);

  if (!mounted || isProfileLoading || isWorkoutsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const firstName = profile?.name?.split(' ')[0] || user?.displayName?.split(' ')[0] || "User";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      {/* HEADER SECTION - Simplified */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary tracking-tight">
            Welcome, {firstName}
          </h1>
          <p className="text-muted-foreground text-sm">Summary of your fitness progress.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
            <Star className="h-4 w-4 text-primary fill-primary" />
            <span className="font-bold text-primary">{profile?.points || 0} XP</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
            <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
            <span className="font-bold text-orange-500">{profile?.currentStreak || 0}d</span>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS - Grouped & Consistent Spacing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard href="/coach" title="AI Coach" desc="Personal Routine" icon={Sparkles} color="bg-primary" />
        <ActionCard href="/activity" title="Analyze" desc="Health Hub" icon={BarChart3} color="bg-accent" />
        <ActionCard href="/workouts" title="Workout" desc="Log Session" icon={PlayCircle} color="bg-card" border />
      </div>

      {/* BIG CARD - Key Metrics */}
      <Card className="shadow-lg border-none overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="font-headline text-xl">Weekly Energy</CardTitle>
            <CardDescription className="text-xs">Energy expenditure (kcal)</CardDescription>
          </div>
          <Link href="/activity">
            <Button variant="ghost" size="sm" className="text-primary h-8 px-2 font-bold">
              Details <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[300px] w-full mt-2">
            <ChartContainer config={{ calories: { label: "Calories", color: "hsl(var(--primary))" } }} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} dy={10} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="calories" fill="var(--color-calories)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MEDIUM CARD - Recent Activity */}
        <Card className="lg:col-span-2 shadow-md border-none">
          <CardHeader className="pb-4">
            <CardTitle className="font-headline text-lg">Recent History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {processedData.recent.length > 0 ? (
              processedData.recent.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card/50 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full ${w.type === 'Strength' ? 'bg-primary' : 'bg-accent'}`} />
                    <div>
                      <p className="font-bold text-sm truncate">{w.notes || "Workout"}</p>
                      <p className="text-[10px] text-muted-foreground">{w.sessionDateTime instanceof Timestamp ? w.sessionDateTime.toDate().toLocaleDateString() : "Recently"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-primary">{w.durationMinutes}m • {Math.round(w.estimatedCaloriesBurned || 0)} kcal</p>
                    <p className="text-[8px] uppercase tracking-tighter text-muted-foreground">{w.type}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-muted/10 rounded-xl border border-dashed">
                <p className="text-xs text-muted-foreground">No recent workouts.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SMALL CARD - Secondary Tools */}
        <Card className="shadow-md border-none bg-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" /> Progression
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/20">
              <div className="text-xs font-medium">Session Bonus</div>
              <div className="text-xs font-bold text-primary">+50 XP</div>
            </div>
            <Link href="/goals" className="block">
              <Button variant="outline" className="w-full text-xs h-9 font-bold tracking-tight">
                Update Goals <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActionCard({ href, title, desc, icon: Icon, color, border }: any) {
  return (
    <Link href={href}>
      <Card className={`${color} ${border ? 'border-2 border-primary/20' : 'border-none'} ${color === 'bg-card' ? 'text-foreground' : 'text-primary-foreground'} hover:opacity-90 transition-all shadow-md group`}>
        <CardContent className="p-5 flex items-center gap-4">
          <div className={`p-2 rounded-lg ${color === 'bg-card' ? 'bg-primary/10 text-primary' : 'bg-white/20'} group-hover:scale-110 transition-transform`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-none">{title}</h3>
            <p className="text-[10px] opacity-70 mt-1">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
