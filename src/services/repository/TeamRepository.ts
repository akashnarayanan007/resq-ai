import { ResponderTeam, TeamStatus } from '@/types';
import { INITIAL_SIMULATED_TEAMS } from '@/data/simulatedData';

export interface TeamRepository {
  getAll(): Promise<ResponderTeam[]>;
  getById(id: string): Promise<ResponderTeam | null>;
  updateStatus(id: string, status: TeamStatus): Promise<ResponderTeam>;
  assignIncident(teamId: string, incidentId?: string, incidentTitle?: string, forceOverride?: boolean): Promise<ResponderTeam>;
  releaseTeam(teamId: string, incidentId?: string): Promise<ResponderTeam>;
  releaseByIncidentId(incidentId: string): Promise<ResponderTeam | null>;
  updateLocation(teamId: string, lat: number, lng: number, label: string): Promise<ResponderTeam>;
  resetToSimulatedData(): Promise<void>;
}

const STORAGE_KEY = 'resq_teams_v1';

export class LocalStorageTeamRepository implements TeamRepository {
  private getStorage(): ResponderTeam[] {
    if (typeof window === 'undefined') {
      return INITIAL_SIMULATED_TEAMS;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SIMULATED_TEAMS));
        return INITIAL_SIMULATED_TEAMS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_SIMULATED_TEAMS;
    }
  }

  private saveStorage(data: ResponderTeam[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.error('Failed to save teams to localStorage:', err);
      }
    }
  }

  async getAll(): Promise<ResponderTeam[]> {
    return this.getStorage();
  }

  async getById(id: string): Promise<ResponderTeam | null> {
    const list = this.getStorage();
    return list.find((t) => t.id === id) || null;
  }

  async updateStatus(id: string, status: TeamStatus): Promise<ResponderTeam> {
    const list = this.getStorage();
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Team ${id} not found`);

    const updated: ResponderTeam = {
      ...list[index],
      status,
      lastPingTime: new Date().toISOString(),
    };
    list[index] = updated;
    this.saveStorage(list);
    return updated;
  }

  async assignIncident(
    teamId: string,
    incidentId?: string,
    incidentTitle?: string,
    forceOverride: boolean = false
  ): Promise<ResponderTeam> {
    const list = this.getStorage();
    const index = list.findIndex((t) => t.id === teamId);
    if (index === -1) throw new Error(`Team ${teamId} not found`);

    const existingTeam = list[index];

    // Double-assignment check: If team is already assigned to a different active incident
    if (
      incidentId &&
      existingTeam.assignedIncidentId &&
      existingTeam.assignedIncidentId !== incidentId &&
      !forceOverride
    ) {
      throw new Error(
        `Double-assignment prevented: Team "${existingTeam.name}" is already assigned to active incident "${
          existingTeam.assignedIncidentTitle || existingTeam.assignedIncidentId
        }". Release team first or confirm coordinator override.`
      );
    }

    const updated: ResponderTeam = {
      ...existingTeam,
      assignedIncidentId: incidentId,
      assignedIncidentTitle: incidentTitle,
      status: incidentId ? 'en_route' : 'idle',
      lastPingTime: new Date().toISOString(),
    };
    list[index] = updated;
    this.saveStorage(list);
    return updated;
  }

  async releaseTeam(teamId: string, incidentId?: string): Promise<ResponderTeam> {
    const list = this.getStorage();
    const index = list.findIndex((t) => t.id === teamId);
    if (index === -1) throw new Error(`Team ${teamId} not found`);

    const existingTeam = list[index];
    // If specific incidentId provided, only release if it matches
    if (incidentId && existingTeam.assignedIncidentId && existingTeam.assignedIncidentId !== incidentId) {
      return existingTeam; // Not assigned to this incident
    }

    const updated: ResponderTeam = {
      ...existingTeam,
      assignedIncidentId: undefined,
      assignedIncidentTitle: undefined,
      status: 'idle',
      lastPingTime: new Date().toISOString(),
    };
    list[index] = updated;
    this.saveStorage(list);
    return updated;
  }

  async releaseByIncidentId(incidentId: string): Promise<ResponderTeam | null> {
    const list = this.getStorage();
    const index = list.findIndex((t) => t.assignedIncidentId === incidentId);
    if (index === -1) return null;

    const existingTeam = list[index];
    const updated: ResponderTeam = {
      ...existingTeam,
      assignedIncidentId: undefined,
      assignedIncidentTitle: undefined,
      status: 'idle',
      lastPingTime: new Date().toISOString(),
    };
    list[index] = updated;
    this.saveStorage(list);
    return updated;
  }

  async updateLocation(teamId: string, lat: number, lng: number, label: string): Promise<ResponderTeam> {
    const list = this.getStorage();
    const index = list.findIndex((t) => t.id === teamId);
    if (index === -1) throw new Error(`Team ${teamId} not found`);

    const updated: ResponderTeam = {
      ...list[index],
      currentLocation: { lat, lng, label },
      lastPingTime: new Date().toISOString(),
    };
    list[index] = updated;
    this.saveStorage(list);
    return updated;
  }

  async resetToSimulatedData(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SIMULATED_TEAMS));
    }
  }
}

let _activeTeamRepo: TeamRepository | null = null;

export const teamRepository: TeamRepository = new Proxy({} as TeamRepository, {
  get(_target, prop) {
    if (!_activeTeamRepo) {
      if (typeof window === 'undefined') {
        try {
          const { isFirebaseConfigured } = require('../firebase/firebaseAdmin');
          if (isFirebaseConfigured()) {
            const { FirestoreTeamRepository } = require('./FirestoreTeamRepository');
            _activeTeamRepo = new FirestoreTeamRepository();
          } else {
            _activeTeamRepo = new LocalStorageTeamRepository();
          }
        } catch (err) {
          console.warn('Failed to initialize FirestoreTeamRepository, using LocalStorage:', err);
          _activeTeamRepo = new LocalStorageTeamRepository();
        }
      } else {
        _activeTeamRepo = new LocalStorageTeamRepository();
      }
    }
    const val = (_activeTeamRepo as any)[prop];
    return typeof val === 'function' ? val.bind(_activeTeamRepo) : val;
  },
});
