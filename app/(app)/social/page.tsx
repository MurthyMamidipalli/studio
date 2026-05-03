
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
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SocialPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const leaderboardQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "users"), orderBy("points", "desc"), limit(10));
  }, [db]);

  const challengesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "challenges"), limit(10));
  }, [db]);

  const { data: leaderboard, isLoading: isLeaderboardLoading } = useCollection(leaderboardQuery);
  const { data: challenges, isLoading: isChallengesLoading } = useCollection(challengesQuery);

  const handleJoinChallenge = (challengeId: string) => {
    if (!db || !user?.uid) return;
    updateDocumentNonBlocking(doc(db, "challenges", challengeId), {
      participants: arrayUnion(user.uid)
    });
    toast({ title: "Joined!", description: "You are now in the challenge." });
  };

  if (!mounted || isLeaderboardLoading || isChallengesLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold text-primary">Community Hub</h1>
        <p className="text-muted-foreground">Compete and grow with fellow FitStride members.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="leaderboard"><Trophy className="h-4 w-4 mr-2" /> Leaderboard</TabsTrigger>
          <TabsTrigger value="challenges"><Target className="h-4 w-4 mr-2" /> Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Global Rankings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {leaderboard && leaderboard.length > 0 ? leaderboard.map((profile, index) => (
                <div key={profile.id} className={`flex items-center justify-between p-4 rounded-xl border ${profile.id === user?.uid ? 'bg-primary/5 border-primary/30' : 'bg-card'}`}>
                  <div className="flex items-center gap-4">
                    <span className="w-6 font-bold text-muted-foreground">{index + 1}</span>
                    <Avatar><AvatarImage src={profile.photoURL} /><AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback></Avatar>
                    <div>
                      <p className="font-bold flex items-center gap-2">{profile.name} {profile.id === user?.uid && <Badge variant="outline" className="text-[8px]">YOU</Badge>}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" /> {profile.currentStreak || 0}d</span>
                        <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500" /> {profile.points || 0} XP</span>
                      </div>
                    </div>
                  </div>
                </div>
              )) : <p className="text-center py-8 text-muted-foreground">No one on the board yet!</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {challenges && challenges.length > 0 ? challenges.map((challenge) => (
              <Card key={challenge.id} className="border-none shadow-sm overflow-hidden">
                <div className="h-1 bg-accent w-full" />
                <CardHeader>
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                  <CardDescription>{challenge.description}</CardDescription>
                </CardHeader>
                <CardFooter className="bg-muted/5 p-4">
                  {challenge.participants?.includes(user?.uid) ? (
                    <Button variant="outline" className="w-full" disabled><CheckCircle2 className="h-4 w-4 mr-2" /> Joined</Button>
                  ) : (
                    <Button className="w-full bg-accent text-accent-foreground" onClick={() => handleJoinChallenge(challenge.id)}>Join Challenge</Button>
                  )}
                </CardFooter>
              </Card>
            )) : <p className="col-span-full text-center py-12 text-muted-foreground">Check back soon for new challenges!</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
