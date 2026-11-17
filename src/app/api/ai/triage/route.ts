import { NextRequest, NextResponse } from 'next/server';
import { aiTriageRequestSchema, aiTriageOutputSchema, AITriageOutput } from '@/lib/validations/aiTriageSchema';
import { runDemoMultilingualTriage } from '@/services/ai/demoTriageFallback';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    // Support legacy field names (description -> text) for backwards compatibility
    const normalizedBody = {
      text: rawBody.text || rawBody.description || '',
      category: rawBody.category,
      location: rawBody.location,
      waterLevelFt: rawBody.waterLevelFt,
      citizenCount: rawBody.citizenCount,
      needsBoat: rawBody.needsBoat,
      needsMedical: rawBody.needsMedical,
      hasChildrenOrElderly: rawBody.hasChildrenOrElderly,
    };

    const parseResult = aiTriageRequestSchema.safeParse(normalizedBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid AI Triage request data',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { text, category, location, waterLevelFt, citizenCount, needsBoat, needsMedical, hasChildrenOrElderly } =
      parseResult.data;

    // Secure server-only API Key check
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const prompt = `You are RESQ.AI Emergency Triage Engine for Chennai Disaster Operations.
Analyze this citizen emergency distress message (which may be in English, Tamil தமிழ், or Hindi हिन्दी).

CRITICAL DIRECTIVES:
1. Prioritize immediate life threats (cardiac, childbirth, drowning, severe trauma) and vulnerable populations (infants, elderly, disabled, pregnant).
2. NEVER FABRICATE FACTS. If the number of people, exact location, or telephone numbers are not stated in the message, set them to null or list them under missingInformation. Do NOT invent an address or estimate people count if unstated.
3. NEVER AUTOMATICALLY DISPATCH RESPONDERS. Provide recommendations and tactical directives for human dispatchers only. Dispatch requires human verification.
4. Translate any Tamil or Hindi text into clean, clear operational English.

Input Message:
"""
${text}
"""

Additional Context (if provided):
- Pre-selected Category: ${category || 'None'}
- Location: ${location || 'None'}
- Water Level: ${waterLevelFt !== undefined ? `${waterLevelFt} ft` : 'Unstated'}
- Stated Citizen Count: ${citizenCount !== undefined ? citizenCount : 'Unstated'}
- Stated Needs: Boat=${Boolean(needsBoat)}, Medical=${Boolean(needsMedical)}, Vulnerable=${Boolean(hasChildrenOrElderly)}

Return a strict JSON object with this exact structure:
{
  "originalText": "${text.replace(/"/g, '\\"')}",
  "originalLanguage": "English" | "Tamil" | "Hindi" | string,
  "englishTranslation": string,
  "category": "flood_water" | "medical_critical" | "structural_collapse" | "elderly_infant_stranded" | "power_hazard" | "food_water_supply" | "road_blockage",
  "summary": string (1-2 sentences concise situational assessment),
  "peopleAffected": number | null (null if not explicitly stated in text),
  "vulnerabilities": string[] (e.g. "80-year-old grandmother", "6-month-old infant", "pregnant female"),
  "hazardsIdentified": string[] (e.g. "5ft floodwater", "submerged live wire", "active labor pains"),
  "explicitlyReportedLocation": string | null (explicit location mentioned in text, else null),
  "missingInformation": string[] (e.g. "Specific house/door number", "Callback contact number"),
  "urgency": "critical" | "high" | "medium" | "low",
  "priorityScore": number (0-100),
  "urgencySummary": string,
  "explanation": string (justification for the urgency and score),
  "uncertaintyIndicators": string[] (any ambiguity or dialect uncertainty to alert dispatcher),
  "recommendedUnits": string[] (suggested response units for human dispatcher review),
  "suggestedActionPlan": string (step-by-step recommendation for dispatcher verification),
  "triageConfidence": number (between 0.80 and 0.99),
  "modelUsed": "Gemini 1.5 Flash (Live Multi-Lingual)",
  "isDemoFallback": false,
  "humanReviewStatus": "pending"
}`;

        // Implement timeout handling (7 seconds)
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API call timed out after 7000ms')), 7000)
        );

        const geminiPromise = model.generateContent(prompt);
        const result = (await Promise.race([geminiPromise, timeoutPromise])) as any;
        const responseText = result.response.text();

        if (responseText) {
          const parsed = JSON.parse(responseText);
          const validated = aiTriageOutputSchema.safeParse(parsed);
          if (validated.success) {
            return NextResponse.json(validated.data);
          } else {
            console.warn('Gemini output schema validation mismatch, falling back to deterministic demo triage:', validated.error);
          }
        }
      } catch (geminiError) {
        console.warn('Gemini live API failed or timed out. Engaging deterministic DEMO ANALYSIS fallback:', geminiError);
      }
    }

    // Deterministic DEMO ANALYSIS fallback engine (Clearly Labeled)
    const demoResult = runDemoMultilingualTriage(text, {
      category,
      location,
      waterLevelFt,
      citizenCount,
      needsBoat,
      needsMedical,
      hasChildrenOrElderly,
    });

    const validatedDemo = aiTriageOutputSchema.parse(demoResult);
    return NextResponse.json(validatedDemo);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to process AI triage', details: message },
      { status: 500 }
    );
  }
}
