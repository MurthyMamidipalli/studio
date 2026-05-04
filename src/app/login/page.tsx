
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Mail, Lock, Loader2, UserPlus, LogIn, Eye, EyeOff, User } from "lucide-react";
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

        toast({ title: "Account Created", description: `Welcome to FitStride, ${firstName}!` });
      } catch (error: any) {
        setLoading(false);
        toast({ variant: "destructive", title: "Registration Failed", description: error.message });
      }
    } else {
      signInWithEmailAndPassword(auth, email, password)
        .catch((error: any) => {
          setLoading(false);
          toast({ variant: "destructive", title: "Login Failed", description: error.message });
        });
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center">
          <div className="bg-primary p-3 rounded-2xl shadow-lg inline-block mb-3">
            <Activity className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-headline font-bold text-primary tracking-tight">FitStride</h1>
        </div>

        <Card className="border-none shadow-2xl bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-6 pt-10">
            <CardTitle className="text-2xl font-headline font-bold">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-2">
              {isSignUp ? "Join the global community" : "Access your biometrics"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-[11px] font-black uppercase tracking-wider ml-1">First Name</Label>
                    <Input id="firstName" placeholder="John" className="h-12 rounded-xl" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-[11px] font-black uppercase tracking-wider ml-1">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" className="h-12 rounded-xl" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                </div>
              )}
              
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-wider ml-1">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="name@example.com" className="pl-11 h-12 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[11px] font-black uppercase tracking-wider ml-1">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-11 pr-11 h-12 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-muted-foreground hover:text-primary transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-[11px] font-black uppercase tracking-wider ml-1">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
                    <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" className="pl-11 pr-11 h-12 rounded-xl" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-4 text-muted-foreground hover:text-primary transition-colors">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-12 font-bold shadow-lg mt-4 rounded-xl text-md" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isSignUp ? "Sign Up Free" : "Log In to Stride")}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t bg-muted/5 py-6">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-[10px] text-primary font-black uppercase tracking-[0.2em] hover:opacity-80 transition-opacity">
              {isSignUp ? "Already a member? Log In" : "New to FitStride? Create Account"}
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
