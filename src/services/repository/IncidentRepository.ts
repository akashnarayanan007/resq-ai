import { Incident, IncidentStatus, AITriageAnalysis, PublicTrackedIncident } from '@/types';
import { INITIAL_SIMULATED_INCIDENTS } from '@/data/simulatedData';
import { teamRepository } from '@/services/repository/TeamRepository';
import { isFirebaseConfigured } from '../firebase/firebaseAdmin';

export interface IncidentRepository {
  getAll(): Promise<Incident[]>;
  getById(id: string): Promise<Incident | null>;
  getByTrackingToken(id: string, token: string): Promise<Incident | null>;
  getPublicTrackedIncident(id: string, token: string): Promise<PublicTrackedIncident | null>;
  create(incidentData: Partial<Incident>): Promise<Incident>;
  update(id: string, updates: Partial<Incident>, actor?: string, note?: string): Promise<Incident>;
  updateStatus(id: string, status: IncidentStatus, actor: string, note?: string): Promise<Incident>;
  closeAsInvalid(id: string, reason: string, actor: string): Promise<Incident>;
  assignTeam(id: string, teamId: string, teamName: string, actor: string, forceOverride?: boolean): Promise<Incident>;
  updateCoordinates(id: string, lat: number, lng: number, address?: string, area?: string, actor?: string): Promise<Incident>;
  updateAITriage(id: string, triage: AITriageAnalysis): Promise<Incident>;
  resetToSimulatedData(): Promise<void>;
}

const STORAGE_KEY = 'resq_incidents_v1';

