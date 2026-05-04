
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
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  History
} from "lucide-react";
import { 
  LineChart, 
  Line, 
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
import { Button } from "@/components/ui/button";

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

  const statsData = useMemo(() => {
    if (!workouts || !mounted) return [];
    
    // Sort chronologically for the chart
    return [...workouts]
      .sort((a, b) => {
        const dateA = a.sessionDateTime instanceof Timestamp ? a.sessionDateTime.toMillis() : new Date(a.sessionDateTime).getTime();
        const dateB = b.sessionDateTime instanceof Timestamp ? b.sessionDateTime.toMillis() : new Date(b.sessionDateTime).getTime();
        return dateA - dateB;
      })
      .map(w => ({
        date: w.sessionDateTime instanceof Timestamp ? w.sessionDateTime.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Date",
        steps: Number(w.steps) || 0,
        hr: Number(w.heartRate) || 0,
        distance: Number(w.distance) || 0,
        calories: Number(w.estimatedCaloriesBurned) || 0
      }));
  }, [workouts, mounted]);

  if (!mounted || isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary flex items-center gap-3">
          <ActivityIcon className="h-8 w-8" /> Activity Insights
        </h1>
        <p className="text-muted-foreground text-lg">Detailed analysis of your health journey and workout trends.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TrendCard title="Step Trends" icon={Footprints} color="text-blue-500" data={statsData} dataKey="steps" />
        <TrendCard title="Heart Rhythm" icon={Heart} color="text-red-500" data={statsData} dataKey="hr" />
        <TrendCard title="Distance Log" icon={MapPin} color="text-green-500" data={statsData} dataKey="distance" />
        <TrendCard title="Caloric Burn" icon={Flame} color="text-orange-500" data={statsData} dataKey="calories" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl bg-card overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="font-headline flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Progress Over Time
            </CardTitle>
            <CardDescription>Visualizing your workout consistency and metrics.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px] w-full mt-4">
              <ChartContainer config={{ steps: { label: "Steps", color: "hsl(var(--primary))" } }} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={statsData}>
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
              <History className="h-5 w-5 text-accent" /> Data History
            </CardTitle>
            <CardDescription>A chronological view of your logged sessions.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              {statsData.length > 0 ? (
                [...statsData].reverse().map((item, idx) => (
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
                       <div>
                         <p className="text-green-500">{item.distance}</p>
                         <p className="text-[8px] text-muted-foreground">MILES</p>
                       </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground italic">
                  No data points available yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TrendCard({ title, icon: Icon, color, data, dataKey }: any) {
  return (
    <Card className="border-none shadow-md overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-xl bg-muted/50 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-black text-muted-foreground tracking-tighter uppercase">{title}</span>
        </div>
        <div className="h-16 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line type="monotone" dataKey={dataKey} stroke="currentColor" strokeWidth={2} dot={false} className={color} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
