
insert into public.site_settings (id, phone, whatsapp, email, address_en, address_hi, gst_number, social, video_url, tagline_en, tagline_hi, about_en, about_hi)
values (1, '+91 98765 43210', '919876543210', 'yatra@tirthdarshan.com',
 '2nd Floor, Shri Ram Complex, MI Road, Jaipur, Rajasthan 302001',
 'दूसरी मंज़िल, श्री राम कॉम्प्लेक्स, एमआई रोड, जयपुर, राजस्थान 302001',
 '08ABCDE1234F1Z5 (sample)',
 '{"facebook":"https://facebook.com","instagram":"https://instagram.com","youtube":"https://youtube.com"}',
 'https://www.youtube.com/embed/9aN0kG5Kqro',
 'A simple & sacred path to your pilgrimage', 'तीर्थ यात्रा का सरल और पावन मार्ग',
 'For over 15 years we have guided families, senior citizens and devotees to India''s holiest shrines with care, comfort and devotion. Pure-vegetarian meals, experienced tour managers and safe travel are our promise.',
 'पिछले 15 वर्षों से हम परिवारों, वरिष्ठ नागरिकों और श्रद्धालुओं को भारत के पवित्र तीर्थों की यात्रा सेवा, सुविधा और श्रद्धा के साथ करा रहे हैं। शुद्ध शाकाहारी भोजन, अनुभवी टूर मैनेजर और सुरक्षित यात्रा हमारा वादा है।');

insert into public.categories (slug, name_en, name_hi, icon, sort_order, image_url) values
('char-dham','Char Dham','चार धाम','mountain',1,'/images/kedarnath.jpg'),
('jyotirlinga','Jyotirlinga','ज्योतिर्लिंग','flame',2,'/images/varanasi.jpg'),
('shakti-peeth','Shakti Peeth / Devi Darshan','शक्ति पीठ / देवी दर्शन','sparkles',3,'/images/himalaya.jpg'),
('krishna-bhoomi','Krishna Bhoomi (Braj)','कृष्ण भूमि (ब्रज)','flower',4,'/images/vrindavan.jpg'),
('ram-path','Ram Path (Ayodhya)','राम पथ (अयोध्या)','landmark',5,'/images/varanasi.jpg'),
('south-india','South India Temples','दक्षिण भारत मंदिर','castle',6,'/images/south-temple.jpg'),
('himalayan','Himalayan Yatras','हिमालय यात्राएँ','mountain-snow',7,'/images/himalaya.jpg'),
('kumbh-mela','Kumbh & Mela','कुंभ और मेला','users',8,'/images/varanasi.jpg'),
('sikh','Sikh Yatras','सिख यात्राएँ','sun',9,'/images/golden-temple.jpg'),
('jain','Jain Tirth','जैन तीर्थ','hand',10,'/images/dwarka.jpg'),
('helicopter','Helicopter Yatras','हेलीकॉप्टर यात्राएँ','plane',11,'/images/kedarnath.jpg'),
('senior-special','Senior Citizen Special','वरिष्ठ नागरिक विशेष','heart-handshake',12,'/images/puri.jpg');

