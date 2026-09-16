window.Navigation = (() => {
  let gameIndex = 0, reminderIndex = 0;
  const q = s => document.querySelector(s);
  const lang = () => q('#language').value;
  const gameName   = game     => game[lang()]     || game.name;
  const remName    = reminder => reminder[lang()]  || reminder.en;

  // Response messages for every supported language
  const msg = {
    openGames: {
      en:  games => `Games card selected. Your games are: ${games}. Choose one to play.`,
      hi:  games => `गेम्स कार्ड चुना गया। आपके खेल हैं: ${games}। कोई खेल चुनें।`,
      as:  games => `খেলসমূহ কাৰ্ড বাছনি কৰা হ'ল। আপোনাৰ খেলসমূহ: ${games}। এটা বাছক।`,
      mni: games => `খেল কার্ড থীজিল্লে। নত্ত্রা খেলসিং: ${games}। অমা থীজিনু।`,
      brx: games => `গামি কার্ড বাছ। নংগীর গামিসো: ${games}। অমা বাছনো।`,
      bn:  games => `গেমস কার্ড বাছাই হয়েছে। আপনার গেমগুলো: ${games}। একটি বেছে নিন।`,
      ne:  games => `गेमस कार्ड छानियो। तपाईंका खेलहरू: ${games}। एउटा छान्नुस्।`,
    },
    nextGame: {
      en:  name => `Next game: ${name}.`,
      hi:  name => `अगला गेम: ${name}।`,
      as:  name => `পৰৱৰ্তী খেল: ${name}।`,
      mni: name => `মতম অদুগী খেল: ${name}।`,
      brx: name => `গাবো গামি: ${name}।`,
      bn:  name => `পরের গেম: ${name}।`,
      ne:  name => `अर्को खेल: ${name}।`,
    },
    openReminders: {
      en:  rems => `Today's Reminders selected. Your reminders: ${rems}.`,
      hi:  rems => `आज के रिमाइंडर कार्ड चुना गया। आपके रिमाइंडर: ${rems}।`,
      as:  rems => `আজিৰ সোঁৱৰণী কাৰ্ড বাছনি কৰা হ'ল। আপোনাৰ সোঁৱৰণী: ${rems}।`,
      mni: rems => `নুমিদাংগী সোঁৱৰণী থীজিল্লে। নত্ত্রা সোঁৱৰণীসিং: ${rems}।`,
      brx: rems => `গাবোর রিমাইন্ডার বাছ। নংগীর রিমাইন্ডার: ${rems}।`,
      bn:  rems => `আজকের রিমাইন্ডার কার্ড বাছাই। আপনার রিমাইন্ডার: ${rems}।`,
      ne:  rems => `आजका सम्झना छानियो। तपाईंका सम्झना: ${rems}।`,
    },
    nextReminder: {
      en:  name => `Your next reminder is: ${name}.`,
      hi:  name => `आपका अगला रिमाइंडर है: ${name}।`,
      as:  name => `আপোনাৰ পৰৱৰ্তী সোঁৱৰণী: ${name}।`,
      mni: name => `নত্ত্রা মতম অদুগী সোঁৱৰণী: ${name}।`,
      brx: name => `নংগীর গাবো রিমাইন্ডার: ${name}।`,
      bn:  name => `আপনার পরের রিমাইন্ডার: ${name}।`,
      ne:  name => `तपाईंको अर्को सम्झना: ${name}।`,
    },
    openGame: {
      en:  name => `${name} selected. Opening it.`,
      hi:  name => `${name} गेम चुना गया। खोल रहा हूँ।`,
      as:  name => `${name} খেল বাছনি কৰা হ'ল। খুলি আছোঁ।`,
      mni: name => `${name} থীজিল্লে। মফম থংনবা।`,
      brx: name => `${name} বাছ। মফম থংনবা।`,
      bn:  name => `${name} বাছাই হয়েছে। খুলছি।`,
      ne:  name => `${name} छানियो। खोल्दैछु।`,
    },
    help: {
      en:  () => 'You can say: play game, next game, show my reminders, what should I do today, or next reminder.',
      hi:  () => 'आप कह सकते हैं: गेम खेलो, अगला गेम, मेरे रिमाइंडर दिखाओ, आज मुझे क्या करना है, या अगला रिमाइंडर।',
      as:  () => "আপুনি ক'ব পাৰে: খেল খোলক, পৰৱৰ্তী গেম, মোৰ সোঁৱৰণী দেখুওৱা, আজি মই কি কৰিব লাগিব, অথবা পৰৱৰ্তী কাম।",
      mni: () => 'নত্ত্রা হায়থোক্তুনা: খেল থংনবা, মতম অদুগী খেল, মোইগী সোঁৱৰণী থীজিনু, নুমিদাংদা মখোল কনা, নাইতনা মতম অদুগী কাজ।',
      brx: () => 'নংগীর হানজা মোন: গামি মফম, গাবো গামি, মো রিমাইন্ডার বাছ, গাবোর মো খামনি, নাইতনা গাবো খামনি।',
      bn:  () => 'আপনি বলতে পারেন: গেম খেলুন, পরের গেম, আমার রিমাইন্ডার দেখান, আজ আমি কী করব, অথবা পরের রিমাইন্ডার।',
      ne:  () => 'तपाईं भन्न सक्नुहुन्छ: खेल खेल्नुस्, अर्को खेल, मेरा सम्झना देखाउनुस्, आज मैले के गर्ने, वा अर्को सम्झना।',
    },
    unknown: {
      en:  () => "I didn't understand that. Try saying play a game or what should I do today.",
      hi:  () => 'मैं समझ नहीं पाया। आप गेम खेलो या आज मुझे क्या करना है कह सकते हैं।',
      as:  () => 'মই বুজি নাপালোঁ। খেল খোলক বা আজি মই কি কৰিব লাগিব বুলি ক\'ব পাৰে।',
      mni: () => 'মই হায়রিবা নৎতে। খেল থংনবা নাইতনা নুমিদাংদা মখোল কনা হায়বিনু।',
      brx: () => 'মই বুজি নাপালোঁ। গামি মফম নাইতনা গাবোর মো খামনি হানজায়ো।',
      bn:  () => 'আমি বুঝতে পারিনি। গেম খেলুন বা আজ আমি কী করব বলে দেখুন।',
      ne:  () => 'मैले बुझिनँ। खेल खेल्नुस् वा आज मैले के गर्ने भन्नुस्।',
    },
  };

  function t(key, ...args) {
    const l = lang();
    const fn = msg[key][l] || msg[key].en;
    return fn(...args);
  }

  function flash(element) {
    document.querySelectorAll('.voice-focus').forEach(el => el.classList.remove('voice-focus'));
    element.classList.add('voice-focus');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => element.classList.remove('voice-focus'), 5000);
  }

  function selectItem(selector, index) {
    document.querySelectorAll(selector).forEach(el => el.classList.remove('selected-item'));
    const selected = document.querySelectorAll(selector)[index];
    if (selected) { selected.classList.add('selected-item'); selected.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  }

  function message(intent) {
    const games     = DEMO_DATA.games;
    const reminders = DEMO_DATA.reminders;

    if (intent.intent === 'OPEN_GAMES') {
      flash(q('#games-card'));
      return t('openGames', games.map(gameName).join(', '));
    }
    if (intent.intent === 'NEXT_GAME') {
      gameIndex = (gameIndex + 1) % games.length;
      flash(q('#games-card')); selectItem('.game-item', gameIndex);
      return t('nextGame', gameName(games[gameIndex]));
    }
    if (intent.intent === 'OPEN_REMINDERS' || intent.intent === 'TODAY_REMINDERS') {
      flash(q('#reminders-card'));
      return t('openReminders', reminders.map(remName).join(', '));
    }
    if (intent.intent === 'NEXT_REMINDER') {
      const current = reminders[reminderIndex];
      flash(q('#reminders-card')); selectItem('.reminder-item', reminderIndex);
      reminderIndex = (reminderIndex + 1) % reminders.length;
      return t('nextReminder', remName(current));
    }
    if (intent.intent === 'OPEN_GAME') {
      gameIndex = games.findIndex(g => g.id === intent.entity);
      flash(q('#games-card')); selectItem('.game-item', gameIndex);
      openGame(games[gameIndex]);
      return t('openGame', gameName(games[gameIndex]));
    }
    if (intent.intent === 'HELP') {
      q('#help-panel').hidden = false;
      q('#help-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return t('help');
    }
    return t('unknown');
  }

  function openGame(game) {
    q('#dialog-title').textContent = gameName(game);
    q('#dialog-text').textContent = lang() === 'hi'
      ? 'गेम डेमो प्लेसहोल्डर — खेलने के लिए तैयार!'
      : 'Game demo placeholder — ready to play!';
    q('#game-dialog').showModal();
  }

  return { message, openGame };
})();
