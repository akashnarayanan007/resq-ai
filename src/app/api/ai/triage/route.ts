import { NextRequest, NextResponse } from 'next/server';
import { AITriageAnalysis } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      description = '',
      category = 'flood_water',
      waterLevelFt = 0,
      citizenCount = 1,
      hasChildrenOrElderly = false,
      needsBoat = false,
      needsMedical = false,
      location = '',
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const prompt = `You are RESQ.AI Emergency Triage Engine for Chennai Disaster Response.
Analyze this incident and return a strict JSON object with these keys:
{
  "priorityScore": number (0-100),
  "urgencySummary": string (short 1-2 sentence assessment),
  "recommendedUnits": string[] (e.g. Inflatable Rescue Boat, Amphibious Paramedic, etc.),
  "hazardsIdentified": string[] (e.g. Submerged transformers, contamination, rapid current),
  "triageConfidence": number (0.80 to 0.99),
  "suggestedActionPlan": string (tactical directive for dispatch team)
}

Incident Details:
- Category: ${category}
- Description: ${description}
- Location: ${location}
- Estimated Water Depth: ${waterLevelFt} ft
- People Stranded/Affected: ${citizenCount}
- Children or Elderly Present: ${hasChildrenOrElderly}
- Needs Rescue Boat: ${needsBoat}
- Needs Emergency Medical Assistance: ${needsMedical}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2,
              },
            }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            return NextResponse.json({
              ...parsed,
              modelUsed: 'Gemini 1.5 Flash (Live Grounding)',
            });
          }
        }
      } catch (geminiError) {
        console.warn('Gemini live API call failed, falling back to simulated intelligence engine:', geminiError);
      }
    }

    // High-fidelity fallback / simulated triage logic (works out of the box with zero API keys)
    let priorityScore = 45;
    const hazards: string[] = [];
    const units: string[] = [];

    if (waterLevelFt >= 5) {
      priorityScore += 30;
      hazards.push(`Severe flooding depth (${waterLevelFt}ft) exceeding safe wading`);
      units.push('Motorized Inflatable Rescue Boat (IRB)');
    } else if (waterLevelFt >= 3) {
      priorityScore += 18;
      hazards.push(`Elevated water stagnation (${waterLevelFt}ft)`);
      units.push('Flat-Bottom Zodiac Raft');
    }

    if (needsMedical) {
      priorityScore += 25;
      hazards.push('Active medical trauma or critical prescription dependency');
      units.push('108 Amphibious Paramedic Unit with ALS equipment');
    }

    if (hasChildrenOrElderly) {
      priorityScore += 15;
      hazards.push('High vulnerability cohort (infants / geriatric hypothermia risk)');
      units.push('Pediatric & Geriatric Comfort Packs');
    }

    if (needsBoat && !units.includes('Motorized Inflatable Rescue Boat (IRB)')) {
      priorityScore += 10;
      units.push('SDRF Water Evacuation Raft');
    }

    if (citizenCount > 10) {
      priorityScore += 10;
      hazards.push(`Mass evacuation requirement (${citizenCount} persons)`);
      units.push('Multi-Trip Troop Carrier Ferry');
    }

    // Keyword checks in description
    const descLower = description.toLowerCase();
    if (descLower.includes('electric') || descLower.includes('transformer') || descLower.includes('wire') || descLower.includes('spark')) {
      priorityScore += 20;
      hazards.push('Active electrocution hazard in conductive floodwater');
      units.push('TANGEDCO Emergency Line Isolation Crew');
    }
    if (descLower.includes('collapse') || descLower.includes('wall') || descLower.includes('crack')) {
      priorityScore += 15;
      hazards.push('Structural failure hazard & masonry debris');
      units.push('TNFRS Heavy Search & Rescue Extrication Tender');
    }
    if (descLower.includes('food') || descLower.includes('drink') || descLower.includes('hungry') || descLower.includes('water')) {
      units.push('GCC Potable Water Tanker & Ready-to-Eat Food Packets');
    }

    priorityScore = Math.min(99, Math.max(30, priorityScore));

    let urgencySummary = 'MODERATE: Standard priority dispatch. Continuous monitoring advised.';
    let suggestedActionPlan = 'Coordinate field patrol verification and assign nearest municipal team.';

    if (priorityScore >= 85) {
      urgencySummary = `CRITICAL EMERGENCY (Score ${priorityScore}/100): Immediate life-safety intervention mandated within 30 minutes.`;
      suggestedActionPlan = `Prioritize immediate watercraft extraction. Establish direct VHF link with NDRF / 108 Amphibious Command. Route patients to nearest active district hospital.`;
    } else if (priorityScore >= 65) {
      urgencySummary = `HIGH PRIORITY (Score ${priorityScore}/100): Substantial hazard to health and dwelling integrity. Dispatch within 60 minutes.`;
      suggestedActionPlan = `Stage rescue team at closest high-ground intersection. Deploy drone recon to verify approach channel clarity.`;
    }

    const triageAnalysis: AITriageAnalysis = {
      priorityScore,
      urgencySummary,
      recommendedUnits: units.length > 0 ? units : ['General Emergency Response Patrol'],
      hazardsIdentified: hazards.length > 0 ? hazards : ['Slick debris surfaces', 'Low visibility'],
      triageConfidence: 0.94,
      modelUsed: 'RESQ.AI Neural Triage Co-Pilot (Simulated)',
      suggestedActionPlan,
    };

    return NextResponse.json(triageAnalysis);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to process AI triage', details: message },
      { status: 500 }
    );
  }
}
