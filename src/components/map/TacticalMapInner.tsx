'use client';

import React, { useEffect, useRef } from 'react';
import { Incident, ResponderTeam } from '@/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TacticalMapProps {
  incidents: Incident[];
  teams: ResponderTeam[];
  selectedIncidentId?: string | null;
  onSelectIncident?: (incident: Incident) => void;
  onSelectTeam?: (team: ResponderTeam) => void;
  filterMode?: 'all' | 'critical' | 'teams_only';
}

export default function TacticalMapInner({
  incidents,
  teams,
  selectedIncidentId,
  onSelectIncident,
  onSelectTeam,
  filterMode = 'all',
}: TacticalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Chennai metropolitan flood zone (12.98, 80.22)
    const map = L.map(mapContainerRef.current, {
      center: [12.9850, 80.2150],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark Matter tile layer for high-contrast emergency operations room
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Attribution
    L.control.attribution({ position: 'bottomright', prefix: 'RESQ.AI Chennai • CartoDB' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when data, filter, or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Plot Incidents
    if (filterMode !== 'teams_only') {
      const filteredIncidents =
        filterMode === 'critical'
          ? incidents.filter((i) => i.severity === 'critical')
          : incidents;

      filteredIncidents.forEach((inc) => {
        const isSelected = inc.id === selectedIncidentId;
        const effectiveSeverity = inc.preliminaryUrgency || inc.severity;
        const isCritical = effectiveSeverity === 'critical';
        const isResolved = inc.status === 'resolved';
        const isInvalid = inc.status === 'invalid';

        let color = '#38bdf8'; // cyan
        let pulseClass = '';
        if (isResolved) {
          color = '#10b981'; // green
        } else if (isInvalid) {
          color = '#64748b'; // slate muted
        } else if (isCritical) {
          color = '#ef4444'; // red
          pulseClass = 'animate-ping opacity-75';
        } else if (effectiveSeverity === 'high') {
          color = '#f59e0b'; // amber
        }

        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group" style="width: 32px; height: 32px;">
            ${
              isCritical && !isResolved
                ? `<span class="absolute inset-0 rounded-full bg-red-500 ${pulseClass}"></span>`
                : ''
            }
            <div class="relative w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2" 
                 style="background-color: #0f172a; border-color: ${color}; ${
          isSelected ? 'box-shadow: 0 0 16px ' + color + '; transform: scale(1.2);' : ''
        }">
              <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${color};"></span>
            </div>
            <div class="absolute -bottom-5 px-1.5 py-0.2 rounded bg-slate-900/90 border border-slate-700 text-[9px] font-mono text-white whitespace-nowrap pointer-events-none shadow">
              ${inc.location.area}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'resq-custom-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([inc.location.lat, inc.location.lng], { icon: customIcon });

        const popupContent = `
          <div class="p-1 min-w-[210px] space-y-2">
            <div class="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <span class="font-mono text-[10px] font-bold text-red-400">${inc.id}</span>
              <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                inc.severity === 'critical' ? 'bg-red-950 text-red-300' : 'bg-slate-800 text-slate-300'
              }">${inc.severity}</span>
            </div>
            <div class="font-bold text-xs text-white leading-tight">${inc.title}</div>
            <div class="text-[11px] text-slate-300">
              <strong>Loc:</strong> ${inc.location.address} (${inc.location.area})
            </div>
            ${
              inc.location.waterLevelFt
                ? `<div class="text-[11px] text-cyan-400 font-mono">🌊 Water Level: ~${inc.location.waterLevelFt} ft</div>`
                : ''
            }
            ${
              inc.aiTriage
                ? `<div class="text-[10px] bg-slate-900 p-1.5 rounded border border-slate-800 text-amber-200">
                     <strong>AI Priority:</strong> ${inc.aiTriage.priorityScore}/100
                   </div>`
                : ''
            }
            <div class="text-[10px] text-slate-400 flex justify-between pt-1">
              <span>Status: <b class="text-white">${inc.status.toUpperCase()}</b></span>
              <span>People: <b class="text-white">${inc.reporter.citizenCount}</b></span>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          onSelectIncident?.(inc);
        });

        layerGroup.addLayer(marker);
      });
    }

    // 2. Plot Responder Teams
    teams.forEach((team) => {
      const isDispatched = team.status === 'en_route' || team.status === 'on_scene';
      const teamColor = isDispatched ? '#06b6d4' : '#64748b'; // cyan or slate

      const teamIconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group" style="width: 36px; height: 36px;">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center shadow-xl border-2"
               style="background-color: #0b1120; border-color: ${teamColor};">
            <span class="text-xs font-black text-white">⚡</span>
          </div>
          <div class="absolute -top-4 px-1 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-[8px] font-mono text-cyan-200 whitespace-nowrap shadow">
            ${team.callsign}
          </div>
        </div>
      `;

      const teamIcon = L.divIcon({
        html: teamIconHtml,
        className: 'resq-team-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const teamMarker = L.marker([team.currentLocation.lat, team.currentLocation.lng], { icon: teamIcon });

      const teamPopup = `
        <div class="p-1 min-w-[200px] space-y-1.5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-1">
            <span class="font-mono text-[10px] font-bold text-cyan-400">${team.callsign}</span>
            <span class="text-[9px] uppercase px-1 py-0.5 rounded bg-cyan-950 text-cyan-300">${team.status}</span>
          </div>
          <div class="font-bold text-xs text-white">${team.name}</div>
          <div class="text-[11px] text-slate-300">Commander: ${team.commander}</div>
          <div class="text-[10px] text-slate-400 font-mono">Radio: ${team.radioChannel}</div>
          ${
            team.assignedIncidentTitle
              ? `<div class="text-[10px] bg-slate-900 p-1.5 rounded border border-slate-800 text-cyan-300">
                   <strong>Assigned:</strong> ${team.assignedIncidentTitle}
                 </div>`
              : `<div class="text-[10px] text-slate-500 italic">Available for dispatch</div>`
          }
        </div>
      `;

      teamMarker.bindPopup(teamPopup);
      teamMarker.on('click', () => {
        onSelectTeam?.(team);
      });

      layerGroup.addLayer(teamMarker);
    });
  }, [incidents, teams, selectedIncidentId, filterMode, onSelectIncident, onSelectTeam]);

  return <div ref={mapContainerRef} className="w-full h-full min-h-[420px] rounded-xl overflow-hidden" />;
}
