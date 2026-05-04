
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth, useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { doc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (isSignUp) {
      if (password !== confirmPassword) {
        setLoading(false);
        toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        const fullName = `${firstName} ${lastName}`.trim();

        await updateProfile(newUser, { displayName: fullName });

        if (db) {
          const profileRef = doc(db, "users", newUser.uid);
          setDocumentNonBlocking(profileRef, {
            id: newUser.uid,
            name: fullName,
            email: email.toLowerCase(),
            points: 0,
            currentStreak: 0,
            bestStreak: 0,
            earnedBadges: [],
            autoSave: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
      } catch (error: any) {
        setLoading(false);
        toast({ variant: "destructive", title: "Error", description: error.message });
      }
    } else {
      signInWithEmailAndPassword(auth, email, password).catch((e) => {
        setLoading(false);
        toast({ variant: "destructive", title: "Login Failed", description: e.message });
      });
    }
  };

  if (isUserLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Activity className="h-12 w-12 text-primary mx-auto mb-2" />
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight text-center">Fitify</h1>
          <p className="text-muted-foreground font-medium text-center">Your automated biometric ecosystem.</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="pt-10">
            <CardTitle className="text-2xl font-headline font-bold">{isSignUp ? "Join the Stride" : "Welcome Back"}</CardTitle>
            <CardDescription>{isSignUp ? "Start your automated fitness journey today." : "Your health metrics are waiting for you."}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-5">
              {isSignUp && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider">First Name</Label>
                    <Input value={firstName} onChange={e => setFirstName(e.target.value)} required className="rounded-xl h-11" placeholder="Jane" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider">Last Name</Label>
                    <Input value={lastName} onChange={e => setLastName(e.target.value)} required className="rounded-xl h-11" placeholder="Doe" />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Email Address</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="rounded-xl h-11" placeholder="jane@example.com" />
              </div>
              <div className="space-y-1.5 relative">
                <Label className="text-xs font-bold uppercase tracking-wider">Password</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required className="rounded-xl h-11" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 opacity-50 hover:opacity-100 transition-opacity">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {isSignUp && (
                <div className="space-y-1.5 relative">
                  <Label className="text-xs font-bold uppercase tracking-wider">Confirm Password</Label>
                  <div className="relative">
                    <Input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="rounded-xl h-11" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 opacity-50 hover:opacity-100 transition-opacity">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full h-12 rounded-2xl shadow-lg bg-primary font-black uppercase tracking-widest mt-4" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isSignUp ? "Create My Account" : "Access Dashboard")}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t py-6 bg-muted/5">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs font-black text-primary uppercase tracking-[0.2em] hover:underline">
              {isSignUp ? "Already a member? Log In" : "New to Fitify? Join Now"}
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
