
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

  const { data: profile } = useDoc(profileRef);

  const workoutsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "users", user.uid, "workoutSessions"),
      orderBy("sessionDateTime", "desc"),
      limit(3)
    );
  }, [db, user?.uid]);

  const { data: workouts } = useCollection(workoutsQuery);

  const handleGenerateAdvice = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const workoutSummary = workouts && workouts.length > 0 
        ? workouts.map(w => `${w.type} session for ${w.durationMinutes} mins`).join(", ")
        : "No recent workouts logged.";
      
      const goalsSummary = "Maintain health and fitness.";
      const statsSummary = profile ? `Weight: ${profile.weight} lbs, Height: ${profile.height} in, Age: ${profile.age}` : "No stats available.";

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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="p-3 bg-accent/10 rounded-full text-accent">
          <Utensils className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-headline font-bold text-primary">AI Food Advisor</h1>
        <p className="text-muted-foreground text-lg max-w-xl">
          Get precise meal suggestions based on your metabolic needs and recent physical exertion.
        </p>
        <Button 
          size="lg" 
          onClick={handleGenerateAdvice} 
          disabled={loading}
          className="bg-primary hover:bg-primary/90 mt-4 shadow-xl px-8 py-6 text-lg rounded-2xl"
        >
          {loading ? (
            <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Analyzing Workouts...</>
          ) : (
            <><Sparkles className="h-5 w-5 mr-2" /> Generate Food Plan</>
          )}
        </Button>
      </div>

      {advice && (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
          <Card className="border-none shadow-xl bg-primary/5 rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary font-headline">
                <BrainCircuit className="h-5 w-5" /> AI Nutritionist Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed italic text-foreground/80">
                "{advice.advisorNote}"
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {advice.recommendations.map((meal, idx) => (
              <Card key={idx} className="border-none shadow-md hover:scale-[1.02] transition-transform rounded-2xl">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="bg-muted text-[10px] uppercase font-black tracking-widest px-2 py-0.5 border-none">
                      {meal.mealType}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold mt-2 font-headline">{meal.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {meal.description}
                  </p>
                  {meal.macros && (
                    <div className="grid grid-cols-3 gap-2 bg-muted/30 p-3 rounded-xl border border-border/50">
                      <MacroBox icon={Beef} label="P" value={meal.macros.protein} color="text-red-500" />
                      <MacroBox icon={Wheat} label="C" value={meal.macros.carbs} color="text-orange-500" />
                      <MacroBox icon={Droplets} label="F" value={meal.macros.fats} color="text-yellow-600" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-center pt-4">
            <Button variant="ghost" className="text-muted-foreground" onClick={() => setAdvice(null)}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Start over
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
      <div className={`flex items-center justify-center gap-1 ${color} mb-1`}>
        <Icon className="h-3 w-3" />
        <span className="text-[10px] font-black">{label}</span>
      </div>
      <p className="text-xs font-black">{value}</p>
    </div>
  );
}
