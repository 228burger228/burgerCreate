// ===== снежинки =====
import React, { StrictMode, useRef, useEffect } from "https://esm.sh/react";
import { createRoot } from "https://esm.sh/react-dom/client";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<InteractiveSnowfall />
	</StrictMode>
);

type Cursor = {
	radius: number;
	x?: number;
	y?: number;
}
const SnowflakePatternMap = {
    Dot: 0,
    Branches: 1,
    Spearheads: 2,
    Asterisk: 3
} as const;
type SnowflakePattern = typeof SnowflakePatternMap[keyof typeof SnowflakePatternMap];

function InteractiveSnowfall() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const cursor = useRef<Cursor>({ radius: 60 });
	const frameRef = useRef(0);
	const snowflakes = useRef<Snowflake[]>([]);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");

		if (!canvas || !ctx) return;

		const sprites: SnowflakeSprite[] = [];

		for (let s = 0; s <= 3; ++s) {
			sprites.push(new SnowflakeSprite(s as SnowflakePattern));
		}

		const animate = () => {
			const { width, height } = getCanvas();

			ctx.clearRect(0, 0, width, height);
			ctx.globalAlpha = 0.8;

			snowflakes.current.forEach((flake) => {
				flake.update(cursor.current, width, height);
				flake.draw(ctx);
			});
			frameRef.current = requestAnimationFrame(animate);
		};
		const createSnowflakes = () => {
			// keep the snowflake count proportional to the canvas area
			const { width, height } = getCanvas();
			const snowflakesMin = Math.round(width * height / 800);
			const snowflakesMax = 1000;
			const snowflakeCount = Math.min(snowflakesMin, snowflakesMax);
			const radiusMin = 4;
			const radiusMax = 10;

			snowflakes.current = [];

			for (let i = 0; i < snowflakeCount; i++) {
				const radius = Utils.random(radiusMin, radiusMax);
				const pattern = Math.round(Utils.random(0, 3)) as SnowflakePattern;
				const snowflake = new Snowflake(
					width,
					height,
					radius,
					sprites[pattern].canvas
				);

				snowflakes.current.push(snowflake);
			}
		};
		const getCanvas = () => {
			const { devicePixelRatio } = window;
			const width = canvas.width / devicePixelRatio;
			const height = canvas.height / devicePixelRatio;

			return { width, height };
		};
		const handleDown = (e: Event) => {
			const event = e as PointerEvent;

			cursor.current.x = event.clientX;
			cursor.current.y = event.clientY;
		};
		const handleUp = () => {
			const radius = cursor.current.radius;

			cursor.current.x = -radius;
			cursor.current.y = -radius;
		};
		const resize = () => {
			const { devicePixelRatio, innerWidth, innerHeight } = window;

			canvas.width = innerWidth * devicePixelRatio;
			canvas.height = innerHeight * devicePixelRatio;
			canvas.style.width = innerWidth + "px";
			canvas.style.height = innerHeight + "px";
			ctx.scale(devicePixelRatio, devicePixelRatio);

			createSnowflakes();
		};

		resize();
		animate();

		window.addEventListener("resize", resize);

		const eventMap = {
			pointerdown: handleDown,
			pointermove: handleDown,
			pointerout: handleUp,
			pointerup: handleUp
		};
		const eventMapEntries = Object.entries(eventMap);

		eventMapEntries.forEach(([event, handler]) => {
			canvas.addEventListener(event, handler);
		});

		return () => {
			window.removeEventListener("resize", resize);

			eventMapEntries.forEach(([event, handler]) => {
				canvas.removeEventListener(event, handler);
			});
			cancelAnimationFrame(frameRef.current);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			aria-label="Snow falling and a small cursor-controlled area pushing the snowflakes"
		/>
	);
}

class Snowflake {
	private x: number;
	private y: number;
	/** Angle of the snowflake */
	private rotation = Utils.random(0, Math.PI);
	/** Weight for the push effect */
	private readonly density = 50;
	/** Snowflake appearance */
	private readonly pattern: HTMLCanvasElement;
	/** Size from the center */
	private readonly radius: number;
	/** How fast the snowflake rotates clockwise or counterclockwise */
	private readonly rotationSpeed = Utils.random(-0.02, 0.02);
	/** Horizontal speed */
	private readonly speedX = Utils.random(-0.5, 0.5);
	/** Vertical speed */
	private readonly speedY = Utils.random(2, 6);

	/**
	 * @param width canvas width
	 * @param height canvas height
	 * @param radius snowflake radius
	 * @param pattern snowflake pattern
	 */
	constructor(
		width: number,
		height: number,
		radius: number,
		pattern: HTMLCanvasElement
	) {
		this.x = Utils.random(0, width);
		this.y = Utils.random(0, height);
		this.radius = radius;
		this.pattern = pattern;
	}

	/**
	 * Draw the snowflake
	 * @param ctx canvas context
	 */
	draw(ctx: CanvasRenderingContext2D): void {
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(this.rotation);
		ctx.drawImage(
            this.pattern,
            -this.radius,
            -this.radius,
            this.radius * 2,
            this.radius * 2
        );
		ctx.restore();
	}

