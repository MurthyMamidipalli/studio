
"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Flame, 
  TrendingUp, 
  ChevronRight,
  Trophy,
  Loader2,
  Star,
  Calendar,
  Zap,
  Activity as ActivityIcon
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
      limit(100)
    );
  }, [db, user?.uid]);

  const { data: workouts, isLoading: isWorkoutsLoading } = useCollection(workoutsQuery);

  const processedData = useMemo(() => {
    if (!mounted) return { weeklyData: [], recent: [], metrics: { steps: 0, calories: 0, distance: 0, minutes: 0 } };

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0,0,0,0);

    let totalStepsToday = 0;
    let totalCaloriesToday = 0;
    let totalDistanceToday = 0;
    let totalMinutesToday = 0;

    if (workouts) {
      workouts.forEach(w => {
        const workoutDate = w.sessionDateTime instanceof Timestamp ? w.sessionDateTime.toDate() : new Date(w.sessionDateTime);
        if (workoutDate >= startOfToday) {
          totalStepsToday += Number(w.steps) || 0;
          totalCaloriesToday += Number(w.estimatedCaloriesBurned) || 0;
          totalDistanceToday += Number(w.distance) || 0;
          totalMinutesToday += Number(w.durationMinutes) || 0;
        }
      });
    }

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
      recent: workouts ? workouts.slice(0, 3) : [],
      metrics: {
        steps: totalStepsToday,
        calories: Math.round(totalCaloriesToday),
        distance: totalDistanceToday.toFixed(1),
        minutes: totalMinutesToday
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

  const firstName = profile?.name?.split(' ')[0] || user?.displayName?.split(' ')[0] || "User";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary tracking-tight">
            Welcome back, {firstName}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Ready for your next session? Here is your daily summary.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-2xl shadow-sm border border-primary/20">
            <Star className="h-5 w-5 text-primary fill-primary" />
            <span className="font-bold text-lg text-primary">{profile?.points || 0} XP</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-500/10 px-4 py-2 rounded-2xl shadow-sm border border-orange-500/20">
            <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
            <span className="font-bold text-lg text-orange-500">{profile?.currentStreak || 0}d</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-xl border-none bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-2xl">Weekly Activity</CardTitle>
              <CardDescription>Calories burned over the last 7 days</CardDescription>
            </div>
            <Link href="/activity">
              <Button variant="ghost" size="sm" className="text-primary font-bold">
                Detailed Insights <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-[300px] w-full mt-4">
              <ChartContainer config={{ calories: { label: "Calories", color: "hsl(var(--primary))" } }} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedData.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="calories" fill="var(--color-calories)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-none bg-card">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" /> Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pt-4">
            <GoalProgress title="Daily Steps" progress={Math.min((processedData.metrics.steps / 10000) * 100, 100)} current={processedData.metrics.steps} target="10,000" unit="steps" />
            <GoalProgress title="Active Time" progress={Math.min((processedData.metrics.minutes / 45) * 100, 100)} current={processedData.metrics.minutes} target="45" unit="min" />
            <GoalProgress title="Distance Goal" progress={Math.min((Number(processedData.metrics.distance) / 3) * 100, 100)} current={processedData.metrics.distance} target="3" unit="mi" />
            <div className="pt-6">
              <Link href="/goals">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12 text-lg font-bold shadow-lg">
                  Set New Targets
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
        <Card className="shadow-lg border-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-headline text-xl">Recent Efforts</CardTitle>
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {processedData.recent.length > 0 ? (
              processedData.recent.map((w: any) => (
                <RecentWorkoutItem 
                  key={w.id} 
                  type={w.type} 
                  name={w.notes || "Workout"} 
                  time={w.sessionDateTime instanceof Timestamp ? w.sessionDateTime.toDate().toLocaleDateString() : "Recently"} 
                  result={`${w.durationMinutes} min • ${Math.round(w.estimatedCaloriesBurned || 0)} kcal`} 
                />
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">No activity recorded yet.</p>
                <Link href="/workouts">
                  <Button variant="outline" className="rounded-xl">Start Your First Workout</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-none bg-accent/5 overflow-hidden">
          <div className="h-1 bg-accent w-full" />
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <ActivityIcon className="h-6 w-6 text-accent" /> Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
              <p className="text-sm font-medium leading-relaxed">
                Looking for detailed stats like Heart Rate, Distance, and Steps? Head over to the Activity Insights page.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/activity">
                <Button variant="outline" className="w-full rounded-xl h-12 font-bold">
                  View Full Metrics
                </Button>
              </Link>
              <Link href="/coach">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl h-12 font-bold shadow-md">
                  Ask AI Coach for Advice
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GoalProgress({ title, progress, current, target, unit }: any) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm md:text-base">
        <span className="font-bold text-foreground/80">{title}</span>
        <span className="text-muted-foreground font-mono">{current}/{target} {unit}</span>
      </div>
      <Progress value={progress} className="h-3 rounded-full" />
    </div>
  );
}

function RecentWorkoutItem({ type, name, time, result }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-all border border-transparent hover:border-border/50">
      <div className="flex items-center gap-4">
        <div className={`w-2 h-12 rounded-full ${type === 'Strength' ? 'bg-primary' : 'bg-accent'}`} />
        <div>
          <p className="font-bold text-base truncate max-w-[150px]">{name}</p>
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {time}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-primary">{result}</p>
        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{type}</p>
      </div>
    </div>
  );
}
