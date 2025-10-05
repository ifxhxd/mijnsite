async function loadGames() {
  const res = await fetch('games.json');
  const games = await res.json();
  const grid = document.getElementById('grid');
  const template = document.getElementById('card-template');

  function render(list) {
    grid.innerHTML = '';
    list.forEach(game => {
      const card = template.content.cloneNode(true);
      card.querySelector('.thumb').src = game.thumb;
      card.querySelector('.thumb').alt = game.title;
      card.querySelector('.title').textContent = game.title;
      card.querySelector('.desc').textContent = game.desc;
      card.querySelector('.download').href = game.downloadUrl;
      grid.appendChild(card);
    });
  }

  // Zoekfunctie
  document.getElementById('search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = games.filter(g =>
      (g.title + g.desc).toLowerCase().includes(q)
    );
    render(filtered);
  });

  render(games);
}

loadGames().catch(console.error);
