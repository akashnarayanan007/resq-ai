import 'server-only';
import { ResponderTeam, TeamStatus } from '@/types';
import { TeamRepository, LocalStorageTeamRepository } from './TeamRepository';
import { getFirebaseAdminDb } from '../firebase/firebaseAdmin';

const COLLECTION_NAME = 'teams';

export class FirestoreTeamRepository implements TeamRepository {
  private fallback = new LocalStorageTeamRepository();

  private get db() {
    return getFirebaseAdminDb();
  }

  async getAll(): Promise<ResponderTeam[]> {
    const db = this.db;
    if (!db) return this.fallback.getAll();

    try {
      const snapshot = await db.collection(COLLECTION_NAME).limit(50).get();
      if (snapshot.empty) {
        await this.resetToSimulatedData();
        return this.fallback.getAll();
      }
      return snapshot.docs.map((doc) => doc.data() as ResponderTeam);
    } catch (err) {
      console.warn('Firestore team getAll error, using fallback:', err);
      return this.fallback.getAll();
    }
  }

  async getById(id: string): Promise<ResponderTeam | null> {
    const db = this.db;
    if (!db) return this.fallback.getById(id);

    try {
      const doc = await db.collection(COLLECTION_NAME).doc(id.trim().toUpperCase()).get();
      if (!doc.exists) return null;
      return doc.data() as ResponderTeam;
    } catch (err) {
      console.warn('Firestore team getById error, using fallback:', err);
      return this.fallback.getById(id);
    }
  }

  async updateStatus(id: string, status: TeamStatus): Promise<ResponderTeam> {
    const db = this.db;
    if (!db) return this.fallback.updateStatus(id, status);

    const existing = await this.getById(id);
    if (!existing) throw new Error(`Team ${id} not found`);

    const updated: ResponderTeam = {
      ...existing,
      status,
      lastPingTime: new Date().toISOString(),
    };

    try {
      await db.collection(COLLECTION_NAME).doc(id).set(updated);
      return updated;
    } catch (err) {
      console.warn('Firestore team updateStatus error, using fallback:', err);
      return this.fallback.updateStatus(id, status);
    }
  }

  async assignIncident(
    teamId: string,
    incidentId?: string,
    incidentTitle?: string,
    forceOverride: boolean = false
  ): Promise<ResponderTeam> {
    const db = this.db;
    if (!db) return this.fallback.assignIncident(teamId, incidentId, incidentTitle, forceOverride);

    const existing = await this.getById(teamId);
    if (!existing) throw new Error(`Team ${teamId} not found`);

    if (
      incidentId &&
      existing.assignedIncidentId &&
      existing.assignedIncidentId !== incidentId &&
      !forceOverride
    ) {
      throw new Error(
        `Double-assignment prevented: Team "${existing.name}" is already assigned to "${
          existing.assignedIncidentTitle || existing.assignedIncidentId
        }". Coordinator override required.`
      );
    }

    const updated: ResponderTeam = {
      ...existing,
      assignedIncidentId: incidentId,
      assignedIncidentTitle: incidentTitle,
      status: incidentId ? 'en_route' : 'idle',
      lastPingTime: new Date().toISOString(),
    };

    try {
      await db.collection(COLLECTION_NAME).doc(teamId).set(updated);
      return updated;
    } catch (err) {
      console.warn('Firestore team assignIncident error, using fallback:', err);
      return this.fallback.assignIncident(teamId, incidentId, incidentTitle, forceOverride);
    }
  }

  async releaseTeam(teamId: string, incidentId?: string): Promise<ResponderTeam> {
    const db = this.db;
    if (!db) return this.fallback.releaseTeam(teamId, incidentId);

    const existing = await this.getById(teamId);
    if (!existing) throw new Error(`Team ${teamId} not found`);

    if (incidentId && existing.assignedIncidentId && existing.assignedIncidentId !== incidentId) {
      return existing;
    }

    const updated: ResponderTeam = {
      ...existing,
      assignedIncidentId: undefined,
      assignedIncidentTitle: undefined,
      status: 'idle',
      lastPingTime: new Date().toISOString(),
    };

    try {
      await db.collection(COLLECTION_NAME).doc(teamId).set(updated);
      return updated;
    } catch (err) {
      console.warn('Firestore team releaseTeam error, using fallback:', err);
      return this.fallback.releaseTeam(teamId, incidentId);
    }
  }

  async releaseByIncidentId(incidentId: string): Promise<ResponderTeam | null> {
    const teams = await this.getAll();
    const assignedTeam = teams.find((t) => t.assignedIncidentId === incidentId);
    if (!assignedTeam) return null;
    return this.releaseTeam(assignedTeam.id, incidentId);
  }

  async updateLocation(
    teamId: string,
    lat: number,
    lng: number,
    label: string
  ): Promise<ResponderTeam> {
    const db = this.db;
    if (!db) return this.fallback.updateLocation(teamId, lat, lng, label);

    const existing = await this.getById(teamId);
    if (!existing) throw new Error(`Team ${teamId} not found`);

    const updated: ResponderTeam = {
      ...existing,
      currentLocation: { lat, lng, label },
      lastPingTime: new Date().toISOString(),
    };

    try {
      await db.collection(COLLECTION_NAME).doc(teamId).set(updated);
      return updated;
    } catch (err) {
      console.warn('Firestore team updateLocation error, using fallback:', err);
      return this.fallback.updateLocation(teamId, lat, lng, label);
    }
  }

  async resetToSimulatedData(): Promise<void> {
    const db = this.db;
    if (!db) {
      return this.fallback.resetToSimulatedData();
    }

    try {
      const { INITIAL_SIMULATED_TEAMS } = await import('@/data/simulatedData');
      const batch = db.batch();

      const snapshot = await db.collection(COLLECTION_NAME).limit(50).get();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      INITIAL_SIMULATED_TEAMS.forEach((team) => {
        const ref = db.collection(COLLECTION_NAME).doc(team.id);
        batch.set(ref, team);
      });

      await batch.commit();
      await this.fallback.resetToSimulatedData();
    } catch (err) {
      console.warn('Firestore team resetToSimulatedData error, using fallback:', err);
      await this.fallback.resetToSimulatedData();
    }
  }
}
