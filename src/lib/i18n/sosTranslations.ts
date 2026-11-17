export type SupportedLanguage = 'en' | 'ta' | 'hi';

export interface SOSTranslations {
  langName: string;
  langShort: string;
  officialDisclaimer: string;
  title: string;
  subtitle: string;
  tabReport: string;
  tabTrack: string;
  homeLink: string;
  commandCenterLink: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  descriptionHelp: string;
  voiceDictationButton: string;
  voiceListening: string;
  voiceStop: string;
  voiceTranscriptLabel: string;
  voiceAppend: string;
  voiceReplace: string;
  voiceClear: string;
  voiceUnsupported: string;
  voicePermissionDenied: string;
  voiceError: string;
  photoLabel: string;
  photoUploadPrompt: string;
  photoRemove: string;
  photoHint: string;
  photoInvalidType: string;
  photoTooLarge: string;
  photoAnalyzing: string;
  photoUnverifiedBadge: string;
  photoUnverifiedDisclaimer: string;
  categoryLabel: string;
  catFlood: string;
  catMedical: string;
  catStranded: string;
  catCollapse: string;
  catPower: string;
  catSupplies: string;
  catRoad: string;
  locationLabel: string;
  locModeManual: string;
  locModePin: string;
  locArea: string;
  locAddress: string;
  locLandmark: string;
  locWaterDepth: string;
  locPresetsLabel: string;
  citizensLabel: string;
  citizensCount: string;
  citizensBoat: string;
  citizensMedical: string;
  accessTitle: string;
  accessElderly: string;
  accessInfants: string;
  accessMobility: string;
  accessMedical: string;
  accessPregnancy: string;
  accessVisionHearing: string;
  contactTitle: string;
  contactName: string;
  contactPhone: string;
  contactPrivate: string;
  urgencyPreview: string;
  submitButton: string;
  submittingText: string;
  resilienceNotice: string;
  confirmTitle: string;
  confirmId: string;
  confirmPendingNotice: string;
  confirmHelplinesTitle: string;
  trackTitle: string;
  trackPlaceholder: string;
  trackButton: string;
  trackNotFound: string;
  trackStatusLabel: string;
  trackAssignedUnit: string;
}

