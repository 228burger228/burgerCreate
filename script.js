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
