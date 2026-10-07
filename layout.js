/* =========================================================
   MISE EN PAGE COMMUNE — chargé dans le <head> de chaque page
   1. Applique les préférences (thème, accessibilité, mode) avant l'affichage
   2. Liste des pages du site
   3. <site-header> et <site-footer> : la barre du haut, le bandeau et le
      pied de page sont écrits UNE SEULE FOIS ici, pour toutes les pages.
   (Fichier séparé : la politique de sécurité interdit les scripts inline.)
   ========================================================= */

/* --- 1. PRÉFÉRENCES --- */
(function () {
    try {
        var prefs = JSON.parse(localStorage.getItem('elo-portfolio-save') || '{}');
        var root = document.documentElement;
        if (prefs.theme && prefs.theme !== 'neon') root.dataset.theme = prefs.theme;
        if (prefs.font && prefs.font !== 'pixel') root.dataset.font = prefs.font;
        if (prefs.spacing) root.dataset.spacing = 'on';
        if (prefs.crt === false) root.dataset.crt = 'off';
        if (prefs.motion === false) root.dataset.motion = 'off';

        // Mode "recruteur pressé" : ?mode=classique dans l'adresse, ou choix mémorisé
        var params = new URLSearchParams(location.search);
        if (params.get('mode') === 'classique') prefs.classic = true;
        if (params.get('mode') === 'jeu') prefs.classic = false;
        if (prefs.classic) {
            root.dataset.mode = 'classic';
            // Police lisible par défaut pour la version classique
            if (!root.dataset.font) root.dataset.font = 'lexend';
        }
    } catch (e) { /* stockage indisponible : réglages par défaut */ }
})();

/* --- 2. PAGES DU SITE --- */
// clé du niveau → fichier HTML (la clé est aussi dans <body data-page="…">)
window.SITE = {
    url: 'https://portfolio-eloiserobert.vercel.app/',
    pages: {
        map: 'index.html',
        profil: 'profil.html',
        figma: 'maquettes-figma.html',
        vscode: 'projets.html',
        wordpress: 'projets-wordpress.html',
        seo: 'audit-seo.html',
        github: 'github.html',
        certifications: 'certifications.html',
        veille: 'veille-techno.html',
        contact: 'contact.html',
        boutique: 'services.html',
        arcade: 'arcade.html',
        quetes: 'projets-futurs.html',
        e5: 'bts-sio-e5.html',
        autres: 'autres.html',
        trophees: 'succes.html',
        plan: 'plan-du-site.html',
        mentions: 'mentions-legales.html',
        confidentialite: 'confidentialite.html'
    },
    // Niveaux de la carte (comptent pour l'XP et le succès "100 % complété")
    levels: ['profil', 'figma', 'vscode', 'wordpress', 'seo', 'github', 'certifications',
        'veille', 'contact', 'boutique', 'arcade', 'quetes', 'e5', 'autres']
};

/* --- 3. EN-TÊTE ET PIED DE PAGE COMMUNS --- */
// Les éléments sont définis dès le <head> : le navigateur les remplit au moment
// où il les lit, avant d'afficher la page (pas de décalage de mise en page).
customElements.define('site-header', class extends HTMLElement {
    connectedCallback() {
        if (this.childElementCount) return;
        this.innerHTML = `
        <div class="crt" aria-hidden="true"></div>

        <!-- Barre du mode "recruteur pressé" (cachée en mode jeu) -->
        <header class="classic-bar">
            <p class="classic-name"><strong>Eloise Robert</strong> — Développeuse web · BTS SIO option SLAM</p>
            <nav class="classic-nav" aria-label="Pages du portfolio">
                <a href="index.html">Accueil</a>
                <a href="profil.html">Profil</a>
                <a href="projets.html">Projets</a>
                <a href="certifications.html">Certifications</a>
                <a href="bts-sio-e5.html">BTS SIO</a>
                <a href="services.html">Services</a>
                <a href="contact.html">Contact</a>
            </nav>
            <button type="button" class="pixel-btn alt" id="game-mode-btn">🎮 Version jeu</button>
        </header>

        <!-- HUD (barre du haut du jeu) -->
        <header class="hud">
            <a href="index.html" class="hud-player" aria-label="Retour à la carte du monde">
                <span class="hud-avatar" data-avatar aria-hidden="true"></span>
                <span class="hud-name">ELOISE ROBERT</span>
                <span class="hud-lvl">LV <strong id="hud-level">1</strong></span>
            </a>
            <div class="hud-xp">
                <span class="hud-label" aria-hidden="true">XP</span>
                <div class="bar" id="xp-bar" role="progressbar" aria-label="Expérience vers le niveau suivant" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="bar-fill" id="xp-fill"></div></div>
                <span class="hud-xp-text" id="xp-text">0/100</span>
            </div>
            <div class="hud-right">
                <a href="succes.html" class="hud-btn" aria-label="Succès débloqués">🏆 <span id="ach-count">0</span>/<span id="ach-total">0</span></a>
                <button type="button" class="hud-btn" id="palette-btn" aria-haspopup="dialog" aria-keyshortcuts="Control+K">⌨️ <span class="hud-btn-label">Ctrl K</span></button>
                <button type="button" class="hud-btn" id="a11y-btn" aria-haspopup="dialog">♿ <span class="hud-btn-label">Accessibilité</span></button>
                <button type="button" class="hud-btn" id="theme-btn" aria-label="Changer de thème de couleurs">🎨 <span id="theme-name">Néon</span></button>
                <button type="button" class="hud-btn" id="sound-btn" aria-pressed="false" aria-label="Activer le son">🔇</button>
                <span class="hud-clock" id="clock">00:00</span>
            </div>
        </header>

        <!-- Bandeau : recherche de stage (supprimer ce bloc une fois le stage trouvé) -->
        <aside class="stage-banner" aria-label="Recherche de stage">
            <p>
                <span class="stage-banner-icon" aria-hidden="true">🎯</span>
                <span><strong>En recherche de stage</strong> — BTS SIO option SLAM (développement)</span>
            </p>
            <div class="stage-banner-actions">
                <a href="contact.html?objet=stage" class="pixel-btn">📨 Me contacter</a>
                <a href="cv-eloise-robert.pdf" class="pixel-btn alt" download>📜 Mon CV</a>
            </div>
        </aside>`;
    }
});

customElements.define('site-footer', class extends HTMLElement {
    connectedCallback() {
        if (this.childElementCount) return;
        this.innerHTML = `
        <footer class="game-footer">
            <nav aria-label="Liens annexes">
                <a href="plan-du-site.html">Plan du site</a>
                <a href="mentions-legales.html">Mentions légales</a>
                <a href="confidentialite.html">Confidentialité</a>
                <a href="?mode=classique" id="footer-classic">Version classique</a>
            </nav>
            <p class="eco-badge" id="eco-badge" hidden></p>
            <p class="footer-social">
                <a href="https://github.com/elo41flo" target="_blank" rel="noopener">🐙 GitHub</a>
                <a href="https://www.linkedin.com/in/eloise-robert-0b36902a6" target="_blank" rel="noopener">🔗 LinkedIn</a>
                <a href="https://www.instagram.com/eloise_robert_dev/" target="_blank" rel="noopener">📸 Instagram</a>
            </p>
            <p>© 2026 Eloise Robert · Fait main en HTML, CSS & JS · 🕹️ Insert coin</p>
        </footer>`;
    }
});
