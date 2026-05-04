
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

  if (isUserLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Activity className="h-10 w-10 text-primary mx-auto mb-2" />
          <h1 className="text-3xl font-headline font-bold text-primary">FitStride</h1>
        </div>

        <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader>
            <CardTitle>{isSignUp ? "Sign Up" : "Log In"}</CardTitle>
            <CardDescription>{isSignUp ? "Enter your details to begin" : "Welcome back to your dashboard"}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>First Name</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} required /></div>
                  <div className="space-y-1"><Label>Last Name</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} required /></div>
                </div>
              )}
              <div className="space-y-1"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              <div className="space-y-1 relative">
                <Label>Password</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 opacity-50">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              {isSignUp && (
                <div className="space-y-1 relative">
                  <Label>Confirm Password</Label>
                  <div className="relative">
                    <Input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 opacity-50">{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full h-12 rounded-xl" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? "Create Account" : "Log In")}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t py-4">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs font-bold text-primary uppercase">
              {isSignUp ? "Already a member? Log In" : "New? Create Account"}
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