insert into public.destinations (slug, name_en, name_hi, state, image_url, sort_order, description_en, description_hi, best_time_en, best_time_hi, significance_en, significance_hi, how_to_reach_en, how_to_reach_hi, nearby_en, nearby_hi) values
('kedarnath','Kedarnath','केदारनाथ','Uttarakhand','/images/kedarnath.jpg',1,'One of the twelve Jyotirlingas, set at 3,583 m amid the Garhwal Himalayas.','गढ़वाल हिमालय में 3,583 मीटर पर स्थित बारह ज्योतिर्लिंगों में से एक।','May–June, Sept–Oct','मई–जून, सितंबर–अक्टूबर','Abode of Lord Shiva, part of the Char Dham and Panch Kedar.','भगवान शिव का धाम, चार धाम और पंच केदार का हिस्सा।','Drive to Gaurikund, then 16 km trek, pony, palki or helicopter.','गौरीकुंड तक सड़क, फिर 16 किमी पैदल, घोड़ा, पालकी या हेलीकॉप्टर।','Bhairavnath Temple, Vasuki Tal, Gandhi Sarovar','भैरवनाथ मंदिर, वासुकी ताल, गांधी सरोवर'),
('badrinath','Badrinath','बद्रीनाथ','Uttarakhand','/images/himalaya.jpg',2,'Sacred shrine of Lord Vishnu on the banks of the Alaknanda.','अलकनंदा तट पर भगवान विष्णु का पवित्र धाम।','May–Oct','मई–अक्टूबर','One of the four dhams established by Adi Shankaracharya.','आदि शंकराचार्य द्वारा स्थापित चार धामों में से एक।','Road from Rishikesh via Joshimath.','ऋषिकेश से जोशीमठ होते हुए सड़क मार्ग।','Mana Village, Vyas Gufa, Tapt Kund','माणा गाँव, व्यास गुफा, तप्त कुंड'),
('varanasi','Varanasi','वाराणसी','Uttar Pradesh','/images/varanasi.jpg',3,'The eternal city of Kashi on the Ganga, home of Kashi Vishwanath.','गंगा तट पर अविनाशी काशी नगरी, काशी विश्वनाथ का धाम।','Oct–Mar','अक्टूबर–मार्च','Moksha nagari and a Jyotirlinga.','मोक्ष नगरी और ज्योतिर्लिंग।','Train, flight or road; well connected.','रेल, हवाई या सड़क मार्ग से जुड़ा हुआ।','Sarnath, Ramnagar Fort','सारनाथ, रामनगर किला'),
('ayodhya','Ayodhya','अयोध्या','Uttar Pradesh','/images/varanasi.jpg',4,'Birthplace of Lord Ram with the grand Ram Mandir.','भगवान राम की जन्मभूमि और भव्य राम मंदिर।','Oct–Mar','अक्टूबर–मार्च','Sacred Saptapuri city.','पवित्र सप्तपुरी नगरी।','Airport and railway station in the city.','शहर में हवाई अड्डा और रेलवे स्टेशन।','Hanuman Garhi, Saryu Ghat','हनुमान गढ़ी, सरयू घाट'),
('vrindavan','Vrindavan','वृंदावन','Uttar Pradesh','/images/vrindavan.jpg',5,'Land of Krishna''s childhood leelas, filled with temples.','श्रीकृष्ण की बाल लीलाओं की भूमि, मंदिरों से भरी।','Oct–Mar, Holi','अक्टूबर–मार्च, होली','Heart of Braj bhoomi.','ब्रज भूमि का हृदय।','Via Mathura railway station.','मथुरा रेलवे स्टेशन होकर।','Mathura, Govardhan, Barsana','मथुरा, गोवर्धन, बरसाना'),
('rameswaram','Rameswaram','रामेश्वरम','Tamil Nadu','/images/south-temple.jpg',6,'Island temple town with the Ramanathaswamy Jyotirlinga.','रामनाथस्वामी ज्योतिर्लिंग वाला द्वीप नगर।','Oct–Apr','अक्टूबर–अप्रैल','One of the Char Dham of India.','भारत के चार धामों में से एक।','Train via Pamban bridge; nearest airport Madurai.','पंबन पुल से रेल; निकटतम हवाई अड्डा मदुरै।','Dhanushkodi, Agni Theertham','धनुषकोडी, अग्नि तीर्थम'),
('puri','Puri','पुरी','Odisha','/images/puri.jpg',7,'Seat of Lord Jagannath on the Bay of Bengal.','बंगाल की खाड़ी पर भगवान जगन्नाथ का धाम।','Oct–Mar, Rath Yatra','अक्टूबर–मार्च, रथ यात्रा','One of the Char Dham.','चार धामों में से एक।','Train to Puri; airport Bhubaneswar.','पुरी तक रेल; हवाई अड्डा भुवनेश्वर।','Konark, Chilika Lake','कोणार्क, चिल्का झील'),
('dwarka','Dwarka','द्वारका','Gujarat','/images/dwarka.jpg',8,'Krishna''s kingdom on the Arabian Sea.','अरब सागर तट पर श्रीकृष्ण की नगरी।','Oct–Mar','अक्टूबर–मार्च','One of the Char Dham and Saptapuri.','चार धाम और सप्तपुरी में से एक।','Train to Dwarka; airport Jamnagar.','द्वारका तक रेल; हवाई अड्डा जामनगर।','Bet Dwarka, Nageshwar','बेट द्वारका, नागेश्वर'),
('ujjain','Ujjain','उज्जैन','Madhya Pradesh','/images/varanasi.jpg',9,'City of Mahakaleshwar and the famous Bhasma Aarti.','महाकालेश्वर और प्रसिद्ध भस्म आरती की नगरी।','Oct–Mar','अक्टूबर–मार्च','Jyotirlinga and Kumbh city.','ज्योतिर्लिंग और कुंभ नगरी।','Train; airport Indore.','रेल; हवाई अड्डा इंदौर।','Omkareshwar, Kal Bhairav','ओंकारेश्वर, काल भैरव'),
('vaishno-devi','Vaishno Devi','वैष्णो देवी','Jammu & Kashmir','/images/himalaya.jpg',10,'Holy cave shrine of Mata in the Trikuta hills.','त्रिकूट पर्वत पर माता की पवित्र गुफा।','Mar–Oct','मार्च–अक्टूबर','Most visited Shakti shrine.','सबसे अधिक दर्शन वाला शक्ति धाम।','Train to Katra, 13 km trek or helicopter.','कटरा तक रेल, 13 किमी पैदल या हेलीकॉप्टर।','Bhairon Temple, Patnitop','भैरों मंदिर, पटनीटॉप'),
('tirupati','Tirupati','तिरुपति','Andhra Pradesh','/images/south-temple.jpg',11,'Abode of Lord Venkateswara on Tirumala hills.','तिरुमला पहाड़ियों पर भगवान वेंकटेश्वर का धाम।','Sept–Feb','सितंबर–फरवरी','Richest and most visited temple.','सबसे अधिक दर्शन वाला मंदिर।','Train or flight to Tirupati.','तिरुपति तक रेल या हवाई मार्ग।','Padmavathi Temple, Kapila Theertham','पद्मावती मंदिर, कपिल तीर्थम'),
('haridwar-rishikesh','Haridwar–Rishikesh','हरिद्वार–ऋषिकेश','Uttarakhand','/images/varanasi.jpg',12,'Gateway to the Himalayas with Har Ki Pauri aarti.','हर की पौड़ी आरती के साथ हिमालय का प्रवेश द्वार।','Sept–Apr','सितंबर–अप्रैल','Kumbh city and yoga capital.','कुंभ नगरी और योग राजधानी।','Train or road from Delhi.','दिल्ली से रेल या सड़क।','Laxman Jhula, Neelkanth','लक्ष्मण झूला, नीलकंठ');

