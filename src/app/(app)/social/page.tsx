
"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, limit, doc, arrayUnion, serverTimestamp, arrayRemove, where, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Trophy, 
  Users, 
  Target, 
  Loader2, 
  Flame, 
  Star,
  CheckCircle2,
  Plus,
  UserPlus,
  DoorOpen,
  Trash2,
  MailPlus,
  Globe,
  Lock,
  Clock,
  UserCheck,
  UserX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

function SocialContent() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [mounted, setMounted] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  // Invite & Request state
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitingGroupId, setInvitingGroupId] = useState<string | null>(null);
  const [reviewGroupId, setReviewGroupId] = useState<string | null>(null);

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
    return query(collection(db, "groups"), orderBy("createdAt", "desc"), limit(50));
  }, [db]);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "users"), limit(100));
  }, [db]);

  const { data: leaderboard, isLoading: isLeaderboardLoading } = useCollection(leaderboardQuery);
  const { data: challenges, isLoading: isChallengesLoading } = useCollection(challengesQuery);
  const { data: allGroups, isLoading: isGroupsLoading } = useCollection(groupsQuery);
  const { data: allUsers } = useCollection(usersQuery);

  // Filter groups
  const publicGroups = allGroups?.filter(g => g.isPublic) || [];
  const myGroups = allGroups?.filter(g => g.members?.includes(user?.uid) || g.ownerId === user?.uid) || [];

  // Handle joining via link
  useEffect(() => {
    const joinId = searchParams.get("join");
    if (joinId && user && db && mounted) {
      const groupRef = doc(db, "groups", joinId);
      updateDocumentNonBlocking(groupRef, {
        members: arrayUnion(user.uid)
      });
      toast({
        title: "Joined via link!",
        description: "You've been added to the group.",
      });
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("join");
      router.replace(`/social?${newParams.toString()}`);
      setActiveTab("groups");
    }
  }, [searchParams, user, db, mounted, router, toast]);

  const handleJoinChallenge = (challengeId: string) => {
    if (!db || !user?.uid) return;
    const challengeRef = doc(db, "challenges", challengeId);
    updateDocumentNonBlocking(challengeRef, {
      participants: arrayUnion(user.uid)
    });
    toast({ title: "Challenge Joined!", description: "You're now a participant." });
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
      pendingRequests: [],
      isPublic: isPublic,
      createdAt: serverTimestamp(),
    }, { merge: true });

    toast({ title: "Group Created", description: `"${newGroupName}" is now ${isPublic ? 'public' : 'private'}.` });
    setNewGroupName("");
    setNewGroupDesc("");
    setIsPublic(true);
    setIsGroupDialogOpen(false);
    setLoading(false);
  };

  const handleRequestJoin = (groupId: string) => {
    if (!db || !user?.uid) return;
    const groupRef = doc(db, "groups", groupId);
    updateDocumentNonBlocking(groupRef, {
      pendingRequests: arrayUnion(user.uid)
    });
    toast({ title: "Request Sent", description: "The group admin will review your request." });
  };

  const handleApproveRequest = (groupId: string, targetUid: string) => {
    if (!db) return;
    const groupRef = doc(db, "groups", groupId);
    updateDocumentNonBlocking(groupRef, {
      members: arrayUnion(targetUid),
      pendingRequests: arrayRemove(targetUid)
    });
    toast({ title: "Member Approved", description: "User has been added to the group." });
  };

  const handleDeclineRequest = (groupId: string, targetUid: string) => {
    if (!db) return;
    const groupRef = doc(db, "groups", groupId);
    updateDocumentNonBlocking(groupRef, {
      pendingRequests: arrayRemove(targetUid)
    });
    toast({ title: "Request Declined", description: "The request has been removed." });
  };

  const handleJoinPublicGroup = (groupId: string) => {
    if (!db || !user?.uid) return;
    const groupRef = doc(db, "groups", groupId);
    updateDocumentNonBlocking(groupRef, {
      members: arrayUnion(user.uid)
    });
    toast({ title: "Joined Group", description: "You are now a member." });
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
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, "groups", groupId));
    toast({ title: "Group Deleted" });
  };

  const handleAddByEmail = async (groupId: string) => {
    if (!db || !inviteEmail) return;
    setLoading(true);
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", inviteEmail.toLowerCase().trim()));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      toast({ variant: "destructive", title: "Not Found", description: "No user found with that email." });
      setLoading(false);
      return;
    }

    const targetUid = snap.docs[0].id;
    const groupRef = doc(db, "groups", groupId);
    updateDocumentNonBlocking(groupRef, { members: arrayUnion(targetUid) });

    toast({ title: "Added", description: "User added successfully." });
    setInviteEmail("");
    setInvitingGroupId(null);
    setLoading(false);
  };

  const reviewGroup = allGroups?.find(g => g.id === reviewGroupId);
  const pendingUserIds = reviewGroup?.pendingRequests || [];
  const pendingUsers = allUsers?.filter(u => pendingUserIds.includes(u.id)) || [];

  if (!mounted) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Social Community</h1>
          <p className="text-muted-foreground">Connect with others and conquer your fitness goals together.</p>
        </div>
        
        <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" /> Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a Group</DialogTitle>
              <DialogDescription>Foster motivation with a shared fitness community.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Group Name</Label>
                <Input id="name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="e.g. Iron Addicts" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} placeholder="What's this community about?" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    {isPublic ? <Globe className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-accent" />}
                    {isPublic ? "Public Group" : "Private Group"}
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    {isPublic ? "Anyone can find and join." : "Membership requires admin approval."}
                  </p>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
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
        <TabsList className="grid w-full max-w-[400px] grid-cols-3">
          <TabsTrigger value="leaderboard">Rankings</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="challenges">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="font-headline">Global Leaderboard</CardTitle></CardHeader>
            <CardContent>
              {isLeaderboardLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <div className="space-y-3">
                  {leaderboard?.map((p, i) => (
                    <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl border ${p.id === user?.uid ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
                      <div className="flex items-center gap-4">
                        <span className="w-6 font-bold text-muted-foreground">{i + 1}</span>
                        <Avatar className="h-10 w-10"><AvatarImage src={p.photoURL} /><AvatarFallback>{p.name?.[0]}</AvatarFallback></Avatar>
                        <div>
                          <p className="font-bold flex items-center gap-2">{p.name} {p.id === user?.uid && <Badge variant="outline" className="text-[10px]">YOU</Badge>}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                             <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" /> {p.currentStreak || 0}d</span>
                             <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500" /> {p.points || 0} XP</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right"><p className="text-sm font-black text-primary">{p.points || 0} XP</p></div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="mt-6 space-y-10">
          <div className="space-y-4">
             <h3 className="text-lg font-bold flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /> My Circles</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isGroupsLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto col-span-full" /> : 
                 myGroups.length > 0 ? myGroups.map(g => (
                   <GroupCard 
                     key={g.id} 
                     group={g} 
                     user={user} 
                     onLeave={handleLeaveGroup} 
                     onDelete={handleDeleteGroup}
                     onInviteClick={(id: string) => setInvitingGroupId(id)}
                     onReviewClick={(id: string) => setReviewGroupId(id)}
                   />
                 )) : <p className="col-span-full text-center py-8 text-muted-foreground text-sm italic">You haven't joined any groups yet.</p>}
             </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-lg font-bold flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Discover Communities</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicGroups.filter(g => !g.members?.includes(user?.uid) && g.ownerId !== user?.uid).map(g => (
                  <GroupCard key={g.id} group={g} user={user} onJoin={handleJoinPublicGroup} />
                ))}
                {allGroups?.filter(g => !g.isPublic && !g.members?.includes(user?.uid) && g.ownerId !== user?.uid).map(g => (
                  <GroupCard key={g.id} group={g} user={user} onRequestJoin={handleRequestJoin} />
                ))}
             </div>
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isChallengesLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto col-span-full" /> : 
             challenges?.map(c => (
               <Card key={c.id} className="border-none shadow-sm overflow-hidden flex flex-col">
                 <div className="h-1 bg-accent w-full" />
                 <CardHeader>
                   <div className="flex justify-between items-start">
                     <Badge variant="secondary" className="bg-accent/10 text-accent">{c.targetType}</Badge>
                     <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {c.participants?.length || 0}</span>
                   </div>
                   <CardTitle className="font-headline text-xl mt-2">{c.title}</CardTitle>
                   <CardDescription>{c.description}</CardDescription>
                 </CardHeader>
                 <CardFooter className="mt-auto border-t bg-muted/5">
                   <Button 
                    className="w-full" 
                    variant={c.participants?.includes(user?.uid) ? "outline" : "default"}
                    disabled={c.participants?.includes(user?.uid)}
                    onClick={() => handleJoinChallenge(c.id)}
                   >
                     {c.participants?.includes(user?.uid) ? <CheckCircle2 className="h-4 w-4 mr-2" /> : "Join Challenge"}
                   </Button>
                 </CardFooter>
               </Card>
             ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Invite Modal */}
      <Dialog open={!!invitingGroupId} onOpenChange={o => !o && setInvitingGroupId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite Member</DialogTitle></DialogHeader>
          <div className="py-4 space-y-2">
            <Label>User Email</Label>
            <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="name@example.com" />
          </div>
          <DialogFooter>
            <Button onClick={() => invitingGroupId && handleAddByEmail(invitingGroupId)} disabled={loading || !inviteEmail}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Requests Modal */}
      <Dialog open={!!reviewGroupId} onOpenChange={o => !o && setReviewGroupId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Review Join Requests</DialogTitle><DialogDescription>Pending requests for "{reviewGroup?.name}"</DialogDescription></DialogHeader>
          <ScrollArea className="max-h-[300px] mt-4">
            <div className="space-y-4 pr-4">
              {pendingUsers.length > 0 ? pendingUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border bg-card">
                  <div className="flex items-center gap-3">
                    <Avatar><AvatarImage src={u.photoURL} /><AvatarFallback>{u.name?.[0]}</AvatarFallback></Avatar>
                    <span className="text-sm font-bold">{u.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" onClick={() => handleApproveRequest(reviewGroupId!, u.id)}><UserCheck className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeclineRequest(reviewGroupId!, u.id)}><UserX className="h-4 w-4" /></Button>
                  </div>
                </div>
              )) : <p className="text-center text-sm text-muted-foreground py-8 italic">No pending requests.</p>}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GroupCard({ group, user, onJoin, onRequestJoin, onLeave, onDelete, onInviteClick, onReviewClick }: any) {
  const isOwner = group.ownerId === user?.uid;
  const isMember = group.members?.includes(user?.uid) || isOwner;
  const isPending = group.pendingRequests?.includes(user?.uid);
  const requestCount = group.pendingRequests?.length || 0;

  return (
    <Card className="border-none shadow-sm flex flex-col hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-lg truncate pr-2">{group.name}</CardTitle>
          <div className="flex flex-col items-end gap-1 shrink-0">
             {isOwner && <Badge className="bg-primary/10 text-primary border-none text-[10px]">OWNER</Badge>}
             <Badge variant="outline" className="text-[9px] h-4 uppercase tracking-tighter">
               {group.isPublic ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
               {group.isPublic ? "Public" : "Private"}
             </Badge>
          </div>
        </div>
        <CardDescription className="line-clamp-2 h-10">{group.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {group.members?.length || 0}</span>
          {isOwner && requestCount > 0 && (
            <span className="flex items-center gap-1 text-orange-500 font-bold"><Clock className="h-3 w-3" /> {requestCount} Requests</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/5 p-4 flex flex-col gap-2">
        {isMember ? (
          <div className="flex w-full gap-2">
            {isOwner && (
              <>
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => onReviewClick(group.id)}>
                   <UserCheck className="h-3 w-3 mr-1" /> Review {requestCount > 0 && `(${requestCount})`}
                </Button>
                <Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={() => onInviteClick(group.id)}>
                   <MailPlus className="h-3 w-3 mr-1" /> Invite
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(group.id)}>
                   <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            {!isOwner && (
              <Button variant="outline" className="w-full text-xs" onClick={() => onLeave(group.id)}>
                 <DoorOpen className="h-4 w-4 mr-2" /> Leave Group
              </Button>
            )}
          </div>
        ) : isPending ? (
          <Button disabled className="w-full bg-muted text-muted-foreground text-xs">
            <Clock className="h-4 w-4 mr-2" /> Request Pending
          </Button>
        ) : group.isPublic ? (
          <Button className="w-full text-xs" onClick={() => onJoin(group.id)}>
            <UserPlus className="h-4 w-4 mr-2" /> Join Community
          </Button>
        ) : (
          <Button className="w-full text-xs bg-accent text-accent-foreground" onClick={() => onRequestJoin(group.id)}>
            <Target className="h-4 w-4 mr-2" /> Request to Join
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function SocialPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <SocialContent />
    </Suspense>
  );
}
