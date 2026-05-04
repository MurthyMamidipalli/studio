
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
  RefreshCw,
  Zap,
  Save
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
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, doc, Timestamp } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";

export default function ActivityInsightsPage() {
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
      limit(50)
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

  const autoSaveOn = profile?.autoSave ?? true;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary flex items-center gap-2">
            <ActivityIcon className="h-6 w-6" /> Activity Insights Hub
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Real-time performance and biometric tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`${autoSaveOn ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-muted text-muted-foreground'} flex items-center gap-1.5 h-8 px-4 font-black tracking-widest text-[10px]`}>
            <Save className="h-3 w-3 mr-1" /> {autoSaveOn ? "AUTO-SAVE ENABLED" : "MANUAL SYNC"}
          </Badge>
          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 h-8 px-4 flex items-center gap-2 font-black tracking-widest text-[10px]">
            <RefreshCw className="h-3 w-3 animate-spin-slow" /> SYNC ACTIVE
          </Badge>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white">
        <div className="bg-primary/5 p-2.5 px-6 flex items-center gap-2 border-b">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Daily Real-Time Metrics</span>
        </div>
        <CardContent className="p-8 grid grid-cols-2 md:grid-cols-5 gap-10">
          <CompactMetric title="Steps" value={processedData.metrics.steps} icon={Footprints} color="text-blue-500" />
          <CompactMetric title="Heart Rate" value={processedData.metrics.hr || "--"} unit="bpm" icon={Heart} color="text-red-500" />
          <CompactMetric title="Distance" value={processedData.metrics.distance} unit="mi" icon={MapPin} color="text-green-500" />
          <CompactMetric title="Active Burn" value={processedData.metrics.calories} unit="kcal" icon={Flame} color="text-orange-500" />
          <CompactMetric title="Active Time" value={processedData.metrics.minutes} unit="min" icon={Timer} color="text-primary" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/5 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full mt-2">
              <ChartContainer config={{ steps: { label: "Steps", color: "hsl(var(--primary))" } }} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={processedData.charts}>
                    <defs>
                      <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={10} minTickGap={30} />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="steps" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorSteps)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CompactMetric({ title, value, unit, icon: Icon, color }: any) {
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div className={`p-3.5 rounded-2xl bg-muted/50 ${color} shadow-sm group-hover:scale-110 transition-transform`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5">{title}</p>
        <p className="text-2xl font-headline font-black mt-1 leading-none text-foreground">
          {value}<span className="text-sm ml-1 font-bold text-muted-foreground uppercase">{unit}</span>
        </p>
      </div>
    </div>
  );
}
