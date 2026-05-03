
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Dumbbell, 
  Footprints, 
  History, 
  MoreVertical,
  Loader2,
  Trash2,
  Share2,
  Calendar as CalendarIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, limit, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const cardioSchema = z.object({
  name: z.string().min(1, "Workout name is required"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  distance: z.coerce.number().min(0, "Distance cannot be negative"),
  calories: z.coerce.number().min(0, "Calories cannot be negative"),
});

const strengthSchema = z.object({
  name: z.string().min(1, "Workout name is required"),
  exercises: z.array(z.object({
    name: z.string().min(1, "Exercise name is required"),
    sets: z.coerce.number().min(1, "At least 1 set"),
    reps: z.coerce.number().min(1, "At least 1 rep"),
    weight: z.coerce.number().min(0, "Weight cannot be negative"),
  })).min(1, "At least one exercise is required"),
});

type CardioFormValues = z.infer<typeof cardioSchema>;
type StrengthFormValues = z.infer<typeof strengthSchema>;

export default function WorkoutsPage() {
  const [activeTab, setActiveTab] = useState("history");
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

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
      limit(20)
    );
  }, [db, user?.uid]);

  const { data: workouts, isLoading } = useCollection(workoutsQuery);

  const cardioForm = useForm<CardioFormValues>({
    resolver: zodResolver(cardioSchema),
    defaultValues: { name: "", duration: 0, distance: 0, calories: 0 },
  });

  const strengthForm = useForm<StrengthFormValues>({
    resolver: zodResolver(strengthSchema),
    defaultValues: { name: "", exercises: [{ name: "", sets: 1, reps: 10, weight: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({
    control: strengthForm.control,
    name: "exercises",
  });

  const updateGamification = async () => {
    if (!profileRef || !profile) return;
    
    const now = new Date();
    const lastDate = profile.lastActivityDate ? new Date(profile.lastActivityDate) : null;
    let newStreak = profile.currentStreak || 0;
    
    if (lastDate) {
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const newPoints = (profile.points || 0) + 50;
    const earnedBadges = profile.earnedBadges || [];
    
    if (!earnedBadges.includes('first_workout')) earnedBadges.push('first_workout');
    if (newStreak >= 3 && !earnedBadges.includes('streak_3')) earnedBadges.push('streak_3');
    if (newPoints >= 500 && !earnedBadges.includes('points_500')) earnedBadges.push('points_500');

    setDocumentNonBlocking(profileRef, {
      points: newPoints,
      currentStreak: newStreak,
      bestStreak: Math.max(newStreak, profile.bestStreak || 0),
      earnedBadges,
      lastActivityDate: now.toISOString(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    toast({
      title: "Rewards Earned!",
      description: `+50 XP and updated your ${newStreak}-day streak!`,
    });
  };

  const onCardioSubmit = (values: CardioFormValues) => {
    if (!db || !user?.uid) return;
    const sessionId = doc(collection(db, "users", user.uid, "workoutSessions")).id;
    const sessionRef = doc(db, "users", user.uid, "workoutSessions", sessionId);
    setDocumentNonBlocking(sessionRef, {
      id: sessionId,
      userId: user.uid,
      sessionDateTime: Timestamp.now(),
      durationMinutes: values.duration,
      notes: values.name,
      estimatedCaloriesBurned: values.calories,
      type: "Cardio",
      createdAt: serverTimestamp(),
    }, { merge: true });

    updateGamification();
    cardioForm.reset();
    setActiveTab("history");
  };

  const onStrengthSubmit = (values: StrengthFormValues) => {
    if (!db || !user?.uid) return;
    const sessionId = doc(collection(db, "users", user.uid, "workoutSessions")).id;
    const sessionRef = doc(db, "users", user.uid, "workoutSessions", sessionId);
    const totalReps = values.exercises.reduce((acc, ex) => acc + (ex.sets * ex.reps), 0);
    setDocumentNonBlocking(sessionRef, {
      id: sessionId,
      userId: user.uid,
      sessionDateTime: Timestamp.now(),
      durationMinutes: 45, 
      notes: values.name,
      estimatedCaloriesBurned: totalReps * 0.5,
      type: "Strength",
      createdAt: serverTimestamp(),
    }, { merge: true });

    updateGamification();
    strengthForm.reset();
    setActiveTab("history");
  };

  const handleDelete = (id: string) => {
    if (!db || !user?.uid) return;
    deleteDocumentNonBlocking(doc(db, "users", user.uid, "workoutSessions", id));
    toast({ title: "Workout Deleted" });
  };

  const handleShare = (workout: any) => {
    const text = `I just finished a ${workout.type} workout on FitStride! 🏃‍♂️💪\n\nWorkout: ${workout.notes}\nDuration: ${workout.durationMinutes} mins\nBurned: ${Math.round(workout.estimatedCaloriesBurned || 0)} kcal\n\nJoin me on FitStride!`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Link Copied!",
      description: "Workout summary copied to clipboard.",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-headline font-bold text-primary">Workout Log</h1>
          <p className="text-muted-foreground">Keep your streak alive and earn more XP.</p>
        </div>
        <Button onClick={() => setActiveTab("log")} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4 mr-2" /> New Workout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="log">Log New</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : workouts && workouts.length > 0 ? (
                <div className="space-y-4">
                  {workouts.map((workout) => (
                    <WorkoutRow 
                      key={workout.id}
                      date={workout.sessionDateTime instanceof Timestamp ? workout.sessionDateTime.toDate().toLocaleDateString() : "Today"} 
                      name={workout.notes || "Workout"} 
                      type={workout.type} 
                      stats={`${workout.durationMinutes} mins • ${Math.round(workout.estimatedCaloriesBurned || 0)} kcal`} 
                      onDelete={() => handleDelete(workout.id)}
                      onShare={() => handleShare(workout)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">Log your first workout to start earning points!</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="log" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm">
              <CardHeader><CardTitle>Cardio (+50 XP)</CardTitle></CardHeader>
              <CardContent>
                <Form {...cardioForm}>
                  <form onSubmit={cardioForm.handleSubmit(onCardioSubmit)} className="space-y-4">
                    <FormField control={cardioForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Workout Name</FormLabel><FormControl><Input placeholder="Morning Run" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={cardioForm.control} name="duration" render={({ field }) => (
                        <FormItem><FormLabel>Duration (min)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={cardioForm.control} name="calories" render={({ field }) => (
                        <FormItem><FormLabel>Calories</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <Button type="submit" className="w-full"><Footprints className="h-4 w-4 mr-2" /> Log Session</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader><CardTitle>Strength (+50 XP)</CardTitle></CardHeader>
              <CardContent>
                <Form {...strengthForm}>
                  <form onSubmit={strengthForm.handleSubmit(onStrengthSubmit)} className="space-y-4">
                    <FormField control={strengthForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Session Name</FormLabel><FormControl><Input placeholder="Full Body" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.id} className="space-y-4 border rounded-lg p-4 bg-muted/30">
                          <FormField control={strengthForm.control} name={`exercises.${index}.name`} render={({ field }) => (
                            <FormItem><FormControl><Input placeholder="Bench Press" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <div className="grid grid-cols-3 gap-2">
                            <FormField control={strengthForm.control} name={`exercises.${index}.sets`} render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] uppercase">Sets</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormItem /></FormItem>
                            )} />
                            <FormField control={strengthForm.control} name={`exercises.${index}.reps`} render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] uppercase">Reps</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormItem /></FormItem>
                            )} />
                            <FormField control={strengthForm.control} name={`exercises.${index}.weight`} render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] uppercase">Weight</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormItem /></FormItem>
                            )} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => append({ name: "", sets: 1, reps: 10, weight: 0 })}>Add Exercise</Button>
                    <Button type="submit" className="w-full"><Dumbbell className="h-4 w-4 mr-2" /> Log Strength</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WorkoutRow({ date, name, type, stats, onDelete, onShare }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-[10px] uppercase font-bold text-muted-foreground">{date}</p>
          <p className="font-semibold">{name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${type === 'Strength' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>{type}</span>
            <p className="text-xs text-muted-foreground">{stats}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onShare} title="Share Workout">
          <Share2 className="h-4 w-4 text-primary" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
