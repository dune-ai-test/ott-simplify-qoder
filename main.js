const desktopMovies = [
  {
    title: 'The Last Signal',
    platform: 'Netflix',
    mark: 'N',
    image: './img-l/82066-70.jpg',
    releaseIn: 5,
    genre: 'Sci-fi thriller',
    accent: '206, 67, 43',
    position: '50% 50%',
  },
  {
    title: 'Silent Orbit',
    platform: 'Disney+',
    mark: 'D+',
    image: './img-l/121361-77.jpg',
    releaseIn: 12,
    genre: 'Space drama',
    accent: '42, 112, 159',
    position: '50% 50%',
  },
  {
    title: 'After the Rain',
    platform: 'Prime Video',
    mark: 'PV',
    image: './img-l/654018fba1b98.jpg',
    releaseIn: 19,
    genre: 'Romantic drama',
    accent: '176, 105, 49',
    position: '50% 50%',
  },
  {
    title: 'Neon Requiem',
    platform: 'Apple TV+',
    mark: 'A',
    image: './img-l/75760-26.jpg',
    releaseIn: 0,
    genre: 'Neo-noir musical',
    accent: '142, 35, 88',
    position: '50% 50%',
  },
  {
    title: 'North of Nowhere',
    platform: 'Max',
    mark: 'M',
    image: './img-l/6228dc6e91741.jpg',
    releaseIn: -4,
    genre: 'Survival thriller',
    accent: '77, 99, 119',
    position: '50% 50%',
  },
  {
    title: 'Paper Moon',
    platform: 'Disney+',
    mark: 'D+',
    image: './img-l/695cb8d8b9b1b.jpg',
    releaseIn: 40,
    genre: 'Family adventure',
    accent: '124, 104, 164',
    position: '50% 50%',
  },
];

const mobileMovies = [
  {
    title: 'Echoes of Us',
    platform: 'Netflix',
    mark: 'N',
    image: './img-p/82066-1.jpg',
    releaseIn: 3,
    genre: 'Romantic drama',
    accent: '171, 117, 58',
    position: '50% 50%',
  },
  {
    title: 'Night Archive',
    platform: 'Hulu',
    mark: 'H',
    image: './img-p/71663-15.jpg',
    releaseIn: 0,
    genre: 'Mystery thriller',
    accent: '56, 91, 130',
    position: '50% 50%',
  },
  {
    title: 'Wildflower',
    platform: 'Apple TV+',
    mark: 'A',
    image: './img-p/121361-4.jpg',
    releaseIn: 16,
    genre: 'Coming of age',
    accent: '105, 128, 116',
    position: '50% 50%',
  },
  {
    title: 'Violet Hours',
    platform: 'Prime Video',
    mark: 'PV',
    image: './img-p/6319a87a3553a.jpg',
    releaseIn: -3,
    genre: 'Music drama',
    accent: '111, 64, 137',
    position: '50% 50%',
  },
  {
    title: 'Paper Moon',
    platform: 'Disney+',
    mark: 'D+',
    image: './img-p/80379-18.jpg',
    releaseIn: 30,
    genre: 'Animated adventure',
    accent: '112, 97, 153',
    position: '50% 50%',
  },
];

const introKey = 'premiere-intro-played';
let playIntro = false;

try {
  playIntro = !window.sessionStorage.getItem(introKey);
} catch {
  playIntro = true;
}

if (playIntro) document.documentElement.classList.add('intro-pending');

const arrowIcon = (direction) => `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="${direction === 'left' ? 'M15 5l-7 7 7 7M8 12h11' : 'M9 5l7 7-7 7M16 12H5'}" />
  </svg>`;

const app = document.querySelector('#app');
app.innerHTML = `
  <div class="ambient" aria-hidden="true"></div>
  <div class="ambient" aria-hidden="true"></div>
  <div class="noise" aria-hidden="true"></div>
  <div class="app-shell">
    <main class="main">
      <section class="carousel" aria-roledescription="carousel" aria-label="Upcoming movie releases">
        <div class="poster-stage" aria-live="off"></div>

        <div class="details-row">
          <button class="arrow-button previous" type="button" aria-label="Previous movie">${arrowIcon('left')}</button>
          <div class="details" aria-live="polite" aria-atomic="true">
            <div class="details-content"></div>
          </div>
          <button class="arrow-button next" type="button" aria-label="Next movie">${arrowIcon('right')}</button>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="section-label"><span></span> PREMIERES &amp; RELEASES</div>
      <div class="dots" role="group" aria-label="Choose a movie"></div>
      <div class="playback-meta">
        <span class="autoplay-label">AUTOPLAY</span>
        <span class="autoplay-track" aria-hidden="true"><span></span></span>
        <span class="slide-count"></span>
      </div>
    </footer>
  </div>
  <div class="curtain" aria-hidden="true">
    <span class="curtain-bar curtain-bar-top"></span>
    <span class="curtain-bar curtain-bar-bottom"></span>
    <span class="curtain-seam"></span>
  </div>
`;

