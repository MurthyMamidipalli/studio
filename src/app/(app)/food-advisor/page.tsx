
"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Utensils, Sparkles, RefreshCcw, BrainCircuit, Apple, Beef, Wheat, Droplets, Loader2, AlertCircle, ArrowRight } from "lucide-react";
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
        ? workouts.map(w => `${w.type} session for ${w.durationMinutes} mins`).join(", ")
        : "No recent workouts logged.";
      
      const goalsSummary = "Maintain health and fitness.";
      const statsSummary = profile ? `Weight: ${profile.weight || 'unknown'} lbs, Height: ${profile.height || 'unknown'} in, Age: ${profile.age || 'unknown'}` : "No stats available.";

      const result = await generateFoodRecommendations({
        recentWorkouts: workoutSummary,
        userGoals: goalsSummary,
        bodyStats: statsSummary
      });
      setAdvice(result);
      toast({ title: "Advice Ready", description: "Your personalized meal plan has been generated." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Generation Failed", description: "Could not analyze data at this time." });
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingProfile || isLoadingWorkouts) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
            We need your health stats or at least one logged workout to generate a personalized AI meal plan.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Link href="/workouts">
            <Button variant="outline" className="rounded-xl border-2">Log a Workout</Button>
          </Link>
          <Link href="/profile">
            <Button className="rounded-xl shadow-md">Update Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="p-4 bg-accent/10 rounded-3xl text-accent shadow-sm">
          <Utensils className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">AI Food Advisor</h1>
        <p className="text-muted-foreground text-lg max-w-xl font-medium">
          Personalized meal suggestions synced with your metabolic activity.
        </p>
        {!advice && (
          <Button 
            size="lg" 
            onClick={handleGenerateAdvice} 
            disabled={loading}
            className="bg-primary hover:bg-primary/90 mt-4 shadow-xl px-10 py-7 text-lg rounded-2xl transition-all hover:scale-105"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Analyzing Biometrics...</>
            ) : (
              <><Sparkles className="h-5 w-5 mr-2" /> Analyze My Data</>
            )}
          </Button>
        )}
      </div>

      {advice && (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
          <Card className="border-none shadow-xl bg-primary/5 rounded-3xl overflow-hidden">
            <div className="bg-primary h-1.5 w-full" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary font-headline">
                <BrainCircuit className="h-5 w-5" /> AI Nutritionist Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed italic text-foreground/80 font-medium">
                "{advice.advisorNote}"
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {advice.recommendations.map((meal, idx) => (
              <Card key={idx} className="border-none shadow-md hover:scale-[1.02] transition-transform rounded-3xl overflow-hidden bg-white">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="bg-muted/50 text-[10px] uppercase font-black tracking-widest px-2.5 py-1 border-none">
                      {meal.mealType}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold mt-2 font-headline">{meal.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {meal.description}
                  </p>
                  {meal.macros && (
                    <div className="grid grid-cols-3 gap-2 bg-muted/20 p-4 rounded-2xl border border-border/40">
                      <MacroBox icon={Beef} label="P" value={meal.macros.protein} color="text-red-500" />
                      <MacroBox icon={Wheat} label="C" value={meal.macros.carbs} color="text-orange-500" />
                      <MacroBox icon={Droplets} label="F" value={meal.macros.fats} color="text-sky-600" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-center pt-8">
            <Button variant="outline" className="text-muted-foreground rounded-xl border-2 px-6" onClick={() => setAdvice(null)}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Start New Analysis
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MacroBox({ icon: Icon, label, value, color }: any) {
  return (
    <div className="text-center">
      <div className={`flex items-center justify-center gap-1 ${color} mb-1.5`}>
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-black">{label}</span>
      </div>
      <p className="text-xs font-black text-foreground">{value}</p>
    </div>
  );
}