create temp table seed_y (n int, slug text, te text, th text, days int, price numeric, orig numeric, img text, cats text[], dests text[], months int[], feat bool, offer bool, transport text[], diff text, senior bool, start_en text, start_hi text, status text);
insert into seed_y values
(1,'uttarakhand-char-dham-yatra','Uttarakhand Char Dham Yatra','उत्तराखंड चार धाम यात्रा',12,28001,37999,'/images/kedarnath.jpg','{char-dham,himalayan}','{kedarnath,badrinath,haridwar-rishikesh}','{5,6,9,10}',true,true,'{Bus}','moderate',true,'Haridwar','हरिद्वार','published'),
(2,'do-dham-yatra','Do Dham Yatra (Kedarnath + Badrinath)','दो धाम यात्रा (केदारनाथ + बद्रीनाथ)',7,16999,19999,'/images/himalaya.jpg','{char-dham,himalayan}','{kedarnath,badrinath}','{5,6,9}',true,false,'{Bus}','moderate',true,'Haridwar','हरिद्वार','published'),
(3,'char-dham-by-helicopter','Char Dham by Helicopter','हेलीकॉप्टर से चार धाम',6,195000,215000,'/images/kedarnath.jpg','{char-dham,helicopter}','{kedarnath,badrinath}','{5,6,10}',true,false,'{Helicopter}','easy',true,'Dehradun','देहरादून','published'),
(4,'teen-dham-11-jyotirlinga-yatra','Teen Dham & 11 Jyotirlinga Yatra','तीन धाम एवं 11 ज्योतिर्लिंग यात्रा',29,53001,59999,'/images/varanasi.jpg','{jyotirlinga,senior-special}','{puri,rameswaram,dwarka,ujjain,varanasi}','{1,2,11}',true,true,'{Train,Bus}','easy',true,'Delhi','दिल्ली','published'),
(5,'12-jyotirlinga-darshan-yatra','12 Jyotirlinga Darshan Yatra','12 ज्योतिर्लिंग दर्शन यात्रा',21,45999,52999,'/images/varanasi.jpg','{jyotirlinga}','{ujjain,varanasi,kedarnath,rameswaram}','{2,3,11}',true,false,'{Train,Bus}','easy',true,'Delhi','दिल्ली','published'),
(6,'kashi-prayagraj-ayodhya-yatra','Kashi – Prayagraj – Ayodhya Yatra','काशी – प्रयागराज – अयोध्या यात्रा',6,12999,15499,'/images/varanasi.jpg','{ram-path,senior-special}','{varanasi,ayodhya}','{1,2,3,10,11}',true,false,'{Train,Bus}','easy',true,'Varanasi','वाराणसी','published'),
(7,'braj-84-kos-parikrama','Braj 84 Kos Parikrama','ब्रज 84 कोस परिक्रमा',10,17999,22499,'/images/vrindavan.jpg','{krishna-bhoomi}','{vrindavan}','{3,10,11}',false,true,'{Bus}','moderate',false,'Mathura','मथुरा','published'),
(8,'himachal-nau-devi-darshan-kullu-manali','Himachal Nau Devi Darshan with Kullu-Manali','हिमाचल नौ देवी दर्शन कुल्लू-मनाली सहित',13,26001,35999,'/images/himalaya.jpg','{shakti-peeth,himalayan}','{vaishno-devi}','{4,5,9,10}',false,true,'{Bus}','moderate',false,'Delhi','दिल्ली','published'),
(9,'vaishno-devi-amritsar-golden-temple','Vaishno Devi with Amritsar Golden Temple','वैष्णो देवी एवं अमृतसर स्वर्ण मंदिर',6,11499,13499,'/images/golden-temple.jpg','{shakti-peeth,sikh}','{vaishno-devi}','{3,4,9,10}',false,false,'{Train,Bus}','moderate',true,'Delhi','दिल्ली','published'),
(10,'shri-amarnath-yatra','Shri Amarnath Yatra (via Baltal/Pahalgam)','श्री अमरनाथ यात्रा (बालटाल/पहलगाम होकर)',6,18999,21999,'/images/himalaya.jpg','{himalayan}','{}','{7,8}',false,false,'{Bus,Helicopter}','difficult',false,'Jammu','जम्मू','published'),
(11,'jagannath-puri-konark-gangasagar','Jagannath Puri – Konark – Gangasagar Yatra','जगन्नाथ पुरी – कोणार्क – गंगासागर यात्रा',8,15999,18499,'/images/puri.jpg','{char-dham,senior-special}','{puri}','{1,2,11,12}',true,false,'{Train,Bus}','easy',true,'Kolkata','कोलकाता','published'),
(12,'dakshin-bharat-darshan','Dakshin Bharat Darshan (Rameswaram, Madurai, Kanyakumari, Tirupati)','दक्षिण भारत दर्शन (रामेश्वरम, मदुरै, कन्याकुमारी, तिरुपति)',12,27999,32999,'/images/south-temple.jpg','{south-india,jyotirlinga}','{rameswaram,tirupati}','{1,2,11,12}',true,false,'{Train,Bus}','easy',true,'Chennai','चेन्नई','published'),
(13,'gujarat-dwarka-somnath-nageshwar','Gujarat Dwarka – Somnath – Nageshwar – Statue of Unity','गुजरात द्वारका – सोमनाथ – नागेश्वर – स्टैच्यू ऑफ यूनिटी',7,14999,17999,'/images/dwarka.jpg','{jyotirlinga,krishna-bhoomi}','{dwarka}','{1,2,10,12}',false,true,'{Train,Bus}','easy',true,'Ahmedabad','अहमदाबाद','published'),
(14,'ujjain-mahakal-omkareshwar-maheshwar','Ujjain Mahakal – Omkareshwar – Maheshwar','उज्जैन महाकाल – ओंकारेश्वर – महेश्वर',4,8999,10499,'/images/varanasi.jpg','{jyotirlinga,senior-special}','{ujjain}','{1,2,3,10,11,12}',false,false,'{Bus}','easy',true,'Indore','इंदौर','published'),
(15,'shirdi-shani-shingnapur-trimbakeshwar-nashik','Shirdi – Shani Shingnapur – Trimbakeshwar – Nashik','शिरडी – शनि शिंगणापुर – त्र्यंबकेश्वर – नासिक',5,10999,12999,'/images/south-temple.jpg','{jyotirlinga}','{}','{1,3,10,12}',false,false,'{Bus}','easy',true,'Mumbai','मुंबई','published'),
(16,'magh-mela-prayagraj-special','Magh Mela Prayagraj Special','माघ मेला प्रयागराज विशेष',4,9999,11999,'/images/varanasi.jpg','{kumbh-mela}','{varanasi}','{1}',false,false,'{Train,Bus}','easy',true,'Prayagraj','प्रयागराज','published'),
(17,'hemkund-sahib-valley-of-flowers','Hemkund Sahib & Valley of Flowers','हेमकुंड साहिब एवं फूलों की घाटी',7,17499,19999,'/images/himalaya.jpg','{sikh,himalayan}','{badrinath}','{7,8,9}',false,false,'{Bus}','difficult',false,'Rishikesh','ऋषिकेश','published'),
(18,'sammed-shikhar-ji-jain-tirth','Sammed Shikhar Ji Jain Tirth Yatra','सम्मेद शिखर जी जैन तीर्थ यात्रा',5,11999,13999,'/images/dwarka.jpg','{jain}','{}','{2,3,10,11}',false,false,'{Train,Bus}','moderate',false,'Kolkata','कोलकाता','published'),
(19,'kailash-mansarovar-draft','Kailash Mansarovar Yatra (Draft)','कैलाश मानसरोवर यात्रा (ड्राफ्ट)',14,165000,null,'/images/himalaya.jpg','{himalayan}','{}','{6}',false,false,'{Flight,Bus}','difficult',false,'Delhi','दिल्ली','draft'),
(20,'navratri-devi-special-draft','Navratri Devi Special (Draft)','नवरात्रि देवी विशेष (ड्राफ्ट)',8,19999,null,'/images/himalaya.jpg','{shakti-peeth}','{vaishno-devi}','{10}',false,false,'{Bus}','easy',true,'Delhi','दिल्ली','draft');

