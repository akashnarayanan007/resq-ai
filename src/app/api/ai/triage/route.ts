import { NextRequest, NextResponse } from 'next/server';
import { aiTriageRequestSchema, aiTriageOutputSchema, AITriageOutput } from '@/lib/validations/aiTriageSchema';
import { runDemoMultilingualTriage } from '@/services/ai/demoTriageFallback';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

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
        // Supported models verified from Google Generative AI API:
        const modelNames = ['gemini-3.1-flash-lite', 'gemini-3-flash-preview'];
        let lastError: any = null;
        let responseText: string | null = null;
        let usedModelName = 'gemini-3.1-flash-lite';

        const triagePrompt = `You are RESQ.AI Emergency Triage Engine for Chennai Disaster Operations.
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
  "originalLanguage": "English",
  "englishTranslation": "concise English translation",
  "category": "flood_water",
  "summary": "1-2 sentences concise situational assessment",
  "peopleAffected": null,
  "vulnerabilities": ["e.g. 80-year-old grandmother"],
  "hazardsIdentified": ["e.g. 5ft floodwater"],
  "explicitlyReportedLocation": null,
  "missingInformation": ["e.g. specific house door number"],
  "urgency": "critical",
  "priorityScore": 95,
  "urgencySummary": "short summary of urgency",
  "explanation": "justification for the urgency and score",
  "uncertaintyIndicators": [],
  "recommendedUnits": ["Boat Rescue Alpha"],
  "suggestedActionPlan": "step-by-step recommendation for dispatcher verification",
  "triageConfidence": 0.95,
  "modelUsed": "Gemini 3.8 Flash (Live Multi-Lingual)",
  "isDemoFallback": false,
  "humanReviewStatus": "pending"
}`;

        for (const mName of modelNames) {
          try {
            const model = genAI.getGenerativeModel({
              model: mName,
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.1,
              },
            });

            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Gemini API call timed out after 7000ms')), 7000)
            );

            const geminiPromise = model.generateContent(triagePrompt);
            const result = (await Promise.race([geminiPromise, timeoutPromise])) as any;
            responseText = result.response.text();
            if (responseText) {
              usedModelName = mName;
              break;
            }
          } catch (modelErr: any) {
            lastError = modelErr;
            console.warn(`[AI Triage] ${mName} attempt failed or unavailable:`, modelErr.message || modelErr);
          }
        }

        if (responseText) {
          const parsed = JSON.parse(responseText);
          parsed.modelUsed = `Google ${usedModelName} (Live Multilingual)`;
          parsed.isDemoFallback = false;
          const validated = aiTriageOutputSchema.safeParse(parsed);
          if (validated.success) {
            return NextResponse.json(validated.data);
          } else {
            console.warn('[AI Triage] Gemini response schema validation failed, using fallback:', validated.error);
          }
        } else {
          console.warn('[AI Triage] All live models unavailable, engaging resilient fallback:', lastError?.message);
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
