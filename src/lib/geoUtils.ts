import { Incident, ResponderTeam, IncidentCategory, TeamType } from '@/types';

/**
 * Validates whether coordinates are valid, finite, non-zero,
 * and within the Greater Chennai / Tamil Nadu emergency operations boundary.
 */
export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat === undefined || lat === null || lng === undefined || lng === null) return false;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  // Chennai metropolitan area boundary check (~12.5 to 13.5 N, ~79.8 to 80.5 E)
  return lat >= 12.0 && lat <= 14.0 && lng >= 79.0 && lng <= 81.0;
}

/**
 * Calculates Great-Circle (Haversine) straight-line distance between two coordinates in kilometers.
 * Note: Explicitly straight-line distance, NOT road ETA (roads may be flooded/blocked).
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

export interface RankedTeamResult {
  team: ResponderTeam;
  rank: number;
  totalScore: number;
  specializationFit: 'primary' | 'secondary' | 'general';
  specializationScore: number;
  availabilityScore: number;
  distanceKm: number | null;
  approxDistanceDisclaimer: string;
  recommendationReason: string;
  canAssignImmediately: boolean;
  isAlreadyAssignedHere: boolean;
  doubleAssignmentRisk: boolean;
  conflictIncidentTitle?: string;
}

/**
 * Ranks simulated response teams using:
 * 1. Specialization match to the incident category
 * 2. Availability (idle > busy/en-route)
 * 3. Approximate straight-line distance (Haversine km)
 */
export function rankTeamsForIncident(
  incident: Incident,
  teams: ResponderTeam[]
): RankedTeamResult[] {
  const hasValidIncCoords = isValidCoordinate(incident.location?.lat, incident.location?.lng);

  const results: RankedTeamResult[] = teams.map((team) => {
    let specializationScore = 10;
    let specializationFit: 'primary' | 'secondary' | 'general' = 'general';
    let specializationReason = 'General emergency support capability.';

    // 1. Specialization Matching Matrix
    const cat = incident.category;
    const teamType = team.type;

    if (cat === 'flood_water' || cat === 'elderly_infant_stranded') {
      if (teamType === 'ndrf_water_rescue') {
        specializationScore = 50;
        specializationFit = 'primary';
        specializationReason = 'Prime match: Inflatable rescue boats & swift-water flood evacuation divers.';
      } else if (teamType === 'drone_recon') {
        specializationScore = 28;
        specializationFit = 'secondary';
        specializationReason = 'Secondary match: Aerial thermal recon & emergency supply drops.';
      } else if (teamType === 'sdrf_paramedic') {
        specializationScore = 25;
        specializationFit = 'secondary';
        specializationReason = 'Secondary match: Amphibious medical evacuation support.';
      }
    } else if (cat === 'medical_critical') {
      if (teamType === 'sdrf_paramedic') {
        specializationScore = 55;
        specializationFit = 'primary';
        specializationReason = 'Prime match: 4x4 high-wading chassis, ALS obstetric and cardiac trauma kit.';
      } else if (teamType === 'ndrf_water_rescue') {
        specializationScore = 26;
        specializationFit = 'secondary';
        specializationReason = 'Secondary match: Water extraction to land-based ambulance rendezvous.';
      }
    } else if (cat === 'structural_collapse') {
      if (teamType === 'fire_rescue') {
        specializationScore = 55;
        specializationFit = 'primary';
        specializationReason = 'Prime match: Heavy hydraulic spreaders, tree chainsaws & structural shoring.';
      } else if (teamType === 'ndrf_water_rescue') {
        specializationScore = 24;
        specializationFit = 'secondary';
        specializationReason = 'Secondary match: Collapse victim extraction in flooded foundations.';
      }
    } else if (cat === 'power_hazard') {
      if (teamType === 'electrical_grid') {
        specializationScore = 55;
        specializationFit = 'primary';
        specializationReason = 'Prime match: Certified 33kV high-voltage substation isolation & snapped cable earthing.';
      } else if (teamType === 'fire_rescue') {
        specializationScore = 20;
        specializationFit = 'secondary';
        specializationReason = 'Secondary match: Fire perimeter containment during electrical sparking.';
      }
    } else if (cat === 'food_water_supply') {
      if (teamType === 'drone_recon') {
        specializationScore = 50;
        specializationFit = 'primary';
        specializationReason = 'Prime match: Rapid multi-rotor air-drop of ration packs & medicine to isolated roofs.';
      } else if (teamType === 'ndrf_water_rescue') {
        specializationScore = 32;
        specializationFit = 'secondary';
        specializationReason = 'Secondary match: Bulk boat transport of relief cartons.';
      }
    } else if (cat === 'road_blockage') {
      if (teamType === 'fire_rescue') {
        specializationScore = 50;
        specializationFit = 'primary';
        specializationReason = 'Prime match: High-capacity tree cutters, winch and heavy obstacle clearance.';
      }
    }

    // 2. Availability Score
    let availabilityScore = 0;
    const isAlreadyAssignedHere = team.assignedIncidentId === incident.id;
    const doubleAssignmentRisk =
      Boolean(team.assignedIncidentId) && team.assignedIncidentId !== incident.id;

    if (isAlreadyAssignedHere) {
      availabilityScore = 35; // Already working this incident
    } else if (team.status === 'idle') {
      availabilityScore = 30; // 100% available
    } else if (team.status === 'refueling' || team.status === 'maintenance') {
      availabilityScore = -30;
    } else {
      // en_route or on_scene on another incident
      availabilityScore = -40;
    }

    // 3. Distance calculation (Straight-line)
    let distanceKm: number | null = null;
    let distancePenalty = 0;
    let approxDistanceDisclaimer = 'Distance uncalculated: incident location missing GPS coordinates.';

    if (
      hasValidIncCoords &&
      isValidCoordinate(team.currentLocation?.lat, team.currentLocation?.lng)
    ) {
      distanceKm = calculateHaversineDistanceKm(
        team.currentLocation.lat,
        team.currentLocation.lng,
        incident.location.lat,
        incident.location.lng
      );
      // Closer is higher ranked (1.2 pt penalty per km)
      distancePenalty = distanceKm * 1.2;
      approxDistanceDisclaimer = `Approx. straight-line distance: ${distanceKm} km (Not road ETA - road routes may be submerged)`;
    }

    // Overall Score
    const totalScore = Math.round(
      specializationScore + availabilityScore - distancePenalty
    );

    const canAssignImmediately = team.status === 'idle' || isAlreadyAssignedHere;

    let recommendationReason = specializationReason;
    if (doubleAssignmentRisk) {
      recommendationReason += ` [⚠️ Currently assigned to: ${team.assignedIncidentTitle || team.assignedIncidentId}]`;
    }

    return {
      team,
      rank: 0,
      totalScore,
      specializationFit,
      specializationScore,
      availabilityScore,
      distanceKm,
      approxDistanceDisclaimer,
      recommendationReason,
      canAssignImmediately,
      isAlreadyAssignedHere,
      doubleAssignmentRisk,
      conflictIncidentTitle: team.assignedIncidentTitle,
    };
  });

  // Sort descending by total score
  results.sort((a, b) => b.totalScore - a.totalScore);

  // Assign ranks
  results.forEach((item, index) => {
    item.rank = index + 1;
  });

  return results;
}
