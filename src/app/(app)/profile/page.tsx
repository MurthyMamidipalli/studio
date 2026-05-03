
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, User, Bell, Shield, LogOut, ChevronRight, Loader2, Camera, Link as LinkIcon } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, useAuth } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  photoURL: z.string().url("Please enter a valid image URL").or(z.literal("")),
  weight: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, "users", user.uid, "profile");
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      photoURL: "",
      weight: 0,
      height: 0,
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        email: profile.email || "",
        photoURL: profile.photoURL || "",
        weight: profile.weight || 0,
        height: profile.height || 0,
      });
    } else if (user) {
      form.reset({
        name: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
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

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPhotoURL = form.watch("photoURL") || `https://picsum.photos/seed/${user?.uid}/200/200`;

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
                  <AvatarImage src={currentPhotoURL} alt={form.getValues("name")} />
                  <AvatarFallback>{form.getValues("name")?.substring(0, 2).toUpperCase() || "AX"}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 p-1 bg-accent rounded-full border-2 border-white shadow-sm">
                  <Camera className="h-4 w-4 text-accent-foreground" />
                </div>
              </div>
              <CardTitle className="font-headline text-xl mt-4">{form.watch("name") || "User"}</CardTitle>
              <CardDescription>Member since {profile?.createdAt ? (profile.createdAt.seconds ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString() : 'Today') : 'Today'}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ProfileMenuItem icon={User} label="Personal Details" active />
              <ProfileMenuItem icon={Bell} label="Notifications" />
              <ProfileMenuItem icon={Shield} label="Privacy & Security" />
              <ProfileMenuItem icon={LogOut} label="Log Out" color="text-destructive" onClick={handleLogout} />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="font-headline">Account Information</CardTitle>
                  <CardDescription>Update your personal details and profile picture here.</CardDescription>
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
                  <FormField
                    control={form.control}
                    name="photoURL"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profile Picture URL</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="https://example.com/image.jpg" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Enter a direct URL to an image.
                        </FormDescription>
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
        </div>
      </div>
    </div>
  );
}

function ProfileMenuItem({ icon: Icon, label, active, color, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${active ? 'bg-primary/5 text-primary border-r-2 border-primary' : 'hover:bg-muted/50 text-foreground'}`}
    >
      <div className={`flex items-center gap-3 ${color || ''}`}>
        <Icon className="h-5 w-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