export class LocalStorageIncidentRepository implements IncidentRepository {
  private getStorage(): Incident[] {
    if (typeof window === 'undefined') {
      return INITIAL_SIMULATED_INCIDENTS;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SIMULATED_INCIDENTS));
        return INITIAL_SIMULATED_INCIDENTS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_SIMULATED_INCIDENTS;
    }
  }

  private saveStorage(data: Incident[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    }
  }

  async getAll(): Promise<Incident[]> {
    const list = this.getStorage();
    // Return sorted newest first
    return [...list].sort(
      (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
    );
  }

  async getById(id: string): Promise<Incident | null> {
    const list = this.getStorage();
    return list.find((inc) => inc.id.toUpperCase() === id.trim().toUpperCase()) || null;
  }

  async getByTrackingToken(id: string, token: string): Promise<Incident | null> {
    const incident = await this.getById(id);
    if (!incident) return null;
    if (!incident.trackingToken || incident.trackingToken !== token.trim()) {
      return null;
    }
    return incident;
  }

  async getPublicTrackedIncident(id: string, token: string): Promise<PublicTrackedIncident | null> {
    const incident = await this.getByTrackingToken(id, token);
    if (!incident) return null;

    // Strict privacy projection: hide exact residential address and reporter private info
    return {
      id: incident.id,
      title: incident.title,
      category: incident.category,
      status: incident.status,
      preliminaryUrgency: incident.preliminaryUrgency || incident.severity,
      reportedAt: incident.reportedAt,
      updatedAt: incident.updatedAt,
      area: incident.location?.area || 'Chennai Metropolitan Area',
      assignedTeamName: incident.assignedTeamName,
      citizenCount: incident.reporter?.citizenCount || 1,
      timeline: incident.timeline.map((t) => ({
        timestamp: t.timestamp,
        action: t.action,
        note: t.note,
      })),
    };
  }

  async create(incidentData: Partial<Incident>): Promise<Incident> {
    const list = this.getStorage();
    // Generate unique incident ID with Chennai prefix
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = incidentData.id || `INC-CHN-${randomSuffix}`;
    const now = new Date().toISOString();
    const trackingToken =
      incidentData.trackingToken ||
      `trk_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;

    const created: Incident = {
      id: newId,
      title: incidentData.title || 'Emergency Distress Report',
      description: incidentData.description || 'Reported via SOS Emergency Intake.',
      category: incidentData.category || 'flood_water',
      severity: incidentData.severity || incidentData.preliminaryUrgency || 'high',
      preliminaryUrgency: incidentData.preliminaryUrgency || incidentData.severity || 'high',
      status: 'pending', // Starts strictly as pending per requirement
      reportedAt: now,
      updatedAt: now,
      isSimulated: true,
      trackingToken,
      location: incidentData.location || {
        address: 'Specified Field Location',
        area: 'Chennai',
        lat: 12.9815,
        lng: 80.2180,
        landmark: '',
        waterLevelFt: 0,
      },
      reporter: incidentData.reporter || {
        name: 'Private Citizen',
        phone: '',
        citizenCount: 1,
        hasChildrenOrElderly: false,
        needsBoat: false,
        needsMedical: false,
        isPrivateContact: true,
      },
      accessibilityNeeds: incidentData.accessibilityNeeds,
      aiTriage: incidentData.aiTriage,
      assignedTeamId: incidentData.assignedTeamId,
      assignedTeamName: incidentData.assignedTeamName,
      timeline: [
        {
          id: `tl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: now,
          action: 'Incident Created (Status: PENDING)',
          actor: 'Citizen SOS Intake Portal',
          note: incidentData.reporter?.isPrivateContact
            ? `Report registered with private contact preferences. Preliminary urgency: ${(
                incidentData.preliminaryUrgency || 'HIGH'
              ).toUpperCase()}`
            : `Reported by ${incidentData.reporter?.name || 'Citizen'} (${incidentData.reporter?.citizenCount || 1} people). Urgency: ${(
                incidentData.preliminaryUrgency || 'HIGH'
              ).toUpperCase()}`,
          newStatus: 'pending',
        },
      ],
    };

    const updatedList = [created, ...list];
    this.saveStorage(updatedList);
    return created;
  }

  async update(id: string, updates: Partial<Incident>, actor = 'Dispatcher', note?: string): Promise<Incident> {
    const list = this.getStorage();
    const index = list.findIndex((inc) => inc.id === id);
    if (index === -1) {
      throw new Error(`Incident ${id} not found`);
    }

    const now = new Date().toISOString();
    const existing = list[index];
    const newTimeline = [...existing.timeline];

    if (note || updates.status || updates.assignedTeamName || updates.closureReason) {
      newTimeline.push({
        id: `tl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: now,
        action: updates.status
          ? `Status Changed: ${existing.status.toUpperCase()} → ${updates.status.toUpperCase()}`
          : updates.closureReason
          ? 'Incident Closed as Invalid'
          : 'Incident Updated',
        actor,
        note: note || updates.closureReason || (updates.assignedTeamName ? `Assigned to ${updates.assignedTeamName}` : undefined),
        previousStatus: existing.status,
        newStatus: updates.status || existing.status,
      });
    }

    const updated: Incident = {
      ...existing,
      ...updates,
      updatedAt: now,
      timeline: newTimeline,
    };

    list[index] = updated;
    this.saveStorage(list);
    return updated;
  }

  async updateStatus(id: string, status: IncidentStatus, actor: string, note?: string): Promise<Incident> {
    const list = this.getStorage();
    const existing = list.find((inc) => inc.id === id);

    let finalNote = note;

    // Automatic team release upon incident resolution or closure
    if (existing && (status === 'resolved' || status === 'invalid') && existing.assignedTeamId) {
      try {
        await teamRepository.releaseTeam(existing.assignedTeamId, existing.id);
        const releaseMsg = `Responder unit "${existing.assignedTeamName || existing.assignedTeamId}" released back to IDLE inventory.`;
        finalNote = note ? `${note} • ${releaseMsg}` : releaseMsg;
      } catch (err) {
        console.warn('Team release notice:', err);
      }
    }

    return this.update(id, { status }, actor, finalNote);
  }

  async closeAsInvalid(id: string, reason: string, actor: string): Promise<Incident> {
    const list = this.getStorage();
    const existing = list.find((inc) => inc.id === id);

    if (existing?.assignedTeamId) {
      try {
        await teamRepository.releaseTeam(existing.assignedTeamId, existing.id);
      } catch (err) {
        console.warn('Team release on invalid closure:', err);
      }
    }

    return this.update(
      id,
      {
        status: 'invalid',
        closureReason: reason,
      },
      actor,
      `Invalid Report Closed: ${reason}${existing?.assignedTeamName ? ` (Released unit ${existing.assignedTeamName})` : ''}`
    );
  }

  async assignTeam(
    id: string,
    teamId: string,
    teamName: string,
    actor: string,
    forceOverride: boolean = false
  ): Promise<Incident> {
    const list = this.getStorage();
    const existing = list.find((inc) => inc.id === id);
    if (!existing) throw new Error(`Incident ${id} not found`);

    // Coordinate with team repository; throws error if team is busy and not overridden
    await teamRepository.assignIncident(teamId, id, existing.title, forceOverride);

    return this.update(
      id,
      {
        assignedTeamId: teamId,
        assignedTeamName: teamName,
        status: 'assigned', // Sets status consistently to assigned
      },
      actor,
      `Human Coordinator confirmed assignment: Unit ${teamName} (${teamId}) dispatched.`
    );
  }

  async updateCoordinates(
    id: string,
    lat: number,
    lng: number,
    address?: string,
    area?: string,
    actor: string = 'Command Center Operator'
  ): Promise<Incident> {
    const list = this.getStorage();
    const existing = list.find((inc) => inc.id === id);
    if (!existing) throw new Error(`Incident ${id} not found`);

    const updatedLocation = {
      ...existing.location,
      lat,
      lng,
      address: address || existing.location.address,
      area: area || existing.location.area,
    };

    return this.update(
      id,
      { location: updatedLocation },
      actor,
      `Coordinates verified & plotted on tactical grid: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`
    );
  }

  async updateAITriage(id: string, triage: AITriageAnalysis): Promise<Incident> {
    const list = this.getStorage();
    const index = list.findIndex((inc) => inc.id === id);
    if (index === -1) throw new Error(`Incident ${id} not found`);

    const now = new Date().toISOString();
    const existing = list[index];

    // Automatically synchronize severity if urgency score is critical
    let severity = existing.severity;
    if (triage.priorityScore >= 85) severity = 'critical';
    else if (triage.priorityScore >= 65) severity = 'high';
    else if (triage.priorityScore >= 45) severity = 'medium';

    const updated: Incident = {
      ...existing,
      severity,
      aiTriage: triage,
      updatedAt: now,
      timeline: [
        ...existing.timeline,
        {
          id: `tl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: now,
          action: 'AI Triage Generated',
          actor: 'RESQ.AI Intelligence Co-Pilot',
          note: `Priority Score ${triage.priorityScore}/100. ${triage.urgencySummary}`,
        },
      ],
    };

    list[index] = updated;
    this.saveStorage(list);
    return updated;
  }

  async resetToSimulatedData(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SIMULATED_INCIDENTS));
    }
  }
}

let _activeIncidentRepo: IncidentRepository | null = null;

export const incidentRepository: IncidentRepository = new Proxy({} as IncidentRepository, {
  get(_target, prop) {
    if (!_activeIncidentRepo) {
      if (typeof window === 'undefined' && isFirebaseConfigured()) {
        try {
          const { FirestoreIncidentRepository } = require('./FirestoreIncidentRepository');
          _activeIncidentRepo = new FirestoreIncidentRepository();
        } catch (err) {
          console.warn('Failed to initialize FirestoreIncidentRepository, using LocalStorage:', err);
          _activeIncidentRepo = new LocalStorageIncidentRepository();
        }
      } else {
        _activeIncidentRepo = new LocalStorageIncidentRepository();
      }
    }
    const val = (_activeIncidentRepo as any)[prop];
    return typeof val === 'function' ? val.bind(_activeIncidentRepo) : val;
  },
});
