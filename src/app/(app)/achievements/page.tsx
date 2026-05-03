
"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, Star, Award, Zap, Target, Loader2 } from "lucide-react";

const BADGES = [
  { id: 'first_workout', name: 'First Step', description: 'Logged your very first workout.', icon: Zap, color: 'text-blue-500' },
  { id: 'streak_3', name: 'Consistent', description: 'Maintained a 3-day activity streak.', icon: Flame, color: 'text-orange-500' },
  { id: 'points_500', name: 'Power User', description: 'Reached 500 total fitness points.', icon: Star, color: 'text-yellow-500' },
  { id: 'goal_slayer', name: 'Goal Slayer', description: 'Completed a fitness goal.', icon: Target, color: 'text-purple-500' },
  { id: 'nutrition_pro', name: 'Healthy Eater', description: 'Logged nutrition for 5 days.', icon: Award, color: 'text-green-500' },
];

export default function AchievementsPage() {
  const { user } = useUser();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, "users", user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading } = useDoc(profileRef);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const points = profile?.points || 0;
  const streak = profile?.currentStreak || 0;
  const earnedBadgeIds = profile?.earnedBadges || [];
  const level = Math.floor(points / 100) + 1;
  const pointsToNextLevel = (level * 100) - points;
  const levelProgress = ((points % 100) / 100) * 100;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold text-primary">Achievements</h1>
        <p className="text-muted-foreground">Celebrate your milestones and track your rewards.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-none shadow-sm text-center p-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Star className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Level {level}</h3>
          <p className="text-3xl font-headline font-bold">{points} XP</p>
          <div className="mt-4 space-y-2">
             <div className="flex justify-between text-xs font-medium">
               <span>Next Level</span>
               <span>{pointsToNextLevel} XP needed</span>
             </div>
             <Progress value={levelProgress} className="h-2" />
          </div>
        </Card>

        <Card className="bg-orange-500/5 border-none shadow-sm text-center p-6">
          <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
            <Flame className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Streak</h3>
          <p className="text-3xl font-headline font-bold">{streak} Days</p>
          <p className="text-xs text-muted-foreground mt-2">Best streak: {profile?.bestStreak || 0} days</p>
        </Card>

        <Card className="bg-yellow-500/5 border-none shadow-sm text-center p-6">
          <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Badges</h3>
          <p className="text-3xl font-headline font-bold">{earnedBadgeIds.length}/{BADGES.length}</p>
          <p className="text-xs text-muted-foreground mt-2">Keep going to unlock more!</p>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-headline font-bold">Your Badge Collection</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BADGES.map((badge) => {
            const isEarned = earnedBadgeIds.includes(badge.id);
            const Icon = badge.icon;
            return (
              <Card key={badge.id} className={`border-none shadow-sm overflow-hidden transition-all ${isEarned ? 'bg-card' : 'bg-muted/10 opacity-50 grayscale'}`}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-muted/20 ${badge.color}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold">{badge.name}</h4>
                      {isEarned && <Badge className="bg-accent text-accent-foreground border-none h-4 px-1.5 text-[8px]">EARNED</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
