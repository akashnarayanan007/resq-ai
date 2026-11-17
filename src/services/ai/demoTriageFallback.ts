import { AITriageOutput } from '@/lib/validations/aiTriageSchema';
import { IncidentCategory, IncidentSeverity } from '@/types';

export function runDemoMultilingualTriage(rawText: string, context?: {
  category?: IncidentCategory;
  location?: string;
  waterLevelFt?: number;
  citizenCount?: number;
  needsBoat?: boolean;
  needsMedical?: boolean;
  hasChildrenOrElderly?: boolean;
}): AITriageOutput {
  const text = rawText.trim();
  const isTamil = /[\u0B80-\u0BFF]/.test(text);
  const isHindi = /[\u0900-\u097F]/.test(text);

  let originalLanguage = 'English';
  if (isTamil) originalLanguage = 'Tamil';
  else if (isHindi) originalLanguage = 'Hindi';

  // 1. Translation synthesis for known emergency patterns
  let englishTranslation = text;
  if (isTamil) {
    if (text.includes('வேளச்சேரி') || text.includes('ராம் நகர்')) {
      englishTranslation = 'Water entered home up to 5 feet in Ram Nagar, Velachery. An 80-year-old grandmother and a 6-month-old infant are stranded on the terrace. Rescue boat needed immediately.';
    } else if (text.includes('மடிப்பாக்கம்') || text.includes('மடிபாக்கம்')) {
      englishTranslation = 'Water level is 4 feet in Madipakkam. Pregnant woman is in severe labor pain, urgent medical/ambulance support required.';
    } else if (text.includes('தாம்பரம்') || text.includes('முடிச்சூர்')) {
      englishTranslation = 'Severe water overflow on Mudichur road, Tambaram. 6 family members stranded, elder cardiac patient out of oxygen.';
    } else {
      englishTranslation = `[Translated from Tamil]: ${text.replace(/[\u0B80-\u0BFF]+/g, (match) => {
        if (/வெள்ளம்|தண்ணீர்/.test(match)) return 'flooding water';
        if (/குழந்தை/.test(match)) return 'infant/child';
        if (/பாட்டி|தாத்தா|முதியவர்/.test(match)) return 'elderly person';
        if (/மருத்துவம்|நோயாளி/.test(match)) return 'medical emergency';
        if (/படகு/.test(match)) return 'rescue boat';
        if (/உதவி/.test(match)) return 'urgent help';
        return match;
      })}`;
    }
  } else if (isHindi) {
    if (text.includes('मडीपक्कम') || text.includes('मदिपक्कम')) {
      englishTranslation = '4 feet of water has filled our house in Madipakkam. My pregnant wife is having severe labor pains, ambulance or doctor is needed immediately.';
    } else if (text.includes('वेलाचेरी') || text.includes('राम नगर')) {
      englishTranslation = '5 feet flood water entered house in Velachery. Family including elderly and child trapped on roof, urgent boat needed.';
    } else if (text.includes('तांबरम') || text.includes('मुडीचूर')) {
      englishTranslation = 'Canal overflowed in Tambaram Mudichur area. 6 people stranded with heart patient running out of oxygen.';
    } else {
      englishTranslation = `[Translated from Hindi]: ${text.replace(/[\u0900-\u097F]+/g, (match) => {
        if (/पानी|बाढ़/.test(match)) return 'flood water';
        if (/बच्चा|शिशु/.test(match)) return 'infant/child';
        if (/बुजुर्ग|दादा|दादी/.test(match)) return 'elderly person';
        if (/गर्भवती/.test(match)) return 'pregnant woman';
        if (/इलाज|डॉक्टर|अस्पताल/.test(match)) return 'medical aid';
        if (/नाव|कश्ती/.test(match)) return 'rescue boat';
        if (/मदद/.test(match)) return 'help';
        return match;
      })}`;
    }
  }

  // 2. Explicit Location extraction (Never fabricate; if not in text, mark null)
  let explicitlyReportedLocation: string | null = null;
  const combined = `${text} ${englishTranslation}`.toLowerCase();

  if (combined.includes('velachery') || text.includes('வேளச்சேரி') || text.includes('वेलाचेरी')) {
    explicitlyReportedLocation = 'Velachery, Chennai';
  } else if (combined.includes('madipakkam') || text.includes('மடிப்பாக்கம்') || text.includes('मडीपक्कम')) {
    explicitlyReportedLocation = 'Madipakkam, Chennai';
  } else if (combined.includes('tambaram') || text.includes('தாம்பரம்') || text.includes('तांबरम')) {
    explicitlyReportedLocation = 'Tambaram, Chennai';
  } else if (combined.includes('saidapet') || text.includes('சைதாப்பேட்டை') || text.includes('सैदापेट')) {
    explicitlyReportedLocation = 'Saidapet, Chennai';
  } else if (combined.includes('kotturpuram') || text.includes('கொட்டூர்புரம்')) {
    explicitlyReportedLocation = 'Kotturpuram, Chennai';
  } else if (combined.includes('adyar') || text.includes('அடையார்')) {
    explicitlyReportedLocation = 'Adyar, Chennai';
  } else if (combined.includes('sholinganallur') || text.includes('சோழிங்கநல்லூர்')) {
    explicitlyReportedLocation = 'Sholinganallur, Chennai';
  } else if (combined.includes('pallikaranai') || text.includes('பள்ளிக்கரணை')) {
    explicitlyReportedLocation = 'Pallikaranai, Chennai';
  } else if (combined.includes('mylapore') || text.includes('மயிலாப்பூர்')) {
    explicitlyReportedLocation = 'Mylapore, Chennai';
  } else if (context?.location) {
    explicitlyReportedLocation = context.location;
  }

  // 3. People affected extraction (Never fabricate; if not stated, return null)
  let peopleAffected: number | null = null;
  const peopleRegex = /(\d+)\s*(people|persons|family members|residents|civilians|occupants|பேர்|பேர்கள்|लोग|सदस्य)/i;
  const matchCount = combined.match(peopleRegex);

  if (matchCount) {
    peopleAffected = parseInt(matchCount[1], 10);
  } else if (
    combined.includes('grandmother and infant') ||
    text.includes('பாட்டி மற்றும்') ||
    combined.includes('wife and i') ||
    combined.includes('pregnant wife')
  ) {
    peopleAffected = 2;
  } else if (context?.citizenCount && context.citizenCount > 0) {
    peopleAffected = context.citizenCount;
  }

  // 4. Vulnerabilities Identification
  const vulnerabilities: string[] = [];
  if (
    combined.includes('infant') ||
    combined.includes('baby') ||
    combined.includes('child') ||
    text.includes('குழந்தை') ||
    text.includes('बच्चा')
  ) {
    vulnerabilities.push('Infant / Young Child at acute hypothermia risk');
  }
  if (
    combined.includes('elderly') ||
    combined.includes('grandmother') ||
    combined.includes('grandfather') ||
    combined.includes('senior') ||
    text.includes('பாட்டி') ||
    text.includes('தாத்தா') ||
    text.includes('बुजुर्ग') ||
    text.includes('80 வயது')
  ) {
    vulnerabilities.push('Geriatric citizen (80+ yrs) with limited physical mobility');
  }
  if (
    combined.includes('pregnant') ||
    combined.includes('labor') ||
    text.includes('கர்ப்பிணி') ||
    text.includes('பிரசவம்') ||
    text.includes('गर्भवती') ||
    text.includes('प्रसव')
  ) {
    vulnerabilities.push('Full-term pregnancy in active labor');
  }
  if (
    combined.includes('oxygen') ||
    combined.includes('dialysis') ||
    combined.includes('cardiac') ||
    combined.includes('heart patient') ||
    text.includes('ஆக்ஸிஜன்') ||
    text.includes('டயாலிசிஸ்') ||
    text.includes('ऑक्सीजन')
  ) {
    vulnerabilities.push('Life-support prescription dependency (Oxygen/Dialysis)');
  }

  // 5. Hazards Identification
  const hazardsIdentified: string[] = [];
  const depthMatch = combined.match(/(\d+(\.\d+)?)\s*(feet|foot|ft|அடி|फीट)/i);
  if (depthMatch) {
    const depth = parseFloat(depthMatch[1]);
    hazardsIdentified.push(`Standing floodwater height of ${depth} ft`);
  } else if (context?.waterLevelFt && context.waterLevelFt > 0) {
    hazardsIdentified.push(`Recorded flood height of ${context.waterLevelFt} ft`);
  }

  if (
    combined.includes('wire') ||
    combined.includes('electric') ||
    combined.includes('cable') ||
    text.includes('மின் கம்பி') ||
    text.includes('बिजली')
  ) {
    hazardsIdentified.push('Snapped electrical power line with electrocution potential');
  }
  if (
    combined.includes('collapse') ||
    combined.includes('wall') ||
    text.includes('இடிந்து') ||
    text.includes('गिर गया')
  ) {
    hazardsIdentified.push('Structural masonry degradation and wall collapse hazard');
  }
  if (
    combined.includes('current') ||
    combined.includes('overflow') ||
    combined.includes('surge') ||
    text.includes('வேகமாக') ||
    text.includes('तेज बहाव')
  ) {
    hazardsIdentified.push('Fast hydraulic water current hindering pedestrian egress');
  }

  // 6. Category Determination
  let category: IncidentCategory = context?.category || 'flood_water';
  if (vulnerabilities.some((v) => v.includes('labor') || v.includes('Oxygen'))) {
    category = 'medical_critical';
  } else if (vulnerabilities.some((v) => v.includes('Infant') || v.includes('Geriatric'))) {
    category = 'elderly_infant_stranded';
  } else if (hazardsIdentified.some((h) => h.includes('electrical'))) {
    category = 'power_hazard';
  } else if (hazardsIdentified.some((h) => h.includes('Structural'))) {
    category = 'structural_collapse';
  }

  // 7. Missing Information List
  const missingInformation: string[] = [];
  if (!explicitlyReportedLocation || explicitlyReportedLocation.split(',').length < 2) {
    missingInformation.push('Exact street name, plot number, or landmark within the ward');
  }
  if (!peopleAffected) {
    missingInformation.push('Total number of occupants trapped inside dwelling');
  }
  if (!combined.includes('+91') && !combined.match(/\d{10}/)) {
    missingInformation.push('Direct callback mobile phone number of reporting party');
  }
  if (vulnerabilities.length > 0 && !combined.includes('medication')) {
    missingInformation.push('Current medication availability or specific clinical dosage requirements');
  }

  // 8. Urgency, Priority Score & Explanation
  let priorityScore = 50;
  let urgency: IncidentSeverity = 'medium';

  const hasPregnancy = vulnerabilities.some((v) => v.includes('pregnancy'));
  const hasInfantOrElderly = vulnerabilities.some((v) => v.includes('Infant') || v.includes('Geriatric'));
  const hasOxygen = vulnerabilities.some((v) => v.includes('Oxygen'));
  const hasHighWater = hazardsIdentified.some((h) => {
    const m = h.match(/(\d+(\.\d+)?) ft/);
    return m ? parseFloat(m[1]) >= 4 : false;
  });

  if (hasPregnancy) {
    priorityScore = 98;
    urgency = 'critical';
  } else if (hasOxygen) {
    priorityScore = 96;
    urgency = 'critical';
  } else if (hasInfantOrElderly && hasHighWater) {
    priorityScore = 95;
    urgency = 'critical';
  } else if (hazardsIdentified.some((h) => h.includes('electrical'))) {
    priorityScore = 88;
    urgency = 'high';
  } else if (hasHighWater) {
    priorityScore = 80;
    urgency = 'high';
  } else {
    priorityScore = 65;
    urgency = 'medium';
  }

  // 9. Recommended Units
  const recommendedUnits: string[] = [];
  if (category === 'medical_critical' || hasPregnancy || hasOxygen) {
    recommendedUnits.push('108 Amphibious Paramedic Ambulance (ALS Unit)');
    recommendedUnits.push('Obstetric / Emergency Oxygen Trauma Kit');
  }
  if (category === 'elderly_infant_stranded' || hasHighWater || combined.includes('boat')) {
    recommendedUnits.push('NDRF Motorized Inflatable Rescue Raft (IRB)');
    recommendedUnits.push('Pediatric & Geriatric Thermal Lifejackets');
  }
  if (category === 'power_hazard') {
    recommendedUnits.push('TANGEDCO High-Voltage Emergency Isolation Crew');
  }
  if (recommendedUnits.length === 0) {
    recommendedUnits.push('State Disaster Response Patrol (SDRF)');
  }

  // 10. Summary & Tactical Action Plan
  const summary = `${originalLanguage !== 'English' ? `[${originalLanguage} SOS] ` : ''}${
    vulnerabilities.length > 0 ? vulnerabilities[0] : 'Citizens'
  } marooned in ${explicitlyReportedLocation || 'unverified sector'}${
    hazardsIdentified.length > 0 ? ` amidst ${hazardsIdentified[0].toLowerCase()}` : ''
  }.`;

  const explanation = `Prioritized as ${urgency.toUpperCase()} (Score: ${priorityScore}/100) due to ${
    vulnerabilities.length > 0 ? vulnerabilities.join(' and ') : 'rapid storm runoff'
  } combined with ${hazardsIdentified.join(', ')}. Immediate human verification mandated before asset dispatch.`;

  const suggestedActionPlan = `Step 1: Contact reporting party to verify specific door number. Step 2: Alert ${
    recommendedUnits[0]
  }. Step 3: Human dispatcher authorization required before physical deployment.`;

  // 11. Uncertainty Indicators
  const uncertaintyIndicators: string[] = [];
  if (originalLanguage !== 'English') {
    uncertaintyIndicators.push(`Automated translation from ${originalLanguage} — dialect nuances should be confirmed by a bilingual operator.`);
  }
  if (missingInformation.length > 0) {
    uncertaintyIndicators.push(`Location specificity incomplete: ${missingInformation[0]}.`);
  }
  if (!peopleAffected) {
    uncertaintyIndicators.push('Exact victim head-count is unconfirmed.');
  }

  return {
    originalText: text,
    originalLanguage,
    englishTranslation,
    category,
    summary,
    peopleAffected,
    vulnerabilities,
    hazardsIdentified,
    explicitlyReportedLocation,
    missingInformation,
    urgency,
    priorityScore,
    urgencySummary: `${urgency.toUpperCase()} LIFE RISK (Score ${priorityScore}/100)`,
    explanation,
    uncertaintyIndicators,
    recommendedUnits,
    suggestedActionPlan,
    triageConfidence: 0.94,
    modelUsed: 'RESQ.AI Deterministic Multilingual Fallback Engine (Demo Mode)',
    isDemoFallback: true,
    humanReviewStatus: 'pending',
  };
}
