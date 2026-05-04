
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Mail, Lock, Loader2, UserPlus, LogIn, RefreshCcw, Eye, EyeOff, User } from "lucide-react";
import { useAuth, useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { doc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ variant: "destructive", title: "Error", description: "Please enter your email." });
      return;
    }
    setLoading(true);
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setLoading(false);
        toast({ title: "Reset Email Sent", description: "Check your inbox for a reset link." });
        setIsForgotPassword(false);
      })
      .catch((error: any) => {
        setLoading(false);
        toast({ variant: "destructive", title: "Error", description: error.message });
      });
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
      <div className="w-full max-sm:max-w-sm space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center">
          <Activity className="h-10 w-10 text-primary mx-auto mb-2" />
          <h1 className="text-3xl font-headline font-bold text-primary tracking-tight">FitStride</h1>
        </div>

        <Card className="border-none shadow-xl bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              {isForgotPassword ? "Reset" : isSignUp ? "Sign Up" : "Log In"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isForgotPassword ? "Get a reset link via email." : isSignUp ? "Join the community." : "Access your dashboard."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isForgotPassword ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email-reset">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email-reset" type="email" placeholder="name@example.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <Button type="submit" className="w-full h-10 font-bold" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Link"}
                </Button>
                <button type="button" onClick={() => setIsForgotPassword(false)} className="w-full text-xs text-muted-foreground hover:text-primary transition-colors">Back to Login</button>
              </form>
            ) : (
              <form onSubmit={handleAuth} className="space-y-4">
                {isSignUp && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="name@example.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {!isSignUp && <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] text-primary hover:underline">Forgot?</button>}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-9 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" className="pl-9 pr-10" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full h-10 font-bold" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isSignUp ? "Sign Up" : "Log In")}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="justify-center border-t bg-muted/5 py-3">
            {!isForgotPassword && (
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-[11px] text-primary font-bold hover:underline">
                {isSignUp ? "Already have an account? Log In" : "New to FitStride? Create Account"}
              </button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