do $$
declare r record; yid uuid; d int; m int; i int; st date; dep_id uuid;
begin
  for r in select * from seed_y order by n loop
    insert into public.yatras (slug, title_en, title_hi, short_desc_en, short_desc_hi, overview_en, overview_hi, highlights_en, highlights_hi,
      starting_city_en, starting_city_hi, duration_days, duration_nights, transport, difficulty, senior_friendly, featured, offer, offer_ends_at,
      status, original_price, price, rating, review_count, popularity, cover_image, gst_percent, advance_type, advance_value, map_embed_url,
      meta_title_en, meta_title_hi, meta_desc_en, meta_desc_hi, is_sample, min_age)
    values (r.slug, r.te, r.th,
      'A comfortable, guided '||r.days||'-day pilgrimage with pure-veg meals and an experienced tour manager.',
      'शुद्ध शाकाहारी भोजन और अनुभवी टूर मैनेजर के साथ '||r.days||' दिन की आरामदायक, मार्गदर्शित तीर्थ यात्रा।',
      r.te||' takes you through some of India''s most sacred places. Our team handles hotels, transport, darshan arrangements and meals so that you can focus completely on devotion. Suitable for families and senior citizens, with a dedicated tour manager travelling with the group throughout.',
      r.th||' आपको भारत के सबसे पवित्र स्थलों के दर्शन कराती है। होटल, परिवहन, दर्शन व्यवस्था और भोजन की पूरी ज़िम्मेदारी हमारी टीम की है ताकि आप पूरी तरह भक्ति में मन लगा सकें। परिवारों और वरिष्ठ नागरिकों के लिए उपयुक्त, पूरी यात्रा में समर्पित टूर मैनेजर साथ रहते हैं।',
      array['Guided darshan at every shrine','Pure-vegetarian meals','Comfortable hotels / dharamshalas','24x7 tour manager'],
      array['हर तीर्थ पर मार्गदर्शित दर्शन','शुद्ध शाकाहारी भोजन','आरामदायक होटल / धर्मशाला','24x7 टूर मैनेजर'],
      r.start_en, r.start_hi, r.days, r.days-1, r.transport, r.diff, r.senior, r.feat, r.offer,
      case when r.offer then now() + interval '21 days' else null end,
      r.status::public.yatra_status, r.orig, r.price, 4.5 + (r.n % 5)/10.0, 20 + r.n*7, 100 - r.n, r.img, 5, 'fixed',
      case when r.price > 100000 then 25000 when r.price > 30000 then 10000 else 5000 end,
      'https://www.google.com/maps?q='||replace(r.start_en,' ','+')||'&output=embed',
      r.te||' | Tirth Darshan Yatra', r.th||' | तीर्थ दर्शन यात्रा',
      r.days||' days pilgrimage package with departures in 2027. Book online.', r.days||' दिन का तीर्थ यात्रा पैकेज, 2027 की प्रस्थान तिथियाँ। ऑनलाइन बुक करें।',
      true, case when r.diff='difficult' then 13 else null end)
    returning id into yid;

    insert into public.yatra_categories select yid, c.id from public.categories c where c.slug = any(r.cats);
    insert into public.yatra_destinations select yid, x.id from public.destinations x where x.slug = any(r.dests);

    insert into public.yatra_images (yatra_id, url, alt_en, alt_hi, sort_order) values
      (yid, r.img, r.te, r.th, 0), (yid, '/images/varanasi.jpg', 'Ganga aarti', 'गंगा आरती', 1), (yid, '/images/vrindavan.jpg', 'Temple courtyard', 'मंदिर प्रांगण', 2);

    for d in 1..r.days loop
      insert into public.yatra_itinerary_days (yatra_id, day_number, title_en, title_hi, description_en, description_hi, meals, overnight_en, overnight_hi)
      values (yid, d,
        case when d=1 then 'Arrival at '||r.start_en when d=r.days then 'Return to '||r.start_en else 'Darshan & sightseeing – Day '||d end,
        case when d=1 then r.start_hi||' आगमन' when d=r.days then r.start_hi||' वापसी' else 'दर्शन एवं भ्रमण – दिन '||d end,
        case when d=1 then 'Meet our tour manager at the reporting point, check in to the hotel, evening aarti and dinner.'
             when d=r.days then 'After breakfast, final darshan and drop at the railway station / airport with blessings.'
             else 'Early morning darshan, visit nearby sacred sites with our guide, rest in the afternoon and attend the evening aarti.' end,
        case when d=1 then 'रिपोर्टिंग स्थल पर टूर मैनेजर से मिलें, होटल में चेक-इन, शाम की आरती और रात्रि भोजन।'
             when d=r.days then 'नाश्ते के बाद अंतिम दर्शन और आशीर्वाद के साथ रेलवे स्टेशन / हवाई अड्डे पर छोड़ना।'
             else 'प्रातः दर्शन, गाइड के साथ आसपास के पवित्र स्थलों का भ्रमण, दोपहर विश्राम और शाम की आरती।' end,
        case when d=1 then array['D'] when d=r.days then array['B'] else array['B','L','D'] end,
        case when d=r.days then null else r.start_en||' region hotel' end,
        case when d=r.days then null else r.start_hi||' क्षेत्र होटल' end);
    end loop;

    insert into public.yatra_pricing values (yid, r.price, round(r.price*1.08), round(r.price*1.18), round(r.price*1.45), round(r.price*0.75), 2500);

    insert into public.yatra_pickup_cities (yatra_id, city_en, city_hi, extra_charge, reporting_time, reporting_place_en, reporting_place_hi, sort_order) values
      (yid, r.start_en, r.start_hi, 0, '07:00 AM', 'Main railway station', 'मुख्य रेलवे स्टेशन', 0),
      (yid, 'Delhi', 'दिल्ली', case when r.start_en='Delhi' then 0 else 2500 end, '06:00 AM', 'Kashmere Gate ISBT', 'कश्मीरी गेट ISBT', 1),
      (yid, 'Jaipur', 'जयपुर', 3000, '05:30 AM', 'Sindhi Camp', 'सिंधी कैंप', 2),
      (yid, 'Ahmedabad', 'अहमदाबाद', 4500, '06:00 AM', 'Kalupur station', 'कालूपुर स्टेशन', 3),
      (yid, 'Lucknow', 'लखनऊ', 3500, '06:00 AM', 'Charbagh station', 'चारबाग स्टेशन', 4);

    insert into public.yatra_addons (yatra_id, name_en, name_hi, price, per_person, sort_order) values
      (yid, 'AC upgrade', 'एसी अपग्रेड', 2500, true, 1),
      (yid, 'Extra night hotel', 'अतिरिक्त रात्रि होटल', 2200, false, 2);
    if 'himalayan' = any(r.cats) or 'char-dham' = any(r.cats) then
      insert into public.yatra_addons (yatra_id, name_en, name_hi, price, per_person, sort_order) values
        (yid, 'Helicopter (Kedarnath)', 'हेलीकॉप्टर (केदारनाथ)', 7500, true, 3),
        (yid, 'Pony / Palki', 'घोड़ा / पालकी', 4500, true, 4);
    end if;

    insert into public.yatra_list_items (yatra_id, kind, text_en, text_hi, sort_order) values
      (yid,'inclusion','Accommodation on twin/triple sharing','ट्विन/ट्रिपल शेयरिंग पर आवास',1),
      (yid,'inclusion','Pure-veg breakfast and dinner','शुद्ध शाकाहारी नाश्ता और रात्रि भोजन',2),
      (yid,'inclusion','All transfers & sightseeing by AC/Non-AC vehicle','एसी/नॉन-एसी वाहन से सभी ट्रांसफर व भ्रमण',3),
      (yid,'inclusion','Tour manager and darshan assistance','टूर मैनेजर और दर्शन सहायता',4),
      (yid,'exclusion','Train / air fare to starting city','प्रारंभिक शहर तक रेल / हवाई किराया',1),
      (yid,'exclusion','Pony, palki, helicopter unless added','घोड़ा, पालकी, हेलीकॉप्टर (जब तक जोड़ा न जाए)',2),
      (yid,'exclusion','Personal expenses, donations and VIP darshan','व्यक्तिगत खर्च, दान और वीआईपी दर्शन',3),
      (yid,'carry','Original photo ID (Aadhaar)','मूल फोटो पहचान पत्र (आधार)',1),
      (yid,'carry','Warm clothes, rain jacket and comfortable shoes','गर्म कपड़े, रेनकोट और आरामदायक जूते',2),
      (yid,'carry','Personal medicines','व्यक्तिगत दवाइयाँ',3),
      (yid,'note','Yatra registration is mandatory where applicable','जहाँ लागू हो वहाँ यात्रा पंजीकरण अनिवार्य है',1),
      (yid,'note','Itinerary may change due to weather or road conditions','मौसम या सड़क की स्थिति के कारण कार्यक्रम बदल सकता है',2);
    if r.slug = 'shri-amarnath-yatra' then
      insert into public.yatra_list_items (yatra_id, kind, text_en, text_hi, sort_order) values
        (yid,'note','Shri Amarnath Yatra registration and Compulsory Health Certificate are mandatory','श्री अमरनाथ यात्रा पंजीकरण और अनिवार्य स्वास्थ्य प्रमाणपत्र ज़रूरी है',0);
    end if;

    insert into public.yatra_faqs (yatra_id, question_en, question_hi, answer_en, answer_hi, sort_order) values
      (yid,'Is this yatra suitable for senior citizens?','क्या यह यात्रा वरिष्ठ नागरिकों के लिए उपयुक्त है?','Yes, our tour manager assists elders throughout. Pony/palki can be added for long walks.','हाँ, टूर मैनेजर पूरी यात्रा में बुज़ुर्गों की सहायता करते हैं। लंबी पैदल दूरी के लिए घोड़ा/पालकी जोड़ी जा सकती है।',1),
      (yid,'What food is provided?','भोजन कैसा मिलता है?','Only pure-vegetarian, satvik meals. Jain food on request.','केवल शुद्ध शाकाहारी, सात्विक भोजन। अनुरोध पर जैन भोजन।',2),
      (yid,'How much advance is required?','कितनी अग्रिम राशि देनी होगी?','A token advance per person confirms your seat; the balance is due 15 days before departure.','प्रति व्यक्ति टोकन राशि से सीट पक्की होती है; शेष राशि प्रस्थान से 15 दिन पहले देनी होती है।',3);

    i := 0;
    foreach m in array r.months loop
      i := i + 1;
      exit when i > 4;
      st := make_date(2027, m, 1 + ((r.n * 3 + i * 5) % 25));
      insert into public.departures (yatra_id, start_date, end_date, total_seats, booked_seats, status)
      values (yid, st, st + (r.days - 1), 40, case when i = 1 then 34 - (r.n % 6) when i = 2 then 18 else 6 end,
        case when i = 1 then 'filling_fast'::public.departure_status else 'available'::public.departure_status end);
    end loop;

    insert into public.reviews (yatra_id, name, city, rating, comment, status) values
      (yid,'Ramesh Sharma','Jaipur',5,'Very well organised, food was excellent and the tour manager took great care of my parents.','approved'),
      (yid,'Sunita Patel','Ahmedabad',4,'Peaceful darshan and good hotels. Would travel again.','approved');
  end loop;
