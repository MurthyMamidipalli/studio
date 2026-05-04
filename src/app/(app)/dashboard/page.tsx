
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
  Activity as ActivityIcon,
  Sparkles,
  Zap,
  RefreshCw,
  Lightbulb,
  ArrowUpRight
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
import { Badge } from "@/components/ui/badge";

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
    if (!mounted) return { weeklyData: [], recent: [], stats: { totalCals: 0, trend: 0 } };

    const now = new Date();
    let totalCals = 0;
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
      totalCals += cals;
      return { 
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: cals 
      };
    });

    return {
      weeklyData: last7Days,
      recent: workouts || [],
      stats: {
        totalCals,
        trend: Math.round((totalCals / 3500) * 100)
      }
    };
  }, [workouts, mounted]);

  if (!mounted || isProfileLoading || isWorkoutsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile?.name?.split(' ')[0] || user?.displayName?.split(' ')[0] || "User";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-headline font-bold text-primary tracking-tight">
              Welcome back, {displayName}
            </h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center gap-1 h-5 text-[10px] font-bold">
              <RefreshCw className="h-2.5 w-2.5 animate-spin-slow" /> TRACKED AUTOMATICALLY
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Your health data is synchronized in real-time.</p>
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

      {/* QUICK ACTIONS - CTA BUTTONS */}
      <div className="grid grid-cols-3 gap-4">
        <ActionCard href="/workouts" title="Start" desc="Log Session" icon={Zap} color="bg-primary" />
        <ActionCard href="/coach" title="Create" desc="AI Routine" icon={Sparkles} color="bg-accent" />
        <ActionCard href="/activity" title="Analyze" desc="Performance" icon={ActivityIcon} color="bg-card" border />
      </div>

      {/* BIG CARDS - Weekly Trends & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-lg border-none overflow-hidden h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/5">
            <div>
              <CardTitle className="font-headline text-xl">Weekly Energy Trends</CardTitle>
              <CardDescription className="text-xs">Energy expenditure across the last 7 days (kcal)</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[260px] w-full">
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

        {/* INSIGHTS PANEL - Smart Summaries */}
        <Card className="shadow-lg border-none bg-primary/5 h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" /> Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-primary/10">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Weekly Summary</p>
              <p className="text-sm font-medium leading-relaxed">
                You've burned <span className="text-primary font-bold">{processedData.stats.totalCals} kcal</span> this week. That's {processedData.stats.trend}% of your target metabolic activity.
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-primary/10">
              <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">AI Suggestion</p>
              <p className="text-sm font-medium leading-relaxed italic">
                "Try generating a routine based on your last activity! You've shown high intensity recently; a recovery flow would be optimal today."
              </p>
              <Link href="/coach">
                <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-3 text-primary font-bold">
                  Start AI session <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="pt-2">
              <Link href="/activity">
                <Button className="w-full text-xs h-11 font-bold shadow-md" variant="secondary">
                  Open Activity Analysis
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MEDIUM CARD - Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-md border-none">
          <CardHeader className="pb-4">
            <CardTitle className="font-headline text-lg">Recent Session History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {processedData.recent.length > 0 ? (
              processedData.recent.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between p-4 rounded-2xl border border-border/40 bg-card/50 hover:bg-muted/30 transition-all hover:scale-[1.01]">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-10 rounded-full ${w.type === 'Strength' ? 'bg-primary' : 'bg-accent'}`} />
                    <div>
                      <p className="font-bold text-sm truncate">{w.notes || "Activity Log"}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {w.sessionDateTime instanceof Timestamp ? w.sessionDateTime.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Recently"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-primary">{w.durationMinutes}m • {Math.round(w.estimatedCaloriesBurned || 0)} kcal</p>
                    <p className="text-[9px] uppercase tracking-tighter text-muted-foreground font-black">{w.type}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-muted/10 rounded-2xl border border-dashed">
                <p className="text-xs text-muted-foreground font-medium italic">No recent activity logs available.</p>
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
            <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/20 shadow-sm">
              <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Level Progress</div>
              <div className="text-xs font-black text-primary">{(profile?.points || 0) % 100}%</div>
            </div>
            <Link href="/goals" className="block">
              <Button variant="outline" className="w-full text-xs h-11 font-black bg-white shadow-sm border-2">
                Manage Targets <ChevronRight className="h-3 w-3 ml-1" />
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
      <Card className={`${color} ${border ? 'border-2 border-primary/20 bg-card' : 'border-none'} ${color === 'bg-card' ? 'text-foreground' : 'text-primary-foreground'} hover:translate-y-[-4px] transition-all shadow-md group h-full cursor-pointer`}>
        <CardContent className="p-5 flex flex-col items-center justify-center text-center gap-2">
          <div className={`p-2.5 rounded-xl ${color === 'bg-card' ? 'bg-primary/10 text-primary' : 'bg-white/20'}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-tight leading-none">{title}</h3>
            <p className="text-[10px] opacity-70 mt-1.5 uppercase tracking-widest font-black leading-none">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
