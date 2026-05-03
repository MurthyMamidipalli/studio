
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Flame, 
  Timer, 
  TrendingUp, 
  MapPin, 
  Calendar,
  ChevronRight,
  Target,
  Loader2,
  Info,
  Apple
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, Timestamp } from "firebase/firestore";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useUser();
  const db = useFirestore();

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
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0,0,0,0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);

    // Activity stats
    let totalCaloriesToday = 0;
    let totalMinutesToday = 0;
    let totalDistanceToday = 0;
    let totalWorkoutsThisWeek = 0;
    let totalCaloriesThisWeek = 0;

    if (workouts && workouts.length > 0) {
      workouts.forEach(w => {
        const workoutDate = w.sessionDateTime instanceof Timestamp ? w.sessionDateTime.toDate() : new Date(w.sessionDateTime);
        if (workoutDate >= startOfToday) {
          totalCaloriesToday += Number(w.estimatedCaloriesBurned) || 0;
          totalMinutesToday += Number(w.durationMinutes) || 0;
          totalDistanceToday += Number(w.distance) || 0;
        }
        if (workoutDate >= startOfWeek) {
          totalWorkoutsThisWeek++;
          totalCaloriesThisWeek += Number(w.estimatedCaloriesBurned) || 0;
        }
      });
    }

    // Nutrition stats
    let nutritionCaloriesToday = 0;
    if (nutrition && nutrition.length > 0) {
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
        distance: totalDistanceToday.toFixed(1),
        weeklyWorkouts: totalWorkoutsThisWeek,
        nutritionCalories: Math.round(nutritionCaloriesToday)
      },
      recent: workouts ? workouts.slice(0, 3) : []
    };
  }, [workouts, nutrition]);

  if (isWorkoutsLoading || isNutritionLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasData = workouts && workouts.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold text-primary">Personal Dashboard</h1>
        <p className="text-muted-foreground">Monitor your real activity and nutrition goals.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Daily Burn" 
          value={processedData.metrics.calories} 
          unit="kcal" 
          icon={Flame} 
          color="text-orange-500"
          trend="Workout total"
        />
        <MetricCard 
          title="Calories In" 
          value={processedData.metrics.nutritionCalories} 
          unit="kcal" 
          icon={Apple} 
          color="text-green-500"
          trend="Nutrition total"
        />
        <MetricCard 
          title="Active Time" 
          value={processedData.metrics.minutes} 
          unit="min" 
          icon={Timer} 
          color="text-primary"
          trend="Today's activity"
        />
        <MetricCard 
          title="Weekly Target" 
          value={`${processedData.metrics.weeklyWorkouts}/5`} 
          unit="workouts" 
          icon={Calendar} 
          color="text-purple-500"
          trend={`${Math.min(Math.round((processedData.metrics.weeklyWorkouts / 5) * 100), 100)}% of goal`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-none bg-card/50 overflow-hidden relative">
          {!hasData && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
               <div className="text-center p-6 bg-card rounded-xl shadow-lg border">
                  <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">No workout data found</p>
                  <Link href="/workouts" className="text-xs text-primary hover:underline mt-1 block">Log your first session</Link>
               </div>
            </div>
          )}
          <CardHeader>
            <CardTitle className="font-headline text-lg">Weekly Calories Burned</CardTitle>
            <CardDescription>Energy expenditure over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="h-[300px] w-full">
              <ChartContainer 
                config={{ 
                  calories: { label: "Calories", color: "hsl(var(--primary))" }
                }}
                className="h-full w-full aspect-auto"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedData.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="calories" fill="var(--color-calories)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-lg">Daily Goals</CardTitle>
              <CardDescription>Nutrition & Activity targets</CardDescription>
            </div>
            <Target className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent className="space-y-6">
            <GoalProgress title="Active minutes today" progress={Math.min((processedData.metrics.minutes / 45) * 100, 100)} current={processedData.metrics.minutes} target="45" unit="min" />
            <GoalProgress title="Calories consumed" progress={Math.min((processedData.metrics.nutritionCalories / 2000) * 100, 100)} current={processedData.metrics.nutritionCalories} target="2000" unit="kcal" />
            <GoalProgress title="Weekly workouts" progress={Math.min((processedData.metrics.weeklyWorkouts / 5) * 100, 100)} current={processedData.metrics.weeklyWorkouts} target="5" unit="sess" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-lg">Recent Workouts</CardTitle>
              <CardDescription>Last logged sessions</CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" />
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
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No workouts logged yet.</p>
                <Link href="/workouts" className="text-xs text-primary font-bold mt-2 inline-block">Start your journey</Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-none bg-accent/5">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <Apple className="h-5 w-5 text-accent" /> Fast Food Log
            </CardTitle>
            <CardDescription>Quick access to your nutrition entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <p className="text-sm text-muted-foreground">Log your meals to see macro-nutrient breakdowns and calorie trends here.</p>
               <Link href="/nutrition">
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
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

function MetricCard({ title, value, unit, icon: Icon, color, trend }: any) {
  return (
    <Card className="shadow-sm border-none overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg bg-background ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{trend}</span>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-headline font-bold">{value}</span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GoalProgress({ title, progress, current, target, unit }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground">{current}/{target} {unit}</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}

function RecentWorkoutItem({ type, name, time, result }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-10 rounded-full ${type === 'Strength' ? 'bg-primary' : 'bg-accent'}`} />
        <div>
          <p className="font-medium text-sm truncate max-w-[120px]">{name}</p>
          <p className="text-[10px] text-muted-foreground">{time}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold">{result}</p>
        <p className="text-[10px] text-muted-foreground uppercase">{type}</p>
      </div>
    </div>
  );
}
