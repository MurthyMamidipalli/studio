
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, BrainCircuit, RefreshCcw, Dumbbell, Timer, ArrowRight, CheckCircle2 } from "lucide-react";
import { generateWorkoutInspiration, type WorkoutInspirationOutput } from "@/ai/flows/ai-workout-inspiration";
import { Badge } from "@/components/ui/badge";

export default function CoachPage() {
  const [loading, setLoading] = useState(false);
  const [inspiration, setInspiration] = useState<WorkoutInspirationOutput | null>(null);
  const [goals, setGoals] = useState("I want to improve my cardiovascular health and build some lean muscle mass. I have 45 minutes to work out today.");

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const pastSummary = "User has logged some activity recently. Looking for a fresh routine.";
      const result = await generateWorkoutInspiration({
        pastWorkoutsSummary: pastSummary,
        currentGoalsSummary: goals
      });
      setInspiration(result);
    } catch (error) {
      console.error("Failed to generate inspiration:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-2">
          <Sparkles className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">AI Workout Coach</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Get a personalized routine based on your recent activity and current fitness goals.
        </p>
      </div>

      {!inspiration ? (
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-accent" /> Define Your Session
            </CardTitle>
            <CardDescription>Tell the AI what you're aiming for today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="goals" className="text-sm font-semibold">Your Focus Today</Label>
              <Textarea 
                id="goals" 
                placeholder="e.g., I want a quick HIIT workout that focuses on legs..."
                className="min-h-[120px] bg-muted/20 border-border/50 focus:border-primary transition-all text-base"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/5 flex justify-end">
            <Button 
              size="lg" 
              onClick={handleGenerate} 
              disabled={loading || !goals}
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[200px]"
            >
              {loading ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" /> Analyzing data...
                </>
              ) : (
                <>
                  Generate Routine <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
          <div className="flex justify-between items-center">
            <Button variant="ghost" onClick={() => setInspiration(null)} className="text-muted-foreground">
              ← Create another one
            </Button>
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}>
              <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Regenerate
            </Button>
          </div>

          <Card className="border-none shadow-xl">
            <CardHeader className="bg-primary/5 rounded-t-xl">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none">AI Inspired</Badge>
                <Badge variant="outline" className="text-accent border-accent">Balanced Routine</Badge>
              </div>
              <CardTitle className="font-headline text-2xl text-primary">Your Custom Session</CardTitle>
              <CardDescription className="text-base text-foreground/80 leading-relaxed italic">
                "{inspiration.summary}"
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="grid gap-6">
                {inspiration.routine.map((ex, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-xl border bg-card hover:border-primary/50 transition-all">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-muted text-primary shrink-0">
                      {ex.type === 'strength' ? <Dumbbell className="h-6 w-6" /> : <Timer className="h-6 w-6" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-lg">{ex.name}</h4>
                        <span className="text-xs uppercase font-black text-muted-foreground tracking-widest">{ex.type}</span>
                      </div>
                      <div className="flex gap-4 mb-2">
                        {ex.sets && (
                          <div className="text-sm">
                            <span className="text-muted-foreground mr-1">Sets:</span>
                            <span className="font-bold">{ex.sets}</span>
                          </div>
                        )}
                        {ex.reps && (
                          <div className="text-sm">
                            <span className="text-muted-foreground mr-1">Reps:</span>
                            <span className="font-bold">{ex.reps}</span>
                          </div>
                        )}
                        {ex.durationMinutes && (
                          <div className="text-sm">
                            <span className="text-muted-foreground mr-1">Duration:</span>
                            <span className="font-bold">{ex.durationMinutes} min</span>
                          </div>
                        )}
                      </div>
                      {ex.description && (
                        <p className="text-sm text-muted-foreground border-l-2 pl-3 mt-2">{ex.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/5 p-6 flex items-center justify-between">
              <p className="text-xs text-muted-foreground max-w-xs">
                Safety first! Ensure you warm up before starting this routine and listen to your body.
              </p>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Start This Workout
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
