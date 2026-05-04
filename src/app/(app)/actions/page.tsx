
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Zap, Sparkles, Activity as ActivityIcon, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ActionsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-headline font-bold text-primary">Quick Actions</h1>
        <p className="text-muted-foreground text-lg font-medium">What would you like to accomplish today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        <ActionBigCard 
          href="/workouts" 
          title="Start" 
          desc="Log a new workout session manually" 
          icon={Zap} 
          color="bg-primary" 
        />
        <ActionBigCard 
          href="/coach" 
          title="Create" 
          desc="Generate an AI-powered fitness routine" 
          icon={Sparkles} 
          color="bg-accent" 
        />
        <ActionBigCard 
          href="/activity" 
          title="Analyze" 
          desc="Deep dive into your performance metrics" 
          icon={ActivityIcon} 
          color="bg-white"
          border
        />
      </div>

      <div className="bg-primary/5 rounded-2xl p-8 mt-12 border border-primary/10">
        <h3 className="text-xl font-headline font-bold mb-4">Pro Tip</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The "Analyze" tool uses real-time data from your connected devices. For the most accurate AI routines, ensure you log your weight and height stats in your profile.
        </p>
      </div>
    </div>
  );
}

function ActionBigCard({ href, title, desc, icon: Icon, color, border }: any) {
  return (
    <Link href={href} className="group">
      <Card className={`${color} ${border ? 'border-2 border-primary/20 bg-card' : 'border-none'} ${color === 'bg-card' || border ? 'text-foreground' : 'text-primary-foreground'} hover:scale-[1.05] transition-all shadow-xl h-[300px] flex flex-col justify-center items-center text-center p-8 cursor-pointer relative overflow-hidden`}>
        {!border && <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Icon className="h-32 w-32 -mr-8 -mt-8" />
        </div>}
        <div className={`p-5 rounded-2xl mb-6 ${border ? 'bg-primary/10 text-primary' : 'bg-white/20'}`}>
          <Icon className="h-10 w-10" />
        </div>
        <h3 className="text-3xl font-headline font-black uppercase tracking-tighter mb-2">{title}</h3>
        <p className="text-sm font-medium opacity-80 mb-6">{desc}</p>
        <div className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest ${border ? 'text-primary' : 'text-white'}`}>
          Go now <ArrowRight className="h-4 w-4" />
        </div>
      </Card>
    </Link>
  );
}
