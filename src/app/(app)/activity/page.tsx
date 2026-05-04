
"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Footprints, 
  Heart, 
  MapPin, 
  Flame, 
  Timer, 
  Loader2, 
  Activity as ActivityIcon,
  TrendingUp,
  History
} from "lucide-react";
import { 
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

export default function ActivityInsightsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const workoutsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "users", user.uid, "workoutSessions"),
      orderBy("sessionDateTime", "desc"),
      limit(100)
    );
  }, [db, user?.uid]);

  const { data: workouts, isLoading } = useCollection(workoutsQuery);

  const processedData = useMemo(() => {
    if (!workouts || !mounted) return { charts: [], metrics: { steps: 0, hr: 0, distance: "0.0", calories: 0, minutes: 0 } };
    
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0,0,0,0);

    let totalStepsToday = 0;
    let totalCaloriesToday = 0;
    let totalDistanceToday = 0;
    let totalMinutesToday = 0;
    let latestHr = 0;

    const chronological = [...workouts]
      .sort((a, b) => {
        const dateA = a.sessionDateTime instanceof Timestamp ? a.sessionDateTime.toMillis() : new Date(a.sessionDateTime).getTime();
        const dateB = b.sessionDateTime instanceof Timestamp ? b.sessionDateTime.toMillis() : new Date(b.sessionDateTime).getTime();
        return dateA - dateB;
      });

    chronological.forEach(w => {
      const workoutDate = w.sessionDateTime instanceof Timestamp ? w.sessionDateTime.toDate() : new Date(w.sessionDateTime);
      if (workoutDate >= startOfToday) {
        totalStepsToday += Number(w.steps) || 0;
        totalCaloriesToday += Number(w.estimatedCaloriesBurned) || 0;
        totalDistanceToday += Number(w.distance) || 0;
        totalMinutesToday += Number(w.durationMinutes) || 0;
        if (w.heartRate > 0) latestHr = w.heartRate;
      }
    });

    const chartData = chronological.map(w => ({
      date: w.sessionDateTime instanceof Timestamp ? w.sessionDateTime.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Date",
      steps: Number(w.steps) || 0,
      hr: Number(w.heartRate) || 0,
      distance: Number(w.distance) || 0,
      calories: Number(w.estimatedCaloriesBurned) || 0
    }));

    return {
      charts: chartData,
      metrics: {
        steps: totalStepsToday,
        hr: latestHr,
        distance: totalDistanceToday.toFixed(1),
        calories: Math.round(totalCaloriesToday),
        minutes: totalMinutesToday
      }
    };
  }, [workouts, mounted]);

  if (!mounted || isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary flex items-center gap-3">
          <ActivityIcon className="h-8 w-8" /> Health & Activity Insights
        </h1>
        <p className="text-muted-foreground text-lg">Detailed analysis of your daily steps, heart rate, and performance trends.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Steps" value={processedData.metrics.steps} unit="steps" icon={Footprints} color="text-blue-500" />
        <MetricCard title="Heart Rate" value={processedData.metrics.hr || "--"} unit="bpm" icon={Heart} color="text-red-500" />
        <MetricCard title="Distance" value={processedData.metrics.distance} unit="mi" icon={MapPin} color="text-green-500" />
        <MetricCard title="Active Burn" value={processedData.metrics.calories} unit="kcal" icon={Flame} color="text-orange-500" />
        <MetricCard title="Active Time" value={processedData.metrics.minutes} unit="min" icon={Timer} color="text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl bg-card overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="font-headline flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Performance Trend
            </CardTitle>
            <CardDescription>Step count visualization over time</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px] w-full mt-4">
              <ChartContainer config={{ steps: { label: "Steps", color: "hsl(var(--primary))" } }} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={processedData.charts}>
                    <defs>
                      <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={10} minTickGap={30} />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="steps" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorSteps)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-card">
          <CardHeader className="bg-accent/5">
            <CardTitle className="font-headline flex items-center gap-2">
              <History className="h-5 w-5 text-accent" /> Tracked History
            </CardTitle>
            <CardDescription>Recent metrics recorded from your sessions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              {processedData.charts.length > 0 ? (
                [...processedData.charts].reverse().map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <p className="font-bold text-sm">{item.date}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Logged Data</p>
                    </div>
                    <div className="flex gap-4 text-xs font-bold text-right">
                       <div>
                         <p className="text-primary">{item.steps}</p>
                         <p className="text-[8px] text-muted-foreground">STEPS</p>
                       </div>
                       <div>
                         <p className="text-red-500">{item.hr || "--"}</p>
                         <p className="text-[8px] text-muted-foreground">BPM</p>
                       </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground italic">
                  Start logging sessions to see your health data here.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit, icon: Icon, color }: any) {
  return (
    <Card className="shadow-md border-none overflow-hidden hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
      <CardContent className="p-5 md:p-6">
        <div className={`p-3 w-fit rounded-2xl bg-muted/50 ${color} shadow-inner mb-4 group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{title}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-xl md:text-2xl font-headline font-bold">{value}</span>
            <span className="text-[8px] text-muted-foreground font-bold">{unit}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
