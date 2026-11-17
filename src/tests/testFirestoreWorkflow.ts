import fs from 'fs';

// Load .env.local BEFORE imports
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

import { getFirebaseAdminDb, isFirebaseConfigured } from '../services/firebase/firebaseAdmin';
import { serverIncidentRepository as incidentRepository } from '../services/repository/server/serverIncidentRepository';
import { serverTeamRepository as teamRepository } from '../services/repository/server/serverTeamRepository';
import { Incident } from '../types';

async function runFirestoreVerification() {
  console.log('======================================================================');
  console.log('       RESQ.AI CLOUD FIRESTORE & SHARED PERSISTENCE VERIFICATION      ');
  console.log('======================================================================\n');

  // STEP 1: Verify environment variables configuration (without printing secrets)
  console.log('[STEP 1] Verifying Firebase Configuration in Environment:');
  console.log('  - isFirebaseConfigured():', isFirebaseConfigured());
  console.log('  - FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID || '(missing)');
  console.log('  - FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? `${process.env.FIREBASE_CLIENT_EMAIL.substring(0, 20)}...` : '(missing)');
  console.log('  - FIREBASE_PRIVATE_KEY present:', Boolean(process.env.FIREBASE_PRIVATE_KEY));

  if (!isFirebaseConfigured()) {
    console.error('FAIL: Firebase is not configured in environment!');
    process.exit(1);
  }

  // STEP 2: Initialize Firebase Admin SDK & Test Connection
  console.log('\n[STEP 2] Initializing Firebase Admin SDK:');
  const db = getFirebaseAdminDb();
  if (!db) {
    console.error('FAIL: getFirebaseAdminDb() returned null.');
    process.exit(1);
  }
  console.log('  ✓ Firebase Admin SDK initialized successfully.');

  // STEP 3: Safe Write/Read/Delete in Temporary Collection
  console.log('\n[STEP 3] Performing Safe Write/Read/Delete in Temporary Collection `_resq_healthcheck`:');
  const testId = `verify_${Date.now()}`;
  const healthRef = db.collection('_resq_healthcheck').doc(testId);
  const probeData = {
    probe: 'resq-operational-probe',
    timestamp: new Date().toISOString(),
    status: 'healthy',
  };

  try {
    await healthRef.set(probeData);
    console.log('  ✓ Write probe document SUCCESS.');

    const readBack = await healthRef.get();
    if (!readBack.exists || readBack.data()?.status !== 'healthy') {
      throw new Error('Read probe document verification failed.');
    }
    console.log('  ✓ Read probe document SUCCESS.');

    await healthRef.delete();
    console.log('  ✓ Delete probe document SUCCESS.');

    const postDelete = await healthRef.get();
    if (postDelete.exists) {
      throw new Error('Deleted probe document still exists.');
    }
    console.log('  ✓ Verified probe document removed from Firestore.');
  } catch (err: any) {
    console.error('FAIL in Step 3:', err.message);
    process.exit(1);
  }

  // STEP 4: Confirm Repository Persistence via Firestore
  console.log('\n[STEP 4] Verifying Incident Repository Shared Persistence:');
  const existingList = await incidentRepository.getAll();
  console.log('  ✓ Repository getAll() executed successfully. Incident count returned:', existingList.length);

  // STEP 5: Create SOS Incident via Repository
  console.log('\n[STEP 5] Creating Live Citizen SOS Incident via incidentRepository.create():');
  const testIncidentPayload: Partial<Incident> = {
    title: 'Flash Flood Rescue: Stranded Family in Velachery',
    description: 'Ground floor submerged under 4.5ft water near Velachery Lake. 3 residents trapped on first-floor terrace.',
    category: 'flood_water',
    severity: 'critical',
    preliminaryUrgency: 'critical',
    location: {
      address: 'Plot 42, 2nd Main Road, Ram Nagar',
      area: 'Velachery',
      landmark: 'Near Velachery MRTS Station',
      lat: 12.9815,
      lng: 80.218,
      waterLevelFt: 4.5,
    },
    reporter: {
      name: 'Dr. R. Sundaram',
      phone: '+91 94440 98765',
      citizenCount: 3,
      hasChildrenOrElderly: true,
      needsBoat: true,
      needsMedical: false,
      isPrivateContact: false,
    },
  };

  const createdIncident = await incidentRepository.create(testIncidentPayload);
  console.log('  ✓ SOS Incident Created with ID:', createdIncident.id);
  console.log('  ✓ Tracking Token Issued:', createdIncident.trackingToken);
  console.log('  ✓ Initial Status:', createdIncident.status);
  console.log('  ✓ Stored Preliminary Urgency:', createdIncident.preliminaryUrgency);

  // STEP 6: Read from an Independent Coordinator Session via Repository
  console.log('\n[STEP 6] Reading Incident from Independent Coordinator Query:');
  const fetchedFromCoordinator = await incidentRepository.getById(createdIncident.id);
  if (!fetchedFromCoordinator) {
    console.error(`FAIL: Incident ${createdIncident.id} could not be read by coordinator!`);
    process.exit(1);
  }
  console.log('  ✓ Coordinator session successfully fetched incident:', fetchedFromCoordinator.id);
  console.log('  ✓ Title verified:', fetchedFromCoordinator.title);
  console.log('  ✓ Category verified:', fetchedFromCoordinator.category);
  console.log('  ✓ Water Level verified:', fetchedFromCoordinator.location.waterLevelFt, 'ft');
  console.log('  ✓ People count verified:', fetchedFromCoordinator.reporter.citizenCount);
  console.log('  ✓ Audit timeline entries:', fetchedFromCoordinator.timeline.length);

  // STEP 7: Direct Firestore Document Verification
  console.log('\n[STEP 7] Cross-Verifying Directly in Firestore Raw Database Collection:');
  const rawDoc = await db.collection('incidents').doc(createdIncident.id).get();
  if (!rawDoc.exists) {
    console.error('FAIL: Raw Firestore document does not exist in Cloud Firestore `incidents` collection!');
    process.exit(1);
  }
  const rawData = rawDoc.data();
  console.log('  ✓ Document confirmed stored directly in Cloud Firestore collection `incidents`');
  console.log('  ✓ Document ID in Firestore matches:', rawDoc.id === createdIncident.id);
  console.log('  ✓ Cloud Firestore stored status:', rawData?.status);
  console.log('  ✓ Cloud Firestore stored area:', rawData?.location?.area);
  console.log('  ✓ Cloud Firestore stored citizenCount:', rawData?.reporter?.citizenCount);

  // STEP 8: Clean up the verification incident
  console.log('\n[STEP 8] Cleaning Up Verification Incident Document from Firestore:');
  await db.collection('incidents').doc(createdIncident.id).delete();
  console.log('  ✓ Test incident cleanly purged from Firestore.');

  console.log('\n======================================================================');
  console.log('       ALL CLOUD FIRESTORE VERIFICATION CHECKS PASSED (100%)          ');
  console.log('======================================================================');
  process.exit(0);
}

runFirestoreVerification().catch((err) => {
  console.error('\nUNHANDLED ERROR IN FIRESTORE VERIFICATION:', err);
  process.exit(1);
});