const stage = document.querySelector('.poster-stage');
const details = document.querySelector('.details-content');
const dots = document.querySelector('.dots');
const ambientLayers = [...document.querySelectorAll('.ambient')];
const autoplayTrack = document.querySelector('.autoplay-track');
const mobileQuery = window.matchMedia('(max-width: 767px)');
const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
const AUTOPLAY_DELAY = 5000;

let movies = [];
let activeIndex = 0;
let ambientIndex = 0;
let autoplayTimer;
let pointerStart = null;
let suppressClick = false;

function getReleaseDate(releaseIn) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + releaseIn);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date).toUpperCase();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resetPosterLife() {
  stage.classList.remove('is-tilting');
  stage.style.setProperty('--tilt-x', '0deg');
  stage.style.setProperty('--tilt-y', '0deg');
  stage.style.setProperty('--img-x', '0px');
  stage.style.setProperty('--img-y', '0px');
  stage.style.setProperty('--spot-opacity', '0');
}

function updatePosterLife(event) {
  if (!finePointerQuery.matches || pointerStart) return;

  const poster = stage.querySelector('.poster.is-active');
  if (!poster) return;

  const stageRect = stage.getBoundingClientRect();
  const width = poster.offsetWidth;
  const height = poster.offsetHeight;
  const left = stageRect.left + (stageRect.width - width) / 2;
  const top = stageRect.top + (stageRect.height - height) / 2;
  const pointerX = clamp((event.clientX - left) / width, 0, 1);
  const pointerY = clamp((event.clientY - top) / height, 0, 1);

  stage.classList.add('is-tilting');
  stage.style.setProperty('--tilt-x', `${((pointerY - 0.5) * 2.6).toFixed(2)}deg`);
  stage.style.setProperty('--tilt-y', `${((0.5 - pointerX) * 2.6).toFixed(2)}deg`);
  stage.style.setProperty('--img-x', `${((0.5 - pointerX) * 18).toFixed(2)}px`);
  stage.style.setProperty('--img-y', `${((0.5 - pointerY) * 14).toFixed(2)}px`);
  stage.style.setProperty('--spot-x', `${(pointerX * 100).toFixed(2)}%`);
  stage.style.setProperty('--spot-y', `${(pointerY * 100).toFixed(2)}%`);
  stage.style.setProperty('--spot-opacity', '1');
}

function getPosition(index) {
  const distance = (index - activeIndex + movies.length) % movies.length;
  if (distance === 0) return 'is-active';
  if (distance === 1) return 'is-next';
  if (distance === movies.length - 1) return 'is-prev';
  return 'is-hidden';
}

function getReleaseStatus(releaseIn) {
  if (releaseIn === 0) return 'live';
  return releaseIn < 0 ? 'released' : 'upcoming';
}

function statusBadge(movie) {
  const status = getReleaseStatus(movie.releaseIn);
  if (status === 'live') return '<span class="poster-badge poster-badge-live"><i></i>Live now</span>';
  if (status === 'released') return '<span class="poster-badge poster-badge-released">Now streaming</span>';
  return '';
}

function posterBloomMarkup() {
  const petals = [];
  const longSide = 7;
  const shortSide = 8;

  for (let i = 0; i < longSide; i += 1) {
    const x = 8 + (i / (longSide - 1)) * 84;
    const topDelay = i * 0.55;
    const bottomDelay = i * 0.55 + 0.9;
    petals.push(`<i class="poster-petal-top" style="--x:${x.toFixed(2)}%;--y:0%;--a:0deg;--d:${topDelay.toFixed(2)}s"></i>`);
    petals.push(`<i class="poster-petal-bottom" style="--x:${x.toFixed(2)}%;--y:100%;--a:180deg;--d:${bottomDelay.toFixed(2)}s"></i>`);
  }

  for (let i = 0; i < shortSide; i += 1) {
    const y = 8 + (i / (shortSide - 1)) * 84;
    const leftDelay = i * 0.48 + 1.6;
    const rightDelay = i * 0.48 + 2.4;
    petals.push(`<i class="poster-petal-left" style="--x:0%;--y:${y.toFixed(2)}%;--a:270deg;--d:${leftDelay.toFixed(2)}s"></i>`);
    petals.push(`<i class="poster-petal-right" style="--x:100%;--y:${y.toFixed(2)}%;--a:90deg;--d:${rightDelay.toFixed(2)}s"></i>`);
  }

  return `<span class="poster-bloom" aria-hidden="true">${petals.join('')}</span>`;
}

