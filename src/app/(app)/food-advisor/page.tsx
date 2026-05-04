
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Utensils, Sparkles, RefreshCcw, BrainCircuit, Loader2, Apple, AlertCircle } from "lucide-react";
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
      
      const statsSummary = profile 
        ? `Weight: ${profile.weight || '?'}lb, Height: ${profile.height || '?'}in, Age: ${profile.age || '?'}` 
        : "No stats recorded";

      const result = await generateFoodRecommendations({
        recentWorkouts: workoutSummary,
        userGoals: "Optimize recovery and health.",
        bodyStats: statsSummary
      });
      setAdvice(result);
      toast({ title: "Plan Ready", description: "Your AI nutritional advice has been generated." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Analysis Failed", description: "The AI had trouble processing the request. Please try again." });
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

  // Improved check for new accounts with no data
  const noWorkouts = !workouts || workouts.length === 0;
  const noStats = !profile || (!profile.weight && !profile.height && !profile.age);
  const hasNoData = noWorkouts && noStats;

  if (hasNoData && !advice) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-8 animate-in fade-in duration-700">
        <div className="mx-auto w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary shadow-inner">
          <Utensils className="h-10 w-10" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-headline font-bold text-primary tracking-tight">Personalization Required</h2>
          <p className="text-muted-foreground max-w-sm mx-auto font-medium leading-relaxed">
            We need at least one body stat or a logged workout to generate a scientifically accurate nutrition plan.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Link href="/workouts">
            <Button variant="outline" className="rounded-2xl h-12 px-8 font-bold border-2">
              Log First Workout
            </Button>
          </Link>
          <Link href="/profile">
            <Button className="rounded-2xl h-12 px-8 font-bold shadow-lg">
              Update Body Stats
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
      <div className="text-center space-y-4">
        <div className="p-5 bg-accent/10 rounded-[2rem] text-accent inline-block shadow-sm border border-accent/5">
          <Utensils className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">AI Food Advisor</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto font-medium leading-relaxed">
          Personalized meal suggestions synchronized with your metabolic activity and training intensity.
        </p>
        {!advice && (
          <Button size="lg" onClick={handleGenerateAdvice} disabled={loading} className="mt-4 rounded-2xl shadow-xl bg-primary px-10 h-14 font-black transition-transform hover:scale-105">
            {loading ? <><Loader2 className="animate-spin mr-3 h-5 w-5" /> Syncing Biometrics...</> : <><Sparkles className="mr-3 h-5 w-5" /> Analyze My Daily Plan</>}
          </Button>
        )}
      </div>

      {advice && (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          <Card className="border-none shadow-xl bg-primary/5 rounded-[2.5rem] overflow-hidden border-2 border-primary/10">
            <CardHeader className="bg-primary/10 py-6">
              <CardTitle className="flex items-center gap-3 text-primary text-xl font-headline">
                <BrainCircuit className="h-6 w-6" /> Advisor Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <p className="italic text-foreground/90 font-medium leading-relaxed text-lg">"{advice.advisorNote}"</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {advice.recommendations.map((meal, idx) => (
              <Card key={idx} className="rounded-[2rem] shadow-lg border-none hover:translate-y-[-6px] transition-all duration-300 bg-white">
                <CardHeader className="pb-4">
                  <Badge variant="secondary" className="w-fit bg-accent/10 text-accent border-none font-black uppercase text-[10px] tracking-widest px-3 py-1">
                    {meal.mealType}
                  </Badge>
                  <CardTitle className="text-2xl font-headline font-bold mt-4 tracking-tight">{meal.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">{meal.description}</p>
                  {meal.macros && (
                    <div className="grid grid-cols-3 gap-2 bg-muted/20 p-5 rounded-[1.5rem] border border-muted/50">
                      <MacroBox label="PROTEIN" value={meal.macros.protein} color="text-red-500" />
                      <MacroBox label="CARBS" value={meal.macros.carbs} color="text-orange-500" />
                      <MacroBox label="FATS" value={meal.macros.fats} color="text-sky-600" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 pt-6">
            <Button variant="ghost" onClick={() => setAdvice(null)} className="text-muted-foreground hover:bg-muted/10 font-bold rounded-xl">
              <RefreshCcw className="mr-2 h-4 w-4" /> Reset and Analyze New Data
            </Button>
            <p className="text-[10px] text-muted-foreground font-black tracking-widest uppercase flex items-center gap-2">
              <AlertCircle className="h-3 w-3" /> Recommendations are AI-generated
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function MacroBox({ label, value, color }: any) {
  return (
    <div className="text-center space-y-1">
      <p className={`text-[9px] font-black tracking-tighter ${color} uppercase`}>{label}</p>
      <p className="text-sm font-black text-foreground">{value}</p>
    </div>
  );
}