	/**
	 * Move the snowflake
	 * @param cursor cursor object
	 * @param width canvas width
	 * @param height canvas height
	 */
	update(cursor: Cursor, width: number, height: number): void {
		// movement
		this.x += this.speedX;
		this.y += this.speedY;
		this.rotation += this.rotationSpeed;
		this.rotation %= 2 * Math.PI;

		const dx = (cursor.x ?? -cursor.radius) - this.x;
		const dy = (cursor.y ?? -cursor.radius) - this.y;
		const distance = Math.hypot(dx, dy);

		if (distance < cursor.radius) {
			// apply cursor repulsion force when in range
			const forceDirectionX = dx / distance;
			const forceDirectionY = dy / distance;
			const force = (cursor.radius - distance) / cursor.radius;
			const directionX = forceDirectionX * force * this.density;
			const directionY = forceDirectionY * force * this.density;

			this.x -= directionX;
			this.y -= directionY;
		}

		const outsideLeft = this.x < -cursor.radius;
		const outsideRight = this.x > width + cursor.radius;
		const outsideBottom = this.y > height + cursor.radius;

		if (outsideLeft || outsideRight || outsideBottom) {
			// reset when outside the canvas
			this.x = Utils.random(0, width);
			this.y = -this.radius;
		}
	}
}
class SnowflakeSprite {
	readonly canvas: HTMLCanvasElement;
	private readonly ctx: CanvasRenderingContext2D | null;
	private readonly patternType: SnowflakePattern;
	private readonly lineWidth = 1;
	private readonly radius = 10;

	constructor(patternIndex: SnowflakePattern) {
		// set up the sprite canvas
		this.canvas = document.createElement("canvas");
		this.ctx = this.canvas.getContext("2d");
		this.patternType = patternIndex;

		const { devicePixelRatio } = window;
		const size = this.radius * 2 * devicePixelRatio;

		this.canvas.width = size;
		this.canvas.height = size;

		if (this.ctx) {
			// prepare styles for drawing
			const color = "hsl(0, 0%, 100%)";

			this.ctx.fillStyle = color;
			this.ctx.strokeStyle = color;
			this.ctx.lineCap = "round";
			this.ctx.lineJoin = "round";
			this.ctx.lineWidth = this.lineWidth;
			this.ctx.scale(devicePixelRatio, devicePixelRatio);
			this.drawPattern();
		}
	}

	private drawPattern(): void {
		this.ctx?.save();
		this.ctx?.translate(this.radius, this.radius);

		if (this.patternType === SnowflakePatternMap.Dot) {
			this.drawDot();
			return;
		}
		// other patterns will have rotated sectors
		const sectors = 6;

		for (let i = 0; i < sectors; i++) {
			this.ctx?.rotate(Math.PI / (sectors / 2));

			switch (this.patternType) {
				case SnowflakePatternMap.Branches:
					this.drawBranch();
					break;

				case SnowflakePatternMap.Spearheads:
					this.drawSpearhead();
					break;

				default:
					// SnowflakePatternMap.Asterisk
					this.drawAsteriskStroke();
			}
		}
		this.ctx?.restore();
	}
	private drawAsteriskStroke(): void {
		const adjustedRadius = this.radius - 1;

		this.ctx?.beginPath();
		this.ctx?.moveTo(0, 0);
		this.ctx?.lineTo(0, adjustedRadius);
		this.ctx?.closePath();
		this.ctx?.stroke();
	}
	private drawBranch(): void {
		const adjustedRadius = this.radius - 0.5;
		const spurPos = -adjustedRadius * 0.5;
		const spurLength = adjustedRadius * 0.35;
		// main branch
		this.ctx?.beginPath();
		this.ctx?.moveTo(0, 0);
		this.ctx?.lineTo(0, -adjustedRadius);
		// side branches
		this.ctx?.moveTo(0, spurPos);
		this.ctx?.lineTo(-spurLength, spurPos - spurLength);
		this.ctx?.moveTo(0, spurPos);
		this.ctx?.lineTo(spurLength, spurPos - spurLength);
		this.ctx?.closePath();
		this.ctx?.stroke();
	}
	private drawDot(): void {
		this.ctx?.beginPath();
		this.ctx?.arc(0, 0, this.radius / 2, 0, Math.PI * 2);
		this.ctx?.closePath();
		this.ctx?.fill();
	}
	private drawSpearhead(): void {
		const adjustedRadius = this.radius - 0.5;
		const headStart = -adjustedRadius * 0.6;
		const headEnd = -adjustedRadius;
		const headWidth = adjustedRadius * 0.2;
		// main “shaft” of the spear
		this.ctx?.beginPath();
		this.ctx?.moveTo(0, 0);
		this.ctx?.lineTo(0, -adjustedRadius * 0.5);
 		// tip
		this.ctx?.moveTo(0, headEnd);
		// left corner
		this.ctx?.lineTo(-headWidth, headStart);
		// bottom notch
		this.ctx?.lineTo(0, headStart + (adjustedRadius * 0.1));
		// right corner
		this.ctx?.lineTo(headWidth, headStart);
		// finish
		this.ctx?.closePath();
		this.ctx?.stroke();
		this.ctx?.fill();
	}
}
class Utils {
	static random(min: number = 0, max: number = 1) {
		const value = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;

		return min + (value * (max - min));
	}
}



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
 //Скрипт для генш персов
//document.addEventListener('DOMContentLoaded', () => {
  //const modal = document.getElementById('charModal');
  //const modalName = document.getElementById('modalName');
 // const modalDesc = document.getElementById('modalDesc');
 // const closeBtn = modal.querySelector('.close');

 //document.querySelectorAll('.btn-char').forEach(btn => {
    //btn.addEventListener('click', () => {
    //  const card = btn.closest('.char-card');
     // modalName.textContent = card.dataset.name;
     // modalDesc.textContent = card.dataset.desc;
     // modal.style.display = 'block';
  //  });
 // });

 // closeBtn.addEventListener('click', () => {
  //  modal.style.display = 'none';
//  });

 // window.addEventListener('click', e => {
   // if (e.target === modal) modal.style.display = 'none';
 // });
//});




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
    await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: data,
    });
    alert('Спасибо! Ваше сообщение отправлено.');
    form.reset();
  });
});
