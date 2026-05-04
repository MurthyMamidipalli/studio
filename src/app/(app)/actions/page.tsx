
"use client";

import { Card } from "@/components/ui/card";
import { Sparkles, Activity as ActivityIcon, ArrowRight, Dumbbell, Zap } from "lucide-react";
import Link from "next/link";

export default function ActionsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-2">
          <Zap className="h-8 w-8 fill-primary" />
        </div>
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Quick Actions</h1>
        <p className="text-muted-foreground text-lg font-medium max-w-lg mx-auto">
          One-tap access to your core fitness workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        <ActionBigCard 
          href="/workouts" 
          title="Start" 
          desc="Log a new session manually" 
          icon={Dumbbell} 
          color="bg-primary" 
        />
        <ActionBigCard 
          href="/coach" 
          title="Create" 
          desc="AI-powered fitness routines" 
          icon={Sparkles} 
          color="bg-accent" 
        />
        <ActionBigCard 
          href="/activity" 
          title="Analyze" 
          desc="Deep performance biometrics" 
          icon={ActivityIcon} 
          color="bg-card"
          border
        />
      </div>

      <div className="bg-primary/5 rounded-[2rem] p-8 border border-primary/10 relative overflow-hidden">
        <div className="absolute top-4 right-4 opacity-10">
          <ActivityIcon className="h-24 w-24 text-primary" />
        </div>
        <h3 className="text-xl font-headline font-bold mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" /> Pro Efficiency
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl font-medium">
          These tools are designed to help you stay ahead of your goals. Use "Analyze" to see real-time biometric synchronization or "Create" for personalized AI-generated routines.
        </p>
      </div>
    </div>
  );
}

function ActionBigCard({ href, title, desc, icon: Icon, color, border }: any) {
  const isWhite = color === 'bg-card' || border;
  
  return (
    <Link href={href} className="group">
      <Card className={`${color} ${border ? 'border-2 border-primary/20 bg-white' : 'border-none'} ${isWhite ? 'text-foreground' : 'text-primary-foreground'} hover:translate-y-[-8px] transition-all duration-300 shadow-xl h-[340px] flex flex-col justify-center items-center text-center p-8 cursor-pointer relative overflow-hidden rounded-[2.5rem]`}>
        <div className={`p-5 rounded-2xl mb-6 shadow-sm ${border ? 'bg-primary/10 text-primary' : 'bg-white/20'}`}>
          <Icon className="h-10 w-10" />
        </div>
        <h3 className="text-3xl font-headline font-black uppercase tracking-tighter mb-2">{title}</h3>
        <p className="text-sm font-medium opacity-80 mb-8 max-w-[200px]">{desc}</p>
        <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full ${border ? 'bg-primary text-white' : 'bg-black/10'}`}>
          Enter <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </div>
      </Card>
    </Link>
  );
}
