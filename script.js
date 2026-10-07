/* =========================================================
   PORTFOLIO ELOÏSE ROBERT — LOGIQUE DU JEU
   ========================================================= */

/* --- 0. STOCKAGE (sécurisé : peut échouer en navigation privée) --- */
const SAVE_KEY = 'elo-portfolio-save';

function loadSave() {
    try {
        const data = JSON.parse(localStorage.getItem(SAVE_KEY));
        if (data && typeof data === 'object') return data;
    } catch (e) { /* stockage indisponible */ }
    return {};
}

const save = Object.assign({ xp: 0, visited: [], achievements: [], sound: false, theme: 'neon', snakeBest: 0 }, loadSave());

function persist() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (e) { /* on continue sans sauvegarde */ }
}

/* --- 1. AVATAR PIXEL ART (généré en SVG) --- */
const AVATAR_MAP = [
    '...HHHHHH...',
    '..HHHHHHHH..',
    '.HHHHHHHHHH.',
    '.HHSSSSSSHH.',
    '.HSSESSESSH.',
    '.HSSSSSSSSH.',
    '.HHSRSSRSHH.',
    '.HH.SMMS.HH.',
    '.HH..SS..HH.',
    '..TTTTTTTT..',
    '.STTTYYTTTS.',
    '.S.TTTTTT.S.',
    '...PPPPPP...',
    '...PP..PP...',
    '...BB..BB...'
];

const AVATAR_COLORS = {
    H: '#6b3a1f', // cheveux
    S: '#ffd2b0', // peau
    E: '#1a1033', // yeux
    R: '#ff9cb8', // joues
    M: '#d94a73', // bouche
    T: '#8b5cf6', // haut
    Y: '#ffd319', // logo
    P: '#2d2a6e', // pantalon
    B: '#111111'  // chaussures
};

function buildAvatar() {
    const w = AVATAR_MAP[0].length;
    const h = AVATAR_MAP.length;
    let rects = '';
    AVATAR_MAP.forEach((row, y) => {
        [...row].forEach((cell, x) => {
            if (AVATAR_COLORS[cell]) {
                rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${AVATAR_COLORS[cell]}"/>`;
            }
        });
    });
    return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}

const avatarSvg = buildAvatar();
document.querySelectorAll('[data-avatar]').forEach(el => { el.innerHTML = avatarSvg; });

/* --- 2. SONS 8-BIT (Web Audio) --- */
let audioCtx = null;

function beep(freq = 440, duration = 0.08, type = 'square', delay = 0) {
    if (!save.sound) return;
    try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const start = audioCtx.currentTime + delay;
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.06, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + duration);
    } catch (e) { /* audio non supporté */ }
}

const sfx = {
    move: () => beep(660, 0.04),
    select: () => { beep(523, 0.06); beep(784, 0.08, 'square', 0.06); },
    back: () => { beep(392, 0.06); beep(262, 0.08, 'square', 0.06); },
    coin: () => { beep(988, 0.06); beep(1319, 0.2, 'square', 0.06); },
    levelUp: () => [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.12, 'square', i * 0.1))
};

const soundBtn = document.getElementById('sound-btn');

function renderSoundBtn() {
    soundBtn.textContent = save.sound ? '🔊' : '🔇';
    soundBtn.setAttribute('aria-pressed', String(save.sound));
    soundBtn.setAttribute('aria-label', save.sound ? 'Couper le son' : 'Activer le son');
}

soundBtn.addEventListener('click', () => {
    save.sound = !save.sound;
    persist();
    renderSoundBtn();
    sfx.coin();
});
renderSoundBtn();

/* --- 3. HORLOGE --- */
const clockEl = document.getElementById('clock');

function updateClock() {
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (clockEl.textContent !== time) clockEl.textContent = time;
}
setInterval(updateClock, 1000);
updateClock();

