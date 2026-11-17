'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Incident, ResponderTeam } from '@/types';
import { Loader2, MapPin } from 'lucide-react';

interface TacticalMapProps {
  incidents: Incident[];
  teams: ResponderTeam[];
  selectedIncidentId?: string | null;
  onSelectIncident?: (incident: Incident) => void;
  onSelectTeam?: (team: ResponderTeam) => void;
  filterMode?: 'all' | 'critical' | 'teams_only';
}

const DynamicMap = dynamic(() => import('./TacticalMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-slate-400 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <div className="text-xs font-mono uppercase tracking-wider text-slate-300">
        Initializing Tactical GIS Engine (Chennai Grid)...
      </div>
    </div>
  ),
});

export default function TacticalMap(props: TacticalMapProps) {
  return <DynamicMap {...props} />;
}