end $$;

insert into public.testimonials (name, city_en, city_hi, yatra_en, yatra_hi, quote_en, quote_hi, rating, sort_order, is_sample) values
('Ramesh & Kamla Sharma','Jaipur','जयपुर','Char Dham Yatra','चार धाम यात्रा','At our age we were worried about Kedarnath, but the team arranged everything – palki, warm rooms, hot food. Jai Kedar!','इस उम्र में केदारनाथ की चिंता थी, पर टीम ने सब व्यवस्था की – पालकी, गर्म कमरे, गरम भोजन। जय केदार!',5,1,true),
('Sunita Patel','Ahmedabad','अहमदाबाद','Dakshin Bharat Darshan','दक्षिण भारत दर्शन','Perfectly planned darshan at Rameswaram and Tirupati without long waits.','रामेश्वरम और तिरुपति में बिना लंबी प्रतीक्षा के बढ़िया दर्शन।',5,2,true),
('Vikas Gupta','Lucknow','लखनऊ','Kashi – Ayodhya','काशी – अयोध्या','Ganga aarti from the boat was unforgettable. Great value for money.','नाव से गंगा आरती अविस्मरणीय थी। पैसा वसूल यात्रा।',5,3,true),
('Meena Agarwal','Indore','इंदौर','12 Jyotirlinga','12 ज्योतिर्लिंग','21 days felt like family. Pure satvik food every day.','21 दिन परिवार जैसा लगा। रोज़ शुद्ध सात्विक भोजन।',5,4,true),
('Harpreet Singh','Delhi','दिल्ली','Hemkund Sahib','हेमकुंड साहिब','Well-managed trek with good guides and medical kit.','अच्छे गाइड और मेडिकल किट के साथ सुव्यवस्थित ट्रेक।',4,5,true),
('Rajesh Jain','Kolkata','कोलकाता','Sammed Shikhar Ji','सम्मेद शिखर जी','Jain food and dolis arranged exactly as promised.','जैन भोजन और डोली ठीक वादे के अनुसार।',5,6,true);

