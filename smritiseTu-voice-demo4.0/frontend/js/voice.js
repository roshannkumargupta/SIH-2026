/* The browser records audio; Sarvam transcribes it through the secure backend proxy. */
window.Voice = (() => {
  let recorder, stream, chunks = [], timer, audioContext, monitorTimer;
  const q = s => document.querySelector(s);
  const languageCode = () => {
    const map = { en: 'en-IN', hi: 'hi-IN', as: 'as-IN', mni: 'mni-IN', brx: 'brx-IN', bn: 'bn-IN', ne: 'ne-IN' };
    return map[q('#language').value] || 'en-IN';
  };
  function setStatus(text, state = '') { q('#voice-status').textContent = text; q('#status-dot').className = `status-dot ${state}`; }
  let currentAudio = null;

  function browserSpeak(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const code = languageCode();
      u.lang = code;
      u.rate = 0.92;
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const langPrefix = code.slice(0, 2).toLowerCase();
        const v = voices.find(x => x.lang.toLowerCase() === code.toLowerCase())
               || voices.find(x => x.lang.toLowerCase().startsWith(langPrefix));
        if (v) u.voice = v;
      }
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn('Browser speech synthesis error:', e);
    }
  }

  function base64ToBlob(base64) {
    const bytes = atob(base64);
    const values = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) values[i] = bytes.charCodeAt(i);
    return new Blob([values], { type: 'audio/wav' });
  }

  async function speak(text) {
    if (!text || !text.trim()) return;
    if (currentAudio) {
      try { currentAudio.pause(); } catch (_) {}
      currentAudio = null;
    }
    // Sarvam Bulbul v3 supported languages: en-IN, hi-IN, bn-IN
    // as-IN (requires beta access), mni-IN, brx-IN, ne-IN use browser speech synthesis
    const sarvamLangs = new Set(['en', 'hi', 'bn']);
    const lang = q('#language').value;
    if (sarvamLangs.has(lang)) {
      try {
        const langCode = { en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN' }[lang];
        const response = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language: langCode }),
        });
        const data = await response.json();
        if (!response.ok || !data.audio) throw new Error(data.error || 'No audio from Sarvam');
        const url = URL.createObjectURL(base64ToBlob(data.audio));
        const audio = new Audio(url);
        currentAudio = audio;
        audio.onended = () => { URL.revokeObjectURL(url); currentAudio = null; };
        await audio.play();
        return;
      } catch (err) {
        console.warn('Sarvam TTS failed, using browser speech synthesis:', err);
      }
    }
    browserSpeak(text);
  }

  function readScreen() {
    const lang = q('#language').value;
    const games = Array.from(document.querySelectorAll('#games-list .game-item'))
      .map(el => el.childNodes[1]?.textContent?.trim() || el.textContent.trim())
      .filter(Boolean).join(', ');
    const rems = Array.from(document.querySelectorAll('#reminders-list .reminder-item'))
      .map(el => el.textContent.trim())
      .filter(Boolean).join(', ');
    
    const intros = {
      en: `Welcome to SmritiSetu. Your games are ${games}. Today's reminders are ${rems}.`,
      hi: `स्मृतिसेतु में आपका स्वागत है। आपके खेल हैं: ${games}। आज के रिमाइंडर हैं: ${rems}।`,
      as: `স্মৃতিসেতুত স্বাগতম। আপোনাৰ খেলসমূহ: ${games}। আজিৰ সোঁৱৰণী: ${rems}।`,
      bn: `স্মৃতিসেতুতে স্বাগতম। আপনার গেমগুলো: ${games}। আজকের রিমাইন্ডার: ${rems}।`,
      mni: `স্মৃতিসেতুদা স্বাগতম। নত্ত্রা খেলসিং: ${games}। নুমিদাংগী সোঁৱৰণীসিং: ${rems}।`,
      brx: `स्मृतिसेतु आव नमस्कार। गामिसो: ${games}। रिमाइन्डार: ${rems}।`,
      ne: `स्मृतिसेतुमा स्वागत छ। तपाईंका खेलहरू: ${games}। आजका सम्झना: ${rems}।`,
    };
    const summary = intros[lang] || intros.en;
    setStatus('🔊 ' + summary, 'done');
    speak(summary);
  }
  async function process(text) {
    if (!text.trim()) return;
    const lang = q('#language').value;
    const sayLabel = { hi: 'आपने कहा', as: 'আপুনি ক\u2019লে', mni: 'নত্ত্রা হায়রিবা ওকলেনি', brx: 'নং হানজা হায়ো', bn: 'আপনি বলেছেন', ne: 'आपनले भन्नुभयो' };
    const thinkLabel = { hi: 'समझ रहा हूँ…', as: 'বুজি আছোঁ…', mni: 'হায়রিবা…', brx: 'হানজা…', bn: 'বুঝছি…', ne: 'বুझ्दैछु…' };
    const actionLabel = { hi: 'कार्रवाई', as: 'কাৰ্য', mni: 'কাযর্নবী', brx: 'খামনি', bn: 'কাজ', ne: 'कार्য' };
    q('#transcript').hidden = false;
    q('#transcript').textContent = `${sayLabel[lang] || 'You said'}: “${text}”`;
    setStatus(thinkLabel[lang] || 'Understanding…', 'thinking');
    const result = await window.interpretCommand(text, lang);
    q('#nlp-result').hidden = false;
    q('#nlp-result').textContent = `Intent: ${result.intent} · Confidence: ${Math.round(result.confidence * 100)}%`;
    const answer = Navigation.message(result);
    setStatus(`${actionLabel[lang] || 'Action'}: ${result.intent.replace('_', ' ')}`, 'done');
    speak(answer);
  }
  function cleanup() { clearTimeout(timer); clearInterval(monitorTimer); if (audioContext) audioContext.close(); audioContext = null; if (stream) stream.getTracks().forEach(track => track.stop()); stream = null; q('#voice-button').classList.remove('listening'); }
  async function transcribe(audio) {
    const transcribeMsg = { hi: 'Sarvam आपकी आवाज़ समझ रहा है…', as: 'Sarvam-এ আপোনাৰ কথা বুজি আছে…', mni: 'Sarvam-না নত্ত্রা হায়রিবা…', brx: 'Sarvam-না নং হানজা হায়ো…', bn: 'Sarvam আপনার কথা বুঝছে…', ne: 'Sarvam आपनको कुरा बुझ्दৈ छ…' };
    setStatus(transcribeMsg[q('#language').value] || 'Sarvam is transcribing your voice…', 'thinking');
    const form = new FormData(); form.append('file', audio, 'voice-command.webm'); form.append('model', 'saaras:v3'); form.append('mode', 'transcribe'); form.append('language_code', languageCode()); form.append('prompt', 'SmritiSetu voice commands: games, Memory Match, Number Puzzle, Word Puzzle, reminders, medicine, water, walk, family, doctor.');
    try { const response = await fetch('/api/transcribe', { method: 'POST', body: form }); const data = await response.json(); const errorText = typeof data.error === 'string' ? data.error : 'Sarvam could not transcribe that recording.'; if (!response.ok) throw new Error(errorText); process(data.text); }
    catch (error) { const text = typeof error.message === 'string' ? error.message : 'Voice transcription failed. Please try again.'; setStatus(text, 'error'); }
  }
  function stop() { if (recorder && recorder.state === 'recording') { setStatus('Processing your voice…', 'thinking'); recorder.stop(); } }
  function stopAfterSilence() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream); const analyser = audioContext.createAnalyser(); analyser.fftSize = 512; source.connect(analyser);
      const samples = new Uint8Array(analyser.fftSize); let heardSpeech = false; let lastSound = Date.now();
      monitorTimer = setInterval(() => {
        if (!recorder || recorder.state !== 'recording') return;
        analyser.getByteTimeDomainData(samples); let energy = 0;
        for (const sample of samples) energy += Math.abs(sample - 128);
        const average = energy / samples.length;
        if (average > 3.5) { heardSpeech = true; lastSound = Date.now(); }
        // A short end-of-speech pause is enough for command-style requests.
        // This dispatches the recording sooner without cutting off normal words.
        if (heardSpeech && Date.now() - lastSound > 700) stop();
      }, 80);
    } catch (_) { /* Manual stop and the maximum-duration timer remain available. */ }
  }
  async function start() {
    if (recorder && recorder.state === 'recording') return stop();
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setStatus('This browser cannot record audio. Please open the demo in Chrome or Edge.', 'error'); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : ''; chunks = []; recorder = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 24000 } : { audioBitsPerSecond: 24000 });
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      // Sarvam accepts audio/webm, but rejects the browser-specific codec suffix
      // (for example, audio/webm;codecs=opus) in a multipart upload.
      recorder.onstop = () => { const audio = new Blob(chunks, { type: 'audio/webm' }); cleanup(); transcribe(audio); };
      recorder.start(); stopAfterSilence(); q('#voice-button').classList.add('listening');
      const listenMsg = { hi: 'सुन रहा हूँ… बोलना समाप्त करने के बाद यह अपने आप रुक जाएगा।', as: 'শুনিছোঁ… কথা শেষ করার পরে আপোনা-আপুনি বন্ধ হব।', mni: 'হায়রিবা… করিবা সাবাধলকে মতম খুদ্দা।', brx: 'হানজায়ো… বায়না ফরায়ো ফরায়ো খামনি হায়ো।', bn: 'শুনছি… বলা শেষ হলে অটোম্যাটিক্যালি বন্ধ হবে।', ne: 'সুনिরহेछु… बोলिসकेपछि आफैं বন्দ হুনेछ।' };
      setStatus(listenMsg[q('#language').value] || 'Listening… It will stop automatically after you finish speaking.', 'listening');
      timer = setTimeout(stop, 7000);
    } catch (error) { setStatus(error.name === 'NotAllowedError' ? 'Microphone permission was denied. Allow microphone access and try again.' : 'Could not start the microphone. Please try again.', 'error'); cleanup(); }
  }
  return { start, stop, process, setStatus, speak, readScreen };
})();