function renderSlides() {
  stage.innerHTML = movies.map((movie, index) => {
    const status = getReleaseStatus(movie.releaseIn);
    const statusClass = status === 'upcoming' ? '' : ` is-${status}`;
    return `
    <button class="poster ${getPosition(index)}${statusClass}" type="button" data-index="${index}" aria-label="Show ${movie.title}">
      <span class="poster-media">
        <img src="${movie.image}" alt="${movie.title} movie poster" draggable="false" style="object-position: ${movie.position}" ${index === 0 ? 'fetchpriority="high"' : ''} />
        <span class="poster-vignette" aria-hidden="true"></span>
      </span>
      ${status === 'live' ? posterBloomMarkup() : ''}
      ${statusBadge(movie)}
      <span class="poster-side-title" aria-hidden="true">${movie.title}</span>
    </button>
  `;
  }).join('') + '<span class="projector-bloom" aria-hidden="true"></span>';

  stage.querySelectorAll('.poster').forEach((poster) => {
    poster.addEventListener('click', () => {
      const index = Number(poster.dataset.index);
      if (index !== activeIndex) setMovie(index);
    });
  });
}

function renderDetails() {
  const movie = movies[activeIndex];
  const status = getReleaseStatus(movie.releaseIn);
  let availability = `IN ${movie.releaseIn} ${movie.releaseIn === 1 ? 'DAY' : 'DAYS'}`;
  let availabilityClass = '';
  if (status === 'live') {
    availability = 'LIVE NOW';
    availabilityClass = ' is-live';
  } else if (status === 'released') {
    availability = 'NOW STREAMING';
    availabilityClass = ' is-released';
  }
  details.innerHTML = `
    <div class="platform-line platform-${movie.platform.toLowerCase().replaceAll(' ', '-').replace('+', '')}">
      <span class="platform-mark">${movie.mark}</span>
      <span class="platform-name">${movie.platform}</span>
    </div>
    <div class="release-line">
      <span>${getReleaseDate(movie.releaseIn)}</span>
      <span class="release-dot"></span>
      <span class="countdown${availabilityClass}">${availability}</span>
    </div>
    <h1 class="movie-title">${movie.title}</h1>
  `;
  details.classList.remove('details-enter');
  void details.offsetWidth;
  details.classList.add('details-enter');
}

function renderDots() {
  dots.innerHTML = movies.map((movie, index) => `
    <button class="dot ${index === activeIndex ? 'is-active' : ''}" type="button" data-index="${index}" aria-label="Show ${movie.title}" aria-pressed="${index === activeIndex}"><span></span></button>
  `).join('');
  dots.querySelectorAll('.dot').forEach((dot) => {
    dot.addEventListener('click', () => setMovie(Number(dot.dataset.index)));
  });
}

function renderState() {
  stage.querySelectorAll('.poster').forEach((poster, index) => {
    const position = getPosition(index);
    const status = getReleaseStatus(movies[index].releaseIn);
    const statusClass = status === 'upcoming' ? '' : ` is-${status}`;
    poster.className = `poster ${position}${statusClass}`;
    poster.tabIndex = position === 'is-hidden' ? -1 : 0;
    poster.setAttribute('aria-hidden', position === 'is-hidden');
    if (position === 'is-active') {
      poster.setAttribute('aria-current', 'true');
      poster.setAttribute('aria-label', `${movies[index].title}, current movie`);
    } else {
      poster.removeAttribute('aria-current');
      poster.setAttribute('aria-label', `Show ${movies[index].title}`);
    }
  });
  document.querySelector('.slide-count').innerHTML = `<strong>${String(activeIndex + 1).padStart(2, '0')}</strong><span>/</span>${String(movies.length).padStart(2, '0')}`;
  renderDetails();
  renderDots();
}

