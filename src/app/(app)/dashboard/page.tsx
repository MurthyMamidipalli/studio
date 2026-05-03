
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
  Star,
  Footprints,
  Heart,
  MapPin
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
      metrics: { calories: 0, minutes: 0, weeklyWorkouts: 0, nutritionCalories: 0, steps: 0, heartRate: 0, distance: 0 },
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
    let totalStepsToday = 0;
    let totalDistanceToday = 0;
    let latestHeartRate = 0;

    if (workouts) {
      const todayWorkouts = workouts.filter(w => {
        const workoutDate = w.sessionDateTime instanceof Timestamp ? w.sessionDateTime.toDate() : new Date(w.sessionDateTime);
        return workoutDate >= startOfToday;
      });

      todayWorkouts.forEach(w => {
        totalCaloriesToday += Number(w.estimatedCaloriesBurned) || 0;
        totalMinutesToday += Number(w.durationMinutes) || 0;
        totalStepsToday += Number(w.steps) || 0;
        totalDistanceToday += Number(w.distance) || 0;
      });

      // Get latest HR if available
      const hrWorkout = workouts.find(w => w.heartRate > 0);
      if (hrWorkout) latestHeartRate = hrWorkout.heartRate;

      workouts.forEach(w => {
        const workoutDate = w.sessionDateTime instanceof Timestamp ? w.sessionDateTime.toDate() : new Date(w.sessionDateTime);
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
        nutritionCalories: Math.round(nutritionCaloriesToday),
        steps: totalStepsToday,
        heartRate: latestHeartRate,
        distance: totalDistanceToday.toFixed(2)
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
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {profile?.name || 'Athlete'}. Here's your status.</p>
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <MetricCard title="Steps" value={processedData.metrics.steps} unit="steps" icon={Footprints} color="text-blue-500" />
        <MetricCard title="Active Burn" value={processedData.metrics.calories} unit="kcal" icon={Flame} color="text-orange-500" />
        <MetricCard title="Heart Rate" value={processedData.metrics.heartRate || "--"} unit="bpm" icon={Heart} color="text-red-500" />
        <MetricCard title="Distance" value={processedData.metrics.distance} unit="mi" icon={MapPin} color="text-green-500" />
        <MetricCard title="Time" value={processedData.metrics.minutes} unit="min" icon={Timer} color="text-purple-500" />
        <MetricCard title="Daily Fuel" value={processedData.metrics.nutritionCalories} unit="kcal" icon={Apple} color="text-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-none bg-card/50 overflow-hidden">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Weekly Activity</CardTitle>
            <CardDescription>Energy expenditure trends</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-[300px] w-full">
              <ChartContainer config={{ calories: { label: "Calories", color: "hsl(var(--primary))" } }} className="h-full w-full">
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
              <Trophy className="h-5 w-5 text-yellow-500" /> Daily Targets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <GoalProgress title="Steps goal" progress={Math.min((processedData.metrics.steps / 10000) * 100, 100)} current={processedData.metrics.steps} target="10000" unit="steps" />
            <GoalProgress title="Active minutes" progress={Math.min((processedData.metrics.minutes / 45) * 100, 100)} current={processedData.metrics.minutes} target="45" unit="min" />
            <GoalProgress title="Distance target" progress={Math.min((Number(processedData.metrics.distance) / 3) * 100, 100)} current={processedData.metrics.distance} target="3.0" unit="mi" />
            <div className="pt-4">
              <Link href="/goals">
                <Button variant="outline" className="w-full">View All Goals</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-headline text-lg">Recent Effort</CardTitle>
                <CardDescription>Your latest workout activities</CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
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
                  result={`${w.durationMinutes}m • ${Math.round(w.estimatedCaloriesBurned || 0)} kcal`} 
                  sub={w.steps ? `${w.steps} steps` : w.distance ? `${w.distance} mi` : undefined}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
                <Link href="/workouts" className="text-xs text-primary font-bold mt-2 inline-block hover:underline">Start logging</Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-none bg-accent/5">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <Apple className="h-5 w-5 text-accent" /> Nutrition Tracker
            </CardTitle>
            <CardDescription>Keep your fuel on track</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <p className="text-sm text-muted-foreground leading-relaxed">Maintaining your weight goals starts in the kitchen. Log your daily intake to see progress.</p>
               <div className="grid grid-cols-2 gap-4 pb-2">
                 <div className="text-center p-3 rounded-lg bg-background">
                    <p className="text-xl font-bold">{processedData.metrics.nutritionCalories}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Calories In</p>
                 </div>
                 <div className="text-center p-3 rounded-lg bg-background">
                    <p className="text-xl font-bold">{Math.max(2000 - processedData.metrics.nutritionCalories, 0)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Remaining</p>
                 </div>
               </div>
               <Link href="/nutrition">
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-md">
                    Log Today's Meal <ChevronRight className="h-4 w-4 ml-1" />
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
      <CardContent className="p-4">
        <div className={`p-2 w-fit rounded-lg bg-background ${color} shadow-sm mb-3`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-tight">{title}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-lg md:text-xl font-headline font-bold">{value}</span>
            <span className="text-[10px] text-muted-foreground">{unit}</span>
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
      <Progress value={progress} className="h-2" />
    </div>
  );
}

function RecentWorkoutItem({ type, name, time, result, sub }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
      <div className="flex items-center gap-3">
        <div className={`w-1.5 h-10 rounded-full ${type === 'Strength' ? 'bg-primary' : 'bg-accent'}`} />
        <div>
          <p className="font-medium text-sm truncate max-w-[120px]">{name}</p>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-muted-foreground">{time}</p>
            {sub && <span className="text-[10px] text-primary font-bold">• {sub}</span>}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold">{result}</p>
        <p className="text-[10px] text-muted-foreground uppercase font-bold">{type}</p>
      </div>
    </div>
  );
}
