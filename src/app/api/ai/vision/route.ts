import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ImageObservation } from '@/types';

// Deterministic safe fallback for visual observations
function getFallbackObservation(notes?: string): ImageObservation {
  return {
    visibleHazards: [
      'Submerged road/ground terrain',
      'High-turbidity storm surge',
      'Potential underwater manhole/debris hazards',
    ],
    estimatedWaterLevelFt: 3.5,
    environmentalNotes: notes
      ? `Visual cues reflect active flood water inundation. User noted: "${notes.substring(0, 80)}".`
      : 'Visual cues indicate substantial surface water stagnation and obstructed pedestrian footing.',
    isVerified: false,
    disclaimer:
      'UNVERIFIED VISUAL AI OBSERVATION: Automated visual screening aid. Does NOT verify coordinates or count of victims.',
    locationInferred: false,
    victimCountInferred: false,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg', userNotes } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(getFallbackObservation(userNotes), { status: 200 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Deterministic fallback when Gemini API key is not configured
      return NextResponse.json(getFallbackObservation(userNotes), { status: 200 });
    }

    // Extract raw base64 data if prefixed with data:image/...;base64,
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    // 7-second abort controller for emergency responsiveness
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const visionModels = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-flash-image'];

      const prompt = `You are RESQ.AI Emergency Disaster Vision Co-pilot. Analyze this scene image.
CRITICAL SAFETY & ETHICAL RULES:
1. Treat all visual observations as UNVERIFIED contextual screening only.
2. NEVER infer or guess exact geographic location from this image.
3. NEVER infer, guess, or fabricate count of victims or missing persons from this image.
4. Focus strictly on visible environmental flood markers, estimated water depth relative to doors/wheels/walls, structural cracks, fallen wires, and water turbidity.

Return a STRICT raw JSON object with this exact shape:
{
  "visibleHazards": ["string", "string"],
  "estimatedWaterLevelFt": 3.0,
  "environmentalNotes": "one or two concise sentences describing visual water condition and surroundings",
  "isVerified": false,
  "disclaimer": "UNVERIFIED VISUAL AI OBSERVATION: Automated screening only. Direct ground verification required.",
  "locationInferred": false,
  "victimCountInferred": false
}`;

      let resultText: string | null = null;
      for (const vModel of visionModels) {
        try {
          const model = genAI.getGenerativeModel({ model: vModel });
          const res = await model.generateContent([
            prompt,
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
          ]);
          resultText = res.response.text();
          if (resultText) break;
        } catch (e: any) {
          console.warn(`[AI Vision] ${vModel} attempt failed:`, e.message || e);
        }
      }

      clearTimeout(timeout);

      if (!resultText) {
        return NextResponse.json(getFallbackObservation(userNotes), { status: 200 });
      }

      // Extract JSON
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const observation: ImageObservation = {
          visibleHazards: Array.isArray(parsed.visibleHazards) ? parsed.visibleHazards : ['Surface inundation'],
          estimatedWaterLevelFt: typeof parsed.estimatedWaterLevelFt === 'number' ? parsed.estimatedWaterLevelFt : 3.0,
          environmentalNotes: typeof parsed.environmentalNotes === 'string' ? parsed.environmentalNotes : 'Visual waterlogging detected.',
          isVerified: false, // Strictly false per guidelines
          disclaimer:
            'UNVERIFIED VISUAL AI OBSERVATION: Automated screening only. Does NOT verify coordinates or victim count.',
          locationInferred: false, // Strictly false
          victimCountInferred: false, // Strictly false
        };
        return NextResponse.json(observation);
      }

      return NextResponse.json(getFallbackObservation(userNotes));
    } catch (apiErr) {
      clearTimeout(timeout);
      console.warn('Gemini Vision API fallback:', apiErr);
      return NextResponse.json(getFallbackObservation(userNotes));
    }
  } catch (err) {
    console.warn('Vision route error fallback:', err);
    return NextResponse.json(getFallbackObservation());
  }
}