function scheduleAutoplay() {
  window.clearTimeout(autoplayTimer);
  autoplayTrack.classList.remove('is-running');
  void autoplayTrack.offsetWidth;
  autoplayTrack.classList.add('is-running');
  autoplayTimer = window.setTimeout(() => {
    setMovie(activeIndex + 1);
  }, AUTOPLAY_DELAY);
}

function setMovie(index) {
  const nextIndex = (index + movies.length) % movies.length;
  activeIndex = nextIndex;
  const movie = movies[activeIndex];
  document.documentElement.style.setProperty('--accent-rgb', movie.accent);
  document.documentElement.style.setProperty('--accent-color', `rgb(${movie.accent})`);

  const nextAmbient = ambientLayers[(ambientIndex + 1) % ambientLayers.length];
  nextAmbient.style.backgroundImage = `url("${movie.image}")`;
  nextAmbient.classList.add('is-visible');
  ambientLayers[ambientIndex].classList.remove('is-visible');
  ambientIndex = (ambientIndex + 1) % ambientLayers.length;

  resetPosterLife();
  renderState();
  scheduleAutoplay();
}

function buildCarousel() {
  window.clearTimeout(autoplayTimer);
  movies = mobileQuery.matches ? mobileMovies : desktopMovies;
  activeIndex = 0;
  movies.forEach((movie) => {
    const image = new Image();
    image.src = movie.image;
  });
  renderSlides();
  setMovie(0);
}

function finishDrag(event) {
  if (!pointerStart || (event.pointerId !== undefined && event.pointerId !== pointerStart.id)) return;
  const distance = event.clientX - pointerStart.x;
  const flicked = Math.abs(pointerStart.velocity) > 0.45 && Math.abs(distance) > 16;
  const wasDragged = Math.abs(distance) > 9;
  pointerStart = null;
  stage.classList.remove('is-dragging');
  stage.style.setProperty('--drag-x', '0px');
  if (wasDragged) {
    suppressClick = true;
    window.setTimeout(() => { suppressClick = false; }, 80);
  }
  if (Math.abs(distance) > 45 || flicked) {
    setMovie(activeIndex + (distance < 0 ? 1 : -1));
  } else {
    scheduleAutoplay();
  }
}

stage.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary || event.button !== 0) return;
  resetPosterLife();
  pointerStart = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    lastX: event.clientX,
    lastTime: event.timeStamp,
    velocity: 0,
  };
  stage.setPointerCapture(event.pointerId);
  stage.classList.add('is-dragging');
  window.clearTimeout(autoplayTimer);
  autoplayTrack.classList.remove('is-running');
});

stage.addEventListener('pointermove', (event) => {
  if (!pointerStart || event.pointerId !== pointerStart.id) return;
  const distance = event.clientX - pointerStart.x;
  const elapsed = Math.max(1, event.timeStamp - pointerStart.lastTime);
  pointerStart.velocity = (event.clientX - pointerStart.lastX) / elapsed;
  pointerStart.lastX = event.clientX;
  pointerStart.lastTime = event.timeStamp;
  stage.style.setProperty('--drag-x', `${distance * 0.65}px`);
});

stage.addEventListener('pointermove', updatePosterLife);
stage.addEventListener('pointerleave', resetPosterLife);
finePointerQuery.addEventListener('change', resetPosterLife);

stage.addEventListener('pointerup', finishDrag);
stage.addEventListener('pointercancel', finishDrag);
stage.addEventListener('click', (event) => {
  if (!suppressClick) return;
  event.preventDefault();
  event.stopPropagation();
  suppressClick = false;
}, true);

stage.addEventListener('dragstart', (event) => event.preventDefault());

document.querySelector('.previous').addEventListener('click', () => setMovie(activeIndex - 1));
document.querySelector('.next').addEventListener('click', () => setMovie(activeIndex + 1));

document.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  setMovie(activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    window.clearTimeout(autoplayTimer);
    autoplayTrack.classList.remove('is-running');
  } else {
    scheduleAutoplay();
  }
});

mobileQuery.addEventListener('change', buildCarousel);
buildCarousel();

if (playIntro) {
  try {
    window.sessionStorage.setItem(introKey, 'true');
  } catch {
    // Storage may be unavailable in private or local-file contexts.
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('intro-pending');
      document.documentElement.classList.add('intro-revealing');
      window.setTimeout(() => {
        document.documentElement.classList.remove('intro-revealing');
      }, 2200);
    });
  });
}
