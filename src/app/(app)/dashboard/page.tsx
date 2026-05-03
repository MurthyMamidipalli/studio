
"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Flame, 
  Timer, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  Trophy,
  Loader2,
  Apple,
  Star
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

  const { data: profile } = useDoc(profileRef);

  const workoutsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "users", user.uid, "workoutSessions"),
      orderBy("sessionDateTime", "desc"),
      limit(100)
    );
  }, [db, user?.uid]);

  const nutritionQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "users", user.uid, "nutritionLogs"),
      orderBy("logDate", "desc"),
      limit(50)
    );
  }, [db, user?.uid]);

  const { data: workouts, isLoading: isWorkoutsLoading } = useCollection(workoutsQuery);
  const { data: nutrition, isLoading: isNutritionLoading } = useCollection(nutritionQuery);

  const processedData = useMemo(() => {
    if (!mounted) return {
      weeklyData: [],
      metrics: { calories: 0, minutes: 0, weeklyWorkouts: 0, nutritionCalories: 0 },
      recent: []
    };

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0,0,0,0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);

    let totalCaloriesToday = 0;
    let totalMinutesToday = 0;
    let totalWorkoutsThisWeek = 0;

    if (workouts) {
      workouts.forEach(w => {
        const workoutDate = w.sessionDateTime instanceof Timestamp ? w.sessionDateTime.toDate() : new Date(w.sessionDateTime);
        if (workoutDate >= startOfToday) {
          totalCaloriesToday += Number(w.estimatedCaloriesBurned) || 0;
          totalMinutesToday += Number(w.durationMinutes) || 0;
        }
        if (workoutDate >= startOfWeek) {
          totalWorkoutsThisWeek++;
        }
      });
    }

    let nutritionCaloriesToday = 0;
    if (nutrition) {
      nutrition.forEach(n => {
        const logDate = n.logDate instanceof Timestamp ? n.logDate.toDate() : new Date(n.logDate);
        if (logDate >= startOfToday) {
          nutritionCaloriesToday += Number(n.calories) || 0;
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
      metrics: {
        calories: Math.round(totalCaloriesToday),
        minutes: totalMinutesToday,
        weeklyWorkouts: totalWorkoutsThisWeek,
        nutritionCalories: Math.round(nutritionCaloriesToday)
      },
      recent: workouts ? workouts.slice(0, 3) : []
    };
  }, [workouts, nutrition, mounted]);

  if (!mounted || isWorkoutsLoading || isNutritionLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Keep pushing toward your fitness milestones.</p>
        </div>
        <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
           <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full shrink-0">
              <Star className="h-4 w-4 md:h-5 md:w-5 text-primary fill-primary" />
              <span className="font-bold text-sm md:text-base text-primary">{profile?.points || 0} XP</span>
           </div>
           <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full shrink-0">
              <Flame className="h-4 w-4 md:h-5 md:w-5 text-orange-500 fill-orange-500" />
              <span className="font-bold text-sm md:text-base text-orange-500">{profile?.currentStreak || 0}d Streak</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard title="Daily Burn" value={processedData.metrics.calories} unit="kcal" icon={Flame} color="text-orange-500" />
        <MetricCard title="Calories In" value={processedData.metrics.nutritionCalories} unit="kcal" icon={Apple} color="text-green-500" />
        <MetricCard title="Active Time" value={processedData.metrics.minutes} unit="min" icon={Timer} color="text-primary" />
        <MetricCard title="Weekly Goals" value={`${processedData.metrics.weeklyWorkouts}/5`} unit="workouts" icon={Calendar} color="text-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-none bg-card/50 overflow-hidden relative">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Weekly Activity</CardTitle>
            <CardDescription>Calories burned over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-[250px] md:h-[300px] w-full">
              <ChartContainer config={{ calories: { label: "Calories", color: "hsl(var(--primary))" } }} className="h-full w-full aspect-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedData.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="calories" fill="var(--color-calories)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-card">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" /> Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-2">
               <p className="text-sm text-muted-foreground mb-4">You have earned {profile?.earnedBadges?.length || 0} badges.</p>
               <Link href="/achievements" className="w-full">
                  <Button variant="outline" className="w-full">View My Trophies</Button>
               </Link>
            </div>
            <GoalProgress title="Active minutes today" progress={Math.min((processedData.metrics.minutes / 45) * 100, 100)} current={processedData.metrics.minutes} target="45" unit="min" />
            <GoalProgress title="Calories consumed" progress={Math.min((processedData.metrics.nutritionCalories / 2000) * 100, 100)} current={processedData.metrics.nutritionCalories} target="2000" unit="kcal" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        <Card className="shadow-sm border-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-headline text-lg">Recent Effort</CardTitle>
                <CardDescription>Your latest workouts</CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {processedData.recent.length > 0 ? (
              processedData.recent.map((w: any) => (
                <RecentWorkoutItem key={w.id} type={w.type} name={w.notes || "Workout"} time={w.sessionDateTime instanceof Timestamp ? w.sessionDateTime.toDate().toLocaleDateString() : "Recently"} result={`${w.durationMinutes} min • ${Math.round(w.estimatedCaloriesBurned || 0)} kcal`} />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
                <Link href="/workouts" className="text-xs text-primary font-bold mt-2 inline-block hover:underline">Start your journey</Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-none bg-accent/5">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <Apple className="h-5 w-5 text-accent" /> Nutrition Tracker
            </CardTitle>
            <CardDescription>Energy balance & macros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <p className="text-sm text-muted-foreground leading-relaxed">Log your meals to maintain your streak and earn points.</p>
               <Link href="/nutrition">
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-md">
                    Go to Nutrition Tracker <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
               </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit, icon: Icon, color }: any) {
  return (
    <Card className="shadow-sm border-none overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg bg-background ${color} shadow-sm`}>
            <Icon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-xl md:text-2xl font-headline font-bold">{value}</span>
            <span className="text-xs md:text-sm text-muted-foreground">{unit}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GoalProgress({ title, progress, current, target, unit }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs md:text-sm">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground">{current}/{target} {unit}</span>
      </div>
      <Progress value={progress} className="h-1.5 md:h-2" />
    </div>
  );
}

function RecentWorkoutItem({ type, name, time, result }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
      <div className="flex items-center gap-3">
        <div className={`w-1.5 h-8 md:h-10 rounded-full ${type === 'Strength' ? 'bg-primary' : 'bg-accent'}`} />
        <div>
          <p className="font-medium text-sm truncate max-w-[100px] sm:max-w-[150px]">{name}</p>
          <p className="text-[10px] text-muted-foreground">{time}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold">{result}</p>
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{type}</p>
      </div>
    </div>
  );
}
