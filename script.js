// ==========================================================================
// Custom Cursor Controller
// ==========================================================================

const cursorRing = document.querySelector('.pointer-ring');
const cursorDot = document.querySelector('.pointer-dot');
let cursorX = 0, cursorY = 0;
let ringX = 0, ringY = 0;

window.addEventListener('mousemove', (e) => {
  cursorX = e.clientX;
  cursorY = e.clientY;
  cursorDot.style.left = `${cursorX}px`;
  cursorDot.style.top = `${cursorY}px`;
});

function animateCursor() {
  ringX += (cursorX - ringX) * 0.15;
  ringY += (cursorY - ringY) * 0.15;
  cursorRing.style.left = `${ringX}px`;
  cursorRing.style.top = `${ringY}px`;
  requestAnimationFrame(animateCursor);
}
animateCursor();

// Scale cursor on hover of interactive elements
const hoverables = document.querySelectorAll('a, button, select, input, textarea, .card');
hoverables.forEach(item => {
  item.addEventListener('mouseenter', () => {
    cursorRing.style.transform = 'translate(-50%, -50%) scale(1.5)';
    cursorRing.style.borderColor = 'var(--text-primary)';
  });
  item.addEventListener('mouseleave', () => {
    cursorRing.style.transform = 'translate(-50%, -50%) scale(1)';
    cursorRing.style.borderColor = 'var(--primary-color)';
  });
});

// ==========================================================================
// Preloader & Theme Manager
// ==========================================================================

window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  preloader.style.opacity = '0';
  setTimeout(() => {
    preloader.style.visibility = 'hidden';
  }, 500);
});

// Theme Manager
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'dark';

if (currentTheme === 'light') {
  document.body.classList.add('light-theme');
}

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  const theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
  localStorage.setItem('theme', theme);
});

// ==========================================================================
// Scroll Progress & Active Navigation Highlighting
// ==========================================================================

window.addEventListener('scroll', () => {
  const scrollProgress = document.getElementById('scroll-progress-bar');
  const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = (window.pageYOffset / totalHeight) * 100;
  scrollProgress.style.width = `${progress}%`;

  // Back to top button visibility
  const backToTop = document.getElementById('back-to-top');
  if (window.pageYOffset > 500) {
    backToTop.style.display = 'flex';
  } else {
    backToTop.style.display = 'none';
  }
});

document.getElementById('back-to-top').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Navigation Highlight on Scroll
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

