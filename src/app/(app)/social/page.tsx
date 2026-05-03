
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, limit, doc, arrayUnion, serverTimestamp, arrayRemove } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Trophy, 
  Users, 
  Target, 
  Loader2, 
  Flame, 
  Star,
  CheckCircle2,
  Plus,
  Search,
  UserPlus,
  DoorOpen,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SocialPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [mounted, setMounted] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const leaderboardQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "users"),
      orderBy("points", "desc"),
      limit(10)
    );
  }, [db]);

  const challengesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "challenges"), limit(10));
  }, [db]);

  const groupsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "groups"), orderBy("createdAt", "desc"), limit(20));
  }, [db]);

  const { data: leaderboard, isLoading: isLeaderboardLoading } = useCollection(leaderboardQuery);
  const { data: challenges, isLoading: isChallengesLoading } = useCollection(challengesQuery);
  const { data: groups, isLoading: isGroupsLoading } = useCollection(groupsQuery);

  const handleJoinChallenge = (challengeId: string) => {
    if (!db || !user?.uid) return;
    const challengeRef = doc(db, "challenges", challengeId);
    updateDocumentNonBlocking(challengeRef, {
      participants: arrayUnion(user.uid)
    });
    toast({ title: "Challenge Joined!", description: "You're now a participant. Good luck!" });
  };

  const handleCreateGroup = () => {
    if (!db || !user?.uid || !newGroupName) return;
    setLoading(true);
    const groupId = doc(collection(db, "groups")).id;
    const groupRef = doc(db, "groups", groupId);
    
    setDocumentNonBlocking(groupRef, {
      id: groupId,
      name: newGroupName,
      description: newGroupDesc,
      ownerId: user.uid,
      members: [user.uid],
      createdAt: serverTimestamp(),
    }, { merge: true });

    toast({ title: "Group Created", description: `"${newGroupName}" is now active!` });
    setNewGroupName("");
    setNewGroupDesc("");
    setIsGroupDialogOpen(false);
    setLoading(false);
  };

  const handleJoinGroup = (groupId: string) => {
    if (!db || !user?.uid) return;
    const groupRef = doc(db, "groups", groupId);
    updateDocumentNonBlocking(groupRef, {
      members: arrayUnion(user.uid)
    });
    toast({ title: "Joined Group", description: "You are now a member of this community." });
  };

  const handleLeaveGroup = (groupId: string) => {
    if (!db || !user?.uid) return;
    const groupRef = doc(db, "groups", groupId);
    updateDocumentNonBlocking(groupRef, {
      members: arrayRemove(user.uid)
    });
    toast({ title: "Left Group", description: "You have left the community." });
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!db || !user?.uid) return;
    deleteDocumentNonBlocking(doc(db, "groups", groupId));
    toast({ title: "Group Deleted", description: "The group has been removed." });
  };

  if (!mounted) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-headline font-bold text-primary">Social Community</h1>
          <p className="text-muted-foreground">Connect with others, join groups, and climb the leaderboard.</p>
        </div>
        
        <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" /> Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Form a Fitness Group</DialogTitle>
              <DialogDescription>Create a community for shared goals and motivation.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input id="group-name" placeholder="e.g. Early Birds Runner Club" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="group-desc">Description</Label>
                <Textarea id="group-desc" placeholder="What is this group about?" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateGroup} disabled={loading || !newGroupName}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Establish Group"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[600px] grid-cols-3">
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" /> Leaderboard
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Groups
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Target className="h-4 w-4" /> Challenges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Global Rankings</CardTitle>
              <CardDescription>The most active FitStride members.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLeaderboardLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-4">
                  {leaderboard.map((profile, index) => (
                    <div key={profile.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${profile.id === user?.uid ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'bg-card'}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-8 text-center font-bold text-muted-foreground">{index + 1}</div>
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
                <div className="text-center py-12 text-muted-foreground">No rankings available.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isGroupsLoading ? (
              <div className="col-span-full flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : groups && groups.length > 0 ? (
              groups.map((group) => {
                const isMember = group.members?.includes(user?.uid);
                const isOwner = group.ownerId === user?.uid;
                return (
                  <Card key={group.id} className="border-none shadow-sm flex flex-col hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="font-headline text-xl truncate">{group.name}</CardTitle>
                        {isOwner && <Badge className="bg-primary/10 text-primary border-none">OWNER</Badge>}
                      </div>
                      <CardDescription className="line-clamp-2 min-h-[40px]">{group.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{group.members?.length || 0} Members</span>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/5 p-4 flex gap-2">
                      {isMember ? (
                        <Button variant="outline" className="flex-1" onClick={() => handleLeaveGroup(group.id)}>
                          <DoorOpen className="h-4 w-4 mr-2" /> Leave
                        </Button>
                      ) : (
                        <Button className="flex-1 bg-primary" onClick={() => handleJoinGroup(group.id)}>
                          <UserPlus className="h-4 w-4 mr-2" /> Join Group
                        </Button>
                      )}
                      {isOwner && (
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteGroup(group.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-bold">No groups found</h3>
                <p className="text-muted-foreground mt-2">Be the first to create a fitness community!</p>
              </div>
            )}
          </div>
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
                <Target className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-bold">No active challenges</h3>
                <p className="text-muted-foreground mt-2">Check back later for community competitions.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
