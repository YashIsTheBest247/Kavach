"""Multi-language citizen advisory snippets (Fraud Shield)."""

LANGUAGES = ["en", "hi", "bn", "ta", "te", "kn", "mr", "gu", "ml", "pa", "or", "ur"]

# Display names for the 12 supported languages (used by the UI language pickers).
LANGUAGE_NAMES = {
    "en": "English", "hi": "हिन्दी", "bn": "বাংলা", "ta": "தமிழ்", "te": "తెలుగు",
    "kn": "ಕನ್ನಡ", "mr": "मराठी", "gu": "ગુજરાતી", "ml": "മലയാളം", "pa": "ਪੰਜਾਬੀ",
    "or": "ଓଡ଼ିଆ", "ur": "اردو",
}

VERDICT_ADVISORY = {
    "CRITICAL": {
        "en": "🚨 SCAM ALERT: This is almost certainly a fraud. Do NOT pay or share OTP. Hang up and call 1930.",
        "hi": "🚨 धोखाधड़ी चेतावनी: यह लगभग निश्चित रूप से एक घोटाला है। पैसे न भेजें, OTP साझा न करें। कॉल काटें और 1930 पर कॉल करें।",
        "ta": "🚨 மோசடி எச்சரிக்கை: இது கிட்டத்தட்ட நிச்சயமாக மோசடி. பணம் அனுப்ப வேண்டாம், OTP பகிர வேண்டாம். அழைப்பைத் துண்டித்து 1930 ஐ அழைக்கவும்.",
        "kn": "🚨 ವಂಚನೆ ಎಚ್ಚರಿಕೆ: ಇದು ಬಹುತೇಕ ಖಚಿತವಾಗಿ ವಂಚನೆ. ಹಣ ಕಳುಹಿಸಬೇಡಿ, OTP ಹಂಚಿಕೊಳ್ಳಬೇಡಿ. ಕರೆ ಕಡಿತಗೊಳಿಸಿ 1930 ಗೆ ಕರೆ ಮಾಡಿ.",
        "te": "🚨 మోసం హెచ్చరిక: ఇది దాదాపు ఖచ్చితంగా మోసం. డబ్బు పంపవద్దు, OTP షేర్ చేయవద్దు. కాల్ కట్ చేసి 1930కి కాల్ చేయండి.",
        "bn": "🚨 প্রতারণা সতর্কতা: এটি প্রায় নিশ্চিতভাবে একটি প্রতারণা। টাকা পাঠাবেন না, OTP শেয়ার করবেন না। কল কেটে 1930-এ কল করুন।",
        "mr": "🚨 फसवणूक इशारा: हे जवळपास नक्कीच फसवणूक आहे. पैसे देऊ नका किंवा OTP शेअर करू नका. कॉल बंद करा आणि 1930 वर कॉल करा.",
        "gu": "🚨 છેતરપિંડી ચેતવણી: આ લગભગ ચોક્કસપણે છેતરપિંડી છે. પૈસા ન આપો કે OTP શેર ન કરો. કૉલ કાપો અને 1930 પર કૉલ કરો.",
        "ml": "🚨 തട്ടിപ്പ് മുന്നറിയിപ്പ്: ഇത് മിക്കവാറും ഉറപ്പായും ഒരു തട്ടിപ്പാണ്. പണം നൽകുകയോ OTP പങ്കിടുകയോ ചെയ്യരുത്. കോൾ വെട്ടി 1930 ൽ വിളിക്കുക.",
        "pa": "🚨 ਧੋਖਾਧੜੀ ਚੇਤਾਵਨੀ: ਇਹ ਲਗਭਗ ਯਕੀਨੀ ਤੌਰ 'ਤੇ ਧੋਖਾ ਹੈ। ਪੈਸੇ ਨਾ ਭੇਜੋ ਜਾਂ OTP ਸਾਂਝਾ ਨਾ ਕਰੋ। ਕਾਲ ਕੱਟੋ ਅਤੇ 1930 'ਤੇ ਕਾਲ ਕਰੋ।",
        "or": "🚨 ଠକେଇ ଚେତାବନୀ: ଏହା ପ୍ରାୟ ନିଶ୍ଚିତ ଭାବେ ଏକ ଠକେଇ। ଟଙ୍କା ଦିଅନ୍ତୁ ନାହିଁ କିମ୍ବା OTP ସେୟାର କରନ୍ତୁ ନାହିଁ। କଲ କାଟି 1930 କୁ କଲ କରନ୍ତୁ।",
        "ur": "🚨 دھوکہ دہی کی وارننگ: یہ تقریباً یقینی طور پر فراڈ ہے۔ پیسے نہ دیں اور OTP شیئر نہ کریں۔ کال کاٹ دیں اور 1930 پر کال کریں۔",
    },
    "HIGH": {
        "en": "⚠️ Likely scam. Do not act on the caller's instructions. Verify via official numbers. Report to 1930.",
        "hi": "⚠️ संभावित घोटाला। कॉल करने वाले के निर्देशों का पालन न करें। आधिकारिक नंबरों से सत्यापित करें। 1930 पर रिपोर्ट करें।",
        "ta": "⚠️ மோசடியாக இருக்கலாம். அழைப்பாளரின் அறிவுறுத்தல்களைப் பின்பற்ற வேண்டாம். அதிகாரப்பூர்வ எண்களில் சரிபார்க்கவும். 1930க்கு புகாரளிக்கவும்.",
        "kn": "⚠️ ವಂಚನೆ ಇರಬಹುದು. ಕರೆ ಮಾಡಿದವರ ಸೂಚನೆಗಳನ್ನು ಪಾಲಿಸಬೇಡಿ. ಅಧಿಕೃತ ಸಂಖ್ಯೆಗಳಿಂದ ಪರಿಶೀಲಿಸಿ. 1930 ಗೆ ವರದಿ ಮಾಡಿ.",
        "te": "⚠️ మోసం కావచ్చు. కాలర్ సూచనలను పాటించవద్దు. అధికారిక నంబర్లతో ధృవీకరించండి. 1930కి నివేదించండి.",
        "bn": "⚠️ সম্ভাব্য প্রতারণা। কলকারীর নির্দেশ অনুসরণ করবেন না। সরকারি নম্বরে যাচাই করুন। 1930-এ রিপোর্ট করুন।",
        "mr": "⚠️ बहुधा फसवणूक. कॉल करणाऱ्याच्या सूचनांचे पालन करू नका. अधिकृत क्रमांकांवरून खात्री करा. 1930 वर तक्रार करा.",
        "gu": "⚠️ સંભવિત છેતરપિંડી. કૉલ કરનારની સૂચનાઓનું પાલન ન કરો. અધિકૃત નંબરો દ્વારા ચકાસો. 1930 પર જાણ કરો.",
        "ml": "⚠️ തട്ടിപ്പ് സാധ്യത. വിളിക്കുന്നയാളുടെ നിർദ്ദേശങ്ങൾ അനുസരിക്കരുത്. ഔദ്യോഗിക നമ്പറുകളിൽ പരിശോധിക്കുക. 1930 ൽ റിപ്പോർട്ട് ചെയ്യുക.",
        "pa": "⚠️ ਸੰਭਾਵਿਤ ਧੋਖਾ। ਕਾਲ ਕਰਨ ਵਾਲੇ ਦੀਆਂ ਹਦਾਇਤਾਂ 'ਤੇ ਅਮਲ ਨਾ ਕਰੋ। ਅਧਿਕਾਰਤ ਨੰਬਰਾਂ ਤੋਂ ਪੁਸ਼ਟੀ ਕਰੋ। 1930 'ਤੇ ਰਿਪੋਰਟ ਕਰੋ।",
        "or": "⚠️ ସମ୍ଭାବ୍ୟ ଠକେଇ। କଲ କରୁଥିବା ବ୍ୟକ୍ତିଙ୍କ ନିର୍ଦ୍ଦେଶ ମାନନ୍ତୁ ନାହିଁ। ଅଧିକାରିକ ନମ୍ବରରୁ ଯାଞ୍ଚ କରନ୍ତୁ। 1930 କୁ ରିପୋର୍ଟ କରନ୍ତୁ।",
        "ur": "⚠️ ممکنہ فراڈ۔ کال کرنے والے کی ہدایات پر عمل نہ کریں۔ سرکاری نمبروں سے تصدیق کریں۔ 1930 پر اطلاع دیں۔",
    },
    "MEDIUM": {
        "en": "🔎 Some risk signs. Never share OTP/PIN or transfer money to 'verify'. Verify identity first.",
        "hi": "🔎 कुछ जोखिम संकेत। OTP/PIN साझा न करें या 'सत्यापन' के लिए पैसे न भेजें। पहले पहचान सत्यापित करें।",
        "ta": "🔎 சில ஆபத்து அறிகுறிகள். OTP/PIN பகிர வேண்டாம் அல்லது 'சரிபார்க்க' பணம் அனுப்ப வேண்டாம். முதலில் அடையாளத்தைச் சரிபார்க்கவும்.",
        "kn": "🔎 ಕೆಲವು ಅಪಾಯ ಸೂಚನೆಗಳು. OTP/PIN ಹಂಚಿಕೊಳ್ಳಬೇಡಿ ಅಥವಾ 'ಪರಿಶೀಲನೆ'ಗಾಗಿ ಹಣ ಕಳುಹಿಸಬೇಡಿ.",
        "te": "🔎 కొన్ని ప్రమాద సంకేతాలు. OTP/PIN షేర్ చేయవద్దు లేదా 'ధృవీకరణ' కోసం డబ్బు పంపవద్దు.",
        "bn": "🔎 কিছু ঝুঁকির লক্ষণ। OTP/PIN শেয়ার করবেন না বা 'যাচাই' করতে টাকা পাঠাবেন না।",
        "mr": "🔎 काही धोक्याची चिन्हे. OTP/PIN कधीही शेअर करू नका किंवा 'पडताळणी'साठी पैसे पाठवू नका. आधी ओळख तपासा.",
        "gu": "🔎 કેટલાક જોખમના સંકેતો. OTP/PIN ક્યારેય શેર ન કરો કે 'ચકાસણી' માટે પૈસા ન મોકલો. પહેલા ઓળખ ચકાસો.",
        "ml": "🔎 ചില അപകട സൂചനകൾ. OTP/PIN ഒരിക്കലും പങ്കിടരുത് അല്ലെങ്കിൽ 'പരിശോധിക്കാൻ' പണം അയയ്ക്കരുത്. ആദ്യം ഐഡന്റിറ്റി പരിശോധിക്കുക.",
        "pa": "🔎 ਕੁਝ ਖਤਰੇ ਦੇ ਸੰਕੇਤ। OTP/PIN ਕਦੇ ਸਾਂਝਾ ਨਾ ਕਰੋ ਜਾਂ 'ਤਸਦੀਕ' ਲਈ ਪੈਸੇ ਨਾ ਭੇਜੋ। ਪਹਿਲਾਂ ਪਛਾਣ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ।",
        "or": "🔎 କିଛି ବିପଦ ସଙ୍କେତ। OTP/PIN କେବେ ସେୟାର କରନ୍ତୁ ନାହିଁ କିମ୍ବା 'ଯାଞ୍ଚ' ପାଇଁ ଟଙ୍କା ପଠାନ୍ତୁ ନାହିଁ। ପ୍ରଥମେ ପରିଚୟ ଯାଞ୍ଚ କରନ୍ତୁ।",
        "ur": "🔎 کچھ خطرے کی علامات۔ OTP/PIN کبھی شیئر نہ کریں یا 'تصدیق' کے لیے پیسے نہ بھیجیں۔ پہلے شناخت کی تصدیق کریں۔",
    },
    "LOW": {
        "en": "✅ No strong scam signs found. Stay alert — agencies never demand money or OTP over a call.",
        "hi": "✅ कोई मजबूत घोटाला संकेत नहीं मिला। सतर्क रहें — एजेंसियां ​​कभी कॉल पर पैसे या OTP की मांग नहीं करतीं।",
        "ta": "✅ வலுவான மோசடி அறிகுறிகள் இல்லை. விழிப்புடன் இருங்கள் — அமைப்புகள் அழைப்பில் பணம் அல்லது OTP கேட்காது.",
        "kn": "✅ ಪ್ರಬಲ ವಂಚನೆ ಸೂಚನೆಗಳಿಲ್ಲ. ಜಾಗರೂಕರಾಗಿರಿ — ಸಂಸ್ಥೆಗಳು ಕರೆಯಲ್ಲಿ ಹಣ ಅಥವಾ OTP ಕೇಳುವುದಿಲ್ಲ.",
        "te": "✅ బలమైన మోసం సంకేతాలు లేవు. అప్రమత్తంగా ఉండండి — ఏజెన్సీలు కాల్‌లో డబ్బు లేదా OTP అడగవు.",
        "bn": "✅ শক্তিশালী প্রতারণার লক্ষণ নেই। সতর্ক থাকুন — সংস্থা কখনও কলে টাকা বা OTP চায় না।",
        "mr": "✅ कोणतीही ठोस फसवणुकीची चिन्हे आढळली नाहीत. सतर्क राहा — संस्था कधीही कॉलवर पैसे किंवा OTP मागत नाहीत.",
        "gu": "✅ કોઈ મજબૂત છેતરપિંડીના સંકેત મળ્યા નથી. સાવધ રહો — એજન્સીઓ ક્યારેય કૉલ પર પૈસા કે OTP માંગતી નથી.",
        "ml": "✅ ശക്തമായ തട്ടിപ്പ് സൂചനകളൊന്നും കണ്ടെത്തിയില്ല. ജാഗ്രത പാലിക്കുക — ഏജൻസികൾ കോളിൽ പണമോ OTP-യോ ആവശ്യപ്പെടില്ല.",
        "pa": "✅ ਕੋਈ ਪੱਕੇ ਧੋਖੇ ਦੇ ਸੰਕੇਤ ਨਹੀਂ ਮਿਲੇ। ਸੁਚੇਤ ਰਹੋ — ਏਜੰਸੀਆਂ ਕਦੇ ਵੀ ਕਾਲ 'ਤੇ ਪੈਸੇ ਜਾਂ OTP ਨਹੀਂ ਮੰਗਦੀਆਂ।",
        "or": "✅ କୌଣସି ଦୃଢ଼ ଠକେଇ ସଙ୍କେତ ମିଳିଲା ନାହିଁ। ସତର୍କ ରୁହନ୍ତୁ — ସଂସ୍ଥାମାନେ କେବେ କଲରେ ଟଙ୍କା କିମ୍ବା OTP ମାଗନ୍ତି ନାହିଁ।",
        "ur": "✅ کوئی مضبوط فراڈ کی علامت نہیں ملی۔ چوکس رہیں — ادارے کبھی کال پر پیسے یا OTP نہیں مانگتے۔",
    },
}

