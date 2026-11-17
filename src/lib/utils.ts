import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ${diffMin % 60}m ago`;
    return new Date(isoString).toLocaleDateString();
  } catch {
    return 'Recently';
  }
}

export function getSeverityBadgeClass(severity: string) {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 'bg-red-950/80 text-red-300 border-red-700/60 font-semibold';
    case 'high':
      return 'bg-amber-950/80 text-amber-300 border-amber-700/60 font-semibold';
    case 'medium':
      return 'bg-yellow-950/80 text-yellow-300 border-yellow-700/60';
    case 'low':
      return 'bg-slate-800 text-slate-300 border-slate-700';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

export function getStatusBadgeClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'pending':
    case 'reported':
      return 'bg-slate-900/90 text-slate-300 border-slate-700 font-medium';
    case 'under_review':
    case 'triaged':
      return 'bg-purple-950/90 text-purple-300 border-purple-700 font-medium';
    case 'assigned':
    case 'dispatched':
      return 'bg-blue-950/90 text-blue-300 border-blue-700 font-medium';
    case 'in_progress':
      return 'bg-cyan-950/90 text-cyan-300 border-cyan-700 animate-pulse font-medium';
    case 'resolved':
      return 'bg-emerald-950/90 text-emerald-300 border-emerald-700 font-medium';
    case 'invalid':
    case 'closed_invalid':
      return 'bg-rose-950/90 text-rose-300 border-rose-800 font-medium';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

export function getStatusLabel(status: string): string {
  switch (status?.toLowerCase()) {
    case 'pending':
    case 'reported':
      return 'Pending';
    case 'under_review':
    case 'triaged':
      return 'Under Review';
    case 'assigned':
    case 'dispatched':
      return 'Assigned';
    case 'in_progress':
      return 'In Progress';
    case 'resolved':
      return 'Resolved';
    case 'invalid':
    case 'closed_invalid':
      return 'Closed / Invalid';
    default:
      return status?.replace('_', ' ') || 'Unknown';
  }
}

export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'flood_water':
      return 'Flooding / Inundation';
    case 'medical_critical':
      return 'Critical Medical Emergency';
    case 'structural_collapse':
      return 'Structural Collapse / Breaches';
    case 'elderly_infant_stranded':
      return 'Elderly / Infant Stranded';
    case 'power_hazard':
      return 'Live Wire / Power Hazard';
    case 'food_water_supply':
      return 'Food / Potable Water Depletion';
    case 'road_blockage':
      return 'Road Blocked / Submerged';
    default:
      return category?.replace('_', ' ') || category;
  }
}
