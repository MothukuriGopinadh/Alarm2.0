document.addEventListener('DOMContentLoaded',()=>{
  const timeEl=document.getElementById('timePicker');
  const stepsEl=document.getElementById('stepsInput');
  const setAlarmBtn=document.getElementById('setAlarmBtn');
  const out=document.getElementById('result');
  const fileInput = document.getElementById('soundFile');
  const chooseBtn = document.getElementById('chooseBtn');
  const selected = document.getElementById('selectedSound');
  const alarmsList = document.getElementById('alarmsList');
  // camera elements
  const openCameraBtn = document.getElementById('openCameraBtn');
  const captureBtn = document.getElementById('captureBtn');
  const closeCameraBtn = document.getElementById('closeCameraBtn');
  const cameraVideo = document.getElementById('cameraVideo');
  const cameraCanvas = document.getElementById('cameraCanvas');
  const snapshot = document.getElementById('snapshot');
  let cameraStream = null;

  // state for alarms management
  let alarms = []; // array of alarm objects
  let alarmCheckInterval = null;

  // state for step detection
  let stepDetectionActive = false;
  let lastStepTime = 0;
  let lastAccelMagnitude = 0;
  const STEP_THRESHOLD = 12; // lower threshold for better detection
  const MIN_STEP_INTERVAL = 250; // minimum ms between steps
  
  // Peak detection for step counting
  let accelHistory = [];
  let accelHistoryLength = 10;
  let isPeak = false;

  // state for audio
  let audioUrl = null;
  let audioEl = null;

  // prefer 24-hour view if browser supports it (time input uses 24-hour by default for many locales)
  // On click, set alarm (wait for time to ring)
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
      time: time,
      steps: steps,
      currentSteps: 0,
      active: false,
      ringing: false,
      audioUrl: audioUrl,
      audioEl: audioEl ? audioEl.cloneNode() : null,
      beepNode: null,
      audioCtx: null,
      beepInterval: null
    };

    alarms.push(alarm);
    out.textContent = `Alarm set for ${time} with ${steps} steps required.`;
  renderAlarms();
  startAlarmChecker();
  });

  // Check alarms every second to see if any should ring
  function startAlarmChecker() {
    if (alarmCheckInterval) return; // already running
    
    alarmCheckInterval = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      
      alarms.forEach((alarm) => {
        if (!alarm.ringing && alarm.time === currentTime) {
          // Time to ring this alarm!
          alarm.ringing = true;
          alarm.active = true;
          alarm.currentSteps = 0;
          
          out.textContent = `Alarm ringing! ${alarm.time} - Walk ${alarm.steps} steps to stop!`;
          
          // Start alarm sound
          if (alarm.audioEl) {
            alarm.audioEl.loop = true;
            alarm.audioEl.play().catch(()=>{});
          } else {
            startBeep(600, alarm);
          }
          // Start step detection when alarm begins ringing
          startStepDetection();
          
          renderAlarms();
        }
      });
    }, 1000);
  }

  // Render alarms list
  function renderAlarms() {
    alarmsList.innerHTML = '';
    if (alarms.length === 0) {
      alarmsList.innerHTML = '<p class="muted">No alarms set yet</p>';
      return;
    }

    alarms.forEach((alarm) => {
      const alarmDiv = document.createElement('div');
      alarmDiv.className = 'alarm-item';
  const status = alarm.ringing ? 'RINGING' : 'Set';
      alarmDiv.innerHTML = `
        <div class="alarm-info">
          <strong>${alarm.time}</strong> - ${alarm.steps} steps
          <span class="alarm-progress">(${status} - Steps: ${alarm.currentSteps}/${alarm.steps})</span>
        </div>
        <div class="alarm-controls">
          <button onclick="window.deleteAlarm(${alarm.id})" class="tertiary">Delete</button>
        </div>
      `;
      alarmsList.appendChild(alarmDiv);
    });
  }

  // Alarm management functions
  window.deleteAlarm = (alarmId) => {
    const alarm = alarms.find(a => a.id === alarmId);
    if (alarm) {
      // Stop the alarm
      if (alarm.audioEl) {
        alarm.audioEl.pause();
        alarm.audioEl.currentTime = 0;
      }
      stopBeep(alarm);
    }
    alarms = alarms.filter(a => a.id !== alarmId);
    out.textContent = 'Alarm deleted.';
    renderAlarms();
    
    // Stop checker and step detection if no more active alarms
    const hasActiveAlarms = alarms.some(a => a.active || a.ringing);
    if (!hasActiveAlarms) {
      if (alarmCheckInterval) {
        clearInterval(alarmCheckInterval);
        alarmCheckInterval = null;
      }
      stopStepDetection();
    }
  };

  // Small helper: set current time as default
  const now=new Date();
  const hh=String(now.getHours()).padStart(2,'0');
  const mm=String(now.getMinutes()).padStart(2,'0');
  if(!timeEl.value) timeEl.value = `${hh}:${mm}`;

  // File picker behaviour
  chooseBtn.addEventListener('click', ()=> fileInput.click());
  fileInput.addEventListener('change', (ev)=>{
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    // revoke previous URL
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = URL.createObjectURL(f);
    selected.textContent = f.name;
    // create audio element for playback
    if (audioEl) {
      audioEl.pause();
      audioEl.remove();
    }
    audioEl = document.createElement('audio');
    audioEl.src = audioUrl;
    audioEl.preload = 'auto';
  });

  // Step detection using accelerometer/motion sensors
  function onMotionData(event) {
    if (!stepDetectionActive) return;
    
    const activeRingingAlarm = alarms.find(a => a.active && a.ringing);
    if (!activeRingingAlarm) return;
    
    // Get acceleration without gravity (more reliable for step detection)
    const x = event.acceleration.x || 0;
    const y = event.acceleration.y || 0;
    const z = event.acceleration.z || 0;
    
    // Calculate magnitude of acceleration
    const accelMagnitude = Math.sqrt(x * x + y * y + z * z);
    
    // Keep history of accelerations for peak detection
    accelHistory.push(accelMagnitude);
    if (accelHistory.length > accelHistoryLength) {
      accelHistory.shift();
    }
    
    // Detect peaks in acceleration (indicates a step)
    const now = Date.now();
    if (accelHistory.length === accelHistoryLength) {
      const currentAccel = accelHistory[accelHistory.length - 1];
      const prevAccel = accelHistory[accelHistory.length - 2] || 0;
      const nextIndex = accelHistory.length - 1;
      
      // Check if current value is a local peak (higher than surrounding values)
      let isLocalPeak = currentAccel > STEP_THRESHOLD;
      
      if (isLocalPeak && !isPeak && (now - lastStepTime) > MIN_STEP_INTERVAL) {
        // We found a peak (step detected)
        isPeak = true;
        lastStepTime = now;
        activeRingingAlarm.currentSteps += 1;
        
  // update alarm list only (avoid changing main result text on every step)
  renderAlarms();
        
        if (activeRingingAlarm.currentSteps >= activeRingingAlarm.steps) {
          // Goal reached!
          out.textContent = `Goal reached! Alarm stopped after ${activeRingingAlarm.currentSteps} steps.`;
          // Stop the alarm
          if (activeRingingAlarm.audioEl) {
            activeRingingAlarm.audioEl.pause();
            activeRingingAlarm.audioEl.currentTime = 0;
          }
          stopBeep(activeRingingAlarm);
          activeRingingAlarm.active = false;
          activeRingingAlarm.ringing = false;
          renderAlarms();
          stopStepDetection();
        }
      } else if (currentAccel < STEP_THRESHOLD * 0.6) {
        // Reset peak flag when acceleration is low
        isPeak = false;
      }
    }
    
    lastAccelMagnitude = accelMagnitude;
  }

  function startStepDetection() {
    if (stepDetectionActive) return;
    
    // Reset step detection history
    accelHistory = [];
    isPeak = false;
    lastStepTime = 0;
    
    if (window.DeviceMotionEvent && typeof window.DeviceMotionEvent.requestPermission === 'function') {
      // iOS 13+ requires permission
      window.DeviceMotionEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            stepDetectionActive = true;
            window.addEventListener('devicemotion', onMotionData);
            // permission granted; do not show extra messages in the main result area
          } else {
            out.textContent = 'Permission denied for motion sensor access.';
          }
        })
        .catch(err => {
          console.error('Motion sensor error:', err);
          out.textContent = 'Error accessing motion sensors.';
        });
    } else if (window.DeviceMotionEvent) {
      // Other browsers (Android, etc.)
  stepDetectionActive = true;
  window.addEventListener('devicemotion', onMotionData);
  // sensors active (no UI message to keep interface clean)
    } else {
      console.log('Motion sensors not supported');
  out.textContent = 'Motion sensors not supported on this device.';
    }
  }

  function stopStepDetection() {
    stepDetectionActive = false;
    window.removeEventListener('devicemotion', onMotionData);
  }

  // Simple beep implementation for preview when no audio chosen
  function startBeep(freq=600, alarm=null){
    try{
      if (!alarm) {
        alarm = { beepNode: null, audioCtx: null, beepInterval: null };
      }
      if (!alarm.audioCtx) alarm.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      stopBeep(alarm);
      alarm.beepNode = alarm.audioCtx.createOscillator();
      const gain = alarm.audioCtx.createGain();
      alarm.beepNode.type = 'sine';
      alarm.beepNode.frequency.value = freq;
      alarm.beepNode.connect(gain);
      gain.connect(alarm.audioCtx.destination);
      gain.gain.value = 0.1;
      alarm.beepNode.start();
      // stop after 1s then restart every 1.2s to imitate an alarm
      alarm.beepInterval = setTimeout(()=>{ stopBeep(alarm); alarm.beepInterval = setTimeout(()=> startBeep(freq, alarm), 1200); }, 1000);
    }catch(e){ /* ignore in browsers without audio */ }
  }
  function stopBeep(alarm=null){
    try{
      if (!alarm) alarm = { beepNode: null, beepInterval: null };
      if (alarm.beepNode) { alarm.beepNode.stop(); alarm.beepNode.disconnect(); alarm.beepNode = null; }
      if (alarm.beepInterval) { clearTimeout(alarm.beepInterval); alarm.beepInterval = null; }
    }catch(e){}
  }

  // Camera controls: open, capture, close
  openCameraBtn.addEventListener('click', async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      out.textContent = 'Camera API not supported in this browser.';
      return;
    }
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      cameraVideo.srcObject = cameraStream;
      cameraVideo.style.display = 'block';
      snapshot.style.display = 'none';
      captureBtn.disabled = false;
      closeCameraBtn.disabled = false;
      out.textContent = 'Camera opened.';
    } catch (err) {
      console.error('Camera error', err);
      out.textContent = 'Error opening camera.';
    }
  });

  captureBtn.addEventListener('click', () => {
    if (!cameraStream) return;
    const video = cameraVideo;
    const canvas = cameraCanvas;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    snapshot.src = dataUrl;
    snapshot.style.display = 'block';
    out.textContent = 'Snapshot captured.';
  });

  closeCameraBtn.addEventListener('click', () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
    cameraVideo.srcObject = null;
    cameraVideo.style.display = 'none';
    captureBtn.disabled = true;
    closeCameraBtn.disabled = true;
    out.textContent = 'Camera closed.';
  });
});