const observerOptions = {
  root: null,
  threshold: 0.3,
  rootMargin: '0px'
};

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const activeId = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${activeId}`) {
          link.classList.add('active');
        }
      });
    }
  });
}, observerOptions);

sections.forEach(section => {
  sectionObserver.observe(section);
});

// Hamburger menu toggle for mobile
const hamburger = document.querySelector('.hamburger-menu');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
  navMenu.classList.toggle('active');
  hamburger.classList.toggle('open');
});

navMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('active');
    hamburger.classList.remove('open');
  });
});

// ==========================================================================
// Intersection Observer for Reveal Animations & Stats Counters
// ==========================================================================

const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    }
  });
}, { threshold: 0.1 });

revealElements.forEach(el => revealObserver.observe(el));

// Stats Counter Animation
const statNumbers = document.querySelectorAll('.stat-num');
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = entry.target;
      const endVal = parseInt(target.getAttribute('data-val'), 10);
      const suffix = target.getAttribute('data-suffix') || '';
      let startVal = 0;
      const duration = 2000;
      const startTime = performance.now();

      function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentVal = Math.floor(progress * endVal);
        target.textContent = currentVal + suffix;

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          target.textContent = endVal + suffix;
        }
      }
      requestAnimationFrame(updateCounter);
      statObserver.unobserve(target);
    }
  });
}, { threshold: 0.5 });

statNumbers.forEach(num => statObserver.observe(num));

// ==========================================================================
// Audio Waveform Simulator Canvas
// ==========================================================================

const canvas = document.getElementById('waveform-canvas');
const ctx = canvas.getContext('2d');
let wavePhase = 0;
let attackActive = false;
let noiseLevel = 0;

function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawWaveform() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.beginPath();
  ctx.strokeStyle = attackActive ? '#ef4444' : '#10b981';
  ctx.lineWidth = 2;

  const sliceWidth = canvas.width / 100;
  
  for (let i = 0; i < 100; i++) {
    const x = i * sliceWidth;
    let y = canvas.height / 2;

    // Normal audio component
    const amp1 = 30;
    const freq1 = 0.05;
    const sinComponent1 = Math.sin(i * freq1 + wavePhase) * amp1;

    // High frequency components representing voice details
    const amp2 = 10;
    const freq2 = 0.2;
    const sinComponent2 = Math.cos(i * freq2 - wavePhase * 1.5) * amp2;

    // Simulated attack noise perturbation
    let perturbation = 0;
    if (attackActive) {
      perturbation = (Math.random() - 0.5) * noiseLevel * 50;
    }

    y += sinComponent1 + sinComponent2 + perturbation;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();

  wavePhase += 0.07;
  requestAnimationFrame(drawWaveform);
}
drawWaveform();

// Simulator Interaction Actions
const btnGenerate = document.getElementById('btn-generate-attack');
const targetTextEl = document.getElementById('sim-original-text');
const advTextEl = document.getElementById('sim-adversarial-text');

const barPerturbation = document.getElementById('bar-perturbation');
const barWer = document.getElementById('bar-wer');
const barSuccess = document.getElementById('bar-success');

const valPerturbation = document.getElementById('val-perturbation');
const valWer = document.getElementById('val-wer');
const valSuccess = document.getElementById('val-success');

const originalTexts = [
  "Open the gate now",
  "Authorize transaction to account 421",
  "Call emergency contacts immediately",
  "Disable defense firewall safeguards"
];

// Attack simulated data mapping
const attackDatabase = {
  fgsm: {
    noise: 0.35,
    perturbation: '0.0082',
    wer: '72%',
    success: '78%',
    transcripts: {
      "Open the gate now": "Open the state now",
      "Authorize transaction to account 421": "Authorize transformation to amount 420",
      "Call emergency contacts immediately": "Call consistency contacts intermediate",
      "Disable defense firewall safeguards": "Display defense firewall signals"
    }
  },
  pgd: {
    noise: 0.22,
    perturbation: '0.0041',
    wer: '88%',
    success: '85%',
    transcripts: {
      "Open the gate now": "Close the gate now",
      "Authorize transaction to account 421": "Cancel transaction to account 421",
      "Call emergency contacts immediately": "Call alternative contacts immediately",
      "Disable defense firewall safeguards": "Enable defense firewall safeguards"
    }
  },
  cw: {
    noise: 0.12,
    perturbation: '0.0012',
    wer: '96%',
    success: '96%',
    transcripts: {
      "Open the gate now": "Transfer five thousand dollars",
      "Authorize transaction to account 421": "Authorize transfer of all funds",
      "Call emergency contacts immediately": "Open bedroom front door lock",
      "Disable defense firewall safeguards": "Route network connections outward"
    }
  },
  imperceptible: {
    noise: 0.05,
    perturbation: '0.0008',
    wer: '91%',
    success: '92%',
    transcripts: {
      "Open the gate now": "Weather reports search online",
      "Authorize transaction to account 421": "Play music playlist on speaker",
      "Call emergency contacts immediately": "Tell me a joke about robots",
      "Disable defense firewall safeguards": "How many states in the country"
    }
  }
};

btnGenerate.addEventListener('click', () => {
  const selectedAttack = document.getElementById('attack-select').value;
  const selectedModel = document.getElementById('model-select').value;
  const randomText = originalTexts[Math.floor(Math.random() * originalTexts.length)];
  
  targetTextEl.textContent = `"${randomText}"`;
  advTextEl.textContent = "Computing adversarial vector...";
  btnGenerate.disabled = true;
  
  attackActive = true;
  noiseLevel = 0.1;

  // Animate progress elements
  let simProgress = 0;
  const interval = setInterval(() => {
    simProgress += 10;
    noiseLevel = (simProgress / 100) * attackDatabase[selectedAttack].noise;
    
    if (simProgress >= 100) {
      clearInterval(interval);
      btnGenerate.disabled = false;
      
      const details = attackDatabase[selectedAttack];
      advTextEl.textContent = `"${details.transcripts[randomText]}"`;

      // Set metric values
      valPerturbation.textContent = details.perturbation;
      valWer.textContent = details.wer;
      valSuccess.textContent = details.success;

      // Fill progress bars
      barPerturbation.style.width = `${parseFloat(details.perturbation) * 10000}%`;
      barWer.style.width = details.wer;
      barSuccess.style.width = details.success;
    }
  }, 200);
});
