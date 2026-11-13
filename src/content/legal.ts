type Doc = { title: string; sections: [string, string][] };
export const LEGAL: Record<"privacy" | "terms" | "cancellation", { en: Doc; hi: Doc }> = {
  privacy: {
    en: { title: "Privacy Policy", sections: [
      ["Information we collect", "Name, mobile number, email, address, age, gender, ID proof details and any medical information you share for a booking, plus enquiry form submissions."],
      ["How we use it", "Only to arrange your yatra: hotel and transport bookings, temple registrations, insurance, emergency contact and sending booking updates. We never sell your data."],
      ["ID proof and medical data", "ID numbers are stored encrypted and only the last 4 digits are shown. Full ID numbers and medical details are visible only to senior administrators preparing the traveller manifest."],
      ["Payments", "Online payments are processed by Razorpay. We do not store card or UPI credentials."],
      ["Your rights", "You can ask us to correct or delete your personal data by writing to our support email. Booking records required by tax law are retained for the legal period."],
    ] },
    hi: { title: "गोपनीयता नीति", sections: [
      ["हम कौन सी जानकारी लेते हैं", "बुकिंग के लिए आपका नाम, मोबाइल नंबर, ईमेल, पता, आयु, लिंग, पहचान पत्र विवरण और आपके द्वारा दी गई कोई भी चिकित्सा जानकारी, साथ ही पूछताछ फ़ॉर्म की जानकारी।"],
      ["हम इसका उपयोग कैसे करते हैं", "केवल आपकी यात्रा की व्यवस्था के लिए: होटल और वाहन बुकिंग, मंदिर पंजीकरण, बीमा, आपातकालीन संपर्क और बुकिंग अपडेट। हम आपकी जानकारी कभी नहीं बेचते।"],
      ["पहचान पत्र और चिकित्सा जानकारी", "पहचान संख्या एन्क्रिप्ट करके रखी जाती है और केवल अंतिम 4 अंक दिखते हैं। पूरी पहचान संख्या और चिकित्सा जानकारी केवल वरिष्ठ प्रशासक यात्री सूची बनाते समय देख सकते हैं।"],
      ["भुगतान", "ऑनलाइन भुगतान Razorpay द्वारा होता है। हम कार्ड या यूपीआई विवरण संग्रहीत नहीं करते।"],
      ["आपके अधिकार", "आप हमारे सहायता ईमेल पर लिखकर अपनी जानकारी सुधारने या हटाने का अनुरोध कर सकते हैं। कर कानून के अनुसार आवश्यक बुकिंग रिकॉर्ड निर्धारित अवधि तक रखे जाते हैं।"],
    ] },
  },
  terms: {
    en: { title: "Terms & Conditions", sections: [
      ["Booking", "A booking is confirmed only after the token advance is received. The balance must be paid 15 days before departure, failing which the seat may be released."],
      ["Prices", "Prices are per person and subject to GST as shown at checkout. Prices may change due to fuel, government taxes or hotel rates before full payment."],
      ["Itinerary changes", "Itineraries may change due to weather, landslides, government orders or temple timings. We will offer the best possible alternative; extra costs from such events are borne by travellers."],
      ["Health and fitness", "Travellers must be medically fit for high-altitude yatras. A medical certificate is mandatory where required by authorities (e.g. Amarnath)."],
      ["Conduct", "Consumption of alcohol, non-vegetarian food or tobacco is not permitted during the yatra. The tour manager may exclude anyone endangering the group."],
      ["Liability", "We act as an agent for hotels, transporters and airlines and are not liable for their deficiencies, delays or force majeure events."],
    ] },
    hi: { title: "नियम एवं शर्तें", sections: [
      ["बुकिंग", "टोकन राशि मिलने के बाद ही बुकिंग पक्की होती है। शेष राशि प्रस्थान से 15 दिन पहले देनी होगी, अन्यथा सीट रद्द की जा सकती है।"],
      ["मूल्य", "मूल्य प्रति व्यक्ति हैं और चेकआउट पर दिखाए गए जीएसटी के अधीन हैं। पूर्ण भुगतान से पहले ईंधन, सरकारी कर या होटल दरों के कारण मूल्य बदल सकते हैं।"],
      ["कार्यक्रम में बदलाव", "मौसम, भूस्खलन, सरकारी आदेश या मंदिर समय के कारण कार्यक्रम बदल सकता है। हम सर्वोत्तम विकल्प देंगे; ऐसी परिस्थितियों का अतिरिक्त खर्च यात्रियों को वहन करना होगा।"],
      ["स्वास्थ्य", "ऊँचाई वाली यात्राओं के लिए यात्री चिकित्सकीय रूप से स्वस्थ होने चाहिए। जहाँ अधिकारी माँगें (जैसे अमरनाथ), वहाँ मेडिकल प्रमाणपत्र अनिवार्य है।"],
      ["आचरण", "यात्रा के दौरान शराब, मांसाहार या तंबाकू वर्जित है। समूह को खतरे में डालने वाले व्यक्ति को टूर मैनेजर यात्रा से अलग कर सकते हैं।"],
      ["दायित्व", "हम होटल, वाहन और एयरलाइन के एजेंट के रूप में कार्य करते हैं और उनकी कमियों, देरी या अप्रत्याशित घटनाओं के लिए उत्तरदायी नहीं हैं।"],
    ] },
  },
  cancellation: {
    en: { title: "Cancellation & Refund Policy", sections: [
      ["Cancellation by traveller", "30 or more days before departure: 90% refund. 15–30 days before: 50% refund. Less than 15 days or no-show: no refund. Some yatras have their own slabs, shown on the yatra page."],
      ["How to cancel", "Request cancellation from My Bookings or call us. The refund amount is calculated automatically from the slab on the day we receive your request."],
      ["Refund timeline", "Refunds are processed to the original payment method within 5–7 working days of approval."],
      ["Non-refundable items", "Helicopter tickets, train/air tickets and special darshan passes booked on your behalf are refunded only as per the provider's rules."],
      ["Cancellation by us", "If we cancel a departure, you may choose a full refund or move to another date at no extra cost."],
    ] },
    hi: { title: "रद्दीकरण एवं रिफंड नीति", sections: [
      ["यात्री द्वारा रद्दीकरण", "प्रस्थान से 30 या अधिक दिन पहले: 90% वापसी। 15–30 दिन पहले: 50% वापसी। 15 दिन से कम या न आने पर: कोई वापसी नहीं। कुछ यात्राओं के अपने नियम हैं जो यात्रा पेज पर दिखाए जाते हैं।"],
      ["कैसे रद्द करें", "मेरी बुकिंग से रद्दीकरण का अनुरोध करें या हमें कॉल करें। अनुरोध मिलने के दिन के नियम के अनुसार वापसी राशि अपने आप तय होती है।"],
      ["रिफंड समय", "स्वीकृति के 5–7 कार्य दिवसों में मूल भुगतान माध्यम में रिफंड भेजा जाता है।"],
      ["वापसी योग्य नहीं", "आपकी ओर से बुक किए गए हेलीकॉप्टर, रेल/हवाई टिकट और विशेष दर्शन पास की वापसी संबंधित संस्था के नियमों के अनुसार ही होगी।"],
      ["हमारे द्वारा रद्दीकरण", "यदि हम कोई प्रस्थान रद्द करते हैं, तो आप पूरी राशि वापस ले सकते हैं या बिना अतिरिक्त शुल्क दूसरी तिथि चुन सकते हैं।"],
    ] },
  },
};
