import 'server-only';
import { isFirebaseConfigured } from '@/services/firebase/firebaseAdmin';
import { IncidentRepository, LocalStorageIncidentRepository } from '../IncidentRepository';
import { FirestoreIncidentRepository } from '../FirestoreIncidentRepository';
import { AITriageAnalysis, Incident, IncidentStatus, PublicTrackedIncident } from '@/types';

class ServerIncidentRepositoryProxy implements IncidentRepository {
  private instance: IncidentRepository | null = null;

  private getInstance(): IncidentRepository {
    if (!this.instance) {
      if (isFirebaseConfigured()) {
        try {
          this.instance = new FirestoreIncidentRepository();
        } catch (err) {
          console.warn('[serverIncidentRepository] Firestore init failed, falling back to LocalStorage:', err);
          this.instance = new LocalStorageIncidentRepository();
        }
      } else {
        this.instance = new LocalStorageIncidentRepository();
      }
    }
    return this.instance;
  }

  getAll(): Promise<Incident[]> {
    return this.getInstance().getAll();
  }

  getById(id: string): Promise<Incident | null> {
    return this.getInstance().getById(id);
  }

  getByTrackingToken(id: string, token: string): Promise<Incident | null> {
    return this.getInstance().getByTrackingToken(id, token);
  }

  getPublicTrackedIncident(id: string, token: string): Promise<PublicTrackedIncident | null> {
    return this.getInstance().getPublicTrackedIncident(id, token);
  }

  create(incidentData: Partial<Incident>): Promise<Incident> {
    return this.getInstance().create(incidentData);
  }

  update(id: string, updates: Partial<Incident>, actor?: string, note?: string): Promise<Incident> {
    return this.getInstance().update(id, updates, actor, note);
  }

  updateStatus(id: string, status: IncidentStatus, actor: string, note?: string): Promise<Incident> {
    return this.getInstance().updateStatus(id, status, actor, note);
  }

  closeAsInvalid(id: string, reason: string, actor: string): Promise<Incident> {
    return this.getInstance().closeAsInvalid(id, reason, actor);
  }

  assignTeam(id: string, teamId: string, teamName: string, actor: string, forceOverride?: boolean): Promise<Incident> {
    return this.getInstance().assignTeam(id, teamId, teamName, actor, forceOverride);
  }

  updateCoordinates(id: string, lat: number, lng: number, address?: string, area?: string, actor?: string): Promise<Incident> {
    return this.getInstance().updateCoordinates(id, lat, lng, address, area, actor);
  }

  updateAITriage(id: string, triage: AITriageAnalysis): Promise<Incident> {
    return this.getInstance().updateAITriage(id, triage);
  }

  resetToSimulatedData(): Promise<void> {
    return this.getInstance().resetToSimulatedData();
  }
}

export const serverIncidentRepository: IncidentRepository = new ServerIncidentRepositoryProxy();