export const SOS_TRANSLATIONS: Record<SupportedLanguage, SOSTranslations> = {
  en: {
    langName: 'English',
    langShort: 'EN',
    officialDisclaimer:
      'OFFICIAL ADVISORY: This is an emergency intake simulation for Chennai Flood Response. If in immediate life peril, call 112 or 108 immediately.',
    title: 'Citizen SOS Emergency Intake',
    subtitle: 'Report trapped civilians, surging waters, medical crises, or power line hazards for rapid rescue coordination.',
    tabReport: 'Report New Emergency',
    tabTrack: 'Track Existing SOS',
    homeLink: 'Back to Home',
    commandCenterLink: 'Command Center',
    descriptionLabel: 'Distress Briefing & Life Peril Details',
    descriptionPlaceholder:
      'Describe what happened, water depth, trapped individuals, infants/elderly needs, immediate hazards...',
    descriptionHelp: 'Be as descriptive as possible. Text intake is guaranteed; voice and photo are optional assistive tools.',
    voiceDictationButton: 'Voice Dictation (Mic)',
    voiceListening: 'Listening... Speak in English, Tamil, or Hindi',
    voiceStop: 'Stop Listening',
    voiceTranscriptLabel: 'Live Speech Transcript (Preview & Edit):',
    voiceAppend: 'Append to Description',
    voiceReplace: 'Replace Description',
    voiceClear: 'Clear Transcript',
    voiceUnsupported: 'Voice dictation is not supported in this browser. Please type directly into the description box.',
    voicePermissionDenied: 'Microphone permission was denied. Please enable microphone permissions in your browser settings or type below.',
    voiceError: 'Microphone audio input error. Please type your message directly.',
    photoLabel: 'Scene Photo / Water Level Evidence (Optional)',
    photoUploadPrompt: 'Click or tap to snap / upload scene photograph',
    photoRemove: 'Remove Photo',
    photoHint: 'JPEG, PNG, WebP up to 5MB. AI image observations are strictly unverified environmental aids.',
    photoInvalidType: 'Invalid file type. Please upload a JPEG, PNG, or WebP photo.',
    photoTooLarge: 'File exceeds 5MB limit. Please upload a smaller image file.',
    photoAnalyzing: 'Generating unverified visual AI observations with Gemini Vision...',
    photoUnverifiedBadge: 'UNVERIFIED VISUAL AI OBSERVATIONS',
    photoUnverifiedDisclaimer:
      'Automated visual analysis only. Never infers exact coordinates or victim counts. Human dispatch confirmation required.',
    categoryLabel: 'Primary Emergency Category',
    catFlood: 'Flood Water / Ground Inundation',
    catMedical: 'Critical Medical Emergency',
    catStranded: 'Elderly / Infants Marooned',
    catCollapse: 'Structural / Tree Collapse',
    catPower: 'High-Voltage Snapped Line / Spark',
    catSupplies: 'Food / Potable Water Depletion',
    catRoad: 'Submerged Road / Culvert Breach',
    locationLabel: 'Incident Location in Greater Chennai',
    locModeManual: 'Verified Area Selection',
    locModePin: 'Interactive Map Pin Picker',
    locArea: 'Chennai Ward / Locality',
    locAddress: 'Street Name, Door No, or Landmark',
    locLandmark: 'Nearby Recognizable Landmark (Optional)',
    locWaterDepth: 'Estimated Water Depth (Feet)',
    locPresetsLabel: 'Quick Chennai Locality Presets:',
    citizensLabel: 'Citizens Affected & Rescue Logistics',
    citizensCount: 'Number of People Affected / Trapped',
    citizensBoat: 'Inflatable Boat / Raft Needed (Depth > 3ft)',
    citizensMedical: 'Immediate ALS Paramedic / Oxygen Needed',
    accessTitle: 'Vulnerabilities & Accessibility Needs (Optional)',
    accessElderly: 'Elderly Citizens (Age 65+)',
    accessInfants: 'Infants / Small Children (Age < 5)',
    accessMobility: 'Wheelchair / Reduced Mobility',
    accessMedical: 'Oxygen / Dialysis Dependency',
    accessPregnancy: 'Pregnancy / Active Labor',
    accessVisionHearing: 'Vision / Hearing Impairment',
    contactTitle: 'Reporter Contact Details (Optional & Private)',
    contactName: 'Your Name / Informant',
    contactPhone: 'Contact Phone Number',
    contactPrivate: 'Keep contact private (viewable only by verified emergency coordinators)',
    urgencyPreview: 'Preliminary Automated Urgency Score:',
    submitButton: 'Transmit SOS Emergency Dispatch',
    submittingText: 'Transmitting Emergency SOS...',
    resilienceNotice:
      'Guaranteed intake: Neither speech recognition nor image upload failures will obstruct distress report transmission.',
    confirmTitle: 'Emergency Distress Signal Registered',
    confirmId: 'Your Tracking Incident Code:',
    confirmPendingNotice: 'Status: PENDING. Coordinators are reviewing this incident. Do not close this window.',
    confirmHelplinesTitle: 'Official 24x7 Government Helplines:',
    trackTitle: 'Track SOS Response Status',
    trackPlaceholder: 'Enter Tracking Incident ID (e.g. INC-CHN-4091)',
    trackButton: 'Lookup Status',
    trackNotFound: 'No matching incident found. Please verify the code or submit a fresh report.',
    trackStatusLabel: 'Current Status:',
    trackAssignedUnit: 'Assigned Responder Unit:',
  },
  ta: {
    langName: 'தமிழ்',
    langShort: 'TA',
    officialDisclaimer:
      'அதிகாரப்பூர்வ எச்சரிக்கை: இது சென்னை பெருவெள்ள மீட்பு பணிக்கான மாதிரி தளம். உயிருக்கு உடனடி ஆபத்து ஏற்பட்டால் உடனே 112 அல்லது 108 ஐ அழைக்கவும்.',
    title: 'குடிமக்கள் அவசர உதவி பதிவு (SOS)',
    subtitle: 'வெள்ளத்தில் சிக்கிய மக்கள், உயரும் நீர்மட்டம், மருத்துவ அவசர தேவைகளை விரைந்து பதிவு செய்து மீட்பு படையை அணுகவும்.',
    tabReport: 'புதிய அவசரநிலை பதிவு',
    tabTrack: 'உதவி நிலவரத்தை அறிய',
    homeLink: 'முகப்பு பக்கம்',
    commandCenterLink: 'கட்டுப்பாட்டு அறை',
    descriptionLabel: 'ஆபத்து மற்றும் அவசரநிலை விவரம்',
    descriptionPlaceholder:
      'தண்ணீரின் அளவு, சிக்கியுள்ளோர் எண்ணிக்கை, குழந்தைகள்/முதியோர் தேவைகள் மற்றும் உடனடி ஆபத்துகளை விவரிக்கவும்...',
    descriptionHelp: 'முடிந்தவரை தெளிவாக குறிப்பிடவும். உரை வடிவிலான பதிவு எப்போதும் தடையின்றி இயங்கும்; குரல் மற்றும் படம் விருப்பத்தேர்வே.',
    voiceDictationButton: 'குரல் பதிவு (மைக்)',
    voiceListening: 'கேட்கிறது... ஆங்கிலம், தமிழ் அல்லது இந்தியில் பேசவும்',
    voiceStop: 'பதிவை நிறுத்த',
    voiceTranscriptLabel: 'நேரடி குரல் உரை (சரிபார்த்து திருத்தலாம்):',
    voiceAppend: 'விவரத்தில் சேர்க்கவும்',
    voiceReplace: 'முழுமையாக மாற்றவும்',
    voiceClear: 'அழித்து மீண்டும் பேச',
    voiceUnsupported: 'உங்கள் உலாவியில் குரல் பதிவு வசதி இல்லை. கீழே உள்ள கட்டத்தில் நேரடியாக தட்டச்சு செய்யவும்.',
    voicePermissionDenied: 'மைக் அனுமதி மறுக்கப்பட்டது. பிரவுசர் அமைப்புகளில் மைக் அனுமதியை வழங்கவும் அல்லது கீழே தட்டச்சு செய்யவும்.',
    voiceError: 'ஆடியோ உள்ளீட்டு பிழை. தயவுசெய்து நேரடியாக தட்டச்சு செய்யவும்.',
    photoLabel: 'சம்பவ இட புகைப்படம் / நீர்மட்ட ஆதாரம் (விருப்பத்தேர்வு)',
    photoUploadPrompt: 'புகைப்படம் எடுக்க அல்லது பதிவேற்ற அழுத்தவும்',
    photoRemove: 'படத்தை நீக்கு',
    photoHint: 'JPEG, PNG, WebP (அதிகபட்சம் 5MB). AI காட்சி ஆய்வுகள் சரிபார்க்கப்படாத குறிப்புகளாகவே பதிவு செய்யப்படும்.',
    photoInvalidType: 'தவறான கோப்பு வடிவம். JPEG, PNG அல்லது WebP படங்களை பதிவேற்றவும்.',
    photoTooLarge: 'கோப்பு 5MB அளவுக்கு மேல் உள்ளது. சிறிய படத்தை தேர்ந்தெடுக்கவும்.',
    photoAnalyzing: 'ஜெமினி AI மூலம் புகைப்பட காட்சி ஆய்வு செய்யப்படுகிறது...',
    photoUnverifiedBadge: 'சரிபார்க்கப்படாத AI காட்சி குறிப்புகள்',
    photoUnverifiedDisclaimer:
      'தானியங்கி காட்சி ஆய்வு மட்டுமே. இது இருப்பிடத்தையோ அல்லது நபர்களின் எண்ணிக்கையையோ தானாக உறுதி செய்யாது.',
    categoryLabel: 'முக்கிய அவசர வகை',
    catFlood: 'வெள்ள நீர் உட்புகுதல் / முடக்கம்',
    catMedical: 'தீவிர மருத்துவ அவசரம்',
    catStranded: 'முதியவர்கள் / கைக்குழந்தைகள் தவிப்பு',
    catCollapse: 'கட்டடம் / மரம் விழுந்து விபத்து',
    catPower: 'மின்கம்பி அறுந்து விழுதல் / தீப்பொறி',
    catSupplies: 'உணவு / குடிநீர் தட்டுப்பாடு',
    catRoad: 'மூழ்கிய சாலை அடைப்பு',
    locationLabel: 'சென்னையில் சம்பவம் நடந்த இடம்',
    locModeManual: 'பகுதி தேர்வு பட்டியல்',
    locModePin: 'வரைபட முள் தேர்வு (Pin Picker)',
    locArea: 'சென்னை வார்டு / பகுதி',
    locAddress: 'தெரு பெயர், கதவு எண் அல்லது அடையாளம்',
    locLandmark: 'அருகிலுள்ள முக்கிய அடையாளம் (விருப்பத்தேர்வு)',
    locWaterDepth: 'தோராயமான தண்ணீர் ஆழம் (அடி)',
    locPresetsLabel: 'முக்கிய சென்னை பகுதிகள்:',
    citizensLabel: 'பாதிக்கப்பட்ட மக்கள் & மீட்பு தேவை',
    citizensCount: 'சிக்கியுள்ள நபர்களின் எண்ணிக்கை',
    citizensBoat: 'மீட்பு படகு தேவை (நீர்மட்டம் > 3 அடி)',
    citizensMedical: 'உடனடி ஆம்புலன்ஸ் / ஆக்ஸிஜன் தேவை',
    accessTitle: 'முன்னுரிமை மற்றும் விசேஷ தேவைகள் (விருப்பத்தேர்வு)',
    accessElderly: 'முதியவர்கள் (65 வயதுக்கு மேல்)',
    accessInfants: 'கைக்குழந்தைகள் / சிறுவர்கள் (<5)',
    accessMobility: 'சக்கர நாற்காலி / மாற்றுத்திறனாளி',
    accessMedical: 'டயாலிசிஸ் / ஆக்ஸிஜன் தேவைப்படுவோர்',
    accessPregnancy: 'கர்ப்பிணி பெண் / பிரசவ வலி',
    accessVisionHearing: 'பார்வை / கேட்கும் திறன் குறைபாடு',
    contactTitle: 'தொடர்பு விவரம் (ரகசியமானது)',
    contactName: 'உங்கள் பெயர்',
    contactPhone: 'கைபேசி எண்',
    contactPrivate: 'தொடர்பு விவரங்களை பொது பலகையில் காட்ட வேண்டாம் (அதிகாரிகள் மட்டுமே பார்ப்பர்)',
    urgencyPreview: 'முதற்கட்ட அவசர நிலை மதிப்பீடு:',
    submitButton: 'அவசர உதவி சமர்ப்பிக்கவும்',
    submittingText: 'சமர்ப்பிக்கப்படுகிறது...',
    resilienceNotice:
      'உறுதிப்படுத்தப்பட்ட சேவை: குரல் அல்லது பட பதிவேற்றம் தோல்வியடைந்தாலும், உரை பதிவு எப்போதும் சமர்ப்பிக்கப்படும்.',
    confirmTitle: 'அவசர உதவி கோரிக்கை பதிவு செய்யப்பட்டது',
    confirmId: 'உங்கள் கண்காணிப்பு குறியீடு (Tracking ID):',
    confirmPendingNotice: 'நிலை: பரிசீலனையில் உள்ளது (PENDING). அதிகாரிகள் மதிப்பாய்வு செய்கிறார்கள். இந்த பக்கத்தை மூட வேண்டாம்.',
    confirmHelplinesTitle: 'அரசு 24x7 உதவி எண்கள்:',
    trackTitle: 'உதவி கோரிக்கையின் தற்போதைய நிலை',
    trackPlaceholder: 'கண்காணிப்பு குறியீட்டை உள்ளிடவும் (எ.கா. INC-CHN-4091)',
    trackButton: 'நிலவரத்தை அறிய',
    trackNotFound: 'இந்த குறியீட்டில் எந்த பதிவும் இல்லை. குறியீட்டை சரிபார்க்கவும்.',
    trackStatusLabel: 'தற்போதைய நிலை:',
    trackAssignedUnit: 'ஒதுக்கப்பட்ட மீட்பு படை:',
  },
  hi: {
    langName: 'हिंदी',
    langShort: 'HI',
    officialDisclaimer:
      'आधिकारिक सूचना: यह चेन्नई बाढ़ राहत आपातकालीन सहायता सिमुलेशन है। यदि जीवन संकट में है, तो तुरंत 112 या 108 पर कॉल करें।',
    title: 'नागरिक आपातकालीन एसओएस सहायता (SOS)',
    subtitle: 'बाढ़ में फंसे नागरिकों, बढ़ते जलस्तर, चिकित्सा संकट या बिजली के खतरों की तत्काल सूचना दर्ज करें।',
    tabReport: 'नई आपातकालीन रिपोर्ट',
    tabTrack: 'एसओएस स्थिति ट्रैक करें',
    homeLink: 'होम पेज',
    commandCenterLink: 'कमांड सेंटर',
    descriptionLabel: 'आपातकालीन स्थिति और संकट का विवरण',
    descriptionPlaceholder:
      'घटना का विवरण, पानी का स्तर, फंसे हुए लोग, शिशुओं/बुजुर्गों की आवश्यकताएं और तत्काल खतरे बताएं...',
    descriptionHelp: 'कृपया स्थिति को स्पष्ट रूप से लिखें। टेक्स्ट रिपोर्ट हमेशा बिना रुकावट सबमिट होगी; आवाज और फोटो वैकल्पिक हैं।',
    voiceDictationButton: 'आवाज से बोलें (माइक)',
    voiceListening: 'सुन रहा है... अंग्रेजी, तमिल या हिंदी में बोलें',
    voiceStop: 'रिकॉर्डिंग रोकें',
    voiceTranscriptLabel: 'लाइव ऑडियो ट्रांसक्रिप्ट (संपादन योग्य):',
    voiceAppend: 'विवरण में जोड़ें',
    voiceReplace: 'विवरण बदलें',
    voiceClear: 'ट्रांसक्रिप्ट हटाएं',
    voiceUnsupported: 'इस ब्राउज़र में वॉयस डिक्टेशन समर्थित नहीं है। कृपया सीधे टेक्स्ट बॉक्स में टाइप करें।',
    voicePermissionDenied: 'माइक्रोफ़ोन अनुमति अस्वीकृत। कृपया ब्राउज़र सेटिंग्स में अनुमति दें या नीचे टाइप करें।',
    voiceError: 'ऑडियो इनपुट त्रुटि। कृपया सीधे टाइप करें।',
    photoLabel: 'घटनास्थल का फोटो / जल स्तर साक्ष्य (वैकल्पिक)',
    photoUploadPrompt: 'फोटो खींचने या अपलोड करने के लिए टैप करें',
    photoRemove: 'फोटो हटाएं',
    photoHint: 'JPEG, PNG, WebP (अधिकतम 5MB)। एआई अवलोकन केवल असत्यापित पर्यावरणीय सहायता के रूप में दर्ज होंगे।',
    photoInvalidType: 'अमान्य फ़ाइल प्रकार। कृपया JPEG, PNG या WebP फोटो अपलोड करें।',
    photoTooLarge: 'फ़ाइल 5MB से बड़ी है। कृपया छोटी फ़ाइल चुनें।',
    photoAnalyzing: 'जेमिनी एआई फोटो का दृश्य विश्लेषण कर रहा है...',
    photoUnverifiedBadge: 'असत्यापित एआई विज़न अवलोकन',
    photoUnverifiedDisclaimer:
      'स्वचालित दृश्य विश्लेषण केवल पर्यावरणीय संकेत देता है। स्थान और व्यक्तियों की संख्या का प्रत्यक्ष सत्यापन अनिवार्य है।',
    categoryLabel: 'मुख्य आपातकालीन श्रेणी',
    catFlood: 'बाढ़ का पानी / जलभराव',
    catMedical: 'गंभीर चिकित्सा आपातकाल',
    catStranded: 'बुजुर्ग या शिशु फंसे हैं',
    catCollapse: 'इमारत / पेड़ गिरना',
    catPower: 'हाई-वोल्टेज बिजली का तार / करंट',
    catSupplies: 'भोजन और पेयजल की भारी कमी',
    catRoad: 'डूबी हुई सड़क / मार्ग अवरुद्ध',
    locationLabel: 'चेन्नई में घटना का स्थान',
    locModeManual: 'सत्यापित क्षेत्र चयन',
    locModePin: 'मानचित्र पिन पिकर (Map Pin)',
    locArea: 'चेन्नई वार्ड / इलाका',
    locAddress: 'सड़क का नाम, मकान नंबर या मील का पत्थर',
    locLandmark: 'निकटतम प्रमुख पहचान चिन्ह (वैकल्पिक)',
    locWaterDepth: 'अनुमानित जल स्तर (फीट)',
    locPresetsLabel: 'त्वरित चेन्नई क्षेत्र चयन:',
    citizensLabel: 'प्रभावित लोग और बचाव आवश्यकताएं',
    citizensCount: 'फंसे हुए लोगों की कुल संख्या',
    citizensBoat: 'बचाव नाव की आवश्यकता (जलस्तर > 3 फीट)',
    citizensMedical: 'तत्काल एम्बुलेंस / ऑक्सीजन की आवश्यकता',
    accessTitle: 'विशेष आवश्यकताएं और कमजोरियां (वैकल्पिक)',
    accessElderly: 'बुजुर्ग नागरिक (65+ वर्ष)',
    accessInfants: 'शिशु / छोटे बच्चे (< 5 वर्ष)',
    accessMobility: 'व्हीलचेयर / दिव्यांग नागरिक',
    accessMedical: 'डायलिसिस / जीवन रक्षक उपकरण निर्भर',
    accessPregnancy: 'गर्भवती महिला / प्रसव पीड़ा',
    accessVisionHearing: 'दृष्टि / श्रवण बाधित नागरिक',
    contactTitle: 'संपर्क विवरण (वैकल्पिक व निजी)',
    contactName: 'आपका नाम / सूचनादाता',
    contactPhone: 'मोबाइल फोन नंबर',
    contactPrivate: 'संपर्क विवरण सार्वजनिक न करें (केवल बचाव दल ही देख सकेंगे)',
    urgencyPreview: 'प्रारंभिक स्वचालित तात्कालिकता स्कोर:',
    submitButton: 'एसओएस आपातकालीन संदेश भेजें',
    submittingText: 'संदेश भेजा जा रहा है...',
    resilienceNotice:
      'सुरक्षित सेवा: ऑडियो या फोटो विफल होने पर भी टेक्स्ट रिपोर्ट हमेशा बिना किसी रुकावट के सबमिट होगी।',
    confirmTitle: 'आपातकालीन एसओएस सिग्नल दर्ज हुआ',
    confirmId: 'आपका ट्रैकिंग कोड (Incident ID):',
    confirmPendingNotice: 'स्थिति: समीक्षा जारी है (PENDING)। अधिकारी रिपोर्ट की समीक्षा कर रहे हैं। इस विंडो को बंद न करें।',
    confirmHelplinesTitle: 'सरकारी 24x7 हेल्पलाइन नंबर:',
    trackTitle: 'एसओएस स्थिति ट्रैक करें',
    trackPlaceholder: 'इंसिडेंट कोड दर्ज करें (उदा. INC-CHN-4091)',
    trackButton: 'स्थिति देखें',
    trackNotFound: 'इस कोड से कोई रिकॉर्ड नहीं मिला। कृपया कोड जांचें।',
    trackStatusLabel: 'वर्तमान स्थिति:',
    trackAssignedUnit: 'तैनात बचाव दल:',
  },
};
