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

const save = Object.assign({ xp: 0, visited: [], achievements: [], sound: false }, loadSave());

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
    { id: 'all', icon: '⭐', name: '100 % complété', desc: 'Visiter les 10 niveaux.' },
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

/* --- INITIALISATION --- */
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
