/* =========================================================
   PORTFOLIO ELOÏSE ROBERT — LOGIQUE DU JEU
   Le site est découpé en une page par niveau. Ce script est commun à
   toutes les pages : chaque module ne s'active que sur la page qui le
   concerne (voir <body data-page="…"> et la liste SITE dans layout.js).
   ========================================================= */

const PAGE = document.body.dataset.page;          // niveau de la page actuelle
const { pages: PAGES, levels: LEVELS } = window.SITE;
const $ = id => document.getElementById(id);      // raccourci

/* --- 0. STOCKAGE (sécurisé : peut échouer en navigation privée) --- */
const SAVE_KEY = 'elo-portfolio-save';

function loadSave() {
    try {
        const data = JSON.parse(localStorage.getItem(SAVE_KEY));
        if (data && typeof data === 'object') return data;
    } catch (e) { /* stockage indisponible */ }
    return {};
}

const save = Object.assign({
    xp: 0, visited: [], achievements: [], sound: false, theme: 'neon', snakeBest: 0,
    // Accessibilité
    font: 'pixel', spacing: false, crt: true, motion: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    classic: false // mode "recruteur pressé"
}, loadSave());

// Lien partagé avec ?mode=classique ou ?mode=jeu : on mémorise le choix puis on nettoie l'adresse
const params = new URLSearchParams(location.search);
const urlMode = params.get('mode');
if (urlMode === 'classique' || urlMode === 'jeu') {
    save.classic = urlMode === 'classique';
    params.delete('mode');
    const query = params.toString();
    history.replaceState(null, '', location.pathname + (query ? '?' + query : '') + location.hash);
}

function persist() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (e) { /* on continue sans sauvegarde */ }
}
persist();

