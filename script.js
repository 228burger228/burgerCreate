// ===== Гамбургер-меню =====
function initHamburger(hamburgerId, navLinksId) {
  const hamburgerBtn = document.getElementById(hamburgerId);
  const navLinks = document.getElementById(navLinksId);

  hamburgerBtn.addEventListener('click', () => {
    hamburgerBtn.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  // Закрываем меню при клике по ссылке
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        hamburgerBtn.classList.remove('active');
      }
    });
  });
}

// Инициализируем для всех страниц
document.addEventListener('DOMContentLoaded', () => {
  initHamburger('hamburger', 'navLinks');
  initHamburger('hamburgerSport', 'navLinksSport');
  initHamburger('hamburgerPhoto', 'navLinksPhoto');
  initHamburger('hamburgerGenshin', 'navLinksGenshin');

  // ===== Scroll to Top =====
  const scrollButtons = [
    document.getElementById('scrollTopBtn'),
    document.getElementById('scrollTopBtnSport'),
    document.getElementById('scrollTopBtnPhoto'),
    document.getElementById('scrollTopBtnGenshin'),
  ].filter(btn => btn !== null);

  window.addEventListener('scroll', () => {
    scrollButtons.forEach(btn => {
      if (window.pageYOffset > 400) btn.style.display = 'block';
      else btn.style.display = 'none';
    });
  });
  scrollButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
});

// ===== YouTube API =====
// Глобальные переменные для музыки
window.isPlaying = false;
function onYouTubeIframeAPIReady() {
  window.player = new YT.Player('ytPlayer', {
    height: '0',
    width: '0',
    videoId: 'JC3Dj5o_ucw',
    playerVars: {
      autoplay: 0,
      controls: 0,
      loop: 1,
      playlist: 'JC3Dj5o_ucw',
      modestbranding: 1,
      rel: 0,
      iv_load_policy: 3,
      playsinline: 1
    },
    events: {
      'onReady': () => {},
      'onStateChange': e => {
        if (e.data === YT.PlayerState.ENDED) {
          window.player.playVideo();
        }
      },
      'onError': e => console.error('Ошибка плеера:', e.data)
    }
  });
}

// Эта строчка автоматически вставит <script src="https://www.youtube.com/iframe_api">
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

// 1. Плавный скролл
document.addEventListener('click', function(e) {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const target = document.querySelector(a.getAttribute('href'));
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
    // Для доступности: установка фокуса после скролла
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    history.pushState(null, '', a.getAttribute('href'));
  }
});

// 2. Dark/Light Tema Toggle
(function() {
  const key = 'theme';
  const btn = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
  }

  function detectSystem() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  let theme = localStorage.getItem(key) || detectSystem();
  applyTheme(theme);

  if (btn) {
    btn.addEventListener('click', () => {
      theme = (theme === 'dark') ? 'light' : 'dark';
      localStorage.setItem(key, theme);
      applyTheme(theme);
    });
  }

  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', e => {
      if (!localStorage.getItem(key)) {
        theme = e.matches ? 'dark' : 'light';
        applyTheme(theme);
      }
    });
})();

// 3. Netlify Forms – отправка формы
(function() {
  const form = document.querySelector('form[name="contact"][data-netlify="true"]');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data).toString()
    })
    .then(() => form.innerHTML = '<p>Спасибо! Форма успешно отправлена.</p>')
    .catch(err => alert('Ошибка отправки: ' + err));
  });
})();


document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[name="contact"]');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = new URLSearchParams(new FormData(form)).toString();

    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data,
      });
      alert('Спасибо! Ваше сообщение отправлено.');
      form.reset();
    } catch (err) {
      alert('Ошибка отправки. Попробуйте позже.');
    }
  });
});