SAMPLE_SCENARIOS = [
    {
        "title": "Fake CBI 'Digital Arrest'",
        "channel": "Video Call",
        "text": "Sir, I am Inspector Sharma from CBI Mumbai. Your Aadhaar has been used in a money laundering case. There is an arrest warrant against you. You are under digital arrest now — do not disconnect this video call and do not tell anyone. To prove your innocence, transfer all your funds to this government verification account immediately for RBI verification, it is fully refundable.",
    },
    {
        "title": "FedEx / Customs Parcel Scam",
        "channel": "Phone Call",
        "text": "This is customs department. A parcel in your name containing illegal drugs and fake passports has been seized. Your number is linked to narcotics. We are connecting you to Mumbai police cyber crime. You must pay a security deposit immediately or face non-bailable arrest within 2 hours.",
    },
    {
        "title": "Genuine bank reminder",
        "channel": "SMS",
        "text": "Dear customer, your credit card bill of Rs 4,500 is due on 25th. Please pay via the official app or visit your nearest branch. Never share your OTP or PIN with anyone, including bank staff.",
    },
    {
        "title": "KYC Update Phishing",
        "channel": "WhatsApp",
        "text": "Your bank account will be blocked today. Urgent KYC update required. Click this link and share the OTP you receive to verify immediately, otherwise account suspended.",
    },
]


def advisory_for(level: str, lang: str) -> str:
    lang = lang if lang in LANGUAGES else "en"
    block = VERDICT_ADVISORY.get(level, VERDICT_ADVISORY["LOW"])
    return block.get(lang) or block["en"]      # fall back to English if a translation is absent


def languages() -> list:
    """[{code, name}] for the 12 supported advisory languages."""
    return [{"code": c, "name": LANGUAGE_NAMES.get(c, c)} for c in LANGUAGES]
