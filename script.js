// GLOBAL AUDIO CONTEXT - Initialize on first user interaction
let globalAudioCtx = null;

function initGlobalAudioContext() {
  if (!globalAudioCtx) {
    globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    console.log('Global audio context created:', globalAudioCtx.state);
  }
  // Resume if suspended
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().then(() => console.log('Audio context resumed'));
  }
  return globalAudioCtx;
}

document.addEventListener('DOMContentLoaded',()=>{
  const timeEl=document.getElementById('timePicker');
  const stepsEl=document.getElementById('stepsInput');
  const setAlarmBtn=document.getElementById('setAlarmBtn');
  const out=document.getElementById('result');
  const fileInput = document.getElementById('soundFile');
  const chooseBtn = document.getElementById('chooseBtn');
  const selected = document.getElementById('selectedSound');
  const alarmsList = document.getElementById('alarmsList');
  
  // step counter elements
  const stepCounterDisplay = document.getElementById('stepCounter');
  let stepCounterActive = false;
  let dailyStepCount = 0;
  
  // camera elements
  const openCameraBtn = document.getElementById('openCameraBtn');
  const captureBtn = document.getElementById('captureBtn');
  const closeCameraBtn = document.getElementById('closeCameraBtn');
  const cameraVideo = document.getElementById('cameraVideo');
  const cameraCanvas = document.getElementById('cameraCanvas');
  const snapshot = document.getElementById('snapshot');
  let cameraStream = null;

  // state for alarms management
  let alarms = [];
  let alarmCheckInterval = null;
  let totalStepsToday = 0;
  let completedAlarmsCount = 0;

  // state for blink detection
  let blinkDetectionActive = false;
  let lastBlinkTime = 0;
  let blinkAnalysisInterval = null;
  let previousBrightness = 255;
  const BLINK_THRESHOLD = 30;  // Lower = more sensitive (was 50)
  const MIN_BLINK_INTERVAL = 100;  // Faster blink detection (was 150)

  // state for audio
  let audioUrl = null;
  let audioEl = null;

  // state for vibration
  let vibrationInterval = null;

  // Enable audio button
  const enableAudioBtn = document.getElementById('enableAudioBtn');
  enableAudioBtn.addEventListener('click', () => {
    try {
      console.log('Enable Audio button clicked');
      const ctx = initGlobalAudioContext();
      out.textContent = 'Audio enabled! Alarm will now ring with sound.';
    } catch (e) {
      console.error('Audio system error:', e);
      out.textContent = 'Audio system not available. Use vibration alert.';
    }
  });

  // Set alarm button
  setAlarmBtn.addEventListener('click',()=>{
    const time = timeEl.value || '00:00';
    const steps = parseInt(stepsEl.value || '0', 10) || 0;
    
    if (!time) {
      out.textContent = 'Please enter a valid time.';
      return;
    }

    if (steps <= 0) {
      out.textContent = 'Please enter a valid number of steps.';
      return;
    }

    const alarm = {
      id: Date.now(),
      label: `Alarm at ${time}`,
      time: time,
      steps: steps,
      currentSteps: 0,
      active: false,
      ringing: false,
      completed: false,
      audioUrl: audioUrl,
      audioEl: audioEl ? audioEl.cloneNode() : null,
      beepNode: null,
      audioCtx: null,
      beepInterval: null
    };

    alarms.push(alarm);
    out.textContent = `Alarm set for ${time} with ${steps} steps required.`;
    renderAlarms();
    updateStatistics();
    startAlarmChecker();
  });

  // Check alarms every second
  function startAlarmChecker() {
    if (alarmCheckInterval) return;
    
    alarmCheckInterval = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      
      alarms.forEach((alarm) => {
        if (!alarm.ringing && alarm.time === currentTime) {
          console.log('ALARM TRIGGERED:', alarm.time, alarm);
          alarm.ringing = true;
          alarm.active = true;
          alarm.currentSteps = 0;
          
          out.textContent = `Alarm ringing! ${alarm.time} - Walk ${alarm.steps} steps to stop!`;
          
          // Start alarm sound
          if (alarm.audioEl) {
            alarm.audioEl.volume = 1.0;
            alarm.audioEl.loop = true;
            alarm.audioEl.play().catch((err) => {
              console.warn('Audio file play failed:', err);
              startBeep(600, alarm);
            });
          } else {
            startBeep(600, alarm);
          }
          
          // Start vibration
          startVibration();
          
          // Start blink detection (will activate after camera opens)
          setTimeout(() => {
            startBlinkDetection();
          }, 600);
          
          // AUTOMATICALLY OPEN CAMERA
          if (openCameraBtn && cameraVideo) {
            setTimeout(() => {
              openCameraBtn.click();
              out.textContent = `Alarm ringing! ${alarm.time} - Blink ${alarm.steps} times to stop!`;
            }, 500);
          }
          
          renderAlarms();
        }
      });
    }, 1000);
  }

  // Render alarms list
  function renderAlarms() {
    alarmsList.innerHTML = '';
    if (alarms.length === 0) {
      alarmsList.innerHTML = '<p class="empty-state">No alarms set yet</p>';
      return;
    }

    alarms.forEach((alarm) => {
      const alarmDiv = document.createElement('div');
      alarmDiv.className = 'alarm-item';
      const status = alarm.ringing ? 'RINGING' : (alarm.completed ? 'COMPLETED' : 'Set');
      alarmDiv.innerHTML = `
        <div class="alarm-info">
          <div class="alarm-time">${alarm.label}</div>
          <div class="alarm-meta">${alarm.steps} steps | ${status} | Progress: ${alarm.currentSteps}/${alarm.steps}</div>
        </div>
      `;
      alarmsList.appendChild(alarmDiv);
    });
  }

  // Delete alarm
  window.deleteAlarm = (alarmId) => {
    const alarm = alarms.find(a => a.id === alarmId);
    if (alarm) {
      if (alarm.audioEl) {
        alarm.audioEl.pause();
        alarm.audioEl.currentTime = 0;
      }
      stopBeep(alarm);
    }
    alarms = alarms.filter(a => a.id !== alarmId);
    out.textContent = 'Alarm deleted.';
    renderAlarms();
    
    const hasActiveAlarms = alarms.some(a => a.active || a.ringing);
    if (!hasActiveAlarms) {
      if (alarmCheckInterval) {
        clearInterval(alarmCheckInterval);
        alarmCheckInterval = null;
      }
      stopBlinkDetection();
    }
  };

  // Update statistics
  function updateStatistics() {
    // Track statistics
  }

  // File picker
  if (chooseBtn && fileInput) {
    chooseBtn.addEventListener('click', ()=> fileInput.click());
    fileInput.addEventListener('change', (ev)=>{
      const f = ev.target.files && ev.target.files[0];
      if (!f) return;
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      audioUrl = URL.createObjectURL(f);
      selected.textContent = f.name;
      if (audioEl) {
        audioEl.pause();
        audioEl.remove();
      }
      audioEl = document.createElement('audio');
      audioEl.src = audioUrl;
      audioEl.volume = 1.0;
      audioEl.preload = 'auto';
    });
  }

  // Blink detection - analyzes camera feed brightness
  let blinkFrameData = [];
  let lastBrightness = 200;
  
  function detectBlink() {
    if (!blinkDetectionActive) return;
    
    const activeRingingAlarm = alarms.find(a => a.active && a.ringing);
    if (!activeRingingAlarm || !cameraVideo || !cameraStream) return;
    
    try {
      const ctx = cameraCanvas.getContext('2d');
      if (!ctx) return;
      
      const videoWidth = cameraVideo.videoWidth || 320;
      const videoHeight = cameraVideo.videoHeight || 240;
      
      cameraCanvas.width = videoWidth;
      cameraCanvas.height = videoHeight;
      ctx.drawImage(cameraVideo, 0, 0, videoWidth, videoHeight);
      
      // Get brightness data
      const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight);
      const data = imageData.data;
      
      // Sample every 10th pixel for speed
      let brightness = 0;
      let samples = 0;
      for (let i = 0; i < data.length; i += 40) {
        brightness += (data[i] + data[i+1] + data[i+2]) / 3;
        samples++;
      }
      brightness = samples > 0 ? brightness / samples : lastBrightness;
      
      blinkFrameData.push(brightness);
      if (blinkFrameData.length > 15) {
        blinkFrameData.shift();
      }
      
      const now = Date.now();
      
      // Detect blink: pattern of dark then bright
      if (blinkFrameData.length >= 10) {
        const avgFirst5 = blinkFrameData.slice(0, 5).reduce((a, b) => a + b) / 5;
        const avgLast5 = blinkFrameData.slice(-5).reduce((a, b) => a + b) / 5;
        const minInSequence = Math.min(...blinkFrameData);
        
        // Blink pattern: was bright, got dark, now bright again
        if (avgFirst5 > 100 && minInSequence < 80 && avgLast5 > 100) {
          if ((now - lastBlinkTime) > MIN_BLINK_INTERVAL) {
            console.log('Blink detected! Pattern:', {avgFirst5, minInSequence, avgLast5});
            
            lastBlinkTime = now;
            blinkFrameData = []; // Reset pattern
            activeRingingAlarm.currentSteps += 1;
            
            if (dailyStepCount !== undefined) {
              dailyStepCount += 1;
              if (stepCounterDisplay) {
                stepCounterDisplay.textContent = dailyStepCount;
              }
            }
            
            out.textContent = `Blink! ${activeRingingAlarm.currentSteps}/${activeRingingAlarm.steps}`;
            renderAlarms();
            
            // Check if goal reached
            if (activeRingingAlarm.currentSteps >= activeRingingAlarm.steps) {
              out.textContent = `Done! ${activeRingingAlarm.currentSteps} blinks!`;
              if (activeRingingAlarm.audioEl) {
                activeRingingAlarm.audioEl.pause();
                activeRingingAlarm.audioEl.currentTime = 0;
              }
              stopBeep(activeRingingAlarm);
              stopVibration();
              activeRingingAlarm.active = false;
              activeRingingAlarm.ringing = false;
              activeRingingAlarm.completed = true;
              
              totalStepsToday += activeRingingAlarm.currentSteps;
              completedAlarmsCount += 1;
              updateStatistics();
              
              renderAlarms();
              stopBlinkDetection();
            }
          }
        }
      }
      
      lastBrightness = brightness;
    } catch (e) {
      console.error('Blink detection error:', e);
    }
  }

  function startBlinkDetection() {
    if (blinkDetectionActive) return;
    blinkDetectionActive = true;
    previousBrightness = 255;
    lastBlinkTime = Date.now();
    
    // Run blink detection every 30ms
    blinkAnalysisInterval = setInterval(detectBlink, 30);
  }

  function stopBlinkDetection() {
    blinkDetectionActive = false;
    if (blinkAnalysisInterval) {
      clearInterval(blinkAnalysisInterval);
      blinkAnalysisInterval = null;
    }
  }

  // Web Audio beeping
  function startBeep(freq=800, alarm=null){
    try{
      if (!alarm) {
        alarm = { beepNode: null, audioCtx: null, beepInterval: null };
      }
      
      if (!alarm.audioCtx) {
        alarm.audioCtx = initGlobalAudioContext();
      }
      
      if (alarm.audioCtx.state === 'suspended') {
        alarm.audioCtx.resume();
      }
      
      stopBeep(alarm);
      
      alarm.beepNode = alarm.audioCtx.createOscillator();
      const gain = alarm.audioCtx.createGain();
      
      alarm.beepNode.type = 'square';
      alarm.beepNode.frequency.value = freq;
      alarm.beepNode.connect(gain);
      gain.connect(alarm.audioCtx.destination);
      gain.gain.value = 1.0;
      
      alarm.beepNode.start();
      
      alarm.beepInterval = setTimeout(()=>{ 
        stopBeep(alarm); 
        alarm.beepInterval = setTimeout(()=> startBeep(freq, alarm), 500); 
      }, 800);
    }catch(e){ 
      console.error('Audio context error:', e);
    }
  }
  
  function stopBeep(alarm=null){
    try{
      if (!alarm) alarm = { beepNode: null, beepInterval: null };
      if (alarm.beepNode) { alarm.beepNode.stop(); alarm.beepNode.disconnect(); alarm.beepNode = null; }
      if (alarm.beepInterval) { clearTimeout(alarm.beepInterval); alarm.beepInterval = null; }
    }catch(e){}
  }

  // Vibration
  function startVibration() {
    if (!navigator.vibrate && !navigator.webkitVibrate && !navigator.mozVibrate && !navigator.msVibrate) {
      return;
    }
    
    const vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
    
    vibrationInterval = setInterval(()=>{
      vibrate.call(navigator, [100, 50, 100]);
    }, 300);
  }

  function stopVibration() {
    if (vibrationInterval) {
      clearInterval(vibrationInterval);
      vibrationInterval = null;
    }
  }

  // Camera
  if (openCameraBtn && captureBtn && closeCameraBtn) {
    openCameraBtn.addEventListener('click', async () => {
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        cameraVideo.srcObject = cameraStream;
        cameraVideo.style.display = 'block';
        openCameraBtn.disabled = true;
        captureBtn.disabled = false;
        closeCameraBtn.disabled = false;
      } catch (err) {
        out.textContent = 'Camera access denied or not available.';
        console.error('Camera error:', err);
      }
    });

    captureBtn.addEventListener('click', () => {
      const ctx = cameraCanvas.getContext('2d');
      cameraCanvas.width = cameraVideo.videoWidth;
      cameraCanvas.height = cameraVideo.videoHeight;
      ctx.drawImage(cameraVideo, 0, 0);
      snapshot.src = cameraCanvas.toDataURL('image/png');
      snapshot.style.display = 'block';
    });

    closeCameraBtn.addEventListener('click', () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
      }
      cameraVideo.style.display = 'none';
      snapshot.style.display = 'none';
      openCameraBtn.disabled = false;
      captureBtn.disabled = true;
      closeCameraBtn.disabled = true;
    });
  }

  // Initialize
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  if(!timeEl.value) timeEl.value = `${hh}:${mm}`;
  
  // DEBUG: Press 'B' key to simulate blink during testing
  document.addEventListener('keydown', (e) => {
    if (e.key === 'b' || e.key === 'B') {
      const activeRingingAlarm = alarms.find(a => a.active && a.ringing);
      if (activeRingingAlarm && blinkDetectionActive) {
        activeRingingAlarm.currentSteps += 1;
        if (stepCounterDisplay) {
          stepCounterDisplay.textContent = (parseInt(stepCounterDisplay.textContent) || 0) + 1;
        }
        out.textContent = `Test Blink! ${activeRingingAlarm.currentSteps}/${activeRingingAlarm.steps}`;
        renderAlarms();
        
        if (activeRingingAlarm.currentSteps >= activeRingingAlarm.steps) {
          out.textContent = `Done! ${activeRingingAlarm.currentSteps} blinks!`;
          if (activeRingingAlarm.audioEl) {
            activeRingingAlarm.audioEl.pause();
            activeRingingAlarm.audioEl.currentTime = 0;
          }
          stopBeep(activeRingingAlarm);
          stopVibration();
          activeRingingAlarm.active = false;
          activeRingingAlarm.ringing = false;
          activeRingingAlarm.completed = true;
          renderAlarms();
          stopBlinkDetection();
        }
      }
    }
  });

});
