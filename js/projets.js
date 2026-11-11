/*
  PROJETS — c'est ici que tu ajoutes, retires ou modifies un projet.

  Chaque projet est un bloc entre { et }, séparé du suivant par une virgule.
  - id        : un mot sans espace ni accent (sert au lien direct)
  - titre     : le nom affiché
  - categorie : la petite ligne en capitales à droite du titre (texte libre)
  - rubriques : le ou les filtres où le projet apparaît, écrits exactement comme dans
                RUBRIQUES ci-dessous (un projet peut être dans deux rubriques)
  - images    : la première sert de vignette ; les autres s'affichent dans la fiche
  - texte     : un paragraphe par ligne du tableau

  Les textes sont entre accents graves ` ` : tu peux y mettre des apostrophes
  et des guillemets sans rien casser.
*/
/*
  RUBRIQUES — les boutons de filtre au-dessus de la liste, dans cet ordre.
  Un bouton n'apparaît que si au moins un projet l'utilise : « Photo » et
  « Vidéo & motion » s'afficheront dès que tu ajouteras un projet de ce type.
*/
window.RUBRIQUES = [
  "Identité visuelle",
  "Print",
  "Illustration",
  "Photo",
  "Vidéo & motion",
  "Réseaux sociaux",
  "Web & interfaces"
];

