/* ─── refs ─── */
const emailInput      = document.getElementById('email');
const magicInput      = document.getElementById('magicLink');
const sendBtn         = document.getElementById('sendBtn');
const verifyBtn       = document.getElementById('verifyBtn');
const resetBtn        = document.getElementById('resetBtn');
const step1           = document.getElementById('step1');
const step2           = document.getElementById('step2');
const progressBar     = document.getElementById('progressBar');
const progressText    = document.getElementById('progressText');
const responseEl      = document.getElementById('response');
const responseContent = document.getElementById('responseContent');
const logEl           = document.getElementById('log');
const clearLogBtn     = document.getElementById('clearLog');
const instructionCard = document.getElementById('instructionCard');
const successCard     = document.getElementById('successCard');
const successEmail    = document.getElementById('successEmail');
const linkFieldBlock  = document.getElementById('linkFieldBlock');
const confettiCanvas  = document.getElementById('confettiCanvas');

/* ─── state ─── */
let currentEmail = '';
let currentJobId = null;
let premiumActivated = false;

/* ─── log ─── */
function addLog(msg) {
  const t = new Date().toLocaleTimeString('id-ID', { hour12: false });
  logEl.textContent += `\n[${t}] ${msg}`;
  logEl.scrollTop = logEl.scrollHeight;
}

/* ─── response box ─── */
function showResponse(message, type = 'info') {
  responseEl.classList.remove('hidden', 'error', 'info', 'success');
  responseEl.classList.add(type === 'error' ? 'error' : type === 'success' ? 'success' : 'info');
  responseContent.textContent = typeof message === 'string'
    ? message
    : JSON.stringify(message, null, 2);
}

/* ─── step ─── */
function setStep(step) {
  document.querySelectorAll('.step').forEach(el => {
    el.classList.add('hidden');
    el.classList.remove('block');
  });
  const target = document.getElementById(step);
  if (target) { target.classList.remove('hidden'); target.classList.add('block'); }
  const first = step === 'step1';
  progressBar.style.width = first ? '50%' : '100%';
  if (progressText) progressText.textContent = first ? 'EMAIL ADDRESS' : 'VERIFICATION LINK';
}

/* ─── loading ─── */
const origHTML = {};
function setLoading(btn, loading) {
  if (!btn) return;
  if (!origHTML[btn.id]) origHTML[btn.id] = btn.innerHTML;
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a9 9 0 1 1-6.36 2.64"/></svg><span>Processing...</span>`;
    btn.classList.add('opacity-70', 'cursor-wait');
  } else {
    btn.disabled = false;
    btn.innerHTML = origHTML[btn.id];
    btn.classList.remove('opacity-70', 'cursor-wait');
  }
}