/* --- 4. SUCCÈS --- */
const ACHIEVEMENTS = [
    { id: 'start', icon: '🕹️', name: 'Insert Coin', desc: 'Lancer la partie.' },
    { id: 'profil', icon: '🧙‍♀️', name: 'Enchantée !', desc: 'Consulter la fiche personnage.' },
    { id: 'coder', icon: '⌨️', name: 'Explorateur·rice de donjon', desc: 'Visiter les projets VS Code.' },
    { id: 'filter', icon: '🔎', name: 'Fin limier', desc: 'Filtrer les projets par techno.' },
    { id: 'figma', icon: '🎨', name: 'Critique d\'art', desc: 'Charger une maquette Figma.' },
    { id: 'trophy', icon: '🎖️', name: 'Chasseur·se de badges', desc: 'Visiter la salle des badges.' },
    { id: 'bonus', icon: '🍄', name: 'Niveau caché', desc: 'Trouver le niveau bonus.' },
    { id: 'contact', icon: '💾', name: 'Partie sauvegardée', desc: 'Envoyer un message.' },
    { id: 'all', icon: '⭐', name: '100 % complété', desc: 'Visiter tous les niveaux de la carte.' },
    { id: 'theme', icon: '🎨', name: 'Styliste', desc: 'Changer le thème de couleurs.' },
    { id: 'snake', icon: '🐍', name: 'Chasseur·se de bugs', desc: 'Atteindre 10 points au Snake.' },
    { id: 'night', icon: '🦉', name: 'Oiseau de nuit', desc: 'Jouer entre 22 h et 6 h.' },
    { id: 'konami', icon: '🌈', name: 'Code secret', desc: '↑ ↑ ↓ ↓ ← → ← → B A' }
];

const toastZone = document.getElementById('toast-zone');
const achList = document.getElementById('achievements-list');
document.getElementById('ach-total').textContent = ACHIEVEMENTS.length;

function renderAchievements() {
    document.getElementById('ach-count').textContent = save.achievements.length;
    achList.innerHTML = ACHIEVEMENTS.map(a => {
        const unlocked = save.achievements.includes(a.id);
        return `<li class="achievement${unlocked ? ' unlocked' : ''}">
            <span class="ach-icon" aria-hidden="true">${unlocked ? a.icon : '🔒'}</span>
            <div><strong>${unlocked ? a.name : '???'}</strong><p>${a.desc}</p></div>
            <span class="visually-hidden">${unlocked ? '(débloqué)' : '(verrouillé)'}</span>
        </li>`;
    }).join('');
}

