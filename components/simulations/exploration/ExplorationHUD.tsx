'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Crosshair, X, Globe, Mountain, Cpu, Telescope, Target, Maximize, Activity, ArrowLeft } from 'lucide-react';
import { useIrisInput } from '@/lib/input/IrisInputContext';
import { useIrisSettings } from '@/lib/settings/IrisSettingsContext';
import { ZoneType, POI } from '@/app/simulations/exploration/page';
import { playClickSound, playCollectSound } from '@/lib/audio/soundEffects';

interface HUDProps {
  activeZone: ZoneType;
  setActiveZone: (zone: ZoneType) => void;
  selectedPOI: POI | null;
  setSelectedPOI: (poi: POI | null) => void;
}

const ZONE_INFO: Record<ZoneType, { title: string; desc: string; icon: any }> = {
  ORBITAL: { title: 'Orbital Sector', desc: 'Exo-atmospheric environment monitoring.', icon: Globe },
  TERRAIN: { title: 'Surface Topology', desc: 'Planetary surface analysis.', icon: Mountain },
  RESEARCH: { title: 'Data Core', desc: 'Quantum information network.', icon: Cpu },
  OBSERVATORY: { title: 'Deep Space', desc: 'Long-range cosmological sensors.', icon: Telescope },
};

export function ExplorationHUD({ activeZone, setActiveZone, selectedPOI, setSelectedPOI }: HUDProps) {
  const input = useIrisInput();
  const { interfaceSounds, volume } = useIrisSettings();
  
  const zones: ZoneType[] = ['ORBITAL', 'TERRAIN', 'RESEARCH', 'OBSERVATORY'];

  return (
    <div className="flex h-full w-full flex-col justify-between p-6 pointer-events-none">
      {/* Top Bar */}
      <div className="flex w-full justify-between items-start pointer-events-auto">
        <div className="flex items-start gap-4">
          <Link
            href="/simulations"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white/90 text-slate-800 border border-slate-200 shadow-sm hover:bg-white transition-all h-fit"
          >
            <ArrowLeft size={18} className="text-sky-600" />
            <span>EXIT SIMULATION</span>
          </Link>

          <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl flex items-center space-x-4 border border-slate-200 shadow-sm border-l-4 border-l-sky-500">
            <div className="p-2.5 bg-sky-50 rounded-xl">
              {(() => {
                const Icon = ZONE_INFO[activeZone].icon;
                return <Icon size={24} className="text-sky-600" />;
              })()}
            </div>
            <div>
              <h1 className="text-lg font-extrabold uppercase tracking-wide text-slate-900">
                {ZONE_INFO[activeZone].title}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {ZONE_INFO[activeZone].desc}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-sm flex space-x-1.5">
          {zones.map((zone) => {
            const Icon = ZONE_INFO[zone].icon;
            const isActive = activeZone === zone;
            return (
              <button
                key={zone}
                onClick={() => {
                  setActiveZone(zone);
                  setSelectedPOI(null);
                  if (interfaceSounds) playClickSound((volume / 100) * 0.3);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 text-xs font-bold ${
                  isActive ? 'bg-sky-600 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Icon size={16} />
                <span className="tracking-wide">{zone}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Center Reticle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#67E8F9]/50 flex flex-col items-center justify-center">
        <Crosshair size={48} strokeWidth={1} />
      </div>

      {/* Right side POI Panel */}
      <AnimatePresence>
        {selectedPOI && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="absolute right-6 top-1/2 -translate-y-1/2 glass-card w-80 p-0 overflow-hidden pointer-events-auto border-[#60A5FA]/30"
          >
            <div className="bg-sky-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-sky-700">
                <Target size={20} />
                <span className="font-bold text-sm tracking-wide">LOCATION FOCUS</span>
              </div>
              <button onClick={() => setSelectedPOI(null)} className="text-slate-400 hover:text-slate-700 transition-colors p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 bg-white">
              <h2 className="text-xl font-bold text-slate-800 mb-2">{selectedPOI.name}</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{selectedPOI.description}</p>
              
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">STATUS</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">ACTIVE SECTOR</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Bar: Clean Guidance */}
      <div className="flex w-full justify-between items-end pointer-events-auto">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold text-slate-600 flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Move head cursor to explore · Blink to inspect points of interest</span>
        </div>

        <div className="flex space-x-3">
          <button 
            onClick={input.recenter} 
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-sky-700 border border-slate-200 font-bold text-xs shadow-sm hover:bg-sky-50 transition-all"
          >
            <Maximize size={16} />
            <span>RECENTER VIEW</span>
          </button>
        </div>
      </div>
    </div>
  );
}
