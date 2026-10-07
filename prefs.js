/* =========================================================
   PRÉFÉRENCES — chargé dans le <head>, avant l'affichage,
   pour éviter un "flash" de couleurs ou de police.
   (Fichier séparé : la politique de sécurité interdit les scripts inline.)
   ========================================================= */
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
