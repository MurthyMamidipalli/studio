"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Filter, 
  Dumbbell, 
  Footprints, 
  History, 
  MoreVertical,
  ChevronDown,
  Loader2,
  Trash2,
  Calendar as CalendarIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
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

  const onCardioSubmit = (values: CardioFormValues) => {
    if (!db || !user?.uid) return;

    const sessionId = doc(collection(db, "users", user.uid, "workoutSessions")).id;
    const sessionRef = doc(db, "users", user.uid, "workoutSessions", sessionId);
    
    const now = Timestamp.now();
    
    const sessionData = {
      id: sessionId,
      userId: user.uid,
      sessionDateTime: now,
      durationMinutes: values.duration,
      notes: values.name,
      estimatedCaloriesBurned: values.calories,
      type: "Cardio",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    setDocumentNonBlocking(sessionRef, sessionData, { merge: true });

    const exerciseId = doc(collection(sessionRef, "loggedExercises")).id;
    const exerciseRef = doc(sessionRef, "loggedExercises", exerciseId);
    
    setDocumentNonBlocking(exerciseRef, {
      id: exerciseId,
      workoutSessionId: sessionId,
      exerciseId: "cardio-generic",
      orderInSession: 1,
      notes: values.name
    }, { merge: true });

    const detailsRef = doc(exerciseRef, "cardioDetails", exerciseId);
    setDocumentNonBlocking(detailsRef, {
      id: exerciseId,
      loggedExerciseId: exerciseId,
      distance: values.distance,
      distanceUnit: "mi",
      caloriesBurned: values.calories,
    }, { merge: true });

    toast({ title: "Workout Logged", description: "Cardio session saved successfully." });
    cardioForm.reset();
    setActiveTab("history");
  };

  const onStrengthSubmit = (values: StrengthFormValues) => {
    if (!db || !user?.uid) return;

    const sessionId = doc(collection(db, "users", user.uid, "workoutSessions")).id;
    const sessionRef = doc(db, "users", user.uid, "workoutSessions", sessionId);
    const now = Timestamp.now();

    const totalReps = values.exercises.reduce((acc, ex) => acc + (ex.sets * ex.reps), 0);

    const sessionData = {
      id: sessionId,
      userId: user.uid,
      sessionDateTime: now,
      durationMinutes: 45, 
      notes: values.name,
      estimatedCaloriesBurned: totalReps * 0.5,
      type: "Strength",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    setDocumentNonBlocking(sessionRef, sessionData, { merge: true });

    values.exercises.forEach((ex, idx) => {
      const exId = doc(collection(sessionRef, "loggedExercises")).id;
      const exRef = doc(sessionRef, "loggedExercises", exId);
      
      setDocumentNonBlocking(exRef, {
        id: exId,
        workoutSessionId: sessionId,
        exerciseId: "strength-generic",
        orderInSession: idx + 1,
        notes: ex.name
      }, { merge: true });

      const strengthDetailsId = exId;
      const strengthDetailsRef = doc(exRef, "strengthDetails", strengthDetailsId);
      setDocumentNonBlocking(strengthDetailsRef, {
        id: strengthDetailsId,
        loggedExerciseId: exId,
        totalSets: ex.sets,
        totalReps: ex.sets * ex.reps,
      }, { merge: true });

      for (let i = 1; i <= ex.sets; i++) {
        const setDetailsId = doc(collection(strengthDetailsRef, "setDetails")).id;
        const setDetailsRef = doc(strengthDetailsRef, "setDetails", setDetailsId);
        setDocumentNonBlocking(setDetailsRef, {
          id: setDetailsId,
          strengthDetailsId: strengthDetailsId,
          setNumber: i,
          reps: ex.reps,
          weight: ex.weight,
          weightUnit: "lbs"
        }, { merge: true });
      }
    });

    toast({ title: "Workout Logged", description: "Strength session saved successfully." });
    strengthForm.reset();
    setActiveTab("history");
  };

  const handleDelete = (id: string) => {
    if (!db || !user?.uid) return;
    const docRef = doc(db, "users", user.uid, "workoutSessions", id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Workout Deleted", description: "Session has been removed." });
  };

  const formatDate = (val: any) => {
    if (!val) return "Today";
    const date = val instanceof Timestamp ? val.toDate() : new Date(val);
    if (isNaN(date.getTime())) return "Today";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-headline font-bold text-primary">Workout Log</h1>
          <p className="text-muted-foreground">Record your efforts and track your consistency.</p>
        </div>
        <Button onClick={() => setActiveTab("log")} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4 mr-2" /> New Workout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" /> History
          </TabsTrigger>
          <TabsTrigger value="log" className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Log New
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search workouts..." className="pl-9" />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                    <Filter className="h-4 w-4 mr-2" /> Filter
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                    Last 30 Days <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : workouts && workouts.length > 0 ? (
                <div className="space-y-4">
                  {workouts.map((workout) => (
                    <WorkoutRow 
                      key={workout.id}
                      id={workout.id}
                      date={formatDate(workout.sessionDateTime)} 
                      name={workout.notes || "Workout"} 
                      type={workout.type} 
                      stats={`${workout.durationMinutes} mins • ${Math.round(workout.estimatedCaloriesBurned || 0)} kcal`} 
                      onDelete={() => handleDelete(workout.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No workouts found. Start by logging your first session!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="log" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline">Cardio Session</CardTitle>
                <CardDescription>Log running, cycling, swimming, or walking.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...cardioForm}>
                  <form onSubmit={cardioForm.handleSubmit(onCardioSubmit)} className="space-y-4">
                    <FormField
                      control={cardioForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Workout Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Evening Jog" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={cardioForm.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (mins)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={cardioForm.control}
                        name="distance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Distance (mi)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={cardioForm.control}
                      name="calories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calories Burned (est.)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      <Footprints className="h-4 w-4 mr-2" /> Log Cardio
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline">Strength Training</CardTitle>
                <CardDescription>Log sets, reps, and weights for each exercise.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...strengthForm}>
                  <form onSubmit={strengthForm.handleSubmit(onStrengthSubmit)} className="space-y-4">
                    <FormField
                      control={strengthForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Workout Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Push Day" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.id} className="space-y-4 border rounded-lg p-4 bg-muted/30">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">Exercise {index + 1}</h4>
                            {fields.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="h-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <FormField
                            control={strengthForm.control}
                            name={`exercises.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Bench Press" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <FormField
                              control={strengthForm.control}
                              name={`exercises.${index}.sets`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] uppercase text-muted-foreground">Sets</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={strengthForm.control}
                              name={`exercises.${index}.reps`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] uppercase text-muted-foreground">Reps</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={strengthForm.control}
                              name={`exercises.${index}.weight`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] uppercase text-muted-foreground">Weight (lbs)</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => append({ name: "", sets: 1, reps: 10, weight: 0 })}>
                      <Plus className="h-4 w-4 mr-2" /> Add Exercise
                    </Button>
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      <Dumbbell className="h-4 w-4 mr-2" /> Log Strength
                    </Button>
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

function WorkoutRow({ id, date, name, type, stats, onDelete }: any) {
  const parts = date.split(' ');
  const month = parts[0];
  const day = parts[1] || "";
  
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="text-center w-12 shrink-0">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">{month}</p>
          <p className="text-xl font-headline font-bold text-primary leading-tight">{day || <CalendarIcon className="h-4 w-4 mx-auto" />}</p>
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <p className="font-semibold text-base">{name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${type === 'Strength' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
              {type}
            </span>
            <p className="text-xs text-muted-foreground">{stats}</p>
          </div>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View Details</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