insert into public.blog_posts (slug, title_en, title_hi, excerpt_en, excerpt_hi, content_en, content_hi, cover_image, category, author, published_at, is_published, is_sample) values
('char-dham-yatra-2027-complete-guide','Char Dham Yatra 2027: Complete Guide','चार धाम यात्रा 2027: संपूर्ण गाइड','Opening dates, registration, route and budget for Char Dham 2027.','चार धाम 2027 की कपाट तिथियाँ, पंजीकरण, मार्ग और बजट।','The Char Dham of Uttarakhand – Yamunotri, Gangotri, Kedarnath and Badrinath – usually open in late April or May. Register online on the Uttarakhand tourism portal, carry Aadhaar, and plan 10–12 days. Best months are May–June and September–October. Pack woollens even in summer.','उत्तराखंड के चार धाम – यमुनोत्री, गंगोत्री, केदारनाथ और बद्रीनाथ – आमतौर पर अप्रैल अंत या मई में खुलते हैं। उत्तराखंड पर्यटन पोर्टल पर ऑनलाइन पंजीकरण करें, आधार साथ रखें और 10–12 दिन की योजना बनाएँ। सबसे अच्छे महीने मई–जून और सितंबर–अक्टूबर हैं। गर्मी में भी ऊनी कपड़े रखें।','/images/kedarnath.jpg','Guides','Team Tirth Darshan', now() - interval '20 days', true, true),
('best-time-for-amarnath-yatra','Best Time for Amarnath Yatra','अमरनाथ यात्रा का सबसे अच्छा समय','When to go, which route to choose and what documents you need.','कब जाएँ, कौन सा मार्ग चुनें और कौन से दस्तावेज़ चाहिए।','Amarnath Yatra runs in July–August. Baltal is shorter but steep; Pahalgam is longer and gentler. Registration and a Compulsory Health Certificate are mandatory.','अमरनाथ यात्रा जुलाई–अगस्त में होती है। बालटाल छोटा पर खड़ी चढ़ाई वाला है; पहलगाम लंबा पर आसान है। पंजीकरण और अनिवार्य स्वास्थ्य प्रमाणपत्र ज़रूरी हैं।','/images/himalaya.jpg','Guides','Team Tirth Darshan', now() - interval '15 days', true, true),
('senior-citizen-tips-himalayan-yatras','Senior Citizen Tips for Himalayan Yatras','हिमालय यात्राओं के लिए वरिष्ठ नागरिक सुझाव','Health checks, acclimatisation and packing tips for elders.','बुज़ुर्गों के लिए स्वास्थ्य जाँच, अनुकूलन और सामान सुझाव।','Get a medical check-up, walk daily for a month before the trip, take rest days, keep medicines handy and choose pony or palki for steep climbs.','यात्रा से पहले मेडिकल जाँच कराएँ, एक महीना रोज़ टहलें, विश्राम दिवस रखें, दवाइयाँ साथ रखें और खड़ी चढ़ाई के लिए घोड़ा या पालकी चुनें।','/images/himalaya.jpg','Tips','Team Tirth Darshan', now() - interval '10 days', true, true),
('12-jyotirlinga-list-and-route','12 Jyotirlingas: List and Best Route','12 ज्योतिर्लिंग: सूची और सर्वश्रेष्ठ मार्ग','All twelve Jyotirlingas and how to cover them in one journey.','सभी बारह ज्योतिर्लिंग और उन्हें एक यात्रा में कैसे करें।','Somnath, Mallikarjuna, Mahakaleshwar, Omkareshwar, Kedarnath, Bhimashankar, Kashi Vishwanath, Trimbakeshwar, Vaidyanath, Nageshwar, Rameswaram and Grishneshwar.','सोमनाथ, मल्लिकार्जुन, महाकालेश्वर, ओंकारेश्वर, केदारनाथ, भीमाशंकर, काशी विश्वनाथ, त्र्यंबकेश्वर, वैद्यनाथ, नागेश्वर, रामेश्वरम और घृष्णेश्वर।','/images/varanasi.jpg','Guides','Team Tirth Darshan', now() - interval '7 days', true, true),
('ayodhya-ram-mandir-darshan-guide','Ayodhya Ram Mandir Darshan Guide','अयोध्या राम मंदिर दर्शन गाइड','Timings, aarti passes and nearby temples.','समय, आरती पास और आसपास के मंदिर।','Darshan runs from early morning to night. Book aarti passes online, avoid weekends, and also visit Hanuman Garhi and Saryu Ghat.','दर्शन सुबह से रात तक होते हैं। आरती पास ऑनलाइन बुक करें, सप्ताहांत से बचें और हनुमान गढ़ी व सरयू घाट भी जाएँ।','/images/varanasi.jpg','Guides','Team Tirth Darshan', now() - interval '4 days', true, true),
('what-to-pack-for-a-pilgrimage','What to Pack for a Pilgrimage','तीर्थ यात्रा के लिए क्या पैक करें','A simple checklist for any yatra.','किसी भी यात्रा के लिए आसान सूची।','ID proof, medicines, a light shawl, comfortable footwear, a small puja kit, a water bottle and a power bank.','पहचान पत्र, दवाइयाँ, हल्की शॉल, आरामदायक जूते, छोटी पूजा किट, पानी की बोतल और पावर बैंक।','/images/vrindavan.jpg','Tips','Team Tirth Darshan', now() - interval '2 days', true, true);

