/* =========================================================
   CONTENU : applique au site les textes, projets, dates et photos de contenu/site.js
   (le fichier que modifie le back-office). Tourne avant js/main.js.
   ========================================================= */
(function () {
  const C = window.CONTENU;
  const racine = document.documentElement;
  if (!C) { racine.classList.remove('chargement'); return; }   // fichier absent : on garde le texte de la page

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const echapper = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const lignes = s => echapper(s).split('\n').join(' <br>');   // un retour à la ligne dans le texte = <br>
  const texte = (sel, valeur) => { const el = $(sel); if (el && valeur != null) el.textContent = valeur; };
  const deuxChiffres = n => String(n).padStart(2, '0');

  /* ----- Coordonnées : partout où elles apparaissent ----- */
  const co = C.coordonnees || {};
  const telLien = 'tel:' + String(co.telephone || '').replace(/[^\d+]/g, '').replace(/^0/, '+33');
  const instaLien = `https://www.instagram.com/${co.instagram}/`;
  if (co.email) $$('a[href^="mailto:"]').forEach(a => { a.href = 'mailto:' + co.email + (a.getAttribute('href').match(/\?.*$/) || [''])[0]; });
  if (co.telephone) $$('a[href^="tel:"]').forEach(a => { a.href = telLien; });
  if (co.instagram) $$('a[href*="instagram.com"]').forEach(a => { a.href = instaLien; });
  if (co.linkedin) $$('a[href*="linkedin.com"]').forEach(a => { a.href = co.linkedin; });
  if (co.email) {
    texte('#contact .bouton', co.email + ' →');
    texte('.direct a[href^="mailto:"]', co.email);
  }
  if (co.telephone) {
    $$('.note-contact[href^="tel:"] b, .direct a[href^="tel:"]').forEach(el => { el.textContent = co.telephone; });
    const tel = $('.direct-tel'); if (tel && tel.lastChild) tel.lastChild.textContent = co.telephone;
  }
  if (co.instagram) $$('.note-contact[href*="instagram.com"] b').forEach(b => { b.textContent = '@' + co.instagram; });

  /* ----- Accueil ----- */
  if (C.accueil) {
    texte('.accueil-texte > p.face-com', C.accueil.sousTitreCom);
    texte('.accueil-texte > p.face-scene', C.accueil.sousTitreScene);
  }

  /* ----- À propos ----- */
  const ap = C.apropos;
  if (ap) {
    texte('#a-propos h2', ap.titre);
    const bloc = $('#a-propos .texte'), outils = $('#a-propos .outils');
    if (bloc && outils && Array.isArray(ap.paragraphes)) {
      bloc.querySelectorAll(':scope > p:not(.caps)').forEach(p => p.remove());
      ap.paragraphes.forEach(t => { const p = document.createElement('p'); p.innerHTML = lignes(t); outils.before(p); });
    }
    texte('#a-propos .outils', ap.outils);
    if (ap.cv) { const cv = $('#a-propos .bouton'); if (cv) cv.setAttribute('href', ap.cv); }
    if (ap.portrait) {
      const vide = $('#a-propos .portrait');
      if (vide) {
        const img = document.createElement('img');
        img.className = 'photo portrait'; img.src = ap.portrait; img.alt = 'Portrait de Lucas Marrec';
        img.style.objectFit = 'cover';
        vide.replaceWith(img);
      }
    }
  }

  /* ----- Projets (affichés par js/main.js) ----- */
  if (C.projets) {
    texte('#projets h2', C.projets.titre);
    window.RUBRIQUES = C.projets.rubriques || [];
    const fichiersProjet = l => (l || []).filter(f => f && f.url).map(f => ({ titre: f.titre || 'Télécharger', url: f.url, poids: f.poids || '' }));
    window.PROJETS = (C.projets.liste || []).filter(p => !p.masque).map(p => ({   // masqué : gardé dans le back-office, absent du site
      id: p.id, titre: p.titre, rubriques: p.rubriques || [], une: !!p.une,   // une : dans la sélection affichée d'abord
      cadrage: p.cadrage || '',   // point de la vignette à garder visible (ex. « 50% 100% » = le bas de l'image)
      categorie: (p.categorie || '').trim() || (p.rubriques || []).join(' · '),   // vide : on affiche les filtres cochés
      texte: (p.texte || []).map(lignes), images: p.images || [],
      // PDF ou vidéo à télécharger depuis la fiche : [{ titre, url, poids }]
      fichiers: fichiersProjet(p.fichiers),
      // vignette : l'image de présentation du projet (sinon, la première image)
      vignette: p.vignette || (p.images || [])[0] || '',
      // parties : un projet peut se présenter en plusieurs parties (ex. le logo, puis l'affiche) ;
      // la 1re = texte / images / fichiers ci-dessus (sous-titre « partie »), les suivantes = sections
      partie: p.partie || '',
      sections: (p.sections || []).map(s => ({ titre: s.titre || '', texte: (s.texte || []).map(lignes), images: s.images || [], fichiers: fichiersProjet(s.fichiers) }))
        .filter(s => s.texte.length || s.images.length || s.fichiers.length)
    }));
  }

  /* ----- Parcours ----- */
  if (C.parcours) {
    texte('#parcours h2', C.parcours.titre);
    const ol = $('#parcours .liste');
    if (ol && Array.isArray(C.parcours.etapes)) ol.innerHTML = C.parcours.etapes.map((e, i) =>
      `<li><span class="date"><small>${echapper(e.annees)}</small><b>${deuxChiffres(i + 1)}</b></span>` +
      `<span class="intitule">${echapper(e.diplome)}<small>${echapper(e.ecole)}</small><em>${lignes(e.description)}</em></span></li>`).join('');
  }

  /* ----- Bandeaux qui défilent ----- */
  const bandeau = (sel, t) => { if (t) $$(sel + ' .piste span').forEach(s => { s.textContent = t + ' · '; }); };
  bandeau('.defile.face-com', C.bandeauCom);
  bandeau('.defile.face-scene', C.bandeauScene);

  /* ----- Contact ----- */
  if (C.contact) {
    texte('#contact h2', C.contact.titre);
    const ch = $('#contact .chapeau'); if (ch && C.contact.chapeau != null) ch.innerHTML = lignes(C.contact.chapeau);
  }

  /* ----- Sur scène (photos live) ----- */
  if (C.live) {
    texte('#live h2', C.live.titre);
    const rail = $('#carrousel .rail');
    if (rail && Array.isArray(C.live.photos)) rail.innerHTML = C.live.photos.map(ph =>
      `<figure class="cliche"><img class="photo" src="${echapper(ph.image)}" alt="${echapper(ph.description)}" draggable="false" loading="lazy"` +
      (ph.cadrage ? ` style="object-position: ${echapper(ph.cadrage)}"` : '') + `>` +
      `<figcaption class="legende"><b>${echapper(ph.lieu)}</b><small>${echapper(ph.date)}</small></figcaption></figure>`).join('');
  }

  /* ----- Présentation côté musique (la carte blanche) ----- */
  const mu = C.musique;
  if (mu) {
    texte('#presentation .caps:not(.outils)', mu.etiquette);
    texte('#presentation h2', mu.titre);
    const ch = $('#presentation .chapeau');
    if (ch && Array.isArray(mu.paragraphes)) ch.innerHTML = mu.paragraphes.map(lignes).join('<br><br>');
    // le répertoire « Chant corse · Variété française · … » devient une pilule par genre
    const rep = $('#presentation .outils');
    if (rep && mu.repertoire != null)
      rep.innerHTML = String(mu.repertoire).split(/\s*[·|]\s*/).filter(Boolean).map(g => `<span>${echapper(g)}</span>`).join('');
  }

  /* ----- Programme de la semaine (masquable hors saison depuis le back-office) ----- */
  const pr = C.programme;
  if (pr && pr.visible === false) {
    const bloc = $('#dates'); if (bloc) bloc.remove();
    $$('a[href="#dates"]').forEach(a => a.remove());   // « Dates » disparaît aussi des menus
  } else if (pr) {
    texte('#dates .entete .caps', pr.mois);
    const h2 = $('#dates h2'); if (h2 && pr.titre) h2.innerHTML = lignes(pr.titre);
    const ol = $('#dates .liste');
    if (ol && Array.isArray(pr.dates)) ol.innerHTML = pr.dates.map(d =>
      `<li><span class="date"><small>${echapper(d.jour)}</small><b>${echapper(d.numero)}</b></span>` +
      `<span class="intitule">${echapper(d.lieu)}<small>${echapper(d.ville)}</small></span></li>`).join('');
  }

  /* ----- Booking ----- */
  if (C.booking) {
    texte('#booking h2', C.booking.titre);
    const pastilles = $('#booking .pastilles');
    if (pastilles && Array.isArray(C.booking.types) && C.booking.types.length) pastilles.innerHTML = C.booking.types.map((t, i) =>
      `<label class="pastille"><input type="radio" name="type" value="${echapper(t)}"${i ? '' : ' required'}><span>${echapper(t)}</span></label>`).join('');
  }

  racine.classList.remove('chargement');
})();