window.PROJETS = [
  {
    id: "programme-semaine",
    titre: `Programme de la semaine`,
    categorie: `Réseaux sociaux · stories`,
    rubriques: ["Réseaux sociaux"],
    images: [
      "img/projets/programme-semaine/01.jpg",
      "img/projets/programme-semaine/02.jpg",
      "img/projets/programme-semaine/03.jpg"
    ],
    texte: [
      `Lorem ipsum : stories Instagram pour annoncer mes dates de concerts de l'été en Corse du Sud. Un seul vert, des petites capitales, des illustrations au trait.`,
      `C'est cette direction artistique qui habille ce site.`
    ]
  },
  {
    id: "apollon",
    titre: `Apollon`,
    categorie: `Projet logotype`,
    rubriques: ["Identité visuelle", "Illustration"],
    images: ["img/projets/apollon/01.png"],
    texte: [
      `Ce logotype représente une réinterprétation contemporaine du dieu grec Apollon, réalisée dans le cadre d'un projet de recherche graphique autour des divinités antiques. L'objectif était d'imaginer une identité visuelle moderne en s'appuyant sur les attributs traditionnels du dieu.`,
      `Apollon, souvent associé à la musique, au soleil et à la beauté, est ici représenté comme une figure urbaine, presque iconique, à la croisée de la mythologie et de la culture pop actuelle. Le casque audio qu'il porte renforce cette modernisation, avec un détail subtil : une clé de sol gravée sur l'oreillette, en référence à sa fonction de dieu de la musique.`,
      `Le tatouage en forme de soleil sur sa poitrine rappelle son lien avec la lumière et l'harmonie, tout en renforçant son identité visuelle. La silhouette stylisée, en noir et blanc, évoque à la fois l'esthétique des sculptures antiques et une certaine modernité graphique, proche du design de marque ou d'affiche.`
    ]
  },
  {
    id: "packaging-biere",
    titre: `Packaging bière`,
    categorie: `Packaging · charte graphique`,
    rubriques: ["Print", "Identité visuelle"],
    images: [
      "img/projets/packaging-biere/01.jpg",
      "img/projets/packaging-biere/02.jpg",
      "img/projets/packaging-biere/03.jpg"
    ],
    texte: [
      `Dans ce projet, j'ai collaboré avec des partenaires et des étudiants en génie biologique pour concevoir une bière aromatisée à un ingrédient spécifique, alliant créativité et expertise scientifique.`,
      `L'objectif était de proposer une bière unique, distinctive par son goût et son identité visuelle, en parfaite adéquation avec l'ingrédient choisi. J'ai réalisé une analyse approfondie du marché et des attentes des consommateurs pour orienter le développement du produit.`,
      `Ensuite, j'ai défini une iconographie précise, incluant des photographies, illustrations et vidéos. J'ai élaboré une charte graphique déclinée sur l'étiquetage, les réseaux sociaux et les animations, garantissant une esthétique cohérente et impactante.`
    ]
  },
  {
    id: "boite-biscuits-luxe",
    titre: `Boîte de biscuits de luxe`,
    categorie: `Packaging · luxe`,
    rubriques: ["Print"],
    images: ["img/projets/boite-biscuits-luxe/01.jpg"],
    texte: [
      `Dans ce projet, l'objectif était de créer une boîte de luxe pour la marque Aperi'Strelli, inspirée par la marque Fauchon. L'idée était de concevoir un packaging si attrayant qu'il parlerait de lui-même, incitant les consommateurs à acheter les biscuits rien que pour la beauté de la boîte.`,
      `Le but était de choisir des couleurs sobres et une clarté visuelle, utilisant principalement le noir avec des accents blancs et dorés. Ce design élégant et sophistiqué visait à captiver l'attention des consommateurs, créant une expérience visuelle mémorable. L'objectif était de faire en sorte que la boîte soit tellement séduisante qu'elle devienne un objet de désir en soi, renforçant ainsi l'image de marque d'Aperi'Strelli comme synonyme de luxe et de qualité.`
    ]
  },
  {
    id: "green-game",
    titre: `Green Game`,
    categorie: `Challenge RSE · interfaces`,
    rubriques: ["Web & interfaces", "Illustration"],
    images: ["img/projets/green-game/01.jpg"],
    texte: [
      `Le projet « Green Game » a été conçu dans le cadre de la deuxième édition du challenge Jean-Louis Canaletti, organisé à Corte. Ce concours, ouvert aux formations Bac+3 de l'IUT, vise à sensibiliser les étudiants à l'importance de la Responsabilité Sociale des Entreprises (RSE).`,
      `Dans ce cadre, « Green Game » s'est distingué comme une initiative collaborative et créative, visant à sensibiliser le public à des enjeux écologiques grâce à une approche ludique et pédagogique.`,
      `Création graphique : grâce à des outils tels qu'Adobe Illustrator et Photoshop, j'ai conçu des visuels engageants, incluant des illustrations, icônes et éléments graphiques reflétant les thématiques environnementales du projet.`,
      `Conception d'interfaces utilisateur : en utilisant Figma, j'ai développé des maquettes interactives et intuitives pour garantir une expérience utilisateur fluide et attractive.`
    ]
  },
  {
    id: "prosa-ar",
    titre: `Affiche Prosa en AR`,
    categorie: `Affiche · réalité augmentée`,
    rubriques: ["Print"],
    images: ["img/projets/prosa-ar/01.jpg"],
    texte: [
      `L'affiche pour le projet de jeu vidéo Prosa a été réalisée avec Adobe Aero. Elle présente un paysage fantastique et immersif, mettant en scène des éléments mythologiques corses et provençaux. Les animations et la musique ajoutent une dimension interactive et captivante à l'expérience visuelle.`,
      `Pour tester l'animation, merci de télécharger Adobe Aero sur mobile.`
    ]
  },
  {
    id: "affiche-40-ans-iut",
    titre: `Affiche des 40 ans de l'IUT de Corse`,
    categorie: `Affiche · Illustrator`,
    rubriques: ["Print"],
    images: ["img/projets/affiche-40-ans-iut/01.jpg"],
    texte: [
      `Pour créer mon affiche pour les 40 ans de l'IUT de Corse, j'ai choisi de mettre en avant l'importance de l'éducation avec le slogan « Studia hè libertà ». J'ai utilisé des couleurs inspirées de l'université et des polices modernes pour refléter son prestige.`,
      `J'ai travaillé avec Adobe Illustrator pour concevoir l'affiche, en passant par plusieurs étapes, du croquis initial à la version finale. J'ai intégré les logos de l'université et de l'IUT pour renforcer l'identité visuelle. J'ai aussi pris en compte les retours de mes camarades et professeurs pour améliorer le design.`
    ]
  },
  {
    id: "character-design",
    titre: `Character design`,
    categorie: `Illustration · Photoshop`,
    rubriques: ["Illustration"],
    images: ["img/projets/character-design/01.jpg"],
    texte: [
      `Dans le cadre de ce projet de character design, j'ai créé un personnage original basé sur le thème floral. J'ai exploré des éléments naturels comme les motifs floraux, les textures organiques et des palettes de couleurs vibrantes.`,
      `L'objectif était de concevoir un personnage qui incarne l'essence du thème, en fusionnant réalisme et surréalisme avec une esthétique contemporaine. J'ai utilisé Adobe Photoshop pour expérimenter avec des compositions visuelles complexes, intégrant des éléments floraux dans les vêtements, accessoires et l'environnement visuel du personnage.`,
      `L'ensemble crée un contraste fort entre tradition et contemporanéité, ce qui donne à ce logotype une dimension à la fois symbolique et impactante.`
    ]
  }
];
