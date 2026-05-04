
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Utensils, Sparkles, RefreshCcw, BrainCircuit, Loader2, Apple } from "lucide-react";
import { generateFoodRecommendations, type FoodRecommendationOutput } from "@/ai/flows/ai-food-advisor";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function FoodAdvisorPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<FoodRecommendationOutput | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        : "None recent";
      
      const statsSummary = profile ? `Weight: ${profile.weight || '?'}lb, Height: ${profile.height || '?'}in, Age: ${profile.age || '?'}` : "No stats recorded";

      const result = await generateFoodRecommendations({
        recentWorkouts: workoutSummary,
        userGoals: "Optimize recovery, energy levels, and overall health.",
        bodyStats: statsSummary
      });
      setAdvice(result);
      toast({ title: "Analysis Complete", description: "Your personalized AI meal plan is ready." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Analysis Failed", description: "We couldn't process your data. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || isLoadingProfile || isLoadingWorkouts) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If new account has absolutely no data
  const hasNoData = (!workouts || workouts.length === 0) && (!profile || (!profile.weight && !profile.height));

  if (hasNoData && !advice) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6 animate-in fade-in duration-700">
        <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <Utensils className="h-12 w-12" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-headline font-bold text-primary">No data to analyze</h2>
          <p className="text-muted-foreground max-w-sm mx-auto font-medium">
            We need your body stats or at least one logged workout to generate a custom nutrition plan.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Link href="/workouts"><Button variant="outline" className="rounded-xl">Log Workout</Button></Link>
          <Link href="/profile"><Button className="rounded-xl">Update Stats</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
      <div className="text-center space-y-4">
        <div className="p-5 bg-accent/10 rounded-[2rem] text-accent inline-block shadow-sm">
          <Utensils className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">AI Food Advisor</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto font-medium">
          Personalized meal suggestions synchronized with your metabolic activity and training intensity.
        </p>
        {!advice && (
          <Button size="lg" onClick={handleGenerateAdvice} disabled={loading} className="mt-4 rounded-2xl shadow-xl bg-primary px-8">
            {loading ? <><Loader2 className="animate-spin mr-2" /> Syncing Data...</> : <><Sparkles className="mr-2" /> Analyze My Daily Plan</>}
          </Button>
        )}
      </div>

      {advice && (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          <Card className="border-none shadow-xl bg-primary/5 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-primary/10">
              <CardTitle className="flex items-center gap-3 text-primary text-xl">
                <BrainCircuit className="h-6 w-6" /> Advisor Logic
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="italic text-foreground/90 font-medium leading-relaxed">"{advice.advisorNote}"</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {advice.recommendations.map((meal, idx) => (
              <Card key={idx} className="rounded-[2rem] shadow-lg border-none hover:translate-y-[-4px] transition-transform">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit bg-accent/10 text-accent border-none font-black uppercase text-[10px] tracking-widest">
                    {meal.mealType}
                  </Badge>
                  <CardTitle className="text-2xl font-headline font-bold mt-3">{meal.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">{meal.description}</p>
                  {meal.macros && (
                    <div className="grid grid-cols-3 gap-4 bg-muted/20 p-5 rounded-2xl border border-muted">
                      <MacroBox label="PROTEIN" value={meal.macros.protein} color="text-red-500" />
                      <MacroBox label="CARBS" value={meal.macros.carbs} color="text-orange-500" />
                      <MacroBox label="FATS" value={meal.macros.fats} color="text-sky-600" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <Button variant="ghost" onClick={() => setAdvice(null)} className="text-muted-foreground hover:bg-muted/10 font-bold">
              <RefreshCcw className="mr-2 h-4 w-4" /> Reset and Analyze New Data
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MacroBox({ label, value, color }: any) {
  return (
    <div className="text-center space-y-1">
      <p className={`text-[9px] font-black tracking-tighter ${color}`}>{label}</p>
      <p className="text-sm font-black text-foreground">{value}</p>
    </div>
  );
}