// Anciennes adresses du site sur une seule page (index.html#profil…) : redirection vers la bonne page
if (PAGE === 'map' && location.hash.length > 1) {
    const hash = location.hash.slice(1);
    if (hash.startsWith('fiche-')) location.replace(PAGES.e5 + location.hash);
    else if (PAGES[hash] && hash !== 'map') location.replace(PAGES[hash]);
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

// Une seule image réutilisée partout : beaucoup moins d'éléments dans la page (meilleur EcoIndex)
const avatarSrc = 'data:image/svg+xml,' + encodeURIComponent(buildAvatar());
document.querySelectorAll('[data-avatar]').forEach(el => {
    const img = document.createElement('img');
    img.src = avatarSrc;
    img.alt = '';
    el.replaceChildren(img);
});

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

const soundBtn = $('sound-btn');

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
const clockEl = $('clock');

// Une mise à jour par minute, calée sur le changement de minute (au lieu de 60 par minute)
function updateClock() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setTimeout(updateClock, (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 50);
}
updateClock();

/* --- 4. SUCCÈS --- */
const ACHIEVEMENTS = [
    { id: 'start', icon: '🕹️', name: 'Insert Coin', desc: 'Lancer la partie.' },
    { id: 'profil', icon: '🧙‍♀️', name: 'Enchantée !', desc: 'Consulter la fiche personnage.' },
    { id: 'coder', icon: '⌨️', name: 'Exploration du donjon', desc: 'Visiter les projets VS Code.' },
    { id: 'filter', icon: '🔎', name: 'Fin limier', desc: 'Filtrer les projets par techno.' },
    { id: 'figma', icon: '🎨', name: 'Critique d\'art', desc: 'Charger une maquette Figma.' },
    { id: 'trophy', icon: '🎖️', name: 'Chasse aux badges', desc: 'Visiter la salle des badges.' },
    { id: 'bonus', icon: '🍄', name: 'Niveau caché', desc: 'Trouver le niveau bonus.' },
    { id: 'contact', icon: '💾', name: 'Partie sauvegardée', desc: 'Envoyer un message.' },
    { id: 'all', icon: '⭐', name: '100 % complété', desc: 'Visiter tous les niveaux de la carte.' },
    { id: 'theme', icon: '🎨', name: 'Styliste', desc: 'Changer le thème de couleurs.' },
    { id: 'snake', icon: '🐍', name: 'Chasse aux bugs', desc: 'Atteindre 10 points au Snake.' },
    { id: 'night', icon: '🦉', name: 'Oiseau de nuit', desc: 'Jouer entre 22 h et 6 h.' },
    { id: 'palette', icon: '⌨️', name: 'Ligne de commande', desc: 'Utiliser la palette de commandes (Ctrl + K).' },
    { id: 'konami', icon: '🌈', name: 'Code secret', desc: '↑ ↑ ↓ ↓ ← → ← → B A' }
];

$('ach-total').textContent = ACHIEVEMENTS.length;

function renderAchievements() {
    $('ach-count').textContent = save.achievements.length;

    // La liste détaillée n'existe que sur la page des succès
    const list = $('achievements-list');
    if (!list) return;
    list.innerHTML = ACHIEVEMENTS.map(a => {
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
    showToast(ach.icon, 'SUCCÈS DÉBLOQUÉ', ach.name);
}

// Zone de notifications : créée seulement au premier message
function showToast(icon, label, text) {
    let zone = $('toast-zone');
    if (!zone) {
        zone = document.createElement('div');
        zone.className = 'toast-zone';
        zone.id = 'toast-zone';
        zone.setAttribute('aria-live', 'polite');
        document.body.appendChild(zone);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    const iconEl = document.createElement('span');
    iconEl.className = 'ach-icon';
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.textContent = icon;
    const body = document.createElement('div');
    const small = document.createElement('small');
    small.textContent = label;
    body.append(small, text);
    toast.append(iconEl, body);
    zone.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

/* --- 5. EXPÉRIENCE & NIVEAU --- */
const XP_PER_LEVEL = 100;

function renderXp() {
    const level = Math.floor(save.xp / XP_PER_LEVEL) + 1;
    const current = save.xp % XP_PER_LEVEL;
    $('hud-level').textContent = level;
    $('xp-fill').style.setProperty('--v', `${current}%`);
    $('xp-bar').setAttribute('aria-valuenow', current);
    $('xp-text').textContent = `${current}/${XP_PER_LEVEL}`;
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

/* --- 6. VISITE D'UN NIVEAU --- */
const SCREEN_ACHIEVEMENTS = {
    profil: 'profil',
    vscode: 'coder',
    certifications: 'trophy',
    autres: 'bonus'
};

function visitPage() {
    // Première visite d'un niveau = XP
    if (LEVELS.includes(PAGE) && !save.visited.includes(PAGE)) {
        save.visited.push(PAGE);
        persist();
        addXp(25);
        if (LEVELS.every(l => save.visited.includes(l))) unlock('all');
    }
    if (SCREEN_ACHIEVEMENTS[PAGE]) unlock(SCREEN_ACHIEVEMENTS[PAGE]);
    if (PAGE !== 'map') {
        // Arrivée directe sur un niveau (lien, Google…) : pas d'écran titre en revenant à la carte
        try {
            sessionStorage.setItem('elo-last-level', PAGE);
            sessionStorage.setItem('elo-started', '1');
        } catch (e) { /* ignore */ }
    }

    unlock('start');
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) unlock('night');
}

/* --- 7. ACCUEIL : ÉCRAN TITRE, CARTE DU MONDE, MESSAGE D'ACCUEIL --- */
const titleScreen = $('title-screen');
const levelLinks = document.querySelectorAll('.level');
const pageKey = href => Object.keys(PAGES).find(k => PAGES[k] === href);
let started = PAGE !== 'map'; // l'écran titre n'existe que sur l'accueil

function renderClearedLevels() {
    levelLinks.forEach(link => {
        const cleared = save.visited.includes(pageKey(link.getAttribute('href')));
        link.classList.toggle('cleared', cleared);

        // Repère visible sans la couleur (étoile pleine / vide) et lu par les lecteurs d'écran
        link.querySelector('.level-star').textContent = cleared ? '★' : '☆';
        let status = link.querySelector('.level-status');
        if (!status) {
            status = document.createElement('span');
            status.className = 'visually-hidden level-status';
            link.appendChild(status);
        }
        status.textContent = cleared ? ' (niveau visité)' : '';
    });
}

function focusLastLevel() {
    let last = null;
    try { last = sessionStorage.getItem('elo-last-level'); } catch (e) { /* ignore */ }
    const link = last && document.querySelector(`.level[href="${PAGES[last]}"]`);
    (link || levelLinks[0])?.focus({ preventScroll: true });
}

function startGame() {
    if (started) return;
    started = true;
    sfx.coin();
    titleScreen.classList.add('leaving');
    try { sessionStorage.setItem('elo-started', '1'); } catch (e) { /* ignore */ }
    setTimeout(() => { titleScreen.hidden = true; }, 600);
    startTypewriter();
    if (!save.classic) focusLastLevel();
}

// Message d'accueil (effet machine à écrire)
const typeEl = document.querySelector('.typewriter');
let typeTimer = null;

function showFullText() {
    clearInterval(typeTimer);
    typeEl.textContent = typeEl.dataset.text;
    typeEl.classList.add('done');
}

function startTypewriter() {
    if (!typeEl) return;
    if (!save.motion || save.classic) return showFullText();

    const text = typeEl.dataset.text;
    let i = 0;
    clearInterval(typeTimer);
    typeEl.classList.remove('done');
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

if (PAGE === 'map') {
    $('start-btn').addEventListener('click', startGame);
    titleScreen.addEventListener('click', startGame);
    document.querySelector('.intro-dialog').addEventListener('click', showFullText);
    levelLinks.forEach(link => link.addEventListener('mouseenter', sfx.move));

    // Pas le temps de jouer ? → version classique
    $('classic-btn').addEventListener('click', (e) => {
        e.stopPropagation(); // ne pas déclencher "PRESS START"
        setClassic(true);
        startGame();
    });
}

/* --- 8. CLAVIER --- */
document.addEventListener('keydown', (e) => {
    // Écran titre : Entrée / Espace lancent le jeu… sauf sur le bouton "Version classique"
    if (!started) {
        if ((e.key === 'Enter' || e.key === ' ') && document.activeElement.id !== 'classic-btn') {
            e.preventDefault();
            startGame();
        }
        return;
    }

    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    if (document.querySelector('dialog[open]')) return; // Échap ferme d'abord la fenêtre ouverte

    // Échap : retour à la carte du monde
    if (e.key === 'Escape' && !typing && PAGE !== 'map') {
        sfx.back();
        location.href = PAGES.map;
        return;
    }

    // Flèches : déplacement dans la grille des niveaux
    const index = [...levelLinks].indexOf(document.activeElement);
    if (index === -1) return;
    const columns = getComputedStyle(document.querySelector('.level-grid')).gridTemplateColumns.split(' ').length;
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

/* --- 9. PROFIL : INVENTAIRE (infobulle) --- */
const tooltip = $('item-tooltip');
const LVL_LABELS = ['', 'Débutante', 'Apprentie', 'Confirmée', 'Experte', 'Maîtresse'];

if (tooltip) {
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
}

/* --- 10. PROJETS : FILTRES PAR TECHNO --- */
const filterBtns = document.querySelectorAll('.filter-btn');

filterBtns.forEach(btn => {
    btn.setAttribute('aria-pressed', String(btn.classList.contains('active')));
    btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        filterBtns.forEach(b => {
            b.classList.toggle('active', b === btn);
            b.setAttribute('aria-pressed', String(b === btn));
        });

        let visible = 0;
        document.querySelectorAll('.cartridge[data-tech]').forEach(p => {
            const show = filter === 'all' || p.dataset.tech.split(' ').includes(filter);
            p.hidden = !show;
            if (show) visible++;
        });
        $('empty-msg').hidden = visible > 0;

        sfx.move();
        if (filter !== 'all') unlock('filter');
    });
});

/* --- 11. FIGMA : MAQUETTES CHARGÉES À LA DEMANDE --- */
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

/* --- 12. CONTACT : FORMULAIRE (Formspree) --- */
const form = $('contact-form');

if (form) {
    const formStatus = $('form-status');
    const objetSelect = $('objet');
    const subjectInput = $('subject');

    // Objet pré-rempli par les liens "Me contacter", "Choisir cette offre"… (contact.html?objet=…)
    const objet = params.get('objet');
    if (objet && objetSelect.querySelector(`option[value="${CSS.escape(objet)}"]`)) objetSelect.value = objet;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Objet de l'email reçu (champ spécial reconnu par Formspree)
        subjectInput.value = `Portfolio — ${objetSelect.selectedOptions[0].textContent}`;

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
}

/* --- 13. CODE KONAMI --- */
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

/* --- 14. SUCCÈS : NOUVELLE PARTIE --- */
$('reset-btn')?.addEventListener('click', () => {
    if (!confirm('Effacer ta progression et recommencer une nouvelle partie ?')) return;
    save.xp = 0;
    save.visited = [];
    save.achievements = [];
    persist();
    renderXp();
    renderAchievements();
    sfx.back();
});

/* --- 15. THÈMES DE COULEURS --- */
const THEMES = [
    { id: 'neon', name: 'Néon' },
    { id: 'gameboy', name: 'Game Boy' },
    { id: 'console', name: 'Console' },
    { id: 'lave', name: 'Lave' },
    { id: 'access', name: 'Daltonisme' }
];
const themeBtn = $('theme-btn');

function applyTheme(id) {
    const theme = THEMES.find(t => t.id === id) || THEMES[0];
    if (theme.id === 'neon') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme.id;

    $('theme-name').textContent = theme.name;
    themeBtn.setAttribute('aria-label', `Thème : ${theme.name}. Changer de thème`);

    // Couleur de la barre du navigateur sur mobile
    document.querySelector('meta[name="theme-color"]').setAttribute('content', cssVar('--bg'));

    if (canvas) drawSnake(); // le jeu reprend les couleurs du thème
    syncA11yForm();
}

themeBtn.addEventListener('click', () => {
    const index = THEMES.findIndex(t => t.id === save.theme);
    save.theme = THEMES[(index + 1) % THEMES.length].id;
    persist();
    applyTheme(save.theme);
    sfx.select();
    unlock('theme');
});

function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/* --- 16. ARCADE : MINI-JEU SNAKE --- */
const canvas = $('snake');
let snakeState = 'idle'; // idle | running | paused | over
let startSnake = () => { location.href = PAGES.arcade + '?play=1'; }; // depuis une autre page
let pauseSnake = () => {};
let drawSnake = () => {};

const titleHiscore = $('title-hiscore');
if (titleHiscore) titleHiscore.textContent = String(save.snakeBest * 100).padStart(6, '0');

if (canvas) {
    const ctx = canvas.getContext('2d');
    const snakeOverlay = $('snake-overlay');
    const snakeMsg = $('snake-msg');
    const snakeStartBtn = $('snake-start');
    const shareBtn = $('snake-share');
    const scoreEl = $('snake-score');
    const bestEl = $('snake-best');

    const CELLS = 20;                       // grille de 20 x 20
    const CELL = canvas.width / CELLS;      // taille d'une case en pixels
    const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

    let snake = [];
    let food = null;
    let dir = 'right';
    let dirQueue = [];
    let score = 0;
    let lastScore = 0;
    let snakeTimer = null;

    const renderBest = () => { bestEl.textContent = save.snakeBest; };

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

    drawSnake = () => {
        const colors = {
            bg: cssVar('--deep'),
            grid: cssVar('--panel'),
            body: cssVar('--green'),
            head: cssVar('--yellow'),
            bug: cssVar('--bug')
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

        // Les yeux : décalés vers l'avant, puis écartés de chaque côté
        if (snake.length) {
            const head = snake[0];
            const [dx, dy] = DIRS[dir];
            const cx = head.x * CELL + CELL / 2 + dx * 4;
            const cy = head.y * CELL + CELL / 2 + dy * 4;
            ctx.fillStyle = colors.bg;
            ctx.fillRect(cx - dy * 4 - 1, cy + dx * 4 - 1, 3, 3);
            ctx.fillRect(cx + dy * 4 - 1, cy - dx * 4 - 1, 3, 3);
        }
    };

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

    startSnake = () => {
        if (snakeState === 'running') return;
        shareBtn.hidden = true;
        if (snakeState !== 'paused') resetSnake();
        snakeState = 'running';
        snakeOverlay.hidden = true;
        drawSnake();
        startLoop();
        sfx.select();
        canvas.focus({ preventScroll: true });
    };

    pauseSnake = () => {
        if (snakeState !== 'running') return;
        clearInterval(snakeTimer);
        snakeState = 'paused';
        showOverlay('PAUSE', '▶ Reprendre');
    };

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
        lastScore = score;
        shareBtn.hidden = score === 0;
    }

    snakeStartBtn.addEventListener('click', () => startSnake());

    // Partager son score (partage natif sur mobile, sinon copie dans le presse-papiers)
    shareBtn.addEventListener('click', async () => {
        const url = window.SITE.url + PAGES.arcade;
        const text = `🐍 J'ai mangé ${lastScore} bug${lastScore > 1 ? 's' : ''} au Snake sur le portfolio d'Eloïse Robert ! Tu peux battre mon score ?`;

        if (navigator.share) {
            try {
                await navigator.share({ title: 'Snake — Portfolio Eloïse Robert', text, url });
            } catch (err) { /* partage annulé */ }
            return;
        }
        try {
            await navigator.clipboard.writeText(`${text} ${url}`);
            showToast('📋', 'SCORE COPIÉ', 'Colle-le où tu veux pour défier tes amis !');
        } catch (err) {
            showToast('⚠️', 'OUPS', 'Impossible de copier le score.');
        }
    });

    // Clavier : flèches / ZQSD / WASD, espace pour la pause
    const KEY_DIRS = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        z: 'up', w: 'up', s: 'down', q: 'left', a: 'left', d: 'right'
    };

    document.addEventListener('keydown', (e) => {
        if (document.querySelector('dialog[open]') || ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
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
    renderBest();
    // Lancement direct depuis la palette de commandes (arcade.html?play=1)
    if (params.get('play') === '1') setTimeout(startSnake, 300);
}

/* --- 17. OPTIONS D'ACCESSIBILITÉ (fenêtre créée à la première ouverture) --- */
const a11yBtn = $('a11y-btn');
let a11yDialog = null;

const A11Y_HTML = `
    <form method="dialog" class="a11y-form" id="a11y-form">
        <header class="a11y-head">
            <h2 id="a11y-title" class="panel-title">♿ Options d'accessibilité</h2>
            <button type="submit" class="hud-btn" aria-label="Fermer les options">✕</button>
        </header>

        <fieldset class="a11y-group">
            <legend>Police du texte</legend>
            <label class="a11y-choice"><input type="radio" name="font" value="pixel"> <span><strong>Pixel</strong> — style rétro d'origine</span></label>
            <label class="a11y-choice"><input type="radio" name="font" value="lexend"> <span class="font-preview-lexend"><strong>Lexend</strong> — conçue pour faciliter la lecture</span></label>
            <label class="a11y-choice"><input type="radio" name="font" value="dyslexic"> <span class="font-preview-dyslexic"><strong>OpenDyslexic</strong> — pensée pour la dyslexie</span></label>
        </fieldset>

        <fieldset class="a11y-group">
            <legend>Couleurs</legend>
            <label class="a11y-choice"><input type="radio" name="theme" value="neon"> <span>Néon</span></label>
            <label class="a11y-choice"><input type="radio" name="theme" value="gameboy"> <span>Game Boy</span></label>
            <label class="a11y-choice"><input type="radio" name="theme" value="console"> <span>Console (clair)</span></label>
            <label class="a11y-choice"><input type="radio" name="theme" value="lave"> <span>Lave</span></label>
            <label class="a11y-choice"><input type="radio" name="theme" value="access"> <span><strong>Daltonisme</strong> — couleurs distinguables par tous, contraste renforcé</span></label>
        </fieldset>

        <fieldset class="a11y-group">
            <legend>Lecture & confort</legend>
            <label class="a11y-choice"><input type="checkbox" name="spacing"> <span>Texte plus espacé (lignes, lettres et mots)</span></label>
            <label class="a11y-choice"><input type="checkbox" name="crt"> <span>Effet écran cathodique (lignes horizontales)</span></label>
            <label class="a11y-choice"><input type="checkbox" name="motion"> <span>Animations (clignotements, texte qui s'écrit…)</span></label>
        </fieldset>

        <div class="a11y-actions">
            <button type="button" class="pixel-btn alt" id="a11y-reset">↺ Réglages par défaut</button>
            <button type="submit" class="pixel-btn">✔ Valider</button>
        </div>
    </form>`;

// Applique les réglages sur <html> (le CSS s'occupe du reste)
function applyA11y() {
    const root = document.documentElement;
    const font = save.font === 'pixel' && save.classic ? 'lexend' : save.font; // police lisible en version classique
    if (font === 'pixel') delete root.dataset.font; else root.dataset.font = font;
    if (save.spacing) root.dataset.spacing = 'on'; else delete root.dataset.spacing;
    if (save.crt) delete root.dataset.crt; else root.dataset.crt = 'off';
    if (save.motion) delete root.dataset.motion; else root.dataset.motion = 'off';

    // Sans animation, le message d'accueil s'affiche directement
    if (!save.motion && typeEl) showFullText();
    syncA11yForm();
}

// Coche dans la fenêtre les options actuellement actives
function syncA11yForm() {
    const form = a11yDialog?.querySelector('form');
    if (!form) return;
    form.elements.font.value = save.font;
    form.elements.theme.value = save.theme;
    form.elements.spacing.checked = save.spacing;
    form.elements.crt.checked = save.crt;
    form.elements.motion.checked = save.motion;
}

function createA11yDialog() {
    a11yDialog = document.createElement('dialog');
    a11yDialog.className = 'a11y-dialog panel';
    a11yDialog.id = 'a11y-dialog';
    a11yDialog.setAttribute('aria-labelledby', 'a11y-title');
    a11yDialog.innerHTML = A11Y_HTML;
    document.body.appendChild(a11yDialog);

    // Chaque changement s'applique immédiatement (aperçu en direct)
    a11yDialog.querySelector('form').addEventListener('change', (e) => {
        const { name, value, checked, type } = e.target;
        if (name === 'theme') {
            save.theme = value;
            applyTheme(value);
            unlock('theme');
        } else {
            save[name] = type === 'checkbox' ? checked : value;
            applyA11y();
        }
        persist();
    });

    $('a11y-reset').addEventListener('click', () => {
        Object.assign(save, {
            font: 'pixel', spacing: false, crt: true, theme: 'neon',
            motion: !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        });
        persist();
        applyTheme(save.theme);
        applyA11y();
    });

    a11yDialog.addEventListener('close', () => a11yBtn.focus()); // retour du focus
    a11yDialog.addEventListener('click', (e) => { // clic en dehors = fermeture
        if (e.target === a11yDialog) a11yDialog.close();
    });
}

a11yBtn.addEventListener('click', () => {
    if (!a11yDialog) createA11yDialog();
    pauseSnake();
    syncA11yForm();
    a11yDialog.showModal();
    sfx.select();
});

/* --- 18. VERSION CLASSIQUE ("recruteur pressé") --- */
const footerClassic = $('footer-classic');

function setClassicLabels() {
    footerClassic.textContent = save.classic ? 'Version jeu' : 'Version classique';
    footerClassic.href = save.classic ? '?mode=jeu' : '?mode=classique';
}

function setClassic(on) {
    save.classic = on;
    persist();
    if (on) document.documentElement.dataset.mode = 'classic';
    else delete document.documentElement.dataset.mode;
    applyA11y();
    setClassicLabels();
    if (on) {
        pauseSnake();
        if (typeEl) showFullText();
    }
}

$('game-mode-btn').addEventListener('click', () => setClassic(false));
footerClassic.addEventListener('click', (e) => {
    e.preventDefault();
    setClassic(!save.classic);
});

/* --- 19. GITHUB : PROJETS MIS À JOUR AUTOMATIQUEMENT (API GitHub) --- */
const GH_USER = 'elo41flo';
const GH_CACHE = 'elo-gh-cache';
const LANG_COLORS = {
    HTML: '#e34c26', CSS: '#563d7c', JavaScript: '#f1e05a', TypeScript: '#3178c6',
    PHP: '#4f5d95', Blade: '#f7523f', Python: '#3572a5', Lua: '#000080', Luau: '#00a2ff', Vue: '#41b883'
};

async function fetchGithub() {
    // Cache de 30 minutes dans l'onglet : l'API publique est limitée à 60 requêtes/heure
    try {
        const cached = JSON.parse(sessionStorage.getItem(GH_CACHE));
        if (cached && Date.now() - cached.time < 30 * 60 * 1000) return cached.data;
    } catch (e) { /* pas de cache */ }

    // Une seule requête, limitée aux 12 dépôts les plus récents
    const res = await fetch(`https://api.github.com/users/${GH_USER}/repos?sort=pushed&per_page=12`);
    if (!res.ok) throw new Error('GitHub indisponible');

    // On ne garde que les champs utiles (cache plus léger)
    const repos = (await res.json()).map(({ name, html_url, description, language, stargazers_count, pushed_at, fork }) =>
        ({ name, html_url, description, language, stargazers_count, pushed_at, fork }));
    const data = { repos };
    try { sessionStorage.setItem(GH_CACHE, JSON.stringify({ time: Date.now(), data })); } catch (e) { /* ignore */ }
    return data;
}

function repoCard(repo) {
    // Construit avec textContent : aucune donnée externe n'est interprétée comme du HTML
    const card = document.createElement('a');
    card.className = 'repo';
    card.href = repo.html_url;
    card.target = '_blank';
    card.rel = 'noopener';

    const name = document.createElement('span');
    name.className = 'repo-name';
    name.textContent = repo.name;

    const desc = document.createElement('p');
    desc.textContent = repo.description || 'Pas encore de description.';

    const meta = document.createElement('span');
    meta.className = 'repo-meta';
    if (repo.language) {
        const lang = document.createElement('span');
        lang.className = 'lang';
        const dot = document.createElement('i');
        dot.style.setProperty('--l', LANG_COLORS[repo.language] || 'var(--muted)');
        lang.append(dot, repo.language);
        meta.append(lang);
    }
    if (repo.stargazers_count) {
        const stars = document.createElement('span');
        stars.textContent = `⭐ ${repo.stargazers_count}`;
        meta.append(stars);
    }
    const date = document.createElement('span');
    date.textContent = 'Mis à jour le ' + new Date(repo.pushed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    meta.append(date);

    card.append(name, desc, meta);
    return card;
}

async function loadGithub() {
    const status = $('gh-status');
    try {
        const { repos } = await fetchGithub();
        const recent = repos
            .filter(r => !r.fork && r.name !== GH_USER)
            .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
            .slice(0, 6);
        if (!recent.length) throw new Error('Aucun dépôt');

        $('gh-repos').replaceChildren(...recent.map(repoCard));
        status.textContent = `Mis à jour automatiquement depuis GitHub · mes ${recent.length} projets les plus récents.`;
    } catch (err) {
        // En cas d'échec, on garde la liste écrite dans le HTML
        status.textContent = 'GitHub ne répond pas pour le moment : voici mes projets épinglés.';
    }
}

/* --- 20. BADGE ÉCO (mesure en direct, façon EcoIndex) --- */
// Méthode EcoIndex (ecoindex.fr) : nombre d'éléments, de requêtes et poids de la page
const ECO_Q = {
    dom: [0, 47, 75, 159, 233, 298, 358, 417, 476, 537, 603, 674, 753, 843, 949, 1076, 1237, 1459, 1801, 2479, 594601],
    req: [0, 2, 15, 25, 34, 42, 49, 56, 63, 70, 78, 86, 95, 105, 117, 130, 147, 170, 205, 281, 3920],
    size: [0, 1.37, 144.7, 319.53, 479.46, 631.97, 783.38, 937.91, 1098.62, 1265.47, 1448.32, 1648.27, 1876.08, 2142.06, 2465.37, 2866.31, 3401.59, 4155.73, 5400.08, 8037.54, 223212.26]
};
const ECO_GRADES = [
    { min: 80, grade: 'A', color: '#349a47' }, { min: 70, grade: 'B', color: '#51b84b' },
    { min: 55, grade: 'C', color: '#cadb2a' }, { min: 40, grade: 'D', color: '#f6eb15' },
    { min: 25, grade: 'E', color: '#fecd06' }, { min: 10, grade: 'F', color: '#f99839' },
    { min: -Infinity, grade: 'G', color: '#ed2124' }
];

function ecoQuantile(table, value) {
    for (let i = 1; i < table.length; i++) {
        if (value < table[i]) return i - 1 + (value - table[i - 1]) / (table[i] - table[i - 1]);
    }
    return table.length - 1;
}

function measureEco() {
    const sizeOf = e => e.transferSize || e.encodedBodySize || 0;
    const nav = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const kb = ((nav ? sizeOf(nav) : 0) + resources.reduce((t, e) => t + sizeOf(e), 0)) / 1024;
    const requests = resources.length + 1;
    const dom = document.getElementsByTagName('*').length;

    const score = Math.round(100 - 5 * (3 * ecoQuantile(ECO_Q.dom, dom) + 2 * ecoQuantile(ECO_Q.req, requests) + ecoQuantile(ECO_Q.size, kb)) / 6);
    const { grade, color } = ECO_GRADES.find(g => score > g.min);

    const badge = $('eco-badge');
    const gradeEl = document.createElement('span');
    gradeEl.className = 'eco-grade';
    gradeEl.style.background = color;
    gradeEl.textContent = grade;
    badge.replaceChildren(
        `🌱 Empreinte de cette page : ${Math.round(kb)} Ko · ${requests} requêtes · ${dom} éléments · EcoIndex estimé `,
        gradeEl,
        ` ${score}/100`
    );
    badge.title = 'Mesuré en direct dans ton navigateur, selon la méthode EcoIndex (ecoindex.fr)';
    badge.hidden = false;
}

/* --- 21. PALETTE DE COMMANDES (Ctrl + K) — créée à la première ouverture --- */
const paletteBtn = $('palette-btn');
let palette = null;
let paletteInput = null;
let paletteList = null;
let paletteItems = [];
let paletteIndex = 0;

const go = key => () => { location.href = PAGES[key]; };
const normalize = str => str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function downloadCv() {
    const link = document.createElement('a');
    link.href = 'cv-eloise-robert.pdf';
    link.download = '';
    link.click();
}

function paletteCommands() {
    const level = (key, icon, label, hint, keywords) => ({ icon, label, hint, keywords, run: go(key) });
    return [
        level('map', '🗺️', 'Carte du monde', 'accueil', 'home menu'),
        level('profil', '🧙‍♀️', 'Mon profil', '1-1', 'fiche perso cv parcours'),
        level('figma', '🎨', 'Figma', '1-2', 'maquettes design'),
        level('vscode', '⌨️', 'Projets VS Code', '1-3', 'code developpement'),
        level('wordpress', '🏰', 'WordPress', '2-1', 'cms'),
        level('seo', '🔍', 'SEO', '2-2', 'audit referencement'),
        level('github', '🐙', 'GitHub', '2-3', 'depots repos'),
        level('certifications', '🎖️', 'Certifications', '3-1', 'badges diplomes'),
        level('veille', '📡', 'Veille techno', '3-2', 'taverne actualites'),
        level('contact', '💾', 'Contact', '3-3', 'message email'),
        level('boutique', '🛒', 'Services', '4-1', 'boutique tarifs faq'),
        level('arcade', '👾', 'Arcade', '4-2', 'mini-jeu'),
        level('quetes', '🗝️', 'Prochaines quêtes', '4-3', 'projets futurs'),
        level('e5', '🎓', 'BTS SIO · E5', 'E5', 'epreuve slam synthese'),
        level('autres', '🍄', 'Autres', 'BONUS', 'loisirs'),
        level('trophees', '🏆', 'Succès débloqués', 'trophées', 'achievements'),
        { icon: '🐍', label: 'Jouer au Snake', hint: 'action', keywords: 'jeu arcade', run: () => startSnake() },
        { icon: '📨', label: 'Proposer un stage', hint: 'contact', keywords: 'recrutement alternance', run: () => { location.href = PAGES.contact + '?objet=stage'; } },
        { icon: '💰', label: 'Demander un devis', hint: 'contact', keywords: 'prix tarif client', run: () => { location.href = PAGES.contact + '?objet=devis'; } },
        { icon: '📜', label: 'Télécharger mon CV', hint: 'PDF', keywords: 'curriculum resume', run: downloadCv },
        { icon: '🎨', label: 'Changer de thème', hint: 'action', keywords: 'couleur theme', run: () => themeBtn.click() },
        { icon: save.sound ? '🔇' : '🔊', label: save.sound ? 'Couper le son' : 'Activer le son', hint: 'action', keywords: 'audio musique', run: () => soundBtn.click() },
        { icon: '♿', label: "Options d'accessibilité", hint: 'action', keywords: 'dyslexie daltonisme police', run: () => a11yBtn.click() },
        { icon: save.classic ? '🎮' : '📄', label: save.classic ? 'Revenir à la version jeu' : 'Version classique (recruteurs)', hint: 'mode', keywords: 'sobre simple recruteur', run: () => setClassic(!save.classic) },
        level('plan', '🗂️', 'Plan du site', 'page', 'sitemap'),
        level('mentions', '📜', 'Mentions légales', 'page', 'siret legal'),
        level('confidentialite', '🔒', 'Confidentialité', 'page', 'rgpd donnees')
    ];
}

function renderPalette() {
    const query = normalize(paletteInput.value.trim());
    // Les commandes dont le nom correspond passent avant celles trouvées par mot-clé
    const byLabel = c => (normalize(c.label).includes(query) ? 0 : 1);
    paletteItems = paletteCommands()
        .filter(c => normalize(`${c.label} ${c.hint} ${c.keywords}`).includes(query))
        .sort((a, b) => byLabel(a) - byLabel(b));
    paletteIndex = Math.min(paletteIndex, Math.max(paletteItems.length - 1, 0));

    if (!paletteItems.length) {
        const empty = document.createElement('li');
        empty.className = 'palette-empty';
        empty.textContent = `Commande inconnue : « ${paletteInput.value} »`;
        paletteList.replaceChildren(empty);
        paletteInput.removeAttribute('aria-activedescendant');
        return;
    }

    paletteList.replaceChildren(...paletteItems.map((cmd, i) => {
        const li = document.createElement('li');
        li.className = 'palette-item';
        li.id = `palette-item-${i}`;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(i === paletteIndex));

        const icon = document.createElement('span');
        icon.className = 'palette-item-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = cmd.icon;
        const label = document.createElement('span');
        label.className = 'palette-item-label';
        label.textContent = cmd.label;
        const hint = document.createElement('span');
        hint.className = 'palette-item-hint';
        hint.textContent = cmd.hint;

        li.append(icon, label, hint);
        li.addEventListener('click', () => runPalette(i));
        li.addEventListener('mousemove', () => { if (paletteIndex !== i) { paletteIndex = i; renderPalette(); } });
        return li;
    }));
    paletteInput.setAttribute('aria-activedescendant', `palette-item-${paletteIndex}`);
    $(`palette-item-${paletteIndex}`).scrollIntoView({ block: 'nearest' });
}

function createPalette() {
    palette = document.createElement('dialog');
    palette.className = 'palette panel';
    palette.id = 'palette';
    palette.setAttribute('aria-label', 'Palette de commandes');
    palette.innerHTML = `
        <div class="palette-input-wrap">
            <span class="palette-prompt" aria-hidden="true">&gt;</span>
            <input type="text" id="palette-input" class="palette-input" placeholder="Tape une commande : profil, snake, thème…"
                   role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list" autocomplete="off" spellcheck="false">
        </div>
        <ul class="palette-list" id="palette-list" role="listbox" aria-label="Commandes"></ul>
        <p class="palette-help"><kbd>↑</kbd><kbd>↓</kbd> choisir · <kbd>Entrée</kbd> valider · <kbd>Échap</kbd> fermer</p>`;
    document.body.appendChild(palette);
    paletteInput = $('palette-input');
    paletteList = $('palette-list');

    paletteInput.addEventListener('input', () => { paletteIndex = 0; renderPalette(); });
    paletteInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const step = e.key === 'ArrowDown' ? 1 : -1;
            paletteIndex = (paletteIndex + step + paletteItems.length) % Math.max(paletteItems.length, 1);
            renderPalette();
            sfx.move();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            runPalette(paletteIndex);
        }
    });
    palette.addEventListener('click', (e) => { if (e.target === palette) palette.close(); });
}

function openPalette() {
    if (!palette) createPalette();
    if (palette.open) return;
    if (a11yDialog?.open) a11yDialog.close();
    pauseSnake();
    paletteInput.value = '';
    paletteIndex = 0;
    renderPalette();
    palette.showModal();
    paletteInput.focus();
    sfx.select();
    unlock('palette');
}

function runPalette(i) {
    const cmd = paletteItems[i];
    if (!cmd) return;
    palette.close();
    if (!started) startGame();
    cmd.run();
}

// Ctrl + K (ou Cmd + K sur Mac) depuis n'importe où
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        palette?.open ? palette.close() : openPalette();
    }
});
paletteBtn.addEventListener('click', openPalette);

/* --- 22. BTS SIO E5 : ouvrir la fiche ciblée (#fiche-…) --- */
function openFicheFromHash() {
    const fiche = location.hash.startsWith('#fiche-') && document.querySelector(location.hash);
    if (fiche) {
        fiche.open = true;
        fiche.scrollIntoView({ block: 'start' });
    }
}
if (PAGE === 'e5') {
    window.addEventListener('hashchange', openFicheFromHash);
    openFicheFromHash();
}

/* --- INITIALISATION --- */
if (save.classic) document.documentElement.dataset.mode = 'classic';
applyTheme(save.theme);
applyA11y();
renderXp();
renderAchievements();
setClassicLabels();
visitPage();

// GitHub n'est interrogé que lorsque la section devient visible à l'écran
const ghRepos = $('gh-repos');
if (ghRepos) {
    const ghObserver = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) {
            ghObserver.disconnect();
            loadGithub();
        }
    });
    ghObserver.observe(ghRepos);
}

// Le badge éco est calculé une fois la page entièrement chargée
window.addEventListener('load', () => setTimeout(measureEco, 1500));

// Accueil : on saute l'écran titre si la partie a déjà été lancée dans cet onglet ou en version classique
if (PAGE === 'map') {
    renderClearedLevels();
    let alreadyStarted = false;
    try { alreadyStarted = sessionStorage.getItem('elo-started') === '1'; } catch (e) { /* ignore */ }
    if (save.classic || alreadyStarted) {
        titleScreen.hidden = true;
        startGame();
    }
}
