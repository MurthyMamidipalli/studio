
"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight,
  Trophy,
  Loader2,
  Star,
  RefreshCw,
  Lightbulb,
  ArrowUpRight,
  Zap,
  Save
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
      limit(10)
    );
  }, [db, user?.uid]);

  const { data: workouts, isLoading: isWorkoutsLoading } = useCollection(workoutsQuery);

  const processedData = useMemo(() => {
    if (!mounted) {
      return { 
        weeklyData: Array.from({ length: 7 }, (_, i) => ({ day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i], calories: 0 })), 
        recent: [], 
        stats: { totalCals: 0, trend: 0 } 
      };
    }

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

  const displayName = profile?.name?.split(' ')[0] || user?.displayName?.split(' ')[0] || "Athlete";
  const autoSaveOn = profile?.autoSave ?? true;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-headline font-bold text-primary tracking-tight">
              Hello, {displayName}
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${autoSaveOn ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-muted text-muted-foreground'} flex items-center gap-1.5 h-6 text-[10px] font-black uppercase tracking-widest`}>
                <Save className="h-3 w-3" /> {autoSaveOn ? "Auto-Save Active" : "Manual Save Mode"}
              </Badge>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 flex items-center gap-1.5 h-6 text-[10px] font-black uppercase tracking-widest">
                <RefreshCw className="h-3 w-3 animate-spin-slow" /> Tracking On
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Your real-time biometric hub is synchronized.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/actions">
            <Button className="bg-primary font-black shadow-lg hover:scale-105 transition-transform rounded-xl h-11 px-6">
              <Zap className="h-4 w-4 mr-2" /> Quick Actions
            </Button>
          </Link>
          <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20 shadow-sm">
            <Star className="h-4 w-4 text-primary fill-primary" />
            <span className="font-black text-primary text-sm">{profile?.points || 0} XP</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BIG CARD: Weekly Trend */}
        <Card className="lg:col-span-2 shadow-xl border-none overflow-hidden h-full rounded-[2.5rem] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4 bg-muted/5 border-b border-muted/20">
            <div>
              <CardTitle className="font-headline text-2xl font-bold">Weekly Performance</CardTitle>
              <CardDescription className="text-xs font-medium uppercase tracking-widest mt-1 text-muted-foreground">Calories burned per session</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-[320px] w-full">
              <ChartContainer config={{ calories: { label: "Calories", color: "hsl(var(--primary))" } }} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedData.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} dy={10} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="calories" fill="var(--color-calories)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* INSIGHTS PANEL: Smart Summaries */}
        <Card className="shadow-xl border-none bg-primary/5 h-full rounded-[2.5rem] flex flex-col border-2 border-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-headline font-bold flex items-center gap-3 text-primary">
              <Lightbulb className="h-6 w-6 text-yellow-500 fill-yellow-500" /> Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex-1">
            <div className="p-5 bg-white rounded-[1.5rem] shadow-md border border-primary/10 transition-transform hover:scale-[1.02]">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Metabolic Trend</p>
              <p className="text-sm font-semibold leading-relaxed">
                You've achieved <span className="text-primary font-black text-lg">{processedData.stats.totalCals} kcal</span> burn this week. Maintain this intensity!
              </p>
            </div>
            
            <div className="p-5 bg-white rounded-[1.5rem] shadow-md border border-accent/10 transition-transform hover:scale-[1.02]">
              <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-2">AI Guidance</p>
              <p className="text-sm font-semibold leading-relaxed italic text-foreground/80">
                "Based on your recent activity, a recovery session or higher protein intake is recommended."
              </p>
              <Link href="/food-advisor">
                <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-4 text-primary font-black uppercase tracking-widest">
                  View Advisor <ArrowUpRight className="h-3 w-3 ml-1.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MEDIUM CARD: Session History */}
        <Card className="lg:col-span-2 shadow-xl border-none rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="pb-4 border-b border-muted/20">
            <CardTitle className="font-headline text-xl font-bold">Recent History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {processedData.recent.length > 0 ? (
              processedData.recent.slice(0, 4).map((w: any) => (
                <div key={w.id} className="flex items-center justify-between p-5 rounded-[1.5rem] border border-border/40 bg-card hover:bg-muted/30 hover:border-primary/20 transition-all group shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-12 rounded-full ${w.type === 'Strength' ? 'bg-primary' : 'bg-accent'}`} />
                    <div>
                      <p className="font-black text-base truncate max-w-[150px] sm:max-w-none">{w.notes || "Activity Log"}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">
                        {w.sessionDateTime instanceof Timestamp ? w.sessionDateTime.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Recently"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-primary">{Math.round(w.estimatedCaloriesBurned || 0)} <span className="text-[10px]">kcal</span></p>
                    <p className="text-[9px] uppercase tracking-tighter text-muted-foreground font-black bg-muted/50 px-2 py-0.5 rounded-md mt-1">{w.type}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-muted/5 rounded-[2rem] border-2 border-dashed border-muted">
                <p className="text-sm font-bold text-muted-foreground italic">No workout data found. Log a session to see trends.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SMALL CARD: Level & Progression */}
        <Card className="shadow-xl border-none bg-accent/5 rounded-[2.5rem] flex flex-col border-2 border-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-3">
              <Trophy className="h-5 w-5 text-primary" /> My Rank
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4 flex-1">
            <div className="flex flex-col gap-4 p-5 rounded-[1.5rem] bg-white border border-border/20 shadow-md">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Progression</span>
                <span className="text-sm font-black text-primary">{(profile?.points || 0) % 100}%</span>
              </div>
              <div className="w-full bg-muted/50 h-3 rounded-full overflow-hidden shadow-inner">
                <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${(profile?.points || 0) % 100}%` }} />
              </div>
            </div>
            <Link href="/goals" className="block mt-auto">
              <Button variant="outline" className="w-full text-xs h-12 font-black bg-white shadow-md border-2 rounded-2xl transition-transform hover:scale-[1.02]">
                Track Targets <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