insert into public.faqs (group_en, group_hi, question_en, question_hi, answer_en, answer_hi, sort_order) values
('Booking','बुकिंग','How do I book a yatra?','यात्रा कैसे बुक करें?','Choose a yatra and date, fill traveller details and pay the token advance online, or call us.','यात्रा और तिथि चुनें, यात्री विवरण भरें और टोकन राशि ऑनलाइन दें, या हमें कॉल करें।',1),
('Booking','बुकिंग','Can I pay the balance later?','क्या शेष राशि बाद में दे सकते हैं?','Yes, the balance is due 15 days before departure.','हाँ, शेष राशि प्रस्थान से 15 दिन पहले देनी होती है।',2),
('Booking','बुकिंग','Which payment methods are accepted?','कौन से भुगतान माध्यम स्वीकार हैं?','UPI, debit/credit cards, net banking and wallets.','यूपीआई, डेबिट/क्रेडिट कार्ड, नेट बैंकिंग और वॉलेट।',3),
('Booking','बुकिंग','Do you give group discounts?','क्या समूह छूट मिलती है?','Yes, groups of 15+ get special rates. Use code GROUP15.','हाँ, 15+ के समूह को विशेष दर मिलती है। कोड GROUP15 का उपयोग करें।',4),
('Booking','बुकिंग','Is there a senior citizen discount?','क्या वरिष्ठ नागरिक छूट है?','Yes, 10% with code SENIOR10 for travellers aged 60+.','हाँ, 60+ आयु के यात्रियों के लिए कोड SENIOR10 से 10% छूट।',5),
('Travel','यात्रा','Is food pure vegetarian?','क्या भोजन शुद्ध शाकाहारी है?','Yes, all meals are pure-veg and satvik. Jain food available.','हाँ, सारा भोजन शुद्ध शाकाहारी और सात्विक है। जैन भोजन उपलब्ध।',6),
('Travel','यात्रा','Will a tour manager travel with us?','क्या टूर मैनेजर साथ रहेंगे?','Yes, a tour manager is with the group 24x7.','हाँ, टूर मैनेजर 24x7 समूह के साथ रहते हैं।',7),
('Travel','यात्रा','What type of transport is used?','कौन सा वाहन उपयोग होता है?','AC/Non-AC buses, tempo travellers or trains depending on the yatra.','यात्रा के अनुसार एसी/नॉन-एसी बस, टेम्पो ट्रैवलर या रेल।',8),
('Travel','यात्रा','Are hotels comfortable for elders?','क्या होटल बुज़ुर्गों के लिए आरामदायक हैं?','We choose ground-floor or lift rooms for senior citizens wherever possible.','जहाँ संभव हो, वरिष्ठ नागरिकों के लिए भूतल या लिफ्ट वाले कमरे।',9),
('Travel','यात्रा','Do I need a medical certificate?','क्या मेडिकल प्रमाणपत्र चाहिए?','Required for Amarnath and recommended for high-altitude yatras.','अमरनाथ के लिए आवश्यक और ऊँचाई वाली यात्राओं के लिए अनुशंसित।',10),
('Cancellation','रद्दीकरण','What is the cancellation policy?','रद्दीकरण नीति क्या है?','30+ days before: 90% refund; 15–30 days: 50%; under 15 days: no refund.','30+ दिन पहले: 90% वापसी; 15–30 दिन: 50%; 15 दिन से कम: कोई वापसी नहीं।',11),
('Cancellation','रद्दीकरण','How long do refunds take?','रिफंड में कितना समय लगता है?','5–7 working days to the original payment method.','मूल भुगतान माध्यम में 5–7 कार्य दिवस।',12),
('Cancellation','रद्दीकरण','Can I change my departure date?','क्या प्रस्थान तिथि बदल सकते हैं?','Yes, free once if requested 30 days before, subject to availability.','हाँ, 30 दिन पहले अनुरोध पर एक बार निःशुल्क, उपलब्धता अनुसार।',13),
('General','सामान्य','Are you GST registered?','क्या आप जीएसटी पंजीकृत हैं?','Yes, a GST invoice is issued for every booking.','हाँ, हर बुकिंग पर जीएसटी इनवॉइस दिया जाता है।',14),
('General','सामान्य','Where is your office?','आपका कार्यालय कहाँ है?','Jaipur, with representatives across Rajasthan, UP, Gujarat, MP and Delhi NCR.','जयपुर, और राजस्थान, यूपी, गुजरात, एमपी व दिल्ली एनसीआर में प्रतिनिधि।',15);

insert into public.representatives (name, region_en, region_hi, city, phone, whatsapp, sort_order) values
('Mahesh Joshi','Rajasthan','राजस्थान','Jaipur','+91 98290 11111','919829011111',1),
('Anil Tiwari','Uttar Pradesh','उत्तर प्रदेश','Lucknow','+91 94150 22222','919415022222',2),
('Kiran Shah','Gujarat','गुजरात','Ahmedabad','+91 98250 33333','919825033333',3),
('Pradeep Verma','Madhya Pradesh','मध्य प्रदेश','Indore','+91 98260 44444','919826044444',4),
('Neha Malhotra','Delhi NCR','दिल्ली एनसीआर','New Delhi','+91 98110 55555','919811055555',5);

insert into public.team_members (name, role_en, role_hi, bio_en, bio_hi, sort_order) values
('Shri Govind Sharma','Founder & Director','संस्थापक एवं निदेशक','Led more than 300 yatras over 15 years.','15 वर्षों में 300 से अधिक यात्राओं का नेतृत्व।',1),
('Pooja Mishra','Operations Head','संचालन प्रमुख','Plans every itinerary with care for elders.','बुज़ुर्गों का ध्यान रखते हुए हर कार्यक्रम बनाती हैं।',2),
('Ravi Negi','Senior Tour Manager (Himalayas)','वरिष्ठ टूर मैनेजर (हिमालय)','Born in Garhwal; 80+ Char Dham trips.','गढ़वाल निवासी; 80+ चार धाम यात्राएँ।',3),
('Lakshmi Iyer','Tour Manager (South India)','टूर मैनेजर (दक्षिण भारत)','Speaks Hindi, Tamil and Telugu.','हिंदी, तमिल और तेलुगु बोलती हैं।',4);

