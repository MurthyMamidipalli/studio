
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Filter, 
  Dumbbell, 
  Footprints, 
  History, 
  MoreVertical,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function WorkoutsPage() {
  const [activeTab, setActiveTab] = useState("history");

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
              <div className="space-y-4">
                <WorkoutRow 
                  date="Oct 26" 
                  name="Full Body HIIT" 
                  type="Strength" 
                  stats="45 mins • 4 sets • 350 kcal" 
                />
                <WorkoutRow 
                  date="Oct 25" 
                  name="Morning Run" 
                  type="Cardio" 
                  stats="5.2 mi • 42 mins • 510 kcal" 
                />
                <WorkoutRow 
                  date="Oct 23" 
                  name="Upper Body Focus" 
                  type="Strength" 
                  stats="55 mins • 12 sets • 420 kcal" 
                />
                <WorkoutRow 
                  date="Oct 21" 
                  name="Slow Walk" 
                  type="Cardio" 
                  stats="2.5 mi • 50 mins • 180 kcal" 
                />
                <WorkoutRow 
                  date="Oct 20" 
                  name="Leg Day" 
                  type="Strength" 
                  stats="65 mins • 10 sets • 500 kcal" 
                />
              </div>
              <div className="mt-8 text-center">
                <Button variant="ghost" className="text-muted-foreground text-sm">
                  Load more activity
                </Button>
              </div>
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
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardio-name">Workout Name</Label>
                  <Input id="cardio-name" placeholder="e.g. Evening Jog" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (mins)</Label>
                    <Input id="duration" type="number" placeholder="30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distance">Distance (mi)</Label>
                    <Input id="distance" type="number" step="0.1" placeholder="3.5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardio-calories">Calories Burned (est.)</Label>
                  <Input id="cardio-calories" type="number" placeholder="250" />
                </div>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Footprints className="h-4 w-4 mr-2" /> Log Cardio
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline">Strength Training</CardTitle>
                <CardDescription>Log sets, reps, and weights for each exercise.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="strength-name">Workout Name</Label>
                  <Input id="strength-name" placeholder="e.g. Push Day" />
                </div>
                <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Exercise 1</h4>
                    <Button variant="ghost" size="sm" className="h-8 text-destructive">Remove</Button>
                  </div>
                  <Input placeholder="Bench Press" />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Sets</Label>
                      <Input type="number" placeholder="3" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Reps</Label>
                      <Input type="number" placeholder="10" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Weight (lbs)</Label>
                      <Input type="number" placeholder="135" />
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full border-dashed">
                  <Plus className="h-4 w-4 mr-2" /> Add Exercise
                </Button>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Dumbbell className="h-4 w-4 mr-2" /> Log Strength
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WorkoutRow({ date, name, type, stats }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="text-center w-12 shrink-0">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">{date.split(' ')[0]}</p>
          <p className="text-xl font-headline font-bold text-primary leading-tight">{date.split(' ')[1]}</p>
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
          <DropdownMenuItem>Edit Log</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
