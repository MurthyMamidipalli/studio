"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Flame, 
  Timer, 
  TrendingUp, 
  MapPin, 
  Calendar,
  ChevronRight,
  Target
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const weeklyData = [
  { day: "Mon", calories: 350, distance: 3.2 },
  { day: "Tue", calories: 520, distance: 5.1 },
  { day: "Wed", calories: 210, distance: 2.0 },
  { day: "Thu", calories: 640, distance: 7.2 },
  { day: "Fri", calories: 480, distance: 4.5 },
  { day: "Sat", calories: 890, distance: 10.1 },
  { day: "Sun", calories: 120, distance: 1.2 },
];

const activityData = [
  { name: "Week 1", minutes: 120 },
  { name: "Week 2", minutes: 180 },
  { name: "Week 3", minutes: 150 },
  { name: "Week 4", minutes: 240 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold text-primary">Personal Dashboard</h1>
        <p className="text-muted-foreground">Monitor your daily activity and progress towards goals.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Daily Calories" 
          value="520" 
          unit="kcal" 
          icon={Flame} 
          color="text-orange-500"
          trend="+12% from yesterday"
        />
        <MetricCard 
          title="Active Time" 
          value="45" 
          unit="min" 
          icon={Timer} 
          color="text-primary"
          trend="On track"
        />
        <MetricCard 
          title="Distance" 
          value="5.2" 
          unit="mi" 
          icon={MapPin} 
          color="text-accent"
          trend="+0.5mi vs avg"
        />
        <MetricCard 
          title="Weekly Target" 
          value="3/5" 
          unit="workouts" 
          icon={Calendar} 
          color="text-purple-500"
          trend="60% Complete"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-none bg-card/50">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Weekly Calories Burned</CardTitle>
            <CardDescription>Visualizing your energy expenditure over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={{ 
              calories: { label: "Calories", color: "hsl(var(--primary))" }
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="calories" fill="var(--color-calories)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-card/50">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Active Minutes Trend</CardTitle>
            <CardDescription>Monthly intensity overview</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={{ 
              minutes: { label: "Minutes", color: "hsl(var(--accent))" }
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-minutes)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--color-minutes)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="minutes" stroke="var(--color-minutes)" fillOpacity={1} fill="url(#colorMin)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-lg">Active Goals</CardTitle>
              <CardDescription>Your progress towards current targets</CardDescription>
            </div>
            <Target className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent className="space-y-6">
            <GoalProgress title="Run 10 miles this week" progress={52} current="5.2" target="10" unit="mi" />
            <GoalProgress title="Strength training sessions" progress={66} current="2" target="3" unit="sessions" />
            <GoalProgress title="Burn 3000 calories" progress={35} current="1050" target="3000" unit="kcal" />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-lg">Recent Workouts</CardTitle>
              <CardDescription>Last 3 logged activities</CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="space-y-4">
            <RecentWorkoutItem type="Strength" name="Morning Lift" time="Today, 8:00 AM" result="45 min • 320 kcal" />
            <RecentWorkoutItem type="Cardio" name="Evening Run" time="Yesterday, 6:30 PM" result="5.1 mi • 510 kcal" />
            <RecentWorkoutItem type="Strength" name="Leg Day" time="Oct 24, 5:15 PM" result="60 min • 480 kcal" />
            <button className="w-full text-center text-sm font-medium text-primary hover:underline flex items-center justify-center gap-1 mt-4">
              View all history <ChevronRight className="h-4 w-4" />
            </button>
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
          <p className="font-medium text-sm">{name}</p>
          <p className="text-xs text-muted-foreground">{time}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold">{result}</p>
        <p className="text-[10px] text-muted-foreground uppercase">{type}</p>
      </div>
    </div>
  );
}