function unlock(id) {
    if (save.achievements.includes(id)) return;
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return;

    save.achievements.push(id);
    persist();
    renderAchievements();
    addXp(40);
    sfx.coin();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="ach-icon" aria-hidden="true">${ach.icon}</span>
        <div><small>SUCCÈS DÉBLOQUÉ</small>${ach.name}</div>`;
    toastZone.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

/* --- 5. EXPÉRIENCE & NIVEAU --- */
const XP_PER_LEVEL = 100;
const xpFill = document.getElementById('xp-fill');
const xpText = document.getElementById('xp-text');
const levelEl = document.getElementById('hud-level');

function renderXp() {
    const level = Math.floor(save.xp / XP_PER_LEVEL) + 1;
    const current = save.xp % XP_PER_LEVEL;
    levelEl.textContent = level;
    xpFill.style.setProperty('--v', `${current}%`);
    xpText.textContent = `${current}/${XP_PER_LEVEL}`;
}

function addXp(amount) {
    const before = Math.floor(save.xp / XP_PER_LEVEL);
    save.xp += amount;
    persist();
    renderXp();

    if (Math.floor(save.xp / XP_PER_LEVEL) > before) {
        const banner = document.createElement('div');
        banner.className = 'level-up';
        banner.setAttribute('aria-hidden', 'true');
        banner.textContent = 'LEVEL UP!';
        document.body.appendChild(banner);
        setTimeout(() => banner.remove(), 1700);
        setTimeout(sfx.levelUp, 150);
    }
}

/* --- 6. NAVIGATION ENTRE LES ÉCRANS (routeur par hash) --- */
const screens = document.querySelectorAll('.screen');
const levelLinks = document.querySelectorAll('.level');
const LEVELS = [...levelLinks].map(a => a.getAttribute('href').slice(1));
const stage = document.getElementById('main');

const SCREEN_ACHIEVEMENTS = {
    profil: 'profil',
    vscode: 'coder',
    certifications: 'trophy',
    autres: 'bonus'
};

function renderClearedLevels() {
    levelLinks.forEach(link => {
        const id = link.getAttribute('href').slice(1);
        link.classList.toggle('cleared', save.visited.includes(id));
    });
}

function showScreen(name, { focus = true } = {}) {
    const target = [...screens].find(s => s.dataset.screen === name) ? name : 'map';

    screens.forEach(s => { s.hidden = s.dataset.screen !== target; });
    window.scrollTo(0, 0);

    // On met le Snake en pause quand on quitte la salle d'arcade
    if (target !== 'arcade') pauseSnake();

    // Première visite d'un niveau = XP
    if (LEVELS.includes(target) && !save.visited.includes(target)) {
        save.visited.push(target);
        persist();
        addXp(25);
        renderClearedLevels();
        if (LEVELS.every(l => save.visited.includes(l))) unlock('all');
    }
    if (SCREEN_ACHIEVEMENTS[target]) unlock(SCREEN_ACHIEVEMENTS[target]);

    // Titre de l'onglet
    const heading = document.querySelector(`.screen[data-screen="${target}"] .screen-title`);
    document.title = target === 'map'
        ? 'Eloise Robert | Développeuse Web Freelance & Étudiante BTS SIO'
        : `${heading.textContent.replace(/^\S+\s/, '').trim()} | Eloise Robert`;

    if (target === 'map') {
        startTypewriter();
        if (focus) {
            const last = sessionStorage.getItem('elo-last-level');
            const link = last && document.querySelector(`.level[href="#${last}"]`);
            (link || levelLinks[0]).focus({ preventScroll: true });
        }
    } else {
        try { sessionStorage.setItem('elo-last-level', target); } catch (e) { /* ignore */ }
        if (focus) stage.focus({ preventScroll: true });
    }
}

window.addEventListener('hashchange', () => {
    sfx.select();
    showScreen(location.hash.slice(1) || 'map');
});

/* --- 7. ÉCRAN TITRE --- */
const titleScreen = document.getElementById('title-screen');
const game = document.getElementById('game');
let started = false;

function startGame() {
    if (started) return;
    started = true;
    sfx.coin();
    titleScreen.classList.add('leaving');
    game.hidden = false;
    try { sessionStorage.setItem('elo-started', '1'); } catch (e) { /* ignore */ }

    setTimeout(() => { titleScreen.hidden = true; }, 600);
    showScreen(location.hash.slice(1) || 'map');
    unlock('start');

    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) unlock('night');
}

document.getElementById('start-btn').addEventListener('click', startGame);
titleScreen.addEventListener('click', startGame);

/* --- 8. CLAVIER : flèches sur la carte, Échap pour revenir --- */
document.addEventListener('keydown', (e) => {
    if (!started) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            startGame();
        }
        return;
    }

    const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);

    if (e.key === 'Escape' && !typing && location.hash && location.hash !== '#map') {
        sfx.back();
        location.hash = 'map';
        return;
    }

    // Déplacement dans la grille des niveaux
    const index = [...levelLinks].indexOf(document.activeElement);
    if (index === -1) return;

    const grid = document.querySelector('.level-grid');
    const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    const moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns };

    if (moves[e.key] !== undefined) {
        e.preventDefault();
        const next = levelLinks[index + moves[e.key]];
        if (next) {
            next.focus();
            sfx.move();
        }
    }
});

levelLinks.forEach(link => link.addEventListener('mouseenter', sfx.move));

/* --- 9. BOÎTE DE DIALOGUE (effet machine à écrire) --- */
const typeEl = document.querySelector('.typewriter');
let typeTimer = null;

function startTypewriter() {
    const text = typeEl.dataset.text;
    clearInterval(typeTimer);
    typeEl.classList.remove('done');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        typeEl.textContent = text;
        typeEl.classList.add('done');
        return;
    }

    let i = 0;
    typeEl.textContent = '';
    typeTimer = setInterval(() => {
        typeEl.textContent = text.slice(0, ++i);
        if (i % 3 === 0) beep(1200, 0.02);
        if (i >= text.length) {
            clearInterval(typeTimer);
            typeEl.classList.add('done');
        }
    }, 28);
}

// Clic sur la boîte = afficher tout le texte d'un coup
document.querySelector('.intro-dialog').addEventListener('click', () => {
    clearInterval(typeTimer);
    typeEl.textContent = typeEl.dataset.text;
    typeEl.classList.add('done');
});

/* --- 10. INVENTAIRE (infobulle) --- */
const tooltip = document.getElementById('item-tooltip');
const LVL_LABELS = ['', 'Débutante', 'Apprentie', 'Confirmée', 'Experte', 'Maîtresse'];

document.querySelectorAll('.item').forEach(item => {
    item.tabIndex = 0;
    const show = () => {
        const name = item.querySelector('.item-name').textContent;
        const lvl = Number(item.dataset.lvl);
        tooltip.innerHTML = `<strong>${name}</strong> — Niveau ${lvl}/5 : ${LVL_LABELS[lvl]} ${'★'.repeat(lvl)}${'☆'.repeat(5 - lvl)}`;
    };
    item.addEventListener('mouseenter', show);
    item.addEventListener('focus', show);
});

/* --- 11. FILTRES DES PROJETS VS CODE --- */
const filterBtns = document.querySelectorAll('.filter-btn');
const projects = document.querySelectorAll('[data-screen="vscode"] .cartridge');
const emptyMsg = document.getElementById('empty-msg');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        filterBtns.forEach(b => b.classList.toggle('active', b === btn));

        let visible = 0;
        projects.forEach(p => {
            const show = filter === 'all' || p.dataset.tech.split(' ').includes(filter);
            p.hidden = !show;
            if (show) visible++;
        });
        emptyMsg.hidden = visible > 0;

        sfx.move();
        if (filter !== 'all') unlock('filter');
    });
});

/* --- 12. MAQUETTES FIGMA CHARGÉES À LA DEMANDE --- */
document.querySelectorAll('.embed').forEach(box => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pixel-btn';
    btn.textContent = '▶ Charger';
    btn.setAttribute('aria-label', `Charger : ${box.dataset.title}`);
    box.appendChild(btn);

    btn.addEventListener('click', () => {
        const iframe = document.createElement('iframe');
        iframe.src = box.dataset.src;
        iframe.title = box.dataset.title;
        iframe.loading = 'lazy';
        iframe.allowFullscreen = true;
        box.replaceChildren(iframe);
        sfx.select();
        unlock('figma');
    });
});

/* --- 13. FORMULAIRE DE CONTACT (Formspree) --- */
const form = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    formStatus.className = 'form-status';
    formStatus.textContent = 'Sauvegarde en cours…';

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error(response.status);

        form.reset();
        formStatus.classList.add('ok');
        formStatus.textContent = '✔ Partie sauvegardée ! Ton message a bien été envoyé.';
        unlock('contact');
    } catch (err) {
        formStatus.classList.add('error');
        formStatus.textContent = '✖ Game over… L\'envoi a échoué. Réessaie ou écris-moi par email.';
    } finally {
        submitBtn.disabled = false;
    }
});

/* --- 14. CODE KONAMI --- */
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiPos = 0;

document.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    konamiPos = key === KONAMI[konamiPos] ? konamiPos + 1 : (key === KONAMI[0] ? 1 : 0);

    if (konamiPos === KONAMI.length) {
        konamiPos = 0;
        document.body.classList.toggle('rainbow');
        sfx.levelUp();
        unlock('konami');
    }
});

/* --- 15. NOUVELLE PARTIE --- */
document.getElementById('reset-btn').addEventListener('click', () => {
    if (!confirm('Effacer ta progression et recommencer une nouvelle partie ?')) return;
    save.xp = 0;
    save.visited = [];
    save.achievements = [];
    persist();
    renderXp();
    renderAchievements();
    renderClearedLevels();
    sfx.back();
});

/* --- 16. THÈMES DE COULEURS --- */
const THEMES = [
    { id: 'neon', name: 'Néon' },
    { id: 'gameboy', name: 'Game Boy' },
    { id: 'console', name: 'Console' },
    { id: 'lave', name: 'Lave' }
];
const themeBtn = document.getElementById('theme-btn');
const themeName = document.getElementById('theme-name');

function applyTheme(id) {
    const theme = THEMES.find(t => t.id === id) || THEMES[0];
    if (theme.id === 'neon') {
        delete document.documentElement.dataset.theme;
    } else {
        document.documentElement.dataset.theme = theme.id;
    }
    themeName.textContent = theme.name;
    themeBtn.setAttribute('aria-label', `Thème : ${theme.name}. Changer de thème`);

    // Couleur de la barre du navigateur sur mobile
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    document.querySelector('meta[name="theme-color"]').setAttribute('content', bg);

    drawSnake(); // le jeu reprend les couleurs du thème
}

themeBtn.addEventListener('click', () => {
    const index = THEMES.findIndex(t => t.id === save.theme);
    save.theme = THEMES[(index + 1) % THEMES.length].id;
    persist();
    applyTheme(save.theme);
    sfx.select();
    unlock('theme');
});

/* --- 17. MINI-JEU SNAKE --- */
const canvas = document.getElementById('snake');
const ctx = canvas.getContext('2d');
const snakeOverlay = document.getElementById('snake-overlay');
const snakeMsg = document.getElementById('snake-msg');
const snakeStartBtn = document.getElementById('snake-start');
const scoreEl = document.getElementById('snake-score');
const bestEl = document.getElementById('snake-best');
const titleHiscore = document.getElementById('title-hiscore');

const CELLS = 20;                       // grille de 20 x 20
const CELL = canvas.width / CELLS;      // taille d'une case en pixels
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

let snake = [];
let food = null;
let dir = 'right';
let dirQueue = [];
let score = 0;
let snakeTimer = null;
let snakeState = 'idle'; // idle | running | paused | over

function renderBest() {
    bestEl.textContent = save.snakeBest;
    titleHiscore.textContent = String(save.snakeBest * 100).padStart(6, '0');
}

function placeFood() {
    do {
        food = { x: Math.floor(Math.random() * CELLS), y: Math.floor(Math.random() * CELLS) };
    } while (snake.some(s => s.x === food.x && s.y === food.y));
}

function resetSnake() {
    snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
    dir = 'right';
    dirQueue = [];
    score = 0;
    scoreEl.textContent = 0;
    placeFood();
}

function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function drawSnake() {
    const colors = {
        bg: cssVar('--deep'),
        grid: cssVar('--panel'),
        body: cssVar('--green'),
        head: cssVar('--yellow'),
        bug: cssVar('--pink')
    };

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Petits points de grille
    ctx.fillStyle = colors.grid;
    for (let x = 0; x < CELLS; x++) {
        for (let y = 0; y < CELLS; y++) {
            ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2);
        }
    }

    // Le bug (nourriture) en pixel art : corps + pattes
    if (food) {
        const fx = food.x * CELL;
        const fy = food.y * CELL;
        ctx.fillStyle = colors.bug;
        ctx.fillRect(fx + 5, fy + 4, 10, 12);
        ctx.fillRect(fx + 2, fy + 6, 3, 2);
        ctx.fillRect(fx + 15, fy + 6, 3, 2);
        ctx.fillRect(fx + 2, fy + 12, 3, 2);
        ctx.fillRect(fx + 15, fy + 12, 3, 2);
        ctx.fillRect(fx + 7, fy + 1, 2, 3);
        ctx.fillRect(fx + 11, fy + 1, 2, 3);
    }

    // Le serpent
    snake.forEach((part, i) => {
        ctx.fillStyle = i === 0 ? colors.head : colors.body;
        ctx.fillRect(part.x * CELL + 1, part.y * CELL + 1, CELL - 2, CELL - 2);
    });

    // Les yeux
    if (snake.length) {
        const head = snake[0];
        const [dx, dy] = DIRS[dir];
        // Centre des yeux : décalé vers l'avant, puis écarté de chaque côté
        const cx = head.x * CELL + CELL / 2 + dx * 4;
        const cy = head.y * CELL + CELL / 2 + dy * 4;
        ctx.fillStyle = colors.bg;
        ctx.fillRect(cx - dy * 4 - 1, cy + dx * 4 - 1, 3, 3);
        ctx.fillRect(cx + dy * 4 - 1, cy - dx * 4 - 1, 3, 3);
    }
}

function setDirection(newDir) {
    if (snakeState !== 'running') return;
    const last = dirQueue.length ? dirQueue[dirQueue.length - 1] : dir;
    if (newDir !== last && newDir !== OPPOSITE[last] && dirQueue.length < 3) {
        dirQueue.push(newDir);
    }
}

function tick() {
    if (dirQueue.length) dir = dirQueue.shift();
    const [dx, dy] = DIRS[dir];
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    const hitWall = head.x < 0 || head.y < 0 || head.x >= CELLS || head.y >= CELLS;
    const hitSelf = snake.slice(0, -1).some(s => s.x === head.x && s.y === head.y);
    if (hitWall || hitSelf) {
        gameOver();
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = score;
        beep(880, 0.05);
        beep(1320, 0.07, 'square', 0.05);
        if (score === 10) unlock('snake');
        placeFood();
        // Ça accélère un peu tous les 5 bugs
        if (score % 5 === 0) startLoop();
    } else {
        snake.pop();
    }

    drawSnake();
}

function startLoop() {
    clearInterval(snakeTimer);
    const speed = Math.max(60, 140 - Math.floor(score / 5) * 12);
    snakeTimer = setInterval(tick, speed);
}

function showOverlay(message, button) {
    snakeMsg.innerHTML = message;
    snakeStartBtn.textContent = button;
    snakeOverlay.hidden = false;
}

function startSnake() {
    if (snakeState === 'running') return;
    if (snakeState !== 'paused') resetSnake();
    snakeState = 'running';
    snakeOverlay.hidden = true;
    drawSnake();
    startLoop();
    sfx.select();
    canvas.focus({ preventScroll: true });
}

function pauseSnake() {
    if (snakeState !== 'running') return;
    clearInterval(snakeTimer);
    snakeState = 'paused';
    showOverlay('PAUSE', '▶ Reprendre');
}

function gameOver() {
    clearInterval(snakeTimer);
    snakeState = 'over';
    sfx.back();

    let message = `GAME OVER<br>SCORE : ${score}`;
    if (score > save.snakeBest) {
        save.snakeBest = score;
        persist();
        renderBest();
        message += '<br>★ NOUVEAU RECORD ★';
    }
    showOverlay(message, '↺ Rejouer');
}

snakeStartBtn.addEventListener('click', startSnake);

// Clavier : flèches / ZQSD / WASD, espace pour la pause
const KEY_DIRS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    z: 'up', w: 'up', s: 'down', q: 'left', a: 'left', d: 'right'
};

document.addEventListener('keydown', (e) => {
    const onArcade = !document.querySelector('[data-screen="arcade"]').hidden;
    if (!onArcade || ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

    if (key === ' ' && (snakeState === 'running' || snakeState === 'paused')) {
        e.preventDefault();
        snakeState === 'running' ? pauseSnake() : startSnake();
        return;
    }

    if (KEY_DIRS[key] && snakeState === 'running') {
        e.preventDefault(); // évite que la page défile
        setDirection(KEY_DIRS[key]);
    }
});

// Croix directionnelle (mobile)
document.querySelectorAll('.dpad-btn').forEach(btn => {
    btn.addEventListener('click', () => setDirection(btn.dataset.dir));
});

// Glisser le doigt sur l'écran de jeu
let touchStart = null;
const arcadeScreen = document.querySelector('.arcade-screen');

arcadeScreen.addEventListener('touchstart', (e) => {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });

arcadeScreen.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    setDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
});

// Pause automatique si on change d'onglet
document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseSnake();
});

canvas.tabIndex = 0;
resetSnake();

/* --- INITIALISATION --- */
applyTheme(save.theme);
renderBest();
renderXp();
renderAchievements();
renderClearedLevels();

// On saute l'écran titre si la partie a déjà été lancée dans cet onglet
// ou si on arrive directement sur une section (lien partagé)
let alreadyStarted = false;
try { alreadyStarted = sessionStorage.getItem('elo-started') === '1'; } catch (e) { /* ignore */ }
if (alreadyStarted || (location.hash && location.hash !== '#map')) {
    titleScreen.hidden = true;
    startGame();
}
