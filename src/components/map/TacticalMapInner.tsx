'use client';

import React, { useEffect, useRef } from 'react';
import { Incident, ResponderTeam } from '@/types';
import { isValidCoordinate } from '@/lib/geoUtils';
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

// Visual icons based on team specialization
function getTeamInsignia(type: string): string {
  switch (type) {
    case 'ndrf_water_rescue':
      return '🛥️';
    case 'sdrf_paramedic':
      return '🚑';
    case 'fire_rescue':
      return '🚒';
    case 'electrical_grid':
      return '⚡';
    case 'drone_recon':
      return '🚁';
    default:
      return '🛡️';
  }
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

    // Center on Greater Chennai flood operational corridor (12.985, 80.215)
    const map = L.map(mapContainerRef.current, {
      center: [12.9850, 80.2150],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    // OpenStreetMap Standard Tiles with dark-contrast operational theme
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • RESQ.AI Tactical',
      className: 'map-tiles-tactical-dark',
    }).addTo(map);

    // Fallback/Secondary Carto layer if needed
    L.control.attribution({ position: 'bottomright', prefix: 'RESQ.AI Operational Grid • OpenStreetMap' }).addTo(map);

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

    // 1. Plot ONLY Incidents with Valid Known Coordinates
    // Unknown-location incidents are strictly excluded from map points and handled in Needs Location Queue
    if (filterMode !== 'teams_only') {
      const validIncidents = incidents.filter((i) =>
        isValidCoordinate(i.location?.lat, i.location?.lng)
      );

      const filteredIncidents =
        filterMode === 'critical'
          ? validIncidents.filter((i) => (i.preliminaryUrgency || i.severity) === 'critical')
          : validIncidents;

      filteredIncidents.forEach((inc) => {
        const isSelected = inc.id === selectedIncidentId;
        const effectiveUrgency = inc.preliminaryUrgency || inc.severity;
        const isResolved = inc.status === 'resolved';
        const isInvalid = inc.status === 'invalid';

        // Urgency color assignment: Red / Orange / Yellow / Green
        let color = '#eab308'; // Yellow (Medium default)
        let pulseHtml = '';

        if (isResolved) {
          color = '#19E6A0'; // Mint Green (Resolved)
        } else if (isInvalid) {
          color = '#64748b'; // Slate (Invalid / Closed)
        } else if (effectiveUrgency === 'critical') {
          color = '#FF4D67'; // Emergency Coral (Critical)
          pulseHtml = '<span class="absolute inset-0 rounded-full bg-[#FF4D67] animate-ping opacity-75"></span>';
        } else if (effectiveUrgency === 'high') {
          color = '#FFB547'; // Amber (High)
        } else if (effectiveUrgency === 'medium') {
          color = '#eab308'; // Yellow (Medium)
        } else if (effectiveUrgency === 'low') {
          color = '#19E6A0'; // Mint Green (Low)
        }

        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group" style="width: 32px; height: 32px;">
            ${!isResolved && !isInvalid ? pulseHtml : ''}
            <div class="relative w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 transition-transform duration-200" 
                 style="background-color: #080F23; border-color: ${color}; ${
          isSelected ? 'box-shadow: 0 0 16px ' + color + '; transform: scale(1.25);' : ''
        }">
              <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${color};"></span>
            </div>
            <div class="absolute -bottom-5 px-1.5 py-0.5 rounded-full bg-[#080F23]/95 border border-[#1E2E4E] text-[9px] font-mono text-cyan-300 whitespace-nowrap pointer-events-none shadow backdrop-blur-sm">
              ${inc.location.area || inc.id}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'resq-incident-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([inc.location.lat, inc.location.lng], { icon: customIcon });

        const popupContent = `
          <div class="p-1.5 min-w-[220px] max-w-[280px] space-y-2 font-sans">
            <div class="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <span class="font-mono text-[11px] font-bold text-cyan-400">${inc.id}</span>
              <span class="text-[9px] uppercase font-bold px-2 py-0.5 rounded" style="background-color: ${color}25; color: ${color}; border: 1px solid ${color}60;">
                ${effectiveUrgency}
              </span>
            </div>
            <div class="font-bold text-xs text-white leading-snug">${inc.title}</div>
            <div class="text-[11px] text-slate-300">
              <strong class="text-slate-400">Location:</strong> ${inc.location.address} (${inc.location.area})
            </div>
            ${
              inc.location.waterLevelFt
                ? `<div class="text-[11px] text-cyan-400 font-mono">🌊 Water Level: ~${inc.location.waterLevelFt} ft</div>`
                : ''
            }
            ${
              inc.aiTriage
                ? `<div class="text-[10px] bg-slate-900/90 p-1.5 rounded border border-slate-800 text-amber-200">
                     <strong>AI Priority:</strong> ${inc.aiTriage.priorityScore}/100 • ${inc.aiTriage.recommendedUnits?.slice(0, 2).join(', ')}
                   </div>`
                : ''
            }
            <div class="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-800">
              <span>Status: <b class="text-white uppercase font-mono">${inc.status}</b></span>
              <span>People: <b class="text-white">${inc.reporter.citizenCount}</b></span>
            </div>
            <div class="pt-1">
              <button 
                id="btn-inspect-${inc.id}" 
                class="w-full text-center py-1 px-2 text-[11px] font-bold rounded bg-cyan-600 hover:bg-cyan-500 text-white transition shadow"
              >
                Inspect Dossier / Assign Team
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          onSelectIncident?.(inc);
        });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-inspect-${inc.id}`);
          if (btn) {
            btn.onclick = (e) => {
              e.stopPropagation();
              onSelectIncident?.(inc);
            };
          }
        });

        layerGroup.addLayer(marker);
      });
    }

    // 2. Plot Distinct Responder Teams (5 Fictional Simulated Teams)
    teams.forEach((team) => {
      const isDispatched = team.status === 'en_route' || team.status === 'on_scene';
      const teamInsignia = getTeamInsignia(team.type);
      const isSelected = selectedIncidentId && team.assignedIncidentId === selectedIncidentId;

      // Team pin color: Cyan if dispatched, Emerald if idle, Amber if refueling
      let teamColor = '#06b6d4'; // Cyan
      if (team.status === 'idle') {
        teamColor = '#10b981'; // Emerald
      } else if (team.status === 'refueling' || team.status === 'maintenance') {
        teamColor = '#f59e0b'; // Amber
      }

      const pulseEffect = isDispatched
        ? '<span class="absolute inset-0 rounded-xl bg-cyan-400 animate-ping opacity-60"></span>'
        : '';

      const teamIconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group" style="width: 40px; height: 40px;">
          ${pulseEffect}
          <div class="relative w-9 h-9 rounded-xl flex items-center justify-center shadow-2xl border-2 transition-transform duration-200"
               style="background-color: #070d1c; border-color: ${teamColor}; ${
        isSelected ? 'box-shadow: 0 0 18px ' + teamColor + '; transform: scale(1.25);' : ''
      }">
            <span class="text-sm select-none">${teamInsignia}</span>
          </div>
          <div class="absolute -top-3.5 px-1.5 py-0.2 rounded font-mono text-[8px] font-bold whitespace-nowrap shadow border"
               style="background-color: #070d1c; color: ${teamColor}; border-color: ${teamColor}80;">
            ${team.callsign}
          </div>
        </div>
      `;

      const teamIcon = L.divIcon({
        html: teamIconHtml,
        className: 'resq-team-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const teamLat = team.currentLocation?.lat || team.baseCoordinates?.lat || 12.98;
      const teamLng = team.currentLocation?.lng || team.baseCoordinates?.lng || 80.22;

      const teamMarker = L.marker([teamLat, teamLng], { icon: teamIcon });

      const teamPopup = `
        <div class="p-1.5 min-w-[230px] max-w-[290px] space-y-1.5 font-sans">
          <div class="flex items-center justify-between border-b border-slate-800 pb-1">
            <span class="font-mono text-[10px] font-bold text-cyan-400">${team.callsign}</span>
            <span class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded font-mono" style="background-color: ${teamColor}20; color: ${teamColor}; border: 1px solid ${teamColor}50;">
              ${team.status.toUpperCase()}
            </span>
          </div>
          <div class="font-bold text-xs text-white">${team.name}</div>
          <div class="text-[10px] text-cyan-300 font-medium">🎯 ${team.specialization}</div>
          <div class="text-[11px] text-slate-300">
            <strong>Base:</strong> ${team.baseCoordinates?.label || team.currentLocation.label}
          </div>
          <div class="text-[10px] text-slate-400 font-mono flex justify-between">
            <span>Radio: <b>${team.radioChannel}</b></span>
            <span>Personnel: <b>${team.personnelCount}</b></span>
          </div>
          ${
            team.assignedIncidentTitle
              ? `<div class="text-[10px] bg-slate-900 p-1.5 rounded border border-cyan-800/60 text-cyan-200">
                   <strong>Assigned Incident:</strong> ${team.assignedIncidentTitle}
                 </div>`
              : `<div class="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 p-1 rounded border border-emerald-800/40">
                   ✓ Available for emergency dispatch
                 </div>`
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

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-xl overflow-hidden border border-[#1E2E4E] bg-[#080F23]">
      <style jsx global>{`
        /* Dark Theme Styling for OpenStreetMap Tiles */
        .map-tiles-tactical-dark {
          filter: brightness(0.65) invert(1) contrast(2.6) hue-rotate(205deg) saturate(0.4);
        }
        .leaflet-container {
          background-color: #080F23 !important;
          font-family: inherit;
        }
        .leaflet-popup-content-wrapper {
          background-color: #101C35 !important;
          border: 1px solid rgba(0, 217, 255, 0.3) !important;
          border-radius: 0.75rem !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.8), 0 0 15px -3px rgba(0, 217, 255, 0.25) !important;
          color: #F8FAFF !important;
        }
        .leaflet-popup-tip {
          background-color: #101C35 !important;
        }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full min-h-[460px]" />
    </div>
  );
}
