
"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Plus, 
  CheckCircle2, 
  Circle, 
  TrendingUp, 
  Trophy, 
  Loader2, 
  Trash2,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  deleteDocumentNonBlocking,
  setDocumentNonBlocking
} from "@/firebase";
import { collection, query, orderBy, doc, serverTimestamp } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function GoalsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Activity");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("miles");

  const goalsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "users", user.uid, "fitnessGoals"),
      orderBy("createdAt", "desc")
    );
  }, [db, user?.uid]);

  const { data: goals, isLoading } = useCollection(goalsQuery);

  const handleCreateGoal = () => {
    if (!db || !user?.uid || !title || !target) return;
    setLoading(true);

    const goalId = doc(collection(db, "users", user.uid, "fitnessGoals")).id;
    const goalRef = doc(db, "users", user.uid, "fitnessGoals", goalId);

    const newGoal = {
      id: goalId,
      userId: user.uid,
      name: title,
      category,
      targetValue: Number(target),
      currentValue: 0,
      targetUnit: unit,
      status: "In Progress",
      createdAt: serverTimestamp(),
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    setDocumentNonBlocking(goalRef, newGoal, { merge: true });
    
    toast({
      title: "Goal Created",
      description: `You've set a new goal for ${title}!`,
    });

    setTitle("");
    setTarget("");
    setIsDialogOpen(false);
    setLoading(false);
  };

  const handleDeleteGoal = (id: string) => {
    if (!db || !user?.uid) return;
    const goalRef = doc(db, "users", user.uid, "fitnessGoals", id);
    deleteDocumentNonBlocking(goalRef);
    toast({
      title: "Goal Deleted",
      description: "The goal has been removed.",
    });
  };

  const stats = useMemo(() => {
    if (!goals || goals.length === 0) return { success: 0, active: 0, topCategory: "None" };
    const completed = goals.filter(g => g.status === "Completed" || (g.currentValue / g.targetValue >= 1)).length;
    
    const categories = goals.map(g => g.category);
    const mostFrequent = categories.sort((a,b) =>
      categories.filter(v => v===a).length - categories.filter(v => v===b).length
    ).pop();

    return {
      success: Math.round((completed / goals.length) * 100),
      active: goals.filter(g => g.status === "In Progress" && (g.currentValue / g.targetValue < 1)).length,
      topCategory: mostFrequent || "None"
    };
  }, [goals]);

  if (!mounted) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-headline font-bold text-primary">Fitness Goals</h1>
          <p className="text-muted-foreground">Set new milestones and track your journey to success.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" /> Set New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Fitness Goal</DialogTitle>
              <DialogDescription>Define what you want to achieve.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input id="title" placeholder="e.g., Weekly Running" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cardio">Cardio</SelectItem>
                      <SelectItem value="Strength">Strength</SelectItem>
                      <SelectItem value="Activity">Activity</SelectItem>
                      <SelectItem value="Nutrition">Nutrition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Unit</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="miles">Miles</SelectItem>
                      <SelectItem value="sessions">Sessions</SelectItem>
                      <SelectItem value="kcal">Calories</SelectItem>
                      <SelectItem value="steps">Steps</SelectItem>
                      <SelectItem value="lbs">Pounds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="target">Target Value</Label>
                <Input id="target" type="number" placeholder="10" value={target} onChange={(e) => setTarget(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateGoal} disabled={loading || !title || !target}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Goal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" /> Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-headline font-bold">{stats.success}%</p>
            <p className="text-xs text-muted-foreground mt-1">Completion rate</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" /> Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-headline font-bold">{stats.active}</p>
            <p className="text-xs text-muted-foreground mt-1">Currently in progress</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/5 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" /> Focus Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-headline font-bold">{stats.topCategory}</p>
            <p className="text-xs text-muted-foreground mt-1">Most frequent goal type</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : goals && goals.length > 0 ? (
          goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onDelete={() => handleDeleteGoal(goal.id)} />
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold">No active goals found</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-2">
              Your goals list is currently empty. Start tracking your fitness milestones today!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function GoalCard({ goal, onDelete }: any) {
  const current = goal.currentValue || 0;
  const target = goal.targetValue || 1;
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  const isCompleted = goal.status === "Completed" || percentage >= 100;

  return (
    <Card className={`border-none shadow-sm overflow-hidden transition-all hover:shadow-md ${isCompleted ? 'bg-accent/5' : 'bg-card'}`}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-accent text-accent-foreground border-none" : "bg-primary/10 text-primary border-none"}>
            {goal.category}
          </Badge>
          <CardTitle className="font-headline text-xl mt-2">{goal.name}</CardTitle>
          <CardDescription>Target: {target} {goal.targetUnit}</CardDescription>
        </div>
        <div className="flex gap-2">
          {isCompleted ? (
            <CheckCircle2 className="h-8 w-8 text-accent shrink-0" />
          ) : (
            <Circle className="h-8 w-8 text-muted shrink-0" />
          )}
        </div>
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
            <span className="text-sm text-muted-foreground">{goal.targetUnit} achieved</span>
          </div>
          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
