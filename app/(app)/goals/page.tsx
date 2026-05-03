
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, CheckCircle2, Circle, TrendingUp, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mockGoals = [
  { id: 1, title: "Weekly Running", target: 10, current: 5.2, unit: "miles", category: "Cardio", status: "In Progress" },
  { id: 2, title: "Strength Sessions", target: 3, current: 2, unit: "sessions", category: "Strength", status: "In Progress" },
  { id: 3, title: "Daily Calories Burned", target: 500, current: 520, unit: "kcal", category: "Activity", status: "Completed" },
  { id: 4, title: "Steps per Day", target: 10000, current: 8430, unit: "steps", category: "Activity", status: "In Progress" },
];

export default function GoalsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-headline font-bold text-primary">Fitness Goals</h1>
          <p className="text-muted-foreground">Set new milestones and track your journey to success.</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" /> Set New Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" /> Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-headline font-bold">84%</p>
            <p className="text-xs text-muted-foreground mt-1">+5% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" /> Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-headline font-bold">4</p>
            <p className="text-xs text-muted-foreground mt-1">2 nearing completion</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/5 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" /> Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-headline font-bold">12 Days</p>
            <p className="text-xs text-muted-foreground mt-1">Your best is 15 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockGoals.map((goal) => (
          <GoalCard key={goal.id} {...goal} />
        ))}
      </div>
    </div>
  );
}

function GoalCard({ title, target, current, unit, category, status }: any) {
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  const isCompleted = status === "Completed";

  return (
    <Card className={`border-none shadow-sm overflow-hidden ${isCompleted ? 'bg-accent/5' : 'bg-card'}`}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-accent text-accent-foreground border-none" : "bg-primary/10 text-primary border-none"}>
            {category}
          </Badge>
          <CardTitle className="font-headline text-xl mt-2">{title}</CardTitle>
          <CardDescription>Target: {target} {unit}</CardDescription>
        </div>
        {isCompleted ? (
          <CheckCircle2 className="h-8 w-8 text-accent shrink-0" />
        ) : (
          <Circle className="h-8 w-8 text-muted shrink-0" />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Progress</span>
            <span>{percentage}%</span>
          </div>
          <Progress value={percentage} className={`h-3 ${isCompleted ? 'bg-accent/20' : ''}`} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-headline font-bold text-primary">{current}</span>
            <span className="text-sm text-muted-foreground">{unit} achieved</span>
          </div>
          <Button variant="outline" size="sm">Edit Goal</Button>
        </div>
      </CardContent>
    </Card>
  );
}
