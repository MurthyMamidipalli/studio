
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, limit, doc, arrayUnion } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Users, 
  Target, 
  Loader2, 
  Flame, 
  Star,
  UserPlus,
  Share2,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SocialPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("leaderboard");

  // Leaderboard Query
  const leaderboardQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "users"),
      orderBy("points", "desc"),
      limit(10)
    );
  }, [db]);

  // Challenges Query
  const challengesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "challenges"), limit(10));
  }, [db]);

  const { data: leaderboard, isLoading: isLeaderboardLoading } = useCollection(leaderboardQuery);
  const { data: challenges, isLoading: isChallengesLoading } = useCollection(challengesQuery);

  const handleJoinChallenge = (challengeId: string) => {
    if (!db || !user?.uid) return;
    const challengeRef = doc(db, "challenges", challengeId);
    
    updateDocumentNonBlocking(challengeRef, {
      participants: arrayUnion(user.uid)
    });

    toast({
      title: "Challenge Joined!",
      description: "You're now a participant. Good luck!",
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold text-primary">Social Community</h1>
        <p className="text-muted-foreground">Compete on the leaderboard and join community challenges.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" /> Leaderboard
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Target className="h-4 w-4" /> Challenges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-6 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Top Performers</CardTitle>
              <CardDescription>The most active FitStride members this month.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLeaderboardLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-4">
                  {leaderboard.map((profile, index) => (
                    <div key={profile.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${profile.id === user?.uid ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'bg-card'}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-8 text-center font-bold text-muted-foreground">
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile.photoURL} />
                          <AvatarFallback>{profile.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold flex items-center gap-2">
                            {profile.name}
                            {profile.id === user?.uid && <Badge variant="outline" className="text-[10px] h-4">YOU</Badge>}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" /> {profile.currentStreak || 0}d</span>
                            <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500" /> {profile.points || 0} XP</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-primary">{profile.points || 0}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Total XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">No users found in the leaderboard.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isChallengesLoading ? (
              <div className="col-span-full flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : challenges && challenges.length > 0 ? (
              challenges.map((challenge) => {
                const isJoined = challenge.participants?.includes(user?.uid);
                return (
                  <Card key={challenge.id} className="border-none shadow-sm overflow-hidden flex flex-col">
                    <div className="h-2 bg-accent w-full" />
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="bg-accent/10 text-accent border-none">{challenge.targetType}</Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" /> {challenge.participants?.length || 0} joined
                        </div>
                      </div>
                      <CardTitle className="font-headline text-xl mt-2">{challenge.title}</CardTitle>
                      <CardDescription>{challenge.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="font-medium">Goal: {challenge.targetValue} units</span>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/5 p-4">
                      {isJoined ? (
                        <Button className="w-full" variant="outline" disabled>
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Joined
                        </Button>
                      ) : (
                        <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleJoinChallenge(challenge.id)}>
                          Join Challenge
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-bold">No active challenges</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                  Check back soon for new community fitness challenges!
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
