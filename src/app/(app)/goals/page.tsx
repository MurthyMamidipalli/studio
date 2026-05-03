
"use client";

import { useState, useMemo } from "react";
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
  AlertCircle,
  Footprints,
  Scale,
  Flame,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  setDocumentNonBlocking, 
  deleteDocumentNonBlocking 
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

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Steps");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("steps");

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
    };

    setDocumentNonBlocking(goalRef, newGoal, { merge: true });
    
    toast({
      title: "Goal Created",
      description: `You've set a new ${category} target!`,
    });

    // Reset Form
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
    const completed = goals.filter(g => g.status === "Completed").length;
    // Simple category count
    const categories = goals.map(g => g.category);
    const mostFrequent = categories.reduce((a, b, i, arr) => arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b, null);

    return {
      success: Math.round((completed / goals.length) * 100),
      active: goals.filter(g => g.status === "In Progress").length,
      topCategory: mostFrequent || "Steps"
    };
  }, [goals]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-headline font-bold text-primary">Personal Goals</h1>
          <p className="text-muted-foreground">Define your targets for steps, weight, and fitness benchmarks.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" /> Set New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Fitness Target</DialogTitle>
              <DialogDescription>Choose a category and set your benchmark.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Goal Label</Label>
                <Input id="title" placeholder="e.g., Summer Body 2024" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={category} onValueChange={(v) => {
                    setCategory(v);
                    if (v === 'Steps') setUnit('steps');
                    if (v === 'Weight Loss') setUnit('lbs');
                    if (v === 'Calories') setUnit('kcal');
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Steps">Step Count</SelectItem>
                      <SelectItem value="Weight Loss">Weight Loss</SelectItem>
                      <SelectItem value="Calories">Calories Burned</SelectItem>
                      <SelectItem value="Activity">Active Minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Unit</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="steps">Steps</SelectItem>
                      <SelectItem value="lbs">Lbs</SelectItem>
                      <SelectItem value="kcal">Kcal</SelectItem>
                      <SelectItem value="min">Minutes</SelectItem>
                      <SelectItem value="mi">Miles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="target">Target Value</Label>
                <Input id="target" type="number" placeholder="10000" value={target} onChange={(e) => setTarget(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateGoal} disabled={loading || !title || !target}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Pursuit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-none shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground font-medium text-xs uppercase"><Trophy className="h-4 w-4 text-yellow-500" /> Success Rate</div>
          <p className="text-3xl font-headline font-bold">{stats.success}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">Completion across all history</p>
        </Card>
        <Card className="bg-accent/5 border-none shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground font-medium text-xs uppercase"><Target className="h-4 w-4 text-accent" /> Active Pursuits</div>
          <p className="text-3xl font-headline font-bold">{stats.active}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Live goals currently tracking</p>
        </Card>
        <Card className="bg-orange-500/5 border-none shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground font-medium text-xs uppercase"><Zap className="h-4 w-4 text-orange-500" /> Primary Focus</div>
          <p className="text-3xl font-headline font-bold">{stats.topCategory}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Your most targeted area</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : goals && goals.length > 0 ? (
          goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onDelete={() => handleDeleteGoal(goal.id)} />
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold">No benchmarks set</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-2">Set your first fitness goal to start tracking progress automatically.</p>
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

  const getIcon = () => {
    switch (goal.category) {
      case 'Steps': return <Footprints className="h-5 w-5" />;
      case 'Weight Loss': return <Scale className="h-5 w-5" />;
      case 'Calories': return <Flame className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  return (
    <Card className={`border-none shadow-sm overflow-hidden ${isCompleted ? 'bg-accent/5 ring-1 ring-accent/20' : 'bg-card'}`}>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex gap-4">
          <div className={`p-2 rounded-lg ${isCompleted ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
            {getIcon()}
          </div>
          <div>
            <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary"}>
              {goal.category}
            </Badge>
            <CardTitle className="font-headline text-lg mt-1">{goal.name}</CardTitle>
          </div>
        </div>
        {isCompleted ? <CheckCircle2 className="h-6 w-6 text-accent shrink-0" /> : <Circle className="h-6 w-6 text-muted shrink-0" />}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span>{percentage}% Complete</span>
            <span>{current} / {target} {goal.targetUnit}</span>
          </div>
          <Progress value={percentage} className={`h-2.5 ${isCompleted ? 'bg-accent/20' : ''}`} />
        </div>
        <div className="flex items-center justify-between pt-2">
          <p className="text-[10px] text-muted-foreground italic">Target: {target} {goal.targetUnit}</p>
          <Button variant="ghost" size="sm" className="text-destructive h-8 px-2 hover:bg-destructive/10" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
