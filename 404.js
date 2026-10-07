/* Page 404 : compte à rebours façon borne d'arcade.
   À 0, retour automatique à l'accueil. */
var count = 9;
var countdownEl = document.getElementById('countdown');
var timer = setInterval(function () {
    count--;
    countdownEl.textContent = count;
    if (count <= 0) {
        clearInterval(timer);
        window.location.href = '/';
    }
}, 1000);

// Si on interagit avec la page, on arrête le compte à rebours
['keydown', 'pointerdown'].forEach(function (evt) {
    document.addEventListener(evt, function (e) {
        if (e.key === 'Enter') return; // Entrée sur un bouton = navigation normale
        clearInterval(timer);
        countdownEl.textContent = '∞';
    }, { once: true });
});
