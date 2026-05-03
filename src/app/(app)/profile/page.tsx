
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, User, Bell, Shield, LogOut, ChevronRight, Loader2 } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  weight: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    // Correct path according to backend.json and firestore.rules
    return doc(db, "users", user.uid, "profile");
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      weight: 0,
      height: 0,
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        email: profile.email || "",
        weight: profile.weight || 0,
        height: profile.height || 0,
      });
    } else if (user) {
      form.reset({
        name: user.displayName || "",
        email: user.email || "",
        weight: 0,
        height: 0,
      });
    }
  }, [profile, user, form]);

  const onSubmit = (values: ProfileFormValues) => {
    if (!profileRef || !user) return;

    const data = {
      ...values,
      id: user.uid,
      updatedAt: serverTimestamp(),
      ...(profile ? {} : { createdAt: serverTimestamp() }),
    };

    setDocumentNonBlocking(profileRef, data, { merge: true });
    
    toast({
      title: "Profile Updated",
      description: "Your changes have been saved successfully.",
    });
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold text-primary">User Profile</h1>
        <p className="text-muted-foreground">Manage your account and app preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 text-center pt-8 pb-4">
              <div className="relative inline-block mx-auto">
                <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                  <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200/200`} alt={form.getValues("name")} />
                  <AvatarFallback>{form.getValues("name")?.substring(0, 2).toUpperCase() || "AX"}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 p-1 bg-accent rounded-full border-2 border-white shadow-sm">
                  <Settings className="h-4 w-4 text-accent-foreground" />
                </div>
              </div>
              <CardTitle className="font-headline text-xl mt-4">{form.watch("name") || "User"}</CardTitle>
              <CardDescription>Member since {profile?.createdAt ? (profile.createdAt.seconds ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString() : 'Today') : 'Today'}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ProfileMenuItem icon={User} label="Personal Details" active />
              <ProfileMenuItem icon={Bell} label="Notifications" />
              <ProfileMenuItem icon={Shield} label="Privacy & Security" />
              <ProfileMenuItem icon={LogOut} label="Log Out" color="text-destructive" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-accent/10 border-accent/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-accent tracking-widest">Premium Plan</p>
                <p className="text-sm font-medium mt-1">Status: Active</p>
              </div>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">Manage</Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="font-headline">Account Information</CardTitle>
                  <CardDescription>Update your personal details here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Alex Johnson" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="alex.j@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (lbs)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (in)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t bg-muted/5 p-4">
                  <Button type="submit">Save Changes</Button>
                </CardFooter>
              </Card>
            </form>
          </Form>

          <div className="mt-6 space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline">App Preferences</CardTitle>
                <CardDescription>Customize your experience.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PreferenceToggle label="Push Notifications" desc="Stay updated with goal progress and coach tips." defaultChecked />
                <PreferenceToggle label="Email Summaries" desc="Receive weekly reports of your fitness journey." defaultChecked />
                <PreferenceToggle label="Public Profile" desc="Allow other users to see your badges and achievements." />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileMenuItem({ icon: Icon, label, active, color }: any) {
  return (
    <div className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${active ? 'bg-primary/5 text-primary border-r-2 border-primary' : 'hover:bg-muted/50 text-foreground'}`}>
      <div className={`flex items-center gap-3 ${color || ''}`}>
        <Icon className="h-5 w-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

function PreferenceToggle({ label, desc, defaultChecked }: any) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div 
        onClick={() => setChecked(!checked)}
        className={`h-6 w-11 rounded-full relative cursor-pointer flex items-center px-1 transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
    </div>
  );
}
