
"use client";

import { Card } from "@/components/ui/card";
import { Sparkles, Activity as ActivityIcon, ArrowRight, Dumbbell, Zap } from "lucide-react";
import Link from "next/link";

export default function ActionsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
      <div className="text-center space-y-3">
        <div className="inline-flex p-4 rounded-[2rem] bg-primary/10 text-primary mb-2 shadow-sm border border-primary/5">
          <Zap className="h-10 w-10 fill-primary" />
        </div>
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Quick Actions</h1>
        <p className="text-muted-foreground text-lg font-medium max-w-lg mx-auto">
          One-tap access to your core fitness and AI workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
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

      <div className="bg-primary/5 rounded-[2.5rem] p-10 border border-primary/10 relative overflow-hidden shadow-sm">
        <div className="absolute -top-6 -right-6 opacity-[0.03]">
          <ActivityIcon className="h-48 w-48 text-primary" />
        </div>
        <div className="relative z-10">
          <h3 className="text-xl font-headline font-bold mb-4 flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-accent fill-accent" /> Pro Efficiency Mode
          </h3>
          <p className="text-base text-muted-foreground leading-relaxed max-w-3xl font-medium">
            Stay ahead of your goals with our integrated tools. Use **Analyze** for real-time biometric synchronization or **Create** to let the AI build a routine based on your recent fatigue levels.
          </p>
        </div>
      </div>
    </div>
  );
}

function ActionBigCard({ href, title, desc, icon: Icon, color, border }: any) {
  const isWhite = color === 'bg-card' || border;
  
  return (
    <Link href={href} className="group">
      <Card className={`${color} ${border ? 'border-2 border-primary/20 bg-white' : 'border-none'} ${isWhite ? 'text-foreground' : 'text-primary-foreground'} hover:translate-y-[-10px] transition-all duration-500 shadow-xl h-[360px] flex flex-col justify-center items-center text-center p-8 cursor-pointer relative overflow-hidden rounded-[3rem]`}>
        <div className={`p-6 rounded-2xl mb-8 shadow-inner transition-transform group-hover:scale-110 ${border ? 'bg-primary/10 text-primary' : 'bg-white/20'}`}>
          <Icon className="h-12 w-12" />
        </div>
        <h3 className="text-3xl font-headline font-black uppercase tracking-tighter mb-2">{title}</h3>
        <p className="text-sm font-semibold opacity-80 mb-10 max-w-[200px] leading-tight">{desc}</p>
        <div className={`flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-full shadow-lg ${border ? 'bg-primary text-white' : 'bg-black/10'}`}>
          Enter <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
        </div>
      </Card>
    </Link>
  );
}
