
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
  Award
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
      limit(50)
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
      recent: workouts ? workouts.slice(0, 5) : [],
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
            Ready for your next session? Here is your summary.
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
              <CardTitle className="font-headline text-2xl">Calories Burned</CardTitle>
              <CardDescription>Activity overview for the last 7 days</CardDescription>
            </div>
            <Link href="/activity">
              <Button variant="ghost" size="sm" className="text-primary font-bold">
                View Full Activity <ChevronRight className="h-4 w-4 ml-1" />
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

        <div className="space-y-8">
          <Card className="shadow-lg border-none bg-accent/5 overflow-hidden">
            <div className="h-1 bg-accent w-full" />
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-2">
                <ActivityIcon className="h-6 w-6 text-accent" /> Active Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
                <p className="text-sm font-medium leading-relaxed">
                  Your detailed stats (Steps, HR, Distance) have moved to the <strong>Activity Insights</strong> page for a better focused experience.
                </p>
              </div>
              <Link href="/activity">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl h-12 font-bold shadow-md">
                  Check Activity Metrics
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-none bg-card">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-2">
                <Award className="h-6 w-6 text-yellow-500" /> Recent XP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="text-sm font-medium">Daily Goal Bonus</div>
                <div className="text-sm font-bold text-primary">+10 XP</div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="text-sm font-medium">Workout Logged</div>
                <div className="text-sm font-bold text-primary">+50 XP</div>
              </div>
              <Link href="/achievements">
                <Button variant="ghost" className="w-full text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  View Achievements <Trophy className="h-3 w-3 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 pb-10">
        <Card className="shadow-lg border-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-headline text-2xl">Recent Activity Log</CardTitle>
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground mb-4">No activity recorded yet.</p>
                <Link href="/workouts">
                  <Button variant="outline" className="rounded-xl">Start Your First Workout</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RecentWorkoutItem({ type, name, time, result }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-all border border-border/50">
      <div className="flex items-center gap-4">
        <div className={`w-1.5 h-10 rounded-full ${type === 'Strength' ? 'bg-primary' : 'bg-accent'}`} />
        <div>
          <p className="font-bold text-sm truncate max-w-[120px]">{name}</p>
          <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {time}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-black text-primary">{result}</p>
        <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">{type}</p>
      </div>
    </div>
  );
}
