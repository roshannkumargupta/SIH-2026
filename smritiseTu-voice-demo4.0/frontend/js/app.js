(() => {
  const q = s => document.querySelector(s);
  const data = DEMO_DATA;

  // UI copy for all 7 languages
  const copy = {
    en:  { title:'Your helpful day, made simple.', lang:'Language', welcome:'Hello! What would you like to do?', copy:'Choose a card, or use the Voice Assistant to speak naturally.', games:'Games', gamesSub:'A little activity for your mind', rem:"Today's Reminders", remSub:'Your gentle plan for today', try:'Try typing a command', tryCopy:'Useful if microphone permission is not available.', send:'Send', ready:'Ready when you are. Press the microphone to speak.', voice:'Voice Assistant', help:'Things you can say', selected:'Voice selected', input:'e.g. What should I do today?', open:'Open', readAloud:'Read Aloud' },
    hi:  { title:'आपका दिन, आसान तरीके से।', lang:'भाषा', welcome:'नमस्ते! आप क्या करना चाहेंगे?', copy:'कार्ड चुनें या स्वाभाविक रूप से बोलने के लिए वॉइस असिस्टेंट इस्तेमाल करें।', games:'गेम्स', gamesSub:'आपके दिमाग के लिए हल्की गतिविधि', rem:'आज के रिमाइंडर', remSub:'आज की आपकी आसान योजना', try:'कमांड टाइप करके देखें', tryCopy:'माइक्रोफ़ोन की अनुमति न मिले तो उपयोगी।', send:'भेजें', ready:'जब तैयार हों, बोलने के लिए माइक्रोफ़ोन दबाएँ।', voice:'वॉइस असिस्टेंट', help:'आप ये कह सकते हैं', selected:'वॉइस द्वारा चुना गया', input:'जैसे: आज मुझे क्या करना है?', open:'खोलें', readAloud:'बोलकर सुनाएं' },
    as:  { title:'আপোনাৰ দিনটো, সহজভাৱে।', lang:'ভাষা', welcome:'নমস্কাৰ! আপুনি কি কৰিব বিচাৰে?', copy:"কাৰ্ড বাছক, অথবা স্বাভাৱিকভাৱে ক'বলৈ ভইচ সহায়ক ব্যৱহাৰ কৰক।", games:'খেলসমূহ', gamesSub:'আপোনাৰ মনৰ বাবে সৰু কাৰ্যকলাপ', rem:'আজিৰ সোঁৱৰণীসমূহ', remSub:'আজিৰ আপোনাৰ সহজ পৰিকল্পনা', try:'আদেশ টাইপ কৰি চাওক', tryCopy:'মাইক্ৰফোনৰ অনুমতি নাপালে উপযোগী।', send:'পঠাওক', ready:"সাজু হ'লে কথা ক'বলৈ মাইক্ৰফোন টিপক।", voice:'ভইচ সহায়ক', help:"আপুনি এইবোৰ ক'ব পাৰে", selected:'ভইচে বাছনি কৰিলে', input:'যেনে: আজি মই কি কৰিব লাগিব?', open:'খোলক', readAloud:'পঢ়ি শুনাওক' },
    mni: { title:'নত্ত্রা মপান হান্না মতম অমসুং অমত্তা মপান অমদা।', lang:'মীৎয়েক', welcome:'নমস্কার! নত্ত্রা কনা তৌবা হায়রি?', copy:'কার্ড অমা থীজিনু, নাইতনা ভইচ অসিষ্ট্যান্ট শিং ওইনা হায়জিনু।', games:'খেল', gamesSub:'নত্ত্রা মণ্ণ অমত্তা অদুগী লমজিং অমা', rem:'নুমিদাংগী সোঁৱৰণী', remSub:'নুমিদাংগী নত্ত্রা মপান পুথোক্লক্পা', try:'কমান্ড অমা টাইপ তৌনবা থীজিনু', tryCopy:'মাইক্রোফোন পারমিশন নাইবদা উপযোগী।', send:'পাঠাক', ready:'মরম ওলে মাইক্রোফোন দাবানু হায়নবা।', voice:'ভইচ অসিষ্ট্যান্ট', help:'নত্ত্রা হায়থোক্তুনা মফম্দা', selected:'ভইচনা থীজিল্লে', input:'যেমন: নুমিদাংদা মখোল তৌবা কনা?', open:'মফম থংনবা', readAloud:'মখোল শুনাউ' },
    brx: { title:'नङो\u2019 मोन नोगोर, हायो हायो।', lang:'दाहार', welcome:'नमस्कार! नङा आव कोन खामनि लाखिनाय?', copy:'कार्ड बाछ, नाइतनि स्वाभाविक हानजाफोर भयस असिस्टेन्ट थाखाय।', games:'गामि', gamesSub:'नङो\u2019 मन थाखाय गामि', rem:'गाबोर रिमाइन्डार', remSub:'गाबोर नङो\u2019 सायाव खामनि', try:'कमान्ड टाइप खामो', tryCopy:'माइक्रोफोन अनुमति नाथानाय जायगाव।', send:'पाठाव', ready:'थायो नङो\u2019 माइक्रोफोन दाब।', voice:'भयस असिस्टेन्ट', help:'नङा जेरैबो हानजा मोन', selected:'भयस थीजिल', input:'जेरोम: गाबोर मो खामनि?', open:'मफम', readAloud:'फरायना सुनाय' },
    bn:  { title:'আপনার দিন, সহজভাবে।', lang:'ভাষা', welcome:'নমস্কার! আপনি কী করতে চান?', copy:'একটি কার্ড বেছে নিন, অথবা স্বাভাবিকভাবে কথা বলতে ভয়েস অ্যাসিস্ট্যান্ট ব্যবহার করুন।', games:'গেমস', gamesSub:'আপনার মনের জন্য হালকা কার্যকলাপ', rem:'আজকের রিমাইন্ডার', remSub:'আজকের আপনার সহজ পরিকল্পনা', try:'একটি কমান্ড টাইপ করে দেখুন', tryCopy:'মাইক্রোফোন অনুমতি না পেলে উপযোগী।', send:'পাঠান', ready:'প্রস্তুত হলে মাইক্রোফোন চাপুন।', voice:'ভয়েস অ্যাসিস্ট্যান্ট', help:'আপনি এগুলো বলতে পারেন', selected:'ভয়েস দ্বারা বাছাই', input:'যেমন: আজ আমি কী করব?', open:'খুলুন', readAloud:'পড়ে শোনান' },
    ne:  { title:'तपाईंको दिन, सजिलो तरिकाले।', lang:'भाषा', welcome:'नमस्ते! तपाईं के गर्न चाहनुहुन्छ?', copy:'एउटा कार्ड छान्नुस्, वा स्वाभाविक रूपमा बोल्न भ्वाइस असिस्ट्यान्ट प्रयोग गर्नुस्।', games:'खेलहरू', gamesSub:'तपाईंको मनको लागि हल्का गतिविधि', rem:'आजका सम्झना', remSub:'आजको तपाईंको सजिलो योजना', try:'कमान्ड टाइप गरेर हेर्नुस्', tryCopy:'माइक्रोफोन अनुमति नभएमा उपयोगी।', send:'पठाउनुस्', ready:'तयार भएपछि माइक्रोफोन थिच्नुस्।', voice:'भ्वाइस असिस्ट्यान्ट', help:'तपाईं यी भन्न सक्नुहुन्छ', selected:'भ्वाइसले छानेको', input:'जस्तै: आज मैले के गर्ने?', open:'खोल्नुस्', readAloud:'पढेर सुनाउनुस्' },
  };

  // Help command examples per language
  const helpCmds = {
    en:  ['Play a game', 'Next game', 'Show my reminders', 'What should I do today?', 'Next reminder'],
    hi:  ['गेम खेलो', 'अगला गेम', 'मेरे रिमाइंडर दिखाओ', 'आज मुझे क्या करना है', 'अगला रिमाइंडर'],
    as:  ['খেল খোলক', 'পৰৱৰ্তী গেম', 'মোৰ সোঁৱৰণী দেখুওৱা', 'আজি মই কি কৰিব লাগিব', 'পৰৱৰ্তী কাম'],
    mni: ['খেল থংনবা', 'মতম অদুগী খেল', 'মোইগী সোঁৱৰণী থীজিনু', 'নুমিদাংদা মখোল তৌবা কনা', 'মতম অদুগী কাজ'],
    brx: ['गामि मफम', 'गाबो गामि', 'मो\u2019 रिमाइन्डार बाछ', 'गाबोर मो खामनि', 'गाबो खामनि'],
    bn:  ['গেম খেলুন', 'পরের গেম', 'আমার রিমাইন্ডার দেখান', 'আজ আমি কী করব', 'পরের রিমাইন্ডার'],
    ne:  ['खेल खेल्नुस्', 'अर्को खेल', 'मेरा सम्झना देखाउनुस्', 'आज मैले के गर्ने', 'अर्को सम्झना'],
  };

  function render() {
    const lang = q('#language').value;
    const c = copy[lang] || copy.en;
    document.documentElement.lang = lang;
    q('#page-title').textContent = c.title;
    q('#language-label').textContent = c.lang;
    const readBtn = q('#read-aloud-label');
    if (readBtn) readBtn.textContent = c.readAloud;
    q('#welcome-title').textContent = c.welcome;
    q('#welcome-copy').textContent = c.copy;
    q('#games-title').textContent = c.games;
    q('#games-subtitle').textContent = c.gamesSub;
    q('#reminders-title').textContent = c.rem;
    q('#reminders-subtitle').textContent = c.remSub;
    q('#try-title').textContent = c.try;
    q('#try-copy').textContent = c.tryCopy;
    q('#send-command').textContent = c.send;
    q('#voice-button-label').textContent = c.voice;
    q('#assistant-title').textContent = c.voice;
    q('#help-title').textContent = c.help;
    q('#games-selected').textContent = q('#reminders-selected').textContent = c.selected;
    q('#command-input').placeholder = c.input;
    Voice.setStatus(c.ready);
    q('#games-list').innerHTML = data.games.map((g, i) =>
      `<button class="game-item" data-index="${i}"><span>${g.icon}</span>${g[lang] || g.name}<small>${c.open}</small></button>`
    ).join('');
    q('#reminders-list').innerHTML = data.reminders.map((r, i) =>
      `<li class="reminder-item" data-index="${i}"><span>${r.icon}</span>${r[lang] || r.en}</li>`
    ).join('');
    q('#help-commands').innerHTML = (helpCmds[lang] || helpCmds.en).map(x => `<span>${x}</span>`).join('');
    document.querySelectorAll('.game-item').forEach((el, i) => el.onclick = () => Navigation.openGame(data.games[i]));
  }

  const submitCommand = input => { Voice.process(q(input).value); q(input).value = ''; };
  q('#voice-button').onclick = Voice.start;
  q('#send-command').onclick = () => submitCommand('#command-input');
  q('#command-input').onkeydown = e => { if (e.key === 'Enter') q('#send-command').click(); };
  const readAloudEl = q('#read-aloud-btn');
  if (readAloudEl) readAloudEl.onclick = Voice.readScreen;
  q('#language').onchange = render;
  q('#close-dialog').onclick = () => q('#game-dialog').close();
  q('#dialog-ok').onclick = () => q('#game-dialog').close();
  render();
})();
