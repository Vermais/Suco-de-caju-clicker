/* Catálogo visual do Álbum Pedro Victor. A posse vem do Supabase. */
(function(root) {
  'use strict';
  const names = ["Pedro Víctor Furry", "Pedro Víctor com Furry", "Pedro Víctor 67", "Pedro Víctor tomando Suco de Caju", "Pedro Víctor sendo o Suco de Caju", "Pedro Víctor com arroz e feijão", "Pedro Víctor sendo o arroz e feijão", "Pedro Víctor sendo o animatronic Freddy", "Pedro Víctor Chica", "Pedro Víctor Foxy", "Pedro Víctor Bonnie", "Pedro Víctor Funtime Freddy", "Pedro Víctor Funtime Foxy", "Pedro Víctor Ballora", "Pedro Víctor professor de matemática", "Pedro Víctor com roupa colorida", "Pedro Víctor Batman", "Pedro Víctor Mulher-Maravilha", "Pedro Víctor Superman", "Pedro Víctor Flash", "Pedro Víctor Coringa", "Pedro Víctor Arlequina", "Pedro Víctor Duas-Caras", "Pedro Víctor Hulk", "Pedro Víctor com roupa de dormir", "Pedro Víctor sendo o Gon de Hunter x Hunter", "Pedro Víctor sendo o CJ", "Pedro Víctor com Novinho", "Pedro Víctor com Novinho", "Pedro Víctor cozinheiro", "Pedro Víctor policial", "Pedro Víctor papagaio de Gustavo", "Pedro Víctor chinela Havaiana", "Pedro Víctor relógio", "Pedro Víctor comendo carne", "Pedro Víctor Manoel Gomes", "Pedro Víctor cavalo", "Pedro Víctor Stand Notorious B.I.G.", "Pedro Víctor Isaac", "Pedro Víctor Saiko", "Pedro Víctor cupido", "Pedro Víctor palhaço", "Pedro Víctor jogador de futebol", "Pedro Víctor caixa de som", "Pedro Víctor jogador de LoL", "Pedro Víctor gordo", "Pedro Víctor na academia", "Pedro Víctor Minecraft", "Pedro Víctor mago", "Pedro Víctor criança", "Pedra Víctoria", "Pedro Víctor idoso", "Pedro Víctor Lanterna Rosa", "Pedro Víctor pecado da Ira", "Pedro Víctor Bob Esponja", "Paulo Víctor", "Pedro Liso", "Pedro Víctor matuto", "Pedro Víctor rico", "Pedro Víctor Avatar", "Pedro Víctor Saiyajin", "Pedro Víctor Fortnite", "Pedro Víctor Morty", "Pedro Víctor Rick", "Pedro Víctor Lula Molusco", "Pedro Víctor Patrick Estrela", "Pedro Potter", "Pedro Víctor tomando morango ao leite", "Pedro Víctor Springtrap", "Pedro Víctor dirigindo moto", "Pedro Víctor Curupira", "Pedro Víctor Cuca", "Pedro Víctor Iara", "Pedro Víctor Saci", "Pedro Víctor Boitatá", "Pedro Víctor Mapinguari", "Pedro Víctor cabelo grande", "Pedro Víctor mandrake", "Pedro Víctor gótico emo", "Pedro Víctor cabelo colorido", "Pedro Víctor de barba", "Pedro Víctor ônibus", "Pedro Víctor Célio, motorista de ônibus", "Pedro Víctor Orochinho", "Pedro Víctor Sasuke", "Pedro Víctor Naruto", "Pedro Víctor Sakura", "Pedro Víctor Kakashi", "Pedro Víctor lendo livro", "Pedro Víctor consertando carro", "Pedro Víctor consertando computador", "Pedro Víctor cafetão", "Pedro Víctor sugar baby", "Pedro Víctor bebezão da boca inchada", "Pedro Víctor Kurapika Kurta", "Pedro Víctor sombra", "Pedro Víctor luz", "Pedro Víctor apaixonado", "Pedro Víctor com raiva", "Pedro Víctor feliz", "Pedro Víctor babando", "Pedro Víctor Voldemort", "Pedro Víctor Salsicha", "Pedro Víctor Scooby-Doo", "Pedro Víctor + Namorada", "Pedro Víctor Trox", "Pedro Víctor Mamutinho", "Pedro Víctor dedo enroscado", "Pedro Víctor Fantominho", "Pedro Víctor", "Pedro Víctor — Olhar do Anjo Caído"];
  const rarityIds = {"uncommon": [7, 9, 16, 25, 28, 31, 32, 33, 34, 36, 37, 39, 40, 42, 47, 55, 58, 66, 68, 75, 77, 78, 79, 80, 81, 83], "rare": [10, 20, 21, 22, 23, 41, 43, 48, 53, 62, 63, 64, 70, 71, 72, 73, 74, 76, 86, 87, 94], "epic": [1, 11, 17, 18, 19, 24, 26, 27, 49, 60, 61, 84, 85, 88], "mythic": [13, 38, 54, 69, 95, 96, 97], "legendary": [4, 67, 102, 109], "secret": [5, 12, 110], "supersecret": [111]};
  const rarities = {"common": ["Comum", 1.05], "uncommon": ["Incomum", 1.1], "rare": ["Rara", 1.2], "epic": ["Épica", 1.35], "mythic": ["Mítica", 1.5], "legendary": ["Lendária", 1.75], "secret": ["Secreta", 1.9], "supersecret": ["Supersecreta", 2]};
  const rarityFor = id => Object.keys(rarityIds).find(key => rarityIds[key].includes(id)) || 'common';
  const cards = names.map((name, i) => Object.freeze({ id: i + 1, name, rarity: rarityFor(i + 1), rarityName: rarities[rarityFor(i + 1)][0], multiplier: rarities[rarityFor(i + 1)][1],
    image: 'https://album-pedro-victor.vercel.app/stickers/cards/' + String(i + 1).padStart(3, '0') + (i === 110 ? '.png' : '.jpg') }));
  function cardForSkin(skin) {
    if (typeof skin !== 'string' || !/^sticker:[1-9][0-9]{0,2}$/.test(skin)) return null;
    return cards[Number(skin.slice(8)) - 1] || null;
  }
  function hasOwned(owned, id) {
    const count = owned?.[String(id)];
    return typeof count === 'number' && Number.isFinite(count) && Number.isInteger(count) && count > 0;
  }
  function buffMultiplier(buff, skin, owned, now = Date.now()) {
    const card = cardForSkin(skin);
    return card && buff?.cardId === card.id && buff?.owned === true && hasOwned(owned, card.id) && buff.until > now ? card.multiplier : 1;
  }
  const api = { buffMultiplier, rarities, cards: Object.freeze(cards), cardForSkin, hasOwned,
    ownedCards: owned => cards.filter(card => hasOwned(owned, card.id)),
    normalizeSkin: skin => skin === 'pedro67' || skin === 'cup' || cardForSkin(skin) ? skin : 'cup' };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CajuStickers = api;
})(typeof window !== 'undefined' ? window : globalThis);
