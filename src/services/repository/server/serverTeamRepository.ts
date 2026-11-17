import 'server-only';
import { isFirebaseConfigured } from '@/services/firebase/firebaseAdmin';
import { TeamRepository, LocalStorageTeamRepository } from '../TeamRepository';
import { FirestoreTeamRepository } from '../FirestoreTeamRepository';
import { ResponderTeam, TeamStatus } from '@/types';

class ServerTeamRepositoryProxy implements TeamRepository {
  private instance: TeamRepository | null = null;

  private getInstance(): TeamRepository {
    if (!this.instance) {
      if (isFirebaseConfigured()) {
        try {
          this.instance = new FirestoreTeamRepository();
        } catch (err) {
          console.warn('[serverTeamRepository] Firestore init failed, falling back to LocalStorage:', err);
          this.instance = new LocalStorageTeamRepository();
        }
      } else {
        this.instance = new LocalStorageTeamRepository();
      }
    }
    return this.instance;
  }

  getAll(): Promise<ResponderTeam[]> {
    return this.getInstance().getAll();
  }

  getById(id: string): Promise<ResponderTeam | null> {
    return this.getInstance().getById(id);
  }

  updateStatus(id: string, status: TeamStatus): Promise<ResponderTeam> {
    return this.getInstance().updateStatus(id, status);
  }

  assignIncident(teamId: string, incidentId?: string, incidentTitle?: string, forceOverride?: boolean): Promise<ResponderTeam> {
    return this.getInstance().assignIncident(teamId, incidentId, incidentTitle, forceOverride);
  }

  releaseTeam(teamId: string, incidentId?: string): Promise<ResponderTeam> {
    return this.getInstance().releaseTeam(teamId, incidentId);
  }

  releaseByIncidentId(incidentId: string): Promise<ResponderTeam | null> {
    return this.getInstance().releaseByIncidentId(incidentId);
  }

  updateLocation(teamId: string, lat: number, lng: number, label: string): Promise<ResponderTeam> {
    return this.getInstance().updateLocation(teamId, lat, lng, label);
  }

  resetToSimulatedData(): Promise<void> {
    return this.getInstance().resetToSimulatedData();
  }
}

export const serverTeamRepository: TeamRepository = new ServerTeamRepositoryProxy();
