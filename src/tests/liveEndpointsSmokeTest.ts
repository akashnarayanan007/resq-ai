/**
 * Tests live HTTP API endpoints on http://localhost:3000
 */

async function runLiveHttpTests() {
  console.log('Testing live HTTP server endpoints at http://localhost:3000...\n');
  const baseUrl = 'http://localhost:3000';
  let passed = 0;
  let failed = 0;

  function check(condition: boolean, name: string) {
    if (condition) {
      console.log(`  ✓ ${name}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. Analytics endpoint
  try {
    const res = await fetch(`${baseUrl}/api/analytics`);
    const data = await res.json();
    check(res.status === 200 && data.totalIncidents !== undefined, 'GET /api/analytics returns 200 and KPI metrics');
    check(Boolean(data.simulatedDisclaimer && data.simulatedDisclaimer.includes('SIMULATED DRILL')), 'Analytics includes mandatory simulation disclaimer');
  } catch (e: any) {
    check(false, `GET /api/analytics failed: ${e.message}`);
  }

  // 2. Track endpoint without token
  try {
    const res = await fetch(`${baseUrl}/api/track?id=INC-CHN-1001`);
    check(res.status === 400 || res.status === 401, 'GET /api/track without token rejected with 400/401');
  } catch (e: any) {
    check(false, `GET /api/track check failed: ${e.message}`);
  }

  // 3. Coordinator Login with invalid passcode
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: 'invalid_pass' }),
    });
    check(res.status === 401, 'POST /api/auth/login with wrong passcode returns 401 Unauthorized');
  } catch (e: any) {
    check(false, `POST /api/auth/login failed: ${e.message}`);
  }

  // 4. Coordinator Login with valid passcode
  let cookieHeader = '';
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: 'RESQ-CHENNAI-2024' }),
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      cookieHeader = setCookie.split(';')[0];
    }
    const data = await res.json();
    check(res.status === 200 && data.success === true, 'POST /api/auth/login with valid passcode returns 200 & session');
  } catch (e: any) {
    check(false, `POST /api/auth/login valid failed: ${e.message}`);
  }

  // 5. Check session endpoint
  try {
    const res = await fetch(`${baseUrl}/api/auth/session`, {
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });
    const data = await res.json();
    check(res.status === 200 && data.authenticated === true, 'GET /api/auth/session returns authenticated: true');
  } catch (e: any) {
    check(false, `GET /api/auth/session failed: ${e.message}`);
  }

  // 6. AI Triage endpoint
  try {
    const res = await fetch(`${baseUrl}/api/ai/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Severe flood water 4 feet deep at Velachery. 4 trapped including 80yo grandmother.',
        category: 'flood_water',
        waterLevelFt: 4,
      }),
    });
    const data = await res.json();
    check(res.status === 200 && data.urgency !== undefined && data.summary !== undefined, 'POST /api/ai/triage returns 200 and structured triage assessment');
  } catch (e: any) {
    check(false, `POST /api/ai/triage failed: ${e.message}`);
  }

  console.log(`\nLive HTTP Endpoint Tests: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runLiveHttpTests();
