/* Client fallback mirrors the server endpoint, so the demo works as a static page too. */
window.interpretFallback = function (input, lang) {
  const text = (input || '').toLowerCase().replace(/[?!,."']/g, ' ').replace(/\s+/g, ' ').trim();
  const has = words => words.some(w => text.includes(w));
  const hi = lang === 'hi', isAs = lang === 'as';
  const entity = hi
    ? (has(['मेमोरी', 'याददाश्त', 'कार्ड मैच']) ? 'MEMORY_MATCH' : has(['नंबर', 'संख्या', 'गणित', 'अंक']) ? 'NUMBER_PUZZLE' : has(['शब्द', 'वर्ड', 'स्पेलिंग']) ? 'WORD_PUZZLE' : null)
    : isAs ? (has(['মেমৰি', 'মনত ৰাখ', 'কাৰ্ড মেচ']) ? 'MEMORY_MATCH' : has(['নাম্বাৰ', 'সংখ্যা', 'গণিত', 'অংক']) ? 'NUMBER_PUZZLE' : has(['শব্দ', 'বানান', 'আখৰ']) ? 'WORD_PUZZLE' : null)
    : (has(['memory', 'remember', 'remembering', 'card match', 'matching cards']) ? 'MEMORY_MATCH' : has(['number', 'numbers', 'numeric', 'numerical', 'math', 'maths', 'digit', 'counting']) ? 'NUMBER_PUZZLE' : has(['word', 'words', 'spelling', 'vocabulary', 'letters', 'letter game']) ? 'WORD_PUZZLE' : null);
  if (entity) return { intent: 'OPEN_GAME', confidence: .96, entity };
  // Semantic fallback: understand the key words in natural sentence variants,
  // for example "What to do today?", even when no complete example matches.
  if (!hi && !isAs && text.includes('today') && has(['do', 'need', 'have', 'task', 'reminder', 'plan'])) return { intent: 'TODAY_REMINDERS', confidence: .91, entity: null };
  if (!hi && !isAs && text.includes('next') && has(['game'])) return { intent: 'NEXT_GAME', confidence: .91, entity: null };
  if (!hi && !isAs && text.includes('next') && has(['reminder', 'task', 'do'])) return { intent: 'NEXT_REMINDER', confidence: .9, entity: null };
  if (hi && has(['आज', 'आज के']) && has(['क्या', 'करना', 'रिमाइंडर', 'काम'])) return { intent: 'TODAY_REMINDERS', confidence: .9, entity: null };
  if (isAs && has(['আজি', 'আজিৰ']) && has(['কি', 'কৰ', 'সোঁৱৰণী', 'কাম'])) return { intent: 'TODAY_REMINDERS', confidence: .9, entity: null };
  const sets = hi ? { HELP:['मदद','क्या बोल','कमांड'], NEXT_GAME:['अगला गेम','दूसरा गेम','नेक्स्ट गेम'], NEXT_REMINDER:['अगला रिमाइंडर','अगला काम','नेक्स्ट रिमाइंडर'], TODAY_REMINDERS:['आज मुझे क्या करना है','आज के रिमाइंडर','आज क्या करना','आज के काम'], OPEN_REMINDERS:['रिमाइंडर दिखाओ','मेरे रिमाइंडर','काम दिखाओ','क्या करना है'], OPEN_GAMES:['गेम खोलो','गेम खेलना है','गेम खेलो','गेम दिखाओ'] } : isAs ? { HELP:['সহায়','কি কওঁ','কমান্ড'], NEXT_GAME:['পৰৱৰ্তী গেম','আন গেম','নেক্সট গেম'], NEXT_REMINDER:['পৰৱৰ্তী সোঁৱৰণী','পৰৱৰ্তী কাম','নেক্সট ৰিমাইণ্ডাৰ'], TODAY_REMINDERS:['আজি মই কি কৰিব লাগিব','আজিৰ সোঁৱৰণী','আজি কি কৰিব','আজিৰ কাম'], OPEN_REMINDERS:['সোঁৱৰণী দেখুওৱা','মোৰ সোঁৱৰণী','কাম দেখুওৱা','কি কৰিব লাগিব'], OPEN_GAMES:['খেল খোলক','গেম খোলক','গেম খেলিব','গেম দেখুওৱা'] } : { HELP:['help','what can i say','what can i do','commands'], NEXT_GAME:['next game','show next game','another game','another one','give me another','next one'], NEXT_REMINDER:['next reminder','next task','what is next','what should i do next'], TODAY_REMINDERS:['today reminder','reminders today','what should i do today','today tasks','tell me today','need to do today','what do i need to do'], OPEN_REMINDERS:['open reminders','show reminders','my reminders','my tasks','today tasks','what should i do','what do i have to do','show me what to do'], OPEN_GAMES:['play game','play games','show me games','i want to play','feel like playing','open games','let me play'] };
  for (const [intent, phrases] of Object.entries(sets)) if (has(phrases)) return { intent, confidence: .95, entity: null };
  if (!hi && /\b(reminder|reminders|tasks)\b/.test(text)) return { intent:'OPEN_REMINDERS', confidence:.9, entity:null };
  if (!hi && /\b(game|games)\b/.test(text)) return { intent:'OPEN_GAMES', confidence:.9, entity:null };
  return { intent:'UNKNOWN', confidence:.2, entity:null };
};
window.interpretCommand = async function(text, language) {
  try { const r = await fetch('/api/interpret', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text, language}) }); if (r.ok) return r.json(); } catch (_) { /* static/demo fallback */ }
  return window.interpretFallback(text, language);
};
