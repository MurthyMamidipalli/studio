
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, User, Bell, Shield, LogOut, ChevronRight } from "lucide-react";

export default function ProfilePage() {
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
                  <AvatarImage src="https://picsum.photos/seed/user1/200/200" alt="Alex" />
                  <AvatarFallback>AX</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 p-1 bg-accent rounded-full border-2 border-white shadow-sm">
                  <Settings className="h-4 w-4 text-accent-foreground" />
                </div>
              </div>
              <CardTitle className="font-headline text-xl mt-4">Alex Johnson</CardTitle>
              <CardDescription>Member since Oct 2024</CardDescription>
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
                <p className="text-sm font-medium mt-1">Next billing: Nov 28</p>
              </div>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">Manage</Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Account Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fname">First Name</Label>
                  <Input id="fname" defaultValue="Alex" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lname">Last Name</Label>
                  <Input id="lname" defaultValue="Johnson" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="alex.j@example.com" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input id="weight" type="number" defaultValue="165" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (in)</Label>
                  <Input id="height" type="number" defaultValue="70" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" defaultValue="28" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t bg-muted/5">
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>

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
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="h-6 w-11 bg-muted rounded-full relative cursor-pointer flex items-center px-1">
        <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform ${defaultChecked ? 'translate-x-5' : ''}`} />
      </div>
    </div>
  );
}
