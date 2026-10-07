// Vérifie que les fichiers JSON du site sont valides :
// - vercel.json (sinon Vercel refuse de déployer)
// - les données structurées (JSON-LD) de index.html, lues par Google
import { readFileSync } from 'node:fs';

let errors = 0;

function check(name, text) {
    try {
        JSON.parse(text);
        console.log(`✔ ${name}`);
    } catch (err) {
        console.error(`✖ ${name} : ${err.message}`);
        errors++;
    }
}

check('vercel.json', readFileSync('vercel.json', 'utf8'));

const html = readFileSync('index.html', 'utf8');
const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
if (!blocks.length) {
    console.error('✖ Aucune donnée structurée trouvée dans index.html');
    errors++;
}
blocks.forEach((block, i) => check(`Données structurées n°${i + 1} (index.html)`, block[1]));

process.exit(errors ? 1 : 0);
