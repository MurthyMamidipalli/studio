
"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Shield, LogOut, ChevronRight, Loader2, Camera, Activity, Scale, Ruler, Calendar as CalendarIcon, Upload } from "lucide-react";
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
  photoURL: z.string().optional(),
  age: z.coerce.number().min(0).optional(),
  weight: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  publicProfile: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type Section = 'personal' | 'fitness' | 'notifications' | 'privacy';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>('personal');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, "users", user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      photoURL: "",
      age: 0,
      weight: 0,
      height: 0,
      emailNotifications: true,
      pushNotifications: true,
      publicProfile: false,
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        email: profile.email || "",
        photoURL: profile.photoURL || "",
        age: profile.age || 0,
        weight: profile.weight || 0,
        height: profile.height || 0,
        emailNotifications: profile.settings?.emailNotifications ?? true,
        pushNotifications: profile.settings?.pushNotifications ?? true,
        publicProfile: profile.settings?.publicProfile ?? false,
      });
    } else if (user) {
      form.reset({
        name: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        age: 0,
        weight: 0,
        height: 0,
        emailNotifications: true,
        pushNotifications: true,
        publicProfile: false,
      });
    }
  }, [profile, user, form]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please choose an image under 2MB.",
      });
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      form.setValue("photoURL", base64String);
      setUploading(false);
      toast({
        title: "Photo Ready",
        description: "Click save to update your profile picture.",
      });
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (values: ProfileFormValues) => {
    if (!profileRef || !user) return;

    const { emailNotifications, pushNotifications, publicProfile, ...personal } = values;

    const data = {
      ...personal,
      settings: {
        emailNotifications,
        pushNotifications,
        publicProfile,
      },
      id: user.uid,
      updatedAt: serverTimestamp(),
      ...(profile ? {} : { createdAt: serverTimestamp() }),
    };

    setDocumentNonBlocking(profileRef, data, { merge: true });
    
    toast({
      title: "Profile Updated",
      description: "Your health details and preferences have been saved.",
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold text-primary">Your Profile</h1>
        <p className="text-muted-foreground">Manage your identity and personal health metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 text-center pt-8 pb-4">
              <div className="relative inline-block mx-auto">
                <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
                  <AvatarImage src={currentPhotoURL} alt={form.getValues("name")} className="object-cover" />
                  <AvatarFallback className="text-2xl">{form.getValues("name")?.substring(0, 2).toUpperCase() || "FT"}</AvatarFallback>
                </Avatar>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2 bg-primary text-primary-foreground rounded-full border-2 border-white shadow-lg hover:scale-110 transition-transform"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                />
              </div>
              <CardTitle className="font-headline text-xl mt-4">{form.watch("name") || "User"}</CardTitle>
              <CardDescription>Level {Math.floor((profile?.points || 0) / 100) + 1} Member</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ProfileMenuItem icon={User} label="Basic Info" active={activeSection === 'personal'} onClick={() => setActiveSection('personal')} />
              <ProfileMenuItem icon={Activity} label="Body Stats" active={activeSection === 'fitness'} onClick={() => setActiveSection('fitness')} />
              <ProfileMenuItem icon={Bell} label="Alerts" active={activeSection === 'notifications'} onClick={() => setActiveSection('notifications')} />
              <ProfileMenuItem icon={Shield} label="Privacy" active={activeSection === 'privacy'} onClick={() => setActiveSection('privacy')} />
              <ProfileMenuItem icon={LogOut} label="Log Out" color="text-destructive" onClick={handleLogout} />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {activeSection === 'personal' && (
                <Card className="border-none shadow-sm">
                  <CardHeader><CardTitle className="font-headline">Identity</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Alex Johnson" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} disabled /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="pt-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        <Upload className="h-4 w-4 mr-2" /> {uploading ? "Processing..." : "Change Photo"}
                      </Button>
                      <p className="text-[10px] text-muted-foreground mt-2 italic">Supports JPG, PNG (Max 2MB)</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t bg-muted/5 p-4"><Button type="submit">Save Changes</Button></CardFooter>
                </Card>
              )}

              {activeSection === 'fitness' && (
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-headline">Body & Health Stats</CardTitle>
                    <CardDescription>Your stats help us calculate calories and goals more accurately.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField control={form.control} name="age" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-muted-foreground" /> Age</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="weight" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Scale className="h-4 w-4 text-muted-foreground" /> Weight (lbs)</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="height" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Ruler className="h-4 w-4 text-muted-foreground" /> Height (in)</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t bg-muted/5 p-4"><Button type="submit">Update Stats</Button></CardFooter>
                </Card>
              )}

              {activeSection === 'notifications' && (
                <Card className="border-none shadow-sm">
                  <CardHeader><CardTitle className="font-headline">Alert Preferences</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="emailNotifications" render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-4 border rounded-xl">
                        <div className="space-y-0.5"><FormLabel>Email Updates</FormLabel><FormDescription>Receive weekly health summaries.</FormDescription></div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="pushNotifications" render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-4 border rounded-xl">
                        <div className="space-y-0.5"><FormLabel>Push Alerts</FormLabel><FormDescription>Stay on track with workout reminders.</FormDescription></div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                  </CardContent>
                  <CardFooter className="flex justify-end border-t bg-muted/5 p-4"><Button type="submit">Save Preferences</Button></CardFooter>
                </Card>
              )}

              {activeSection === 'privacy' && (
                <Card className="border-none shadow-sm">
                  <CardHeader><CardTitle className="font-headline">Privacy Controls</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="publicProfile" render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-4 border rounded-xl">
                        <div className="space-y-0.5"><FormLabel>Public Visibility</FormLabel><FormDescription>Allow other users to see your achievements.</FormDescription></div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                  </CardContent>
                  <CardFooter className="flex justify-end border-t bg-muted/5 p-4"><Button type="submit">Update Privacy</Button></CardFooter>
                </Card>
              )}
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
      className={`flex items-center justify-between p-4 cursor-pointer transition-colors border-b last:border-0 ${active ? 'bg-primary/5 text-primary border-r-4 border-primary' : 'hover:bg-muted/50 text-foreground'}`}
    >
      <div className={`flex items-center gap-3 ${color || ''}`}>
        <Icon className="h-5 w-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight className={`h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
    </div>
  );
}
