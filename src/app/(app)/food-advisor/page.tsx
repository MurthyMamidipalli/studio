
"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Utensils, Sparkles, RefreshCcw, BrainCircuit, Apple, Beef, Wheat, Droplets, Loader2 } from "lucide-react";
import { generateFoodRecommendations, type FoodRecommendationOutput } from "@/ai/flows/ai-food-advisor";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function FoodAdvisorPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<FoodRecommendationOutput | null>(null);

  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, "users", user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isLoadingProfile } = useDoc(profileRef);

  const workoutsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "users", user.uid, "workoutSessions"),
      orderBy("sessionDateTime", "desc"),
      limit(3)
    );
  }, [db, user?.uid]);

  const { data: workouts, isLoading: isLoadingWorkouts } = useCollection(workoutsQuery);

  const handleGenerateAdvice = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const workoutSummary = workouts && workouts.length > 0 
        ? workouts.map(w => `${w.type} for ${w.durationMinutes}m`).join(", ")
        : "None";
      
      const statsSummary = profile ? `Weight: ${profile.weight || '?'}lb, Height: ${profile.height || '?'}in` : "No stats";

      const result = await generateFoodRecommendations({
        recentWorkouts: workoutSummary,
        userGoals: "Optimize recovery and health",
        bodyStats: statsSummary
      });
      setAdvice(result);
      toast({ title: "Advice Ready", description: "Your AI meal plan is generated." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Failed", description: "Could not analyze data." });
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingProfile || isLoadingWorkouts) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  const hasNoData = (!workouts || workouts.length === 0) && (!profile || (!profile.weight && !profile.height));

  if (hasNoData && !advice) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6 animate-in fade-in duration-700">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <Utensils className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-headline font-bold">No data to analyze</h2>
          <p className="text-muted-foreground max-w-sm mx-auto font-medium">
            We need body stats or a logged workout to generate a food plan.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Link href="/workouts"><Button variant="outline">Log a Workout</Button></Link>
          <Link href="/profile"><Button>Update Profile</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="text-center space-y-4">
        <div className="p-4 bg-accent/10 rounded-3xl text-accent inline-block">
          <Utensils className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">AI Food Advisor</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Personalized meal suggestions based on your metabolic activity.
        </p>
        {!advice && (
          <Button size="lg" onClick={handleGenerateAdvice} disabled={loading} className="mt-4 rounded-2xl shadow-xl">
            {loading ? <><Loader2 className="animate-spin mr-2" /> Analyzing...</> : <><Sparkles className="mr-2" /> Analyze My Data</>}
          </Button>
        )}
      </div>

      {advice && (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
          <Card className="border-none shadow-xl bg-primary/5 rounded-3xl">
            <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><BrainCircuit /> Advisor Summary</CardTitle></CardHeader>
            <CardContent><p className="italic text-foreground/80">"{advice.advisorNote}"</p></CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {advice.recommendations.map((meal, idx) => (
              <Card key={idx} className="rounded-3xl shadow-md border-none">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">{meal.mealType}</Badge>
                  <CardTitle className="text-xl font-bold mt-2">{meal.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{meal.description}</p>
                  {meal.macros && (
                    <div className="grid grid-cols-3 gap-2 bg-muted/20 p-4 rounded-2xl">
                      <MacroBox label="P" value={meal.macros.protein} color="text-red-500" />
                      <MacroBox label="C" value={meal.macros.carbs} color="text-orange-500" />
                      <MacroBox label="F" value={meal.macros.fats} color="text-sky-600" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <Button variant="outline" className="w-full" onClick={() => setAdvice(null)}><RefreshCcw className="mr-2" /> Reset</Button>
        </div>
      )}
    </div>
  );
}

function MacroBox({ label, value, color }: any) {
  return (
    <div className="text-center">
      <p className={`text-[10px] font-black ${color}`}>{label}</p>
      <p className="text-xs font-black">{value}</p>
    </div>
  );
}