/* ─── confetti ─── */
function launchConfetti() {
  const canvas = confettiCanvas;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  const colors = ['#b9ff4a', '#8b5cf6', '#74e7ff', '#ffd84d', '#ff6b6b', '#ffffff', '#ff9f43', '#00d2d3', '#f97316', '#a3e635'];
  // shapes: 'strip' = pita panjang tipis, 'dot' = titik kecil, 'diamond' = belah ketupat, 'square' = kotak kecil
  const shapes = ['strip', 'strip', 'strip', 'dot', 'diamond', 'square'];
  const pieces = [];
  const count = 200;

  // Spawn dari tengah-atas layar seperti petasan meledak
  const cx = canvas.width / 2;
  const cy = canvas.height * 0.35;

  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * Math.PI * 2);
    const speed = Math.random() * 12 + 3;
    pieces.push({
      x: cx + (Math.random() - 0.5) * 60,
      y: cy + (Math.random() - 0.5) * 40,
      w: Math.random() * 5 + 2,   // lebar 2-7px
      h: Math.random() * 10 + 4,  // tinggi 4-14px
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
      vx: Math.cos(angle) * speed * (Math.random() * 0.8 + 0.5),
      vy: Math.sin(angle) * speed * (Math.random() * 0.8 + 0.5) - 4,
      gravity: 0.25,
      drag: 0.97,
      opacity: 1,
    });
  }

  let frame = 0;
  const maxFrames = 200;

  function drawPiece(p) {
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    if (p.shape === 'dot') {
      ctx.beginPath();
      ctx.arc(0, 0, p.w * 0.7, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'strip') {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    } else if (p.shape === 'square') {
      const s = p.w + 1;
      ctx.fillRect(-s / 2, -s / 2, s, s);
    } else if (p.shape === 'diamond') {
      const s = p.w + 2;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.6, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.6, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;

    pieces.forEach(p => {
      p.rotation += p.rotSpeed;
      p.vx *= p.drag;
      p.vy += p.gravity;
      p.vy *= p.drag;
      p.x += p.vx;
      p.y += p.vy;
      if (frame > maxFrames * 0.55) {
        p.opacity -= 0.018;
        if (p.opacity < 0) p.opacity = 0;
      }
      drawPiece(p);
    });

    if (frame < maxFrames && pieces.some(p => p.opacity > 0)) {
      requestAnimationFrame(update);
    } else {
      canvas.style.display = 'none';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  update();
}

/* ─── activate success UI ─── */
function showActivationSuccess(email) {
  premiumActivated = true;

  // swap instruction card -> success card
  instructionCard.classList.add('hidden');
  successCard.classList.remove('hidden');
  successEmail.textContent = email;

  // hide link field
  linkFieldBlock.classList.add('hidden');

  // disable verify button permanently
  verifyBtn.disabled = true;
  verifyBtn.classList.add('btn-disabled-permanent');

  // show reset button
  resetBtn.classList.remove('hidden');

  // launch confetti
  launchConfetti();
}

/* ─── SEND ─── */
sendBtn?.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  if (!email || !email.includes('@')) {
    showResponse('Enter a valid email address.', 'error');
    addLog('ERROR — alamat email tidak valid.');
    return;
  }

  currentEmail = email;
  currentJobId = null;
  setLoading(sendBtn, true);
  showResponse('Mengirim magic link ke email kamu...', 'info');
  addLog(`SEND — mengirim ke ${email}`);

  try {
    const res  = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();

    if (data?.ok) {
      currentJobId = data?.jobId || null;
      addLog('SUCCESS — magic link sent successfully!');
      addLog(`INFO — cek inbox/spam di ${email}`);
      if (currentJobId) addLog(`INFO — jobId: ${currentJobId}`);
      showResponse({ ok: true, message: 'Magic link berhasil dikirim!' }, 'success');
      setStep('step2');
    } else {
      addLog('ERROR — ' + (data?.error || 'gagal mengirim.'));
      showResponse(`Failed: ${data?.error || 'Gagal mengirim link.'}`, 'error');
    }
  } catch (err) {
    addLog('ERROR — ' + err.message);
    showResponse(`Error: ${err.message}`, 'error');
  } finally {
    setLoading(sendBtn, false);
  }
});

/* ─── VERIFY ─── */
verifyBtn?.addEventListener('click', async () => {
  if (premiumActivated) return;

  const link = magicInput.value.trim();
  if (link.length < 10) {
    showResponse('Tempel verification link dari email terlebih dahulu.', 'error');
    addLog('ERROR — verification link kosong/tidak valid.');
    return;
  }

  setLoading(verifyBtn, true);
  showResponse('Memverifikasi link...', 'info');
  addLog('VERIFY — memverifikasi link...');

  try {
    const res  = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail, link, jobId: currentJobId })
    });
    const data = await res.json();

    if (data?.ok) {
      addLog('SUCCESS — Link successfully verified!');
      addLog('SUCCESS — PREMIUM AKTIF!');
      const responseData = data.data || { duration: '1 Year', status: 'active' };
      if (!responseData.duration) responseData.duration = '1 Year';
      showResponse({ ok: true, message: data.message || 'Premium berhasil diaktifkan!', data: responseData }, 'success');
      setLoading(verifyBtn, false);
      showActivationSuccess(currentEmail);
    } else {
      addLog('ERROR — ' + (data?.error || 'verifikasi gagal.'));
      showResponse(`Failed: ${data?.error || 'Verification failed.'}`, 'error');
      setLoading(verifyBtn, false);
    }
  } catch (err) {
    addLog('ERROR — ' + err.message);
    showResponse(`Error: ${err.message}`, 'error');
    setLoading(verifyBtn, false);
  }
});

/* ─── RESET (Aktivasi Akun Lain) ─── */
resetBtn?.addEventListener('click', () => {
  premiumActivated = false;

  // reset step 1
  emailInput.value = '';
  magicInput.value = '';
  currentEmail = '';
  currentJobId = null;

  // restore instruction card
  instructionCard.classList.remove('hidden');
  successCard.classList.add('hidden');

  // restore link field
  linkFieldBlock.classList.remove('hidden');

  // restore verify btn
  verifyBtn.disabled = false;
  verifyBtn.classList.remove('btn-disabled-permanent');
  if (origHTML['verifyBtn']) verifyBtn.innerHTML = origHTML['verifyBtn'];

  // hide reset btn
  resetBtn.classList.add('hidden');

  // hide response
  responseEl.classList.add('hidden');

  // go to step1
  setStep('step1');

  addLog('INFO — reset. Siap aktivasi akun lain.');
});

/* ─── clear log ─── */
clearLogBtn?.addEventListener('click', () => {
  logEl.textContent = '[SYSTEM] Log dibersihkan.';
});

/* ─── enter key ─── */
emailInput?.addEventListener('keypress', e => { if (e.key === 'Enter' && !sendBtn.disabled) sendBtn.click(); });
magicInput?.addEventListener('keypress', e => { if (e.key === 'Enter' && !verifyBtn.disabled) verifyBtn.click(); });

/* ─── init ─── */
document.addEventListener('DOMContentLoaded', () => {
  addLog('INFO — siap digunakan.');
});
