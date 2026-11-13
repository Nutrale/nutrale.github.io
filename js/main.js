/* =========================================================
   Portfolio Lucas Marrec
   Interrupteur, guitare, sentier, trait de montagne, projets
   ========================================================= */
(function () {
  const racine = document.documentElement;
  const interrupteurs = document.querySelectorAll('.interrupteur');
  const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = s => document.querySelector(s);
  const echapper = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');   // textes venus du back-office

  /* =========================================================
     SON : cordes synthétisées (algorithme de Karplus-Strong)
     Aucun fichier audio : le son est fabriqué par le navigateur.
     ========================================================= */
  const Son = {
    ctx: null, maitre: null, cache: {},
    actif: (() => { try { return localStorage.getItem('son') !== 'non'; } catch (e) { return true; } })(),
    pret() {
      if (!this.actif || matchMedia('(max-width: 760px)').matches) return false;   // sur téléphone : ni guitare ni bouton Son, donc pas de son
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        this.ctx = new AC();
        const filtre = this.ctx.createBiquadFilter();
        filtre.type = 'lowpass'; filtre.frequency.value = 4200;
        this.maitre = this.ctx.createGain(); this.maitre.gain.value = .55;
        this.maitre.connect(filtre).connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    },
    tampon(freq) {
      if (this.cache[freq]) return this.cache[freq];
      const sr = this.ctx.sampleRate, n = Math.floor(sr * 2.4), N = Math.max(2, Math.round(sr / freq));
      const buf = this.ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
      let prec = 0;
      for (let i = 0; i < N; i++) { prec = prec * .45 + (Math.random() * 2 - 1) * .55; d[i] = prec; }   // pincement
      const amorti = .9965 - freq / 120000;
      for (let i = N; i < n; i++) d[i] = amorti * .5 * (d[i - N] + (i - N - 1 >= 0 ? d[i - N - 1] : 0));
      return (this.cache[freq] = buf);
    },
    corde(freq, volume) {
      if (!this.pret()) return;
      const t = this.ctx.currentTime;
      const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
      src.buffer = this.tampon(freq);
      g.gain.setValueAtTime(volume, t);
      g.gain.exponentialRampToValueAtTime(.0001, t + 2.3);
      src.connect(g).connect(this.maitre); src.start(t);
    },
    clic() {   // retour côté com : une seule note douce
      this.corde(784, .12);
    }
  };
  const boutonSon = $('.son');
  function majBoutonSon() {
    boutonSon.setAttribute('aria-pressed', Son.actif ? 'true' : 'false');
    boutonSon.setAttribute('aria-label', Son.actif ? 'Couper le son' : 'Activer le son');
  }
  boutonSon.addEventListener('click', () => {
    Son.actif = !Son.actif;
    try { localStorage.setItem('son', Son.actif ? 'oui' : 'non'); } catch (e) {}
    majBoutonSon();
  });
  majBoutonSon();

  /* =========================================================
     GUITARE : six cordes en bas de l'accueil, face scène
     Du haut vers le bas : mi aigu, si, sol, ré, la, mi grave.
     Notes jouées = accord de sol (3e case sur les mi, 2e case sur le la).
     ========================================================= */
  const Guitare = (() => {
    const zone = $('#cordes'), svg = zone.querySelector('svg');
    const CORDES = [
      { nom: 'mi', freq: 392.00, epais: 1.1 },
      { nom: 'si', freq: 246.94, epais: 1.3 },
      { nom: 'sol', freq: 196.00, epais: 1.5 },
      { nom: 'ré', freq: 146.83, epais: 1.9 },
      { nom: 'la', freq: 123.47, epais: 2.3 },
      { nom: 'mi', freq: 98.00, epais: 2.7 }
    ];
    let L = 0, H = 0, ys = [], chemins = [], etats = CORDES.map(() => ({ a: 0, t0: 0, h2: 0 })), boucle = null, precY = null;

    function construire() {
      const b = zone.getBoundingClientRect();
      if (!b.width) return;
      L = b.width; H = b.height;
      const ecart = L < 600 ? Math.min(22, H / 8) : Math.min(17, H / 9), bas = H - 26;   // sur téléphone, cordes plus espacées
      ys = CORDES.map((c, i) => bas - (CORDES.length - 1 - i) * ecart);
      svg.setAttribute('viewBox', `0 0 ${L} ${H}`);
      const marge = parseFloat(getComputedStyle(racine).getPropertyValue('--marge')) || 40;
      svg.innerHTML = CORDES.map((c, i) =>
        `<text class="nom" x="${marge}" y="${ys[i] - 5}">${c.nom}</text><path stroke-width="${c.epais}" d="M0 ${ys[i]} L${L} ${ys[i]}"/>`
      ).join('');
      chemins = [...svg.querySelectorAll('path')];
    }

    function dessiner(now) {
      let encore = false;
      CORDES.forEach((c, i) => {
        const e = etats[i];
        const t = (now - e.t0) / 1000;
        const a = e.a * Math.exp(-t / (.55 + i * .07));
        if (a < .25) { if (e.a) { chemins[i].setAttribute('d', `M0 ${ys[i]} L${L} ${ys[i]}`); e.a = 0; } return; }
        encore = true;
        const w = 2 * Math.PI * (11 + (CORDES.length - i) * 1.6);
        let d = '';
        for (let k = 0; k <= 96; k++) {
          const u = k / 96;
          const y = ys[i] + a * (Math.sin(Math.PI * u) * Math.cos(w * t) + e.h2 * Math.sin(2 * Math.PI * u) * Math.cos(2 * w * t + .6));
          d += (k ? 'L' : 'M') + (u * L).toFixed(1) + ' ' + y.toFixed(2) + ' ';
        }
        chemins[i].setAttribute('d', d);
      });
      boucle = encore ? requestAnimationFrame(dessiner) : null;
    }

    function pincer(i, x, force, avecSon = true) {
      if (!chemins.length) construire();
      const e = etats[i];
      e.a = mouvementReduit.matches ? 0 : Math.max(3, Math.min(13, force));
      e.t0 = performance.now();
      e.h2 = .45 * Math.sin(2 * Math.PI * Math.min(.95, Math.max(.05, x / (L || 1))));
      if (avecSon) Son.corde(CORDES[i].freq, .2 + Math.min(.15, force / 80));
      if (!boucle && e.a) boucle = requestAnimationFrame(dessiner);
      if (performance.now() - derniereNote > 160) envoler(x, ys[i]);
    }

    // Une note dessinée au trait s'échappe de la corde, monte en ondulant et s'efface
    const NOTES = [
      '<ellipse cx="7" cy="25" rx="5.2" ry="3.8" transform="rotate(-22 7 25)"/><path d="M11.8 23.6 V4 C 13.5 10, 21 10.5, 19 19"/>',
      '<ellipse cx="6" cy="27" rx="5" ry="3.6" transform="rotate(-22 6 27)"/><ellipse cx="22" cy="23" rx="5" ry="3.6" transform="rotate(-22 22 23)"/><path d="M10.6 25.6 V7 M26.6 21.6 V3 M10.6 7 L26.6 3"/>'
    ];
    let derniereNote = 0, enVol = 0;
    function envoler(x, y) {
      if (mouvementReduit.matches || enVol >= 6) return;
      derniereNote = performance.now(); enVol++;
      const note = document.createElement('span');
      note.className = 'note-volante';
      note.innerHTML = `<svg viewBox="0 0 30 32">${NOTES[Math.random() < .7 ? 0 : 1]}</svg>`;
      note.style.left = Math.min(L - 44, Math.max(10, x - 16)) + 'px';
      note.style.top = (y - 44) + 'px';
      zone.appendChild(note);
      const derive = (Math.random() - .5) * 50, tourne = (Math.random() - .5) * 30, haut = 90 + Math.random() * 60;
      note.animate([
        { opacity: 0, transform: 'translate(0, 6px) scale(.7) rotate(0deg)' },
        { opacity: .95, transform: `translate(${derive * .25}px, -${haut * .25}px) scale(1) rotate(${tourne * .4}deg)`, offset: .2 },
        { opacity: 0, transform: `translate(${derive}px, -${haut}px) scale(.9) rotate(${tourne}deg)` }
      ], { duration: 1900 + Math.random() * 700, easing: 'cubic-bezier(.2, .6, .3, 1)' })
        .finished.then(() => { note.remove(); enVol--; });
    }

    function gratter() {   // accord complet, du mi grave au mi aigu
      if (!zone.offsetWidth) return;   // cordes masquées (téléphone) : rien à gratter
      construire();
      for (let k = 0; k < CORDES.length; k++) {
        const i = CORDES.length - 1 - k;
        setTimeout(() => pincer(i, L * .55, 11), k * 24);
      }
      // quelques notes s'envolent de part et d'autre
      [.32, .68].forEach((u, k) => setTimeout(() => envoler(L * u, ys[2 + k]), 260 + k * 220));
    }

    // La souris (ou le doigt) qui traverse une corde la fait sonner
    let precT = 0;
    zone.addEventListener('pointermove', ev => {
      const b = zone.getBoundingClientRect(), y = ev.clientY - b.top, x = ev.clientX - b.left;
      if (precY !== null) {
        const vitesse = Math.abs(y - precY) / Math.max(1, ev.timeStamp - precT) * 16;
        ys.forEach((yc, i) => { if ((precY - yc) * (y - yc) < 0) pincer(i, x, 4 + vitesse * 1.4); });
      }
      precY = y; precT = ev.timeStamp;
    });
    zone.addEventListener('pointerleave', () => { precY = null; });
    zone.addEventListener('pointerdown', ev => {
      const b = zone.getBoundingClientRect(), y = ev.clientY - b.top;
      let proche = 0;
      ys.forEach((yc, i) => { if (Math.abs(yc - y) < Math.abs(ys[proche] - y)) proche = i; });
      if (Math.abs(ys[proche] - y) < 16) pincer(proche, ev.clientX - b.left, 9);
    });

    return { construire, gratter };
  })();

  /* =========================================================
     MONTAGNE EN UN SEUL TRAIT : le sol monte en trois sommets puis repart jusqu'au bord,
     où il devient le sentier. Soleil côté com, lune côté scène.
     ========================================================= */
  const MONTAGNE = {
    // le trait principal : il part du sol, passe par trois sommets et redescend (coordonnées locales, sol à y = 170)
    ligne: [[-10,170],[30,150],[62,112],[78,124],[96,108],[124,62],[150,30],[168,58],[186,82],[202,74],[216,96],[238,118],[262,138],[290,156],[312,170]],
    astre: { x: 232, y: 48, r: 20 },
    centre: 151
  };

  // Trait « à la main » : on redécoupe chaque segment et on ajoute un léger tremblé lissé
  function traitMain(points, graine, ampli = .7) {
    let d = '', bruit = 0, n = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0] = points[i], [x1, y1] = points[i + 1];
      const lg = Math.hypot(x1 - x0, y1 - y0), pas = Math.max(1, Math.round(lg / 7));
      const nx = -(y1 - y0) / (lg || 1), ny = (x1 - x0) / (lg || 1);
      for (let k = (i ? 1 : 0); k <= pas; k++) {
        const t = k / pas;
        graine = (graine * 16807) % 2147483647;
        bruit = bruit * .7 + (graine / 2147483647 - .5) * ampli;
        const ext = (k === 0 && i === 0) || (k === pas && i === points.length - 2);
        const x = x0 + (x1 - x0) * t + (ext ? 0 : nx * bruit), y = y0 + (y1 - y0) * t + (ext ? 0 : ny * bruit);
        d += (n++ ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      }
    }
    return d;
  }
  function cercleChemin(cx, cy, r) {
    return `M${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy}`;
  }
  function croissantChemin(cx, cy, r) {   // lune : cercle moins un cercle décalé
    const ang = -Math.PI / 4, dist = r * .55, r2 = r * .9;
    const ix = (dist * dist + r * r - r2 * r2) / (2 * dist), iy = Math.sqrt(Math.max(0, r * r - ix * ix));
    const rot = (x, y) => [cx + x * Math.cos(ang) - y * Math.sin(ang), cy + x * Math.sin(ang) + y * Math.cos(ang)];
    const [ax, ay] = rot(ix, -iy), [bx, by] = rot(ix, iy);
    return `M${ax.toFixed(1)} ${ay.toFixed(1)} A${r} ${r} 0 1 0 ${bx.toFixed(1)} ${by.toFixed(1)} A${r2} ${r2} 0 0 1 ${ax.toFixed(1)} ${ay.toFixed(1)}`;
  }

  function dessinerTraits() {
    const nuit = racine.dataset.mode === 'scene';
    document.querySelectorAll('svg.trait').forEach((svg, n) => {
      const b = svg.getBoundingClientRect();
      if (!b.width) return;
      const L = b.width, H = b.height, sol = H - 20;
      const e = Math.min((H - 26) / 170, (L - 40) / 400);           // échelle du dessin
      const ox = L / 2 - MONTAGNE.centre * e, oy = sol - 170 * e;
      const P = pts => pts.map(([x, y]) => [ox + x * e, oy + y * e]);
      // Un seul trait : le sol depuis le bord gauche, les trois sommets, puis le sol jusqu'au bord droit
      const montagne = P(MONTAGNE.ligne);
      const gauche = [], droite = [];
      for (let x = 0; x < montagne[0][0]; x += 30) gauche.push([x, sol]);
      for (let x = montagne[montagne.length - 1][0] + 30; x <= L; x += 30) droite.push([x, sol]);
      droite.push([L, sol]);
      const relief = traitMain([...gauche, ...montagne, ...droite], 51 + n, .7);

      // Soleil ou lune, découpé au-dessus de la crête : à l'ouverture, le soleil se lève de derrière la montagne
      const a = MONTAGNE.astre, ax = ox + a.x * e, ay = oy + a.y * e, ar = a.r * e;
      const crete = x => {   // hauteur de la crête à l'abscisse x
        for (let i = 0; i < montagne.length - 1; i++) {
          const [x0, y0] = montagne[i], [x1, y1] = montagne[i + 1];
          if (x >= x0 && x <= x1) return y0 + (y1 - y0) * (x - x0) / (x1 - x0 || 1);
        }
        return sol;
      };
      let cache = 0;   // de combien descendre l'astre pour qu'il soit entièrement sous la crête
      for (let k = 0; k <= 24; k++) {
        const x = ax - ar + 2 * ar * k / 24;
        cache = Math.max(cache, crete(x) - (ay - Math.sqrt(Math.max(0, ar * ar - (x - ax) ** 2))) + 3);
      }
      const ciel = [...montagne, [L + 40, montagne[montagne.length - 1][1]], [L + 40, -H], [-40, -H], [-40, montagne[0][1]]]
        .map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join(' ');

      svg.setAttribute('viewBox', `0 0 ${L.toFixed(0)} ${H.toFixed(0)}`);
      svg.innerHTML = `<defs><clipPath id="ciel-${n}"><polygon points="${ciel}"/></clipPath></defs>`
        + `<path class="relief" d="${relief}" style="--d:0s;--t:1.4s"/>`
        + `<g clip-path="url(#ciel-${n})"><g class="astre" style="--cache:${cache.toFixed(1)}px">`
        + `<path d="${nuit ? croissantChemin(ax, ay, ar) : cercleChemin(ax, ay, ar)}"/>`
        + `<circle class="cible" cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="${(ar + 10).toFixed(1)}"/></g></g>`;
      if (svg.classList.contains('trace')) svg.querySelectorAll('.relief').forEach(p => p.style.setProperty('--long', Math.ceil(p.getTotalLength()) + 1));
    });
  }

  // À l'ouverture : la montagne se dessine, le soleil se lève derrière, le nom s'écrit lettre par lettre
  function introAccueil() {
    const h1 = $('.accueil h1'), texte = h1.textContent;
    h1.setAttribute('aria-label', texte);
    h1.innerHTML = [...texte].map((c, i) => c === ' '
      ? '<span class="espace" aria-hidden="true"> </span>'
      : `<span class="lettre" aria-hidden="true" style="--i:${i}">${c}</span>`).join('');
    const trait = $('.accueil .trait');
    // côté com ; et sur téléphone aussi côté musique (la montagne y remplace la guitare)
    if ((racine.dataset.mode === 'com' || matchMedia('(max-width: 760px)').matches) && !mouvementReduit.matches) {
      trait.querySelectorAll('.relief').forEach(p => p.style.setProperty('--long', Math.ceil(p.getTotalLength()) + 1));
      trait.classList.add('trace');
      setTimeout(() => trait.classList.remove('trace'), 5000);
    }
  }

  // Pied de page, face scène : la montagne se dessine et la lune se lève quand on arrive en bas
  const piedTrait = $('.pied .trait');
  let finPied;
  function armerPied(allume) {
    clearTimeout(finPied);
    piedTrait.classList.remove('trace', 'joue');
    if (!allume || mouvementReduit.matches || !('IntersectionObserver' in window)) return;
    piedTrait.classList.add('trace');
    piedTrait.querySelectorAll('.relief').forEach(p => p.style.setProperty('--long', Math.ceil(p.getTotalLength()) + 1));
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(entrees => entrees.forEach(e => {
    if (!e.isIntersecting || !piedTrait.classList.contains('trace') || piedTrait.classList.contains('joue')) return;
    piedTrait.classList.add('joue');
    finPied = setTimeout(() => piedTrait.classList.remove('trace', 'joue'), 4000);
  }), { threshold: .6 }).observe(piedTrait);

  /* =========================================================
     SENTIER : part de la montagne et descend toute la page,
     dessiné au fil du défilement, une étape par section
     ========================================================= */
  const Sentier = (() => {
    const svg = $('#sentier'), chemin = svg.querySelector('.chemin'), pointe = svg.querySelector('.pointe'), groupe = svg.querySelector('.etapes');
    const main = $('main');
    let table = [], total = 0, etapes = [];

    function construire() {
      if (getComputedStyle(svg).display === 'none') { table = []; return; }
      svg.style.height = '0px';   // on remet le dessin à zéro avant de mesurer : sinon l'ancienne hauteur (avant un filtre) gonfle la page
      const W = main.clientWidth, H = main.scrollHeight;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.style.height = H + 'px';
      const marge = parseFloat(getComputedStyle(racine).getPropertyValue('--marge')) || 40;
      const contenu = Math.min(W - 2 * marge, 1160);
      const cote = Math.max(18, (W - contenu) / 4);
      const gauche = cote, droite = W - cote;
      const accueil = $('.accueil');
      const depart = accueil.offsetTop + accueil.offsetHeight - 22;
      let x = droite, d = `M${x} ${depart} `;
      etapes = [];
      const sections = [...main.querySelectorAll(':scope > section.bloc')].filter(s => s.offsetParent !== null);
      sections.forEach((s, i) => {
        const nx = i % 2 === 0 ? gauche : droite;
        const yc = s.offsetTop + 60;
        d += `L${x} ${yc - 45} C${x} ${yc + 12} ${nx} ${yc - 12} ${nx} ${yc + 45} `;
        x = nx;
        const ye = s.offsetTop + 150;
        d += `L${x} ${ye} `;
        etapes.push({ x, y: ye });
      });
      d += `L${x} ${H - 8}`;
      chemin.setAttribute('d', d);
      groupe.innerHTML = etapes.map(e => `<circle cx="${e.x}" cy="${e.y}" r="5"/>`).join('');
      total = chemin.getTotalLength();
      chemin.style.strokeDasharray = total;
      table = [];
      for (let l = 0; l <= total; l += 6) table.push([l, chemin.getPointAtLength(l).y]);
      table.push([total, chemin.getPointAtLength(total).y]);
      suivre();
    }

    function suivre() {
      if (!table.length) return;
      const cible = innerHeight * .7 - main.getBoundingClientRect().top;
      let a = 0, b = table.length - 1;
      if (cible <= table[0][1]) b = 0;
      else while (a < b) { const m = (a + b + 1) >> 1; if (table[m][1] <= cible) a = m; else b = m - 1; }
      const l = mouvementReduit.matches ? total : table[b][0];
      chemin.style.strokeDashoffset = total - l;
      const p = chemin.getPointAtLength(l);
      const avant = chemin.getPointAtLength(Math.max(0, l - 4));   // la pointe regarde dans le sens de la marche
      const angle = Math.atan2(p.y - avant.y, p.x - avant.x) * 180 / Math.PI;
      pointe.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
      pointe.style.opacity = l > 2 && l < total - 2 ? 1 : 0;
      [...groupe.children].forEach((c, i) => c.classList.toggle('atteinte', etapes[i].y <= p.y + 1));
    }

    let enAttente = false;
    addEventListener('scroll', () => {
      if (enAttente) return;
      enAttente = true;
      requestAnimationFrame(() => { enAttente = false; suivre(); });
    }, { passive: true });
    return { construire };
  })();

  /* =========================================================
     INTERRUPTEUR
     ========================================================= */
  function appliquer(mode) {
    racine.dataset.mode = mode;
    const allume = mode === 'scene';
    interrupteurs.forEach(b => {
      b.setAttribute('aria-checked', allume ? 'true' : 'false');
      b.setAttribute('aria-label', allume ? 'Revenir au mode étudiant en communication' : 'Passer au mode chanteur guitariste');
    });
    const url = new URL(location.href);
    if (allume) url.searchParams.set('mode', 'scene'); else url.searchParams.delete('mode');
    history.replaceState(null, '', url);
    document.title = allume ? 'Lucas Marrec · chanteur guitariste' : 'Lucas Marrec · étudiant en communication';
    $('#icone').href = allume ? 'img/icone-scene.png' : 'img/icone-com.png';
    dessinerTraits();
    armerPied(allume);
    Guitare.construire();
    Sentier.construire();
  }

  function basculer(bouton, remonter = false) {   // remonter : on arrive en haut de l'autre face (lien de fin de page)
    const suivant = racine.dataset.mode === 'scene' ? 'com' : 'scene';
    if (suivant === 'scene') setTimeout(Guitare.gratter, 180); else Son.clic();
    const changer = () => { appliquer(suivant); if (remonter) scrollTo({ top: 0, behavior: 'instant' }); };
    if (!document.startViewTransition || mouvementReduit.matches) { changer(); return; }
    // Un cercle part de l'interrupteur et recouvre la page
    // (en pourcentages de l'écran : plus fiable que les pixels selon les navigateurs)
    const r = bouton.getBoundingClientRect();
    const l = innerWidth, h = innerHeight;
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const rayon = Math.hypot(Math.max(x, l - x), Math.max(y, h - y));
    const px = (x / l * 100).toFixed(2) + '%', py = (y / h * 100).toFixed(2) + '%';
    const rayonPct = (rayon / (Math.hypot(l, h) / Math.SQRT2) * 100 + 1).toFixed(2) + '%';
    const transition = document.startViewTransition(changer);
    transition.ready.then(() => {
      racine.animate(
        { clipPath: [`circle(0% at ${px} ${py})`, `circle(${rayonPct} at ${px} ${py})`] },
        { duration: 900, easing: 'cubic-bezier(.65, 0, .35, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
  }
  interrupteurs.forEach(b => b.addEventListener('click', () => basculer(b)));
  $('.fin .autre-face').addEventListener('click', e => basculer(e.currentTarget, true));

  // Surprise : côté scène, un clic sur la lune du pied de page la fait frémir et la guitare joue sol, ré, mi mineur, do
  const ACCORDS = [
    [98.00, 123.47, 146.83, 196.00, 246.94, 392.00],   // sol
    [146.83, 220.00, 293.66, 369.99],                  // ré
    [82.41, 123.47, 164.81, 196.00, 246.94, 329.63],   // mi mineur
    [130.81, 164.81, 196.00, 261.63, 329.63]           // do
  ];
  let enTrainDeJouer = false;
  $('.pied-dessin').addEventListener('click', e => {
    const cible = e.target.closest('.cible');
    if (!cible || racine.dataset.mode !== 'scene' || enTrainDeJouer) return;
    enTrainDeJouer = true;
    ACCORDS.forEach((notes, k) => setTimeout(() => {
      notes.forEach((f, i) => setTimeout(() => Son.corde(f, .18), i * 28));   // gratté du grave vers l'aigu
    }, k * 620));
    setTimeout(() => { enTrainDeJouer = false; }, ACCORDS.length * 620);
    if (mouvementReduit.matches) return;
    const lune = cible.previousElementSibling;
    lune.classList.remove('fremit'); void lune.getBBox(); lune.classList.add('fremit');
    lune.addEventListener('animationend', () => lune.classList.remove('fremit'), { once: true });
  });

  /* =========================================================
     SUR SCÈNE : carrousel de photos qu'on attrape à la souris et qu'on fait glisser
     (au doigt ou au pavé tactile, le défilement natif du navigateur suffit)
     ========================================================= */
  (() => {
    const zone = $('#carrousel'), section = $('#live'), barre = $('#live .progression i');
    let appui = false, tire = false, x0 = 0, s0 = 0, xPrec = 0, tPrec = 0, v = 0, elan = null;

    /* Sur téléphone : la photo du centre en grand, ses voisines en retrait, et le compteur 01 / 06.
       Les tailles suivent directement la position des photos : rien ne penche, rien ne saute. */
    const telephone = matchMedia('(max-width: 760px)');
    const compteur = $('#live .compteur b'), total = $('#live .compteur small');
    function auCentre() {
      const photos = [...zone.querySelectorAll('.cliche')].filter(c => c.offsetParent !== null);
      if (!telephone.matches || !photos.length) {
        zone.querySelectorAll('.cliche').forEach(c => ['--echelle', '--voile', '--legende'].forEach(v => c.style.removeProperty(v)));
        return;
      }
      const z = zone.getBoundingClientRect(), milieu = z.left + z.width / 2;
      const boites = photos.map(c => c.getBoundingClientRect());
      const pas = boites.length > 1 ? boites[1].left - boites[0].left : boites[0].width;
      let n = 0;
      boites.forEach((r, i) => {
        const d = (r.left + r.width / 2 - milieu) / pas, a = Math.min(Math.abs(d), 1);
        photos[i].style.setProperty('--echelle', (1 - .17 * a).toFixed(4));
        photos[i].style.setProperty('--voile', (1 - .5 * a).toFixed(3));
        photos[i].style.setProperty('--legende', (1 - .7 * a).toFixed(3));
        if (Math.abs(d) < .5) n = i;
      });
      compteur.textContent = String(n + 1).padStart(2, '0');
      total.textContent = String(photos.length).padStart(2, '0');
    }
    telephone.addEventListener('change', () => maj());

    function maj() {   // la barre sous les photos suit le défilement
      auCentre();
      if (!zone.clientWidth) return;
      const max = zone.scrollWidth - zone.clientWidth, part = Math.min(1, zone.clientWidth / zone.scrollWidth);
      barre.style.width = part * 100 + '%';
      barre.style.transform = `translateX(${max > 0 ? zone.scrollLeft / max * (1 / part - 1) * 100 : 0}%)`;
      if (zone.scrollLeft > 8) section.classList.add('a-glisse');
    }

    zone.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      cancelAnimationFrame(elan);
      appui = true; tire = false; v = 0;
      x0 = xPrec = e.clientX; s0 = zone.scrollLeft; tPrec = e.timeStamp;
    });
    zone.addEventListener('pointermove', e => {
      if (!appui) return;
      if (!tire) {   // on ne « tient » le carrousel qu'au-delà de quelques pixels : en dessous, c'est un clic
        if (Math.abs(e.clientX - x0) < 5) return;
        tire = true;
        zone.setPointerCapture(e.pointerId);
        zone.classList.add('tire');
      }
      v = (xPrec - e.clientX) / Math.max(1, e.timeStamp - tPrec) * 16;   // vitesse en px par image
      xPrec = e.clientX; tPrec = e.timeStamp;
      zone.scrollLeft = s0 - (e.clientX - x0);
    });
    function lacher(e) {   // on lâche : le carrousel continue sur son élan et ralentit
      appui = false;
      if (!tire) return;
      zone.classList.remove('tire');
      setTimeout(() => { tire = false; });   // le clic qui suit le glissé est ignoré (voir plus bas)
      if (e.timeStamp - tPrec > 90 || mouvementReduit.matches) return;   // la souris était déjà arrêtée
      const glisser = () => {
        v *= .94; zone.scrollLeft += v;
        if (Math.abs(v) > .4) elan = requestAnimationFrame(glisser);
      };
      elan = requestAnimationFrame(glisser);
    }
    zone.addEventListener('pointerup', lacher);
    zone.addEventListener('pointercancel', lacher);
    zone.addEventListener('pointerleave', () => { if (!tire) appui = false; });
    zone.addEventListener('click', e => { if (tire) { e.preventDefault(); e.stopPropagation(); } }, true);
    zone.addEventListener('wheel', () => cancelAnimationFrame(elan), { passive: true });
    zone.addEventListener('scroll', maj, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(maj).observe(zone);   // aussi quand on passe côté scène
    else addEventListener('resize', maj);
    maj();
  })();

  /* =========================================================
     PROGRAMME, version ordinateur : la route de la semaine se trace quand on arrive dessus
     (7 dates par ligne ; au-delà, une deuxième semaine se place dessous)
     ========================================================= */
  (() => {
    const prog = $('#dates .liste');
    if (!prog) return;
    const dates = [...prog.children];
    prog.style.setProperty('--n', Math.min(dates.length, 7));
    dates.forEach((li, i) => li.style.setProperty('--i', i % 7));
    if (mouvementReduit.matches || !('IntersectionObserver' in window)) return;
    prog.classList.add('a-tracer');
    new IntersectionObserver((entrees, guet) => entrees.forEach(e => {
      if (e.isIntersecting) { prog.classList.add('vu'); guet.disconnect(); }
    }), { threshold: .4 }).observe(prog);
  })();

  /* =========================================================
     E-MAIL : un clic sur l'adresse ouvre la messagerie ET copie l'adresse.
     Sur beaucoup d'ordinateurs aucune messagerie n'est réglée : le lien « mailto » ne fait
     alors rien. L'adresse part quand même dans le presse-papiers, et le bouton le dit.
     ========================================================= */
  const annonce = document.createElement('span');   // lu par les lecteurs d'écran, invisible à l'œil
  annonce.className = 'pour-lecteurs'; annonce.setAttribute('aria-live', 'polite');
  document.body.appendChild(annonce);

  async function copier(texte) {
    try { await navigator.clipboard.writeText(texte); return true; }
    catch (e) {   // ancien navigateur, ou page ouverte d'un double-clic : méthode de secours
      const zone = document.createElement('textarea');
      zone.value = texte; zone.setAttribute('readonly', ''); zone.style.cssText = 'position:fixed;top:0;opacity:0';
      document.body.appendChild(zone); zone.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {}
      zone.remove(); return ok;
    }
  }

  document.querySelectorAll('a[href^="mailto:"]').forEach(lien => {
    const texte = lien.innerHTML;
    lien.addEventListener('click', async () => {
      const adresse = decodeURIComponent(lien.getAttribute('href').slice(7).split('?')[0]);
      if (!(await copier(adresse))) return;
      clearTimeout(lien.minuterie);
      if (lien.classList.contains('bouton')) lien.style.minWidth = lien.getBoundingClientRect().width + 'px';   // le bouton garde sa taille
      lien.classList.add('copie');
      lien.textContent = 'Adresse copiée !';
      annonce.textContent = `Adresse ${adresse} copiée`;
      lien.minuterie = setTimeout(() => { lien.innerHTML = texte; lien.classList.remove('copie'); lien.style.minWidth = ''; }, 2600);
    });
  });

  /* =========================================================
     BOOKING : la demande part vers Netlify Forms une fois le site en ligne ;
     en local (ou si l'envoi échoue), elle ouvre un e-mail déjà rempli
     ========================================================= */
  (() => {
    const form = $('#reservation'), merci = $('#merci'), etat = form.querySelector('.etat'), bouton = form.querySelector('[type="submit"]');
    const ADRESSE = (window.CONTENU && window.CONTENU.coordonnees && window.CONTENU.coordonnees.email) || 'lucmarrec2a@gmail.com';
    /* Calendrier maison : la date choisie est entourée d'un rond tracé à la main.
       Pas de date dans le passé ; souris, doigt et clavier (flèches, Page ↑/↓, Échap). */
    (() => {
      const champ = $('#champ-date'), saisie = $('#date-choisie'), cache = form.elements.date, boite = $('#calendrier');
      const titre = boite.querySelector('.cal-mois'), grille = boite.querySelector('.cal-jours');
      const prec = boite.querySelector('.cal-prec'), suiv = boite.querySelector('.cal-suiv');
      const auj = new Date(); auj.setHours(0, 0, 0, 0);
      let vue = new Date(auj.getFullYear(), auj.getMonth(), 1), choisie = null, fermeture;
      const enLettres = d => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const meme = (a, b) => a && b && a.getTime() === b.getTime();
      const rond = '<svg class="rond" viewBox="0 0 44 44" aria-hidden="true"><path pathLength="1" d="M31 8.5C24 4.5 12 6 7.5 14c-4 7.5-1 18.5 7.5 22.5s19.5 1 23-7.5c3-7.5 0-17-8.5-21.5-4.5-2-9.5-2-13 .5"/></svg>';

      function dessiner(jourVise) {
        const a = vue.getFullYear(), m = vue.getMonth();
        const nom = vue.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        titre.textContent = nom[0].toUpperCase() + nom.slice(1);
        prec.disabled = a === auj.getFullYear() && m === auj.getMonth();
        const decalage = (new Date(a, m, 1).getDay() + 6) % 7, total = new Date(a, m + 1, 0).getDate();
        let h = '<span></span>'.repeat(decalage);
        for (let j = 1; j <= total; j++) {
          const d = new Date(a, m, j);
          h += `<button type="button" data-jour="${j}" tabindex="-1" style="--r:${(j * 67) % 360}deg"`
            + `${meme(d, auj) ? ' class="auj" aria-current="date"' : ''}${meme(d, choisie) ? ' aria-pressed="true"' : ''}`
            + ` aria-label="${enLettres(d)}"${d < auj ? ' disabled' : ''}>${j}${rond}</button>`;
        }
        grille.innerHTML = h;
        const cible = grille.querySelector(`[data-jour="${jourVise}"]:not(:disabled)`)
          || grille.querySelector('[aria-pressed="true"]') || grille.querySelector('button:not(:disabled)');
        if (cible) cible.tabIndex = 0;   // un seul jour atteignable par Tab, les flèches font le reste
        return cible;
      }

      function ouvrir(auClavier) {
        clearTimeout(fermeture);
        if (boite.hidden) {
          vue = new Date((choisie || auj).getFullYear(), (choisie || auj).getMonth(), 1);
          dessiner();
          boite.hidden = false; champ.classList.add('ouvert'); saisie.setAttribute('aria-expanded', 'true');
          const r = boite.getBoundingClientRect();
          if (r.bottom > innerHeight) scrollBy({ top: r.bottom - innerHeight + 24, behavior: mouvementReduit.matches ? 'auto' : 'smooth' });
        }
        if (auClavier) grille.querySelector('[tabindex="0"]')?.focus();
      }
      function fermer(rendreLaMain) {
        if (boite.hidden) return;
        boite.hidden = true; champ.classList.remove('ouvert'); saisie.setAttribute('aria-expanded', 'false');
        if (rendreLaMain) saisie.focus();
      }
      function choisir(d) {
        choisie = d; saisie.value = cache.value = enLettres(d);
        cache.dataset.iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        grille.querySelectorAll('[aria-pressed]').forEach(b => b.removeAttribute('aria-pressed'));
        grille.querySelector(`[data-jour="${d.getDate()}"]`).setAttribute('aria-pressed', 'true');
        clearTimeout(fermeture);   // on laisse le temps de voir le rond se tracer
        fermeture = setTimeout(() => fermer(true), mouvementReduit.matches ? 0 : 480);
      }
      function changerMois(k) { vue = new Date(vue.getFullYear(), vue.getMonth() + k, 1); dessiner(); }

      saisie.addEventListener('click', () => boite.hidden ? ouvrir(false) : fermer(false));
      saisie.addEventListener('beforeinput', e => e.preventDefault());   // on ne tape pas la date, on la choisit
      saisie.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); ouvrir(true); }
        else if (e.key === 'Escape') fermer(false);
        else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); choisie = null; saisie.value = cache.value = ''; delete cache.dataset.iso; }
      });
      prec.addEventListener('click', () => changerMois(-1));
      suiv.addEventListener('click', () => changerMois(1));
      grille.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (b && !b.disabled) choisir(new Date(vue.getFullYear(), vue.getMonth(), +b.dataset.jour));
      });
      grille.addEventListener('keydown', e => {
        const b = e.target.closest('button'); if (!b) return;
        const j = +b.dataset.jour, pas = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
        let d;
        if (pas) d = new Date(vue.getFullYear(), vue.getMonth(), j + pas);
        else if (e.key === 'PageUp' || e.key === 'PageDown') {
          const k = e.key === 'PageUp' ? -1 : 1, fin = new Date(vue.getFullYear(), vue.getMonth() + k + 1, 0).getDate();
          d = new Date(vue.getFullYear(), vue.getMonth() + k, Math.min(j, fin));
        } else return;
        e.preventDefault();
        if (d < auj) d = new Date(auj);
        vue = new Date(d.getFullYear(), d.getMonth(), 1);
        dessiner(d.getDate())?.focus();
      });
      boite.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); fermer(true); } });
      document.addEventListener('pointerdown', e => { if (!boite.hidden && !champ.contains(e.target)) fermer(false); });
      champ.addEventListener('focusout', e => { if (e.relatedTarget && !champ.contains(e.relatedTarget)) fermer(false); });
    })();

    /* Invitation calendrier (.ics) jointe à la demande : sur l'iPhone, un toucher sur le fichier
       l'ajoute au Calendrier (journée entière, marquée « provisoire »). Les e-mail et téléphone du
       visiteur restent dans l'e-mail de la demande, pas dans le fichier. */
    function invitation(d) {
      const iso = form.elements.date.dataset.iso;
      if (!iso) return null;
      const jour = iso.replaceAll('-', '');
      const lendemain = new Date(iso + 'T12:00'); lendemain.setDate(lendemain.getDate() + 1);
      const fin = lendemain.toISOString().slice(0, 10).replaceAll('-', '');
      const texte = v => String(v || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
      const plier = ligne => {   // lignes de 75 octets au plus, sans couper un caractère accentué
        const octets = new TextEncoder(); let sortie = '', morceau = '', taille = 0;
        for (const c of ligne) {
          const n = octets.encode(c).length;
          if (taille + n > (sortie ? 74 : 75)) { sortie += (sortie ? '\r\n ' : '') + morceau; morceau = ''; taille = 0; }
          morceau += c; taille += n;
        }
        return sortie + (sortie ? '\r\n ' : '') + morceau;
      };
      const description = [`Demande envoyée depuis le site le ${new Date().toLocaleDateString('fr-FR')}.`,
        `Type de soirée : ${d.get('type')}`, `Nom : ${d.get('nom')}`, `Lieu : ${d.get('lieu')}`,
        d.get('message') ? `Message : ${d.get('message')}` : '', 'Coordonnées : voir l\'e-mail de la demande.'].filter(Boolean).join('\n');
      const maintenant = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
      const lignes = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lucas Marrec//Booking//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}@lucas-marrec`,
        `DTSTAMP:${maintenant}`, `DTSTART;VALUE=DATE:${jour}`, `DTEND;VALUE=DATE:${fin}`,
        `SUMMARY:${texte(`Demande · ${d.get('type')} · ${d.get('nom')}`)}`,
        `LOCATION:${texte(d.get('lieu'))}`, `DESCRIPTION:${texte(description)}`,
        'STATUS:TENTATIVE', 'END:VEVENT', 'END:VCALENDAR'
      ];
      const nom = `demande-${iso}-${String(d.get('type')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')}.ics`;
      return new File([lignes.map(plier).join('\r\n') + '\r\n'], nom, { type: 'text/calendar' });
    }

    function demande(d) {   // la demande rédigée : objet + texte
      const sujet = `Demande de date · ${d.get('type')} · ${d.get('date') || ''}`;
      const corps = [
        `Type de soirée : ${d.get('type')}`, `Date : ${d.get('date') || ''}`, `Lieu : ${d.get('lieu')}`,
        `Nom : ${d.get('nom')}`, `E-mail : ${d.get('email')}`, d.get('telephone') ? `Téléphone : ${d.get('telephone')}` : '',
        '', d.get('message') || ''
      ].filter((l, i, t) => l || t[i - 1]).join('\n');
      return { sujet, corps };
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const d = new FormData(form);
      if (d.get('bot-field')) return;   // robot
      bouton.disabled = true; etat.textContent = 'Envoi…';
      try {
        if (location.protocol === 'file:') throw new Error('hors ligne');
        // 1. Le serveur du site (serveur.py) range la demande dans le back-office, page « Demandes »
        try {
          const r = await fetch('api/demande', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...Object.fromEntries([...d].filter(([, v]) => typeof v === 'string')), dateIso: form.elements.date.dataset.iso || '' }) });
          if (r.ok) { form.hidden = true; merci.hidden = false; merci.focus(); return; }
          if (r.status === 429 || r.status === 400) throw Object.assign(new Error('refus'), { definitif: true });
        } catch (x) { if (x.definitif) throw x; }
        // 2. Sinon (site hébergé ailleurs) : Netlify Forms
        const envoi = new FormData(form);   // en multipart : Netlify garde le fichier et met son lien dans l'e-mail
        const ics = invitation(d);
        if (ics) envoi.set('invitation', ics, ics.name); else envoi.delete('invitation');
        const r = await fetch('/', { method: 'POST', body: envoi });
        if (!r.ok) throw new Error(r.status);
        form.hidden = true; merci.hidden = false; merci.focus();
      } catch (err) {
        // Repli : la messagerie s'ouvre avec la demande rédigée, et la demande est aussi copiée
        // (si aucune messagerie n'est réglée, le visiteur n'a plus qu'à la coller dans un e-mail)
        const { sujet, corps } = demande(d);
        const copiee = await copier(`À : ${ADRESSE}\nObjet : ${sujet}\n\n${corps}`);
        location.href = `mailto:${ADRESSE}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
        etat.textContent = copiee
          ? `Votre messagerie s'ouvre avec la demande déjà rédigée. Rien ne s'ouvre ? La demande est copiée : collez-la dans un e-mail à ${ADRESSE}.`
          : `Votre messagerie s'ouvre avec la demande déjà rédigée : il ne reste qu'à l'envoyer à ${ADRESSE}.`;
      } finally {
        bouton.disabled = false;
      }
    });
  })();

  /* =========================================================
     PROJETS : index (ordinateur), grille de vignettes (téléphone), fiche
     ========================================================= */
  const liste = $('#liste-projets');
  const fiche = $('#fiche');
  const projets = window.PROJETS || [];

  /* Sur ordinateur, l'index : la liste à gauche, une grande image à droite qui montre le projet survolé.
     Sur téléphone, la grille de vignettes (le panneau est masqué). */
  const corps = document.createElement('div');   // enveloppe : liste à gauche, grande image à droite
  corps.className = 'projets-corps';
  liste.before(corps);
  corps.append(liste);
  const panneau = document.createElement('figure');
  panneau.className = 'index-image';
  panneau.setAttribute('aria-hidden', 'true');
  panneau.innerHTML = '<img alt="" loading="lazy"><figcaption class="caps"></figcaption>';
  corps.append(panneau);
  let projetIndex = null;
  function montrerIndex(p) {   // la grande image suit le projet survolé
    if (!p || p === projetIndex) return;
    projetIndex = p;
    const img = panneau.querySelector('img');
    img.classList.toggle('entiere', p.cadrage === 'entier');
    img.src = p.vignette;
    panneau.querySelector('figcaption').textContent = p.categorie;
    [...liste.children].forEach(li => li.classList.toggle('actif', li.projet === p));
  }

  projets.forEach((p, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <button class="ligne" type="button">
        <span class="num"><small>N°</small><b>${String(i + 1).padStart(2, '0')}</b></span>
        <span class="titre-projet">${echapper(p.titre)}</span>
        <span class="cat caps">${echapper(p.categorie)}</span>
        <img class="mini${p.cadrage === 'entier' ? ' entiere' : ''}" src="${echapper(p.vignette)}" alt="" loading="lazy"${p.cadrage && p.cadrage !== 'entier' ? ` style="object-position: ${echapper(p.cadrage)}"` : ''}>
      </button>`;
    const ligne = li.querySelector('.ligne');
    ligne.addEventListener('click', () => ouvrir(p));
    ligne.addEventListener('pointerenter', () => montrerIndex(p));
    ligne.addEventListener('focus', () => montrerIndex(p));
    li.projet = p;
    liste.appendChild(li);
  });

  /* Sélection et filtres.
     — Sélection : seuls les projets cochés « À la une » (back-office) s'affichent d'abord ; la pilule
       « Voir les N projets » sous la liste déroule les autres, « Revenir à la sélection » les replie.
       Si aucun projet n'est à la une (ou s'ils le sont tous), tout s'affiche et la pilule disparaît.
     — Filtres : un mot par rubrique utilisée (ordre de RUBRIQUES), souligné d'un trait à la main quand il
       est choisi ; une rubrique montre tous ses projets, sélection ou non. La liste se resserre en glissant. */
  (function selectionEtFiltres() {
    const lignes = [...liste.children];
    if (!lignes.length) return;
    const aLaUne = lignes.filter(li => li.projet.une);
    const selection = aLaUne.length > 0 && aLaUne.length < lignes.length;
    let rubrique = 'tout', toutVoir = !selection, delai;

    const voirTout = document.createElement('div');
    voirTout.className = 'voir-tout';
    voirTout.innerHTML = '<button class="bouton" type="button" aria-controls="liste-projets"></button>';
    const boutonTout = voirTout.firstElementChild;
    liste.after(voirTout);

    function montrer(animer) {
      const avant = new Map(lignes.filter(li => !li.hidden).map(li => { const r = li.getBoundingClientRect(); return [li, [r.left, r.top]]; }));
      let n = 0;
      lignes.forEach(li => {
        const p = li.projet;
        li.hidden = rubrique !== 'tout' ? !(p.rubriques || []).includes(rubrique) : !toutVoir && !p.une;
        if (!li.hidden) li.querySelector('.num b').textContent = String(++n).padStart(2, '0');
      });
      const premier = lignes.find(li => !li.hidden);   // la grande image montre toujours un projet visible
      if (premier && (!projetIndex || lignes.find(li => li.projet === projetIndex).hidden)) { projetIndex = null; montrerIndex(premier.projet); }
      voirTout.hidden = !selection || rubrique !== 'tout';
      boutonTout.textContent = toutVoir ? 'Revenir à la sélection' : `Voir les ${lignes.length} projets`;
      boutonTout.setAttribute('aria-expanded', toutVoir);
      if (animer && !mouvementReduit.matches) {
        let k = 0;
        lignes.forEach(li => {
          if (li.hidden) return;
          const r = li.getBoundingClientRect();
          if (avant.has(li)) {   // en liste, les projets glissent vers le haut ; en grille (téléphone), aussi de côté
            const dx = avant.get(li)[0] - r.left, dy = avant.get(li)[1] - r.top;
            if (dx || dy) li.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.2, .7, .2, 1)' });
          } else if (r.top < innerHeight) {   // seuls les nouveaux projets visibles à l'écran apparaissent en cascade
            li.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
              { duration: 420, delay: 90 + 70 * Math.min(k++, 8), easing: 'cubic-bezier(.2, .7, .2, 1)', fill: 'backwards' });
          }
        });
      }
      clearTimeout(delai);   // la page a changé de hauteur : le sentier se redessine
      delai = setTimeout(() => Sentier.construire(), animer ? 600 : 0);
    }
    montrer(false);

    boutonTout.addEventListener('click', () => {
      toutVoir = !toutVoir;
      montrer(true);
      if (!toutVoir) $('#projets').scrollIntoView({ behavior: mouvementReduit.matches ? 'auto' : 'smooth', block: 'start' });
    });

    const dans = r => lignes.filter(li => (li.projet.rubriques || []).includes(r)).length;
    const rubriques = (window.RUBRIQUES || []).filter(r => dans(r) > 0);
    if (!rubriques.length) return;
    const barre = document.createElement('div');
    barre.className = 'filtres';
    barre.setAttribute('role', 'group');
    barre.setAttribute('aria-label', 'Filtrer les projets');
    const trait = '<svg class="souligne" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M2 6.5 C 18 3.5, 34 8, 52 5.5 S 84 3.5, 98 6"/></svg>';
    barre.innerHTML = [['tout', 'Tout', lignes.length], ...rubriques.map(r => [r, r, dans(r)])]
      .map(([cle, nom, n]) => `<button type="button" class="filtre" data-rubrique="${echapper(cle)}" aria-pressed="${cle === 'tout'}"><span data-texte="${echapper(nom)}">${echapper(nom)}</span><sup>${n}</sup>${trait}</button>`)
      .join('');
    liste.before(barre);

    barre.addEventListener('click', e => {
      const bouton = e.target.closest('.filtre');
      if (!bouton || bouton.getAttribute('aria-pressed') === 'true') return;
      barre.querySelectorAll('.filtre').forEach(b => b.setAttribute('aria-pressed', b === bouton));
      if (barre.scrollWidth > barre.clientWidth)   // sur téléphone, la rangée glisse pour garder le mot choisi en vue
        barre.scrollTo({ left: bouton.offsetLeft - (barre.clientWidth - bouton.offsetWidth) / 2, behavior: mouvementReduit.matches ? 'auto' : 'smooth' });
      rubrique = bouton.dataset.rubrique;
      montrer(true);
    });
  })();

  /* Fiche projet en plein écran : le texte à gauche (il reste en place), les visuels à droite ;
     sur téléphone, tout l'un sous l'autre. « Précédent / Suivant » (et les flèches du clavier)
     passent d'un projet à l'autre, dans l'ordre de la liste et du filtre choisi. */
  let projetOuvert = null;
  const projetsVisibles = () => {
    const vus = [...liste.children].filter(li => !li.hidden).map(li => li.projet);
    return vus.includes(projetOuvert) ? vus : projets;
  };
  // Un bloc de fiche : le texte, les fichiers à télécharger (PDF, vidéo) et les visuels
  const htmlFichiers = liste => liste.map(f => `
      <a href="${echapper(f.url)}" download>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3.2c.1 3.9-.1 7.9 0 11.6M5.6 10.6c1.5 1.5 2.9 3 4.4 4.4 1.5-1.4 2.9-2.9 4.4-4.4M4 17.4c4 .2 8 0 12 .1"/></svg>
        <span>${echapper(f.titre)}</span>${f.poids ? `<small>${echapper(f.poids)}</small>` : ''}
      </a>`).join('');
  function remplirImages(conteneur, images, titre, premier) {
    conteneur.innerHTML = images.map((src, i) => `<img src="${echapper(src)}" alt="${echapper(titre)}, visuel ${i + 1}" loading="${premier && !i ? 'eager' : 'lazy'}">`).join('');
    conteneur.querySelectorAll('img').forEach(img => {   // les visuels très en hauteur (stories) se rangent par trois
      const ranger = () => img.classList.toggle('etroite', img.naturalHeight / img.naturalWidth > 1.55);
      if (img.complete && img.naturalWidth) ranger(); else img.addEventListener('load', ranger, { once: true });
    });
  }
  const suiteFiche = $('#fiche-suite'), nav = fiche.querySelector('.fiche-nav'), infosPremiere = fiche.querySelector('.fiche-corps .fiche-infos');

  function ouvrir(p) {
    projetOuvert = p;
    const suite = projetsVisibles(), n = suite.indexOf(p);
    $('#fiche-compteur').textContent = `Projet ${String(n + 1).padStart(2, '0')} / ${String(suite.length).padStart(2, '0')}`;
    $('#fiche-categorie').textContent = p.categorie;
    $('#fiche-titre').textContent = p.titre;
    // Un projet peut avoir plusieurs parties (ex. le logo, puis l'affiche) : la 1re dans le premier bloc,
    // les suivantes dans des blocs identiques, l'un sous l'autre, chacun avec son sous-titre.
    const parties = p.sections || [];
    const partie = $('#fiche-partie');
    partie.textContent = p.partie || '';
    partie.hidden = !(p.partie && parties.length);
    $('#fiche-texte').innerHTML = p.texte.map(t => `<p>${t}</p>`).join('');
    const fichiers = $('#fiche-fichiers'), aTelecharger = p.fichiers || [];   // PDF et vidéos : un lien de téléchargement chacun
    fichiers.innerHTML = htmlFichiers(aTelecharger);
    fichiers.hidden = !aTelecharger.length;
    remplirImages($('#fiche-images'), p.images, p.titre, true);
    suiteFiche.replaceChildren(...parties.map(s => {
      const bloc = document.createElement('div');
      bloc.className = 'fiche-corps fiche-bloc';
      bloc.innerHTML = `
        <div class="fiche-infos">
          ${s.titre ? `<h3 class="fiche-partie">${echapper(s.titre)}</h3>` : ''}
          <div class="fiche-texte">${s.texte.map(t => `<p>${t}</p>`).join('')}</div>
          ${s.fichiers.length ? `<div class="fiche-fichiers">${htmlFichiers(s.fichiers)}</div>` : ''}
        </div>
        <div class="fiche-images"></div>`;
      remplirImages(bloc.querySelector('.fiche-images'), s.images, `${p.titre}, ${s.titre}`, false);
      return bloc;
    }));
    (parties.length ? suiteFiche.lastElementChild.querySelector('.fiche-infos') : infosPremiere).append(nav);   // « Précédent / Suivant » tout en bas
    const plusieurs = suite.length > 1;
    nav.hidden = !plusieurs;
    if (!fiche.open) fiche.showModal();
    fiche.scrollTop = 0;
    history.replaceState(null, '', location.pathname + location.search + '#' + p.id);
  }
  function voisin(k) {
    const suite = projetsVisibles(), n = suite.indexOf(projetOuvert);
    ouvrir(suite[(n + k + suite.length) % suite.length]);
  }
  fiche.addEventListener('close', () => history.replaceState(null, '', location.pathname + location.search + '#projets'));
  fiche.querySelector('[data-fermer]').addEventListener('click', () => fiche.close());
  fiche.querySelector('.fiche-prec').addEventListener('click', () => voisin(-1));
  fiche.querySelector('.fiche-suiv').addEventListener('click', () => voisin(1));
  fiche.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); voisin(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); voisin(-1); }
  });

  /* =========================================================
     MENU sur téléphone et tablette : plein écran, les rubriques en grand
     ========================================================= */
  (() => {
    const boite = $('#menu-mobile'), ouvrir = $('.ouvrir-menu');
    if (!boite || !ouvrir || !boite.showModal) return;
    boite.querySelectorAll('.menu-mobile-liens span').forEach(s => [...s.children].forEach((a, i) => a.style.setProperty('--i', i)));
    ouvrir.addEventListener('click', () => { boite.showModal(); ouvrir.setAttribute('aria-expanded', 'true'); });
    boite.addEventListener('close', () => ouvrir.setAttribute('aria-expanded', 'false'));
    boite.querySelector('.fermer-menu').addEventListener('click', () => boite.close());
    boite.querySelectorAll('a').forEach(a => a.addEventListener('click', () => boite.close()));
    boite.querySelector('.menu-mobile-bascule').addEventListener('click', () => { boite.close(); basculer(ouvrir, true); });
    matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches && boite.open) boite.close(); });
  })();

  /* =========================================================
     BARRE « RÉSERVER · APPELER » (téléphone, côté musique) : elle se montre quand on a quitté l'accueil
     et s'efface quand on arrive au formulaire de booking ou au pied de page
     ========================================================= */
  (() => {
    const barre = $('.barre-resa');
    if (!barre || !('IntersectionObserver' in window)) return;
    const presents = new Set();
    const guet = new IntersectionObserver(entrees => {
      entrees.forEach(e => e.isIntersecting ? presents.add(e.target) : presents.delete(e.target));
      barre.classList.toggle('visible', presents.size === 0);
    }, { rootMargin: '0px 0px -15% 0px' });
    ['#accueil', '#booking', '.pied'].forEach(sel => guet.observe($(sel)));
  })();

  /* =========================================================
     ACCÈS CACHÉ AU BACK-OFFICE (sur le Mac et en Wi-Fi seulement) : 5 clics rapides sur « Lucas Marrec · 2026 »
     ========================================================= */
  (() => {
    const credit = $('.pied > .caps');
    if (!credit || /github\.io$/.test(location.hostname)) return;   // le back-office n'existe que sur le Mac
    let clics = 0, remise;
    credit.addEventListener('click', e => {
      if (e.target.closest('a')) return;   // le lien Instagram garde son rôle
      clics++; clearTimeout(remise);
      remise = setTimeout(() => { clics = 0; }, 1500);
      if (clics >= 5) { clics = 0; location.href = 'admin.html'; }
    });
  })();

  /* =========================================================
     EN DIRECT (sur le Mac seulement) : quand le back-office sauvegarde, le site ouvert se met à jour tout seul.
     Toutes les 2 secondes, on regarde si contenu/site.js a changé ; si oui, la page se recharge au même endroit.
     ========================================================= */
  (() => {
    if (!location.protocol.startsWith('http') || /github\.io$/.test(location.hostname)) return;
    let reference = null;
    const verifier = async () => {
      if (document.hidden || (fiche && fiche.open)) return;
      try {
        const r = await fetch('contenu/site.js?verif=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
        const marque = r.headers.get('Last-Modified') || r.headers.get('Content-Length');
        if (!marque) return;
        if (reference === null) reference = marque;
        else if (marque !== reference) { try { sessionStorage.setItem('position', String(scrollY)); } catch (e) {} location.reload(); }
      } catch (e) {}
    };
    verifier(); setInterval(verifier, 2000);
    try {   // après un rechargement en direct : on revient au même endroit
      const y = sessionStorage.getItem('position');
      if (y !== null) { sessionStorage.removeItem('position'); addEventListener('load', () => scrollTo({ top: +y, behavior: 'instant' })); }
    } catch (e) {}
  })();

  /* =========================================================
     DÉMARRAGE
     ========================================================= */
  const direct = projets.find(p => '#' + p.id === location.hash);   // lien direct : …/#apollon
  if (direct) racine.dataset.mode = 'com';
  appliquer(racine.dataset.mode === 'scene' ? 'scene' : 'com');
  introAccueil();
  if (direct) ouvrir(direct);

  // Petit signe de l'interrupteur : si personne n'a cliqué au bout de quelques secondes, le rond glisse à moitié puis revient (une fois)
  const principal = $('.bascule .interrupteur');
  let aBascule = false;
  principal.addEventListener('click', () => { aBascule = true; principal.classList.remove('coucou'); });
  if (!mouvementReduit.matches) setTimeout(() => {
    const r = principal.getBoundingClientRect();
    if (aBascule || fiche.open || r.bottom < 0 || r.top > innerHeight) return;
    principal.classList.add('coucou');
    principal.addEventListener('animationend', () => principal.classList.remove('coucou'), { once: true });
  }, 4800);

  let attente;
  addEventListener('resize', () => { clearTimeout(attente); attente = setTimeout(() => { dessinerTraits(); Guitare.construire(); Sentier.construire(); }, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { dessinerTraits(); Sentier.construire(); });
  addEventListener('load', () => Sentier.construire());
})();
