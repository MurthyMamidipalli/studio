
"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Apple, 
  History, 
  Trash2, 
  Utensils, 
  Loader2,
  ChevronDown
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, limit, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const nutritionSchema = z.object({
  mealName: z.string().min(1, "Meal name is required"),
  calories: z.coerce.number().min(1, "Calories must be positive"),
  protein: z.coerce.number().min(0).default(0),
  carbs: z.coerce.number().min(0).default(0),
  fat: z.coerce.number().min(0).default(0),
});

type NutritionFormValues = z.infer<typeof nutritionSchema>;

export default function NutritionPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [showHistory, setShowHistory] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nutritionQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "users", user.uid, "nutritionLogs"),
      orderBy("logDate", "desc"),
      limit(50)
    );
  }, [db, user?.uid]);

  const { data: logs, isLoading } = useCollection(nutritionQuery);

  const dailyTotals = useMemo(() => {
    if (!logs || !mounted) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayLogs = logs.filter(log => {
      const logDate = log.logDate instanceof Timestamp ? log.logDate.toDate() : new Date(log.logDate);
      return logDate >= startOfToday;
    });

    return todayLogs.reduce((acc, log) => ({
      calories: acc.calories + (Number(log.calories) || 0),
      protein: acc.protein + (Number(log.protein) || 0),
      carbs: acc.carbs + (Number(log.carbs) || 0),
      fat: acc.fat + (Number(log.fat) || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [logs, mounted]);

  const form = useForm<NutritionFormValues>({
    resolver: zodResolver(nutritionSchema),
    defaultValues: { mealName: "", calories: 0, protein: 0, carbs: 0, fat: 0 },
  });

  const onSubmit = (values: NutritionFormValues) => {
    if (!db || !user?.uid) return;

    const logId = doc(collection(db, "users", user.uid, "nutritionLogs")).id;
    const logRef = doc(db, "users", user.uid, "nutritionLogs", logId);
    
    const logData = {
      id: logId,
      userId: user.uid,
      ...values,
      logDate: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    setDocumentNonBlocking(logRef, logData, { merge: true });
    toast({ title: "Meal Logged", description: "Your nutrition data has been saved." });
    form.reset({ mealName: "", calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const handleDelete = (id: string) => {
    if (!db || !user?.uid) return;
    const docRef = doc(db, "users", user.uid, "nutritionLogs", id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Log Deleted", description: "Entry removed successfully." });
  };

  if (!mounted) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold text-primary">Nutrition Tracker</h1>
        <p className="text-muted-foreground">Log your meals and monitor your daily calorie and macro goals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" /> Today's Totals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-4xl font-headline font-bold text-primary">{dailyTotals.calories}</p>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Calories Consumed</p>
              </div>
              
              <div className="space-y-4">
                <MacroProgress label="Protein" value={dailyTotals.protein} target={150} unit="g" color="bg-blue-500" />
                <MacroProgress label="Carbs" value={dailyTotals.carbs} target={200} unit="g" color="bg-orange-500" />
                <MacroProgress label="Fat" value={dailyTotals.fat} target={70} unit="g" color="bg-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Log a Meal</CardTitle>
              <CardDescription>Enter the details of what you've eaten today.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="mealName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meal / Food Item Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Grilled Chicken Salad" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="calories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calories</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="protein"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Protein (g)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="carbs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Carbs (g)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fat (g)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Apple className="h-4 w-4 mr-2" /> Log Meal
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-lg flex items-center gap-2">
                <History className="h-5 w-5" /> Recent Logs
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
                {showHistory ? "Hide" : "Show"} <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {showHistory && (
              <div className="space-y-3">
                {isLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                          <Apple className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{log.mealName}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.calories} kcal • P: {log.protein}g • C: {log.carbs}g • F: {log.fat}g
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(log.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-sm text-muted-foreground">No nutrition logs yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MacroProgress({ label, value, target, unit, color }: any) {
  const percentage = Math.min((value / target) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium">
        <span>{label}</span>
        <span className="text-muted-foreground">{value} / {target}{unit}</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
