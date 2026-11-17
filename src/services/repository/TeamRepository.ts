import { ResponderTeam, TeamStatus } from '@/types';
import { INITIAL_SIMULATED_TEAMS } from '@/data/simulatedData';

export interface TeamRepository {
  getAll(): Promise<ResponderTeam[]>;
  getById(id: string): Promise<ResponderTeam | null>;
  updateStatus(id: string, status: TeamStatus): Promise<ResponderTeam>;
  assignIncident(teamId: string, incidentId?: string, incidentTitle?: string): Promise<ResponderTeam>;
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

  async assignIncident(teamId: string, incidentId?: string, incidentTitle?: string): Promise<ResponderTeam> {
    const list = this.getStorage();
    const index = list.findIndex((t) => t.id === teamId);
    if (index === -1) throw new Error(`Team ${teamId} not found`);

    const updated: ResponderTeam = {
      ...list[index],
      assignedIncidentId: incidentId,
      assignedIncidentTitle: incidentTitle,
      status: incidentId ? 'en_route' : 'idle',
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

export const teamRepository: TeamRepository = new LocalStorageTeamRepository();
