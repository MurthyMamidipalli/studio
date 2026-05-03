
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Mail, Lock, Loader2, ArrowRight, UserPlus, LogIn } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInAnonymously 
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
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
      createUserWithEmailAndPassword(auth, email, password)
        .catch((error: any) => {
          setLoading(false);
          toast({
            variant: "destructive",
            title: "Registration Failed",
            description: error.message,
          });
        });
    } else {
      signInWithEmailAndPassword(auth, email, password)
        .catch((error: any) => {
          setLoading(false);
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: error.message,
          });
        });
    }
  };

  const handleAnonymous = () => {
    setLoading(true);
    signInAnonymously(auth).catch((error: any) => {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Guest Login Failed",
        description: error.message,
      });
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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg">
            <Activity className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">FitStride</h1>
          <p className="text-muted-foreground text-lg">Your journey to peak fitness starts here.</p>
        </div>

        <Card className="border-none shadow-2xl bg-card">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              {isSignUp ? <UserPlus className="h-6 w-6 text-accent" /> : <LogIn className="h-6 w-6 text-accent" />}
              {isSignUp ? "Create an Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-base">
              {isSignUp 
                ? "Join the FitStride community today." 
                : "Enter your credentials to access your dashboard."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    className="pl-9 h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-9 h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {isSignUp && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Password must be at least 6 characters long.
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <>
                    {isSignUp ? "Sign Up" : "Log In"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-medium">Or continue as</span>
              </div>
            </div>

            <Button variant="outline" className="w-full h-11" onClick={handleAnonymous} disabled={loading}>
              Try Guest Access
            </Button>
          </CardContent>
          <CardFooter className="justify-center border-t bg-muted/5 py-4">
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setEmail("");
                setPassword("");
              }}
              className="text-sm text-primary hover:underline font-bold transition-all"
            >
              {isSignUp ? "Already have an account? Log In" : "New to FitStride? Create an Account"}
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
