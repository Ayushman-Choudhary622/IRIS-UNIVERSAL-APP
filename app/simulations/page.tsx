'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import IrisBackButton from '@/components/IrisBackButton';
import { Plane, Compass, Sparkles, ArrowRight, ArrowLeft, ChevronLeft } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

const SimulationPreview = dynamic(
  () => import('@/components/simulations/SimulationPreview'),
  { ssr: false }
);

export default function SimulationsPage() {
  return (
    <div className="h-[calc(100vh-var(--header-height))] bg-[var(--iris-bg)] px-8 py-6 pt-24 flex flex-col justify-between overflow-hidden">
      {/* Upper-Left Standard BACK TO ENTERTAINMENT Button */}
      <IrisBackButton
        href="/entertainment"
        label="BACK TO ENTERTAINMENT"
        subtitle="Return to Entertainment Menu"
        accentColor="#06b6d4"
        showHomeShortcut={true}
        position="fixed"
      />

      <div>
        <PageHeader 
          title="SIMULATIONS" 
          subtitle="Calm, Horizon-Guided 3D Spatial Training" 
          status="ONLINE"
        />
      </div>

      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm relative overflow-hidden h-[220px] flex items-center justify-center">
        <Suspense fallback={<div className="font-mono text-sky-600 font-bold animate-pulse">INITIALIZING 3D ENGINE...</div>}>
          <SimulationPreview />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-auto">
        <Link href="/simulations/flight" className="block group">
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm hover:border-sky-400 hover:shadow-md transition-all flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-sky-50 p-3.5 rounded-2xl">
                <Plane className="w-8 h-8 text-sky-600" />
              </div>
              <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200">
                360° AIRCRAFT COCKPIT
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">FLIGHT SIMULATION</h3>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              Photorealistic 360° interior cockpit with live cursor aerodynamic flight steering, rushing airflow speed particles, and turbofan sound.
            </p>
            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full">HEAD CURSOR PITCH</span>
              <span className="text-xs font-extrabold text-sky-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Enter Simulator <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </Link>

        <div className="bg-slate-50/80 p-6 rounded-2xl border-2 border-dashed border-slate-300 shadow-none flex flex-col h-full opacity-85">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-slate-200/70 p-3.5 rounded-2xl">
              <Sparkles className="w-8 h-8 text-slate-500" />
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-200/80 text-slate-600 text-xs font-bold border border-slate-300">
              IN DEVELOPMENT
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-700 mb-2">MORE COMING SOON...</h3>
          <p className="text-slate-500 text-sm mb-4 leading-relaxed">
            New serene 3D medical spatial environments and sensory relaxation simulations are currently being tailored for hands-free immersion.
          </p>
          <div className="mt-auto pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-full">CLINICAL PIPELINE</span>
            <span className="text-xs font-extrabold text-slate-400">
              Expedition Planned
            </span>
          </div>
        </div>
      </div>

      <div className="text-center text-xs font-semibold text-slate-400 py-1">
        Clinical Head-Guided Simulation Suite · Zero Eye Fatigue
      </div>
    </div>
  );
}