insert into public.banners (title_en, title_hi, subtitle_en, subtitle_hi, image_url, cta_link, sort_order) values
('A simple & sacred path to your pilgrimage','तीर्थ यात्रा का सरल और पावन मार्ग','Char Dham Yatra 2027 – bookings open','चार धाम यात्रा 2027 – बुकिंग शुरू','/images/kedarnath.jpg','/yatras/uttarakhand-char-dham-yatra',1),
('A simple & sacred path to your pilgrimage','तीर्थ यात्रा का सरल और पावन मार्ग','Kashi Vishwanath & Ganga Aarti','काशी विश्वनाथ एवं गंगा आरती','/images/varanasi.jpg','/yatras/kashi-prayagraj-ayodhya-yatra',2),
('A simple & sacred path to your pilgrimage','तीर्थ यात्रा का सरल और पावन मार्ग','Rameswaram & South India Darshan','रामेश्वरम एवं दक्षिण भारत दर्शन','/images/south-temple.jpg','/yatras/dakshin-bharat-darshan',3);

insert into public.gallery_images (url, caption_en, caption_hi, sort_order) values
('/images/kedarnath.jpg','Kedarnath at sunrise','सूर्योदय पर केदारनाथ',1),
('/images/varanasi.jpg','Ganga aarti, Varanasi','गंगा आरती, वाराणसी',2),
('/images/south-temple.jpg','Temple gopuram, Madurai','मंदिर गोपुरम, मदुरै',3),
('/images/vrindavan.jpg','Vrindavan temple','वृंदावन मंदिर',4),
('/images/golden-temple.jpg','Golden Temple, Amritsar','स्वर्ण मंदिर, अमृतसर',5),
('/images/puri.jpg','Jagannath Puri','जगन्नाथ पुरी',6),
('/images/dwarka.jpg','Dwarkadhish at sunset','सूर्यास्त पर द्वारकाधीश',7),
('/images/himalaya.jpg','Trek to the shrine','धाम की ओर पैदल यात्रा',8);

insert into public.coupons (code, description_en, description_hi, discount_type, value, min_amount, valid_from, valid_to, usage_limit, per_user_limit) values
('SENIOR10','10% off for senior citizens','वरिष्ठ नागरिकों के लिए 10% छूट','percent',10,5000,'2026-01-01','2027-12-31',500,2),
('EARLYBIRD','₹2,000 off on early bookings','जल्दी बुकिंग पर ₹2,000 छूट','flat',2000,15000,'2026-01-01','2027-03-31',300,1),
('GROUP15','15% off for groups','समूह के लिए 15% छूट','percent',15,100000,'2026-01-01','2027-12-31',100,1);

insert into public.enquiries (name, mobile, email, yatra_interest, preferred_month, message, source, status, is_sample) values
('Suresh Kumar','9876500001','suresh@example.com','Char Dham Yatra','May','Need 4 seats for parents','home','new',true),
('Anita Desai','9876500002',null,'Dakshin Bharat Darshan','January',null,'contact','contacted',true),
('Mohan Lal','9876500003',null,'12 Jyotirlinga','February','Senior citizen, need lower berth','trip','new',true),
('Priya Singh','9876500004','priya@example.com','Vaishno Devi','October',null,'callback','converted',true),
('Deepak Yadav','9876500005',null,'Kashi – Ayodhya','November','Group of 20','home','new',true),
('Kavita Rao','9876500006',null,'Amarnath Yatra','July','Medical certificate help','trip','contacted',true),
('Gopal Mehta','9876500007',null,'Dwarka Somnath','December',null,'home','closed',true),
('Rekha Jain','9876500008','rekha@example.com','Sammed Shikhar Ji','March','Jain food required','contact','new',true);

do $$
declare dep record; k int := 0; bid uuid; st public.booking_status; tot numeric;
begin
  for dep in select d.id, d.yatra_id, y.price from public.departures d join public.yatras y on y.id = d.yatra_id where y.status='published' order by d.start_date limit 10 loop
    k := k + 1;
    st := (array['confirmed','partially_paid','pending_payment','confirmed','partially_paid','confirmed','cancelled','confirmed','pending_payment','partially_paid'])[k]::public.booking_status;
    tot := round(dep.price * 2 * 1.05);
    insert into public.bookings (booking_code, yatra_id, departure_id, adults, sharing, contact, base_amount, gst_amount, total_amount, amount_paid, status, payment_option, consent, is_sample)
    values (public.next_booking_code(), dep.yatra_id, dep.id, 2, 'twin',
      jsonb_build_object('name', (array['Ramesh Sharma','Sunita Patel','Vikas Gupta','Meena Agarwal','Harpreet Singh','Rajesh Jain','Kamla Devi','Arvind Mishra','Geeta Rani','Sanjay Verma'])[k], 'mobile', '98765000'||lpad(k::text,2,'0'), 'email', 'sample'||k||'@example.com'),
      dep.price*2, round(dep.price*2*0.05), tot,
      case st when 'confirmed' then tot when 'partially_paid' then 10000 else 0 end, st, case when st='pending_payment' then 'pay_later' else 'token' end, true, true)
    returning id into bid;
    insert into public.booking_travellers (booking_id, full_name, age, gender, id_type, id_last4, meal_pref) values
      (bid, (array['Ramesh Sharma','Sunita Patel','Vikas Gupta','Meena Agarwal','Harpreet Singh','Rajesh Jain','Kamla Devi','Arvind Mishra','Geeta Rani','Sanjay Verma'])[k], 62, 'male', 'aadhaar', lpad((1000+k)::text,4,'0'), 'veg'),
      (bid, 'Spouse', 58, 'female', 'aadhaar', lpad((2000+k)::text,4,'0'), 'veg');
    if st in ('confirmed','partially_paid') then
      insert into public.payments (booking_id, amount, method, status, notes) values (bid, case st when 'confirmed' then tot else 10000 end, 'upi', 'captured', 'sample');
    end if;
  end loop;
end $$;
