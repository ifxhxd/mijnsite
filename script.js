const sample = [
  { title: "Voorbeeld Item 1", desc: "Beschrijving…", thumb: "https://picsum.photos/seed/1/600/400", url: "#" },
  { title: "Voorbeeld Item 2", desc: "Beschrijving…", thumb: "https://picsum.photos/seed/2/600/400", url: "#" },
  { title: "Voorbeeld Item 3", desc: "Beschrijving…", thumb: "https://picsum.photos/seed/3/600/400", url: "#" }
];

function render(list){
  const grid = document.getElementById('grid');
  const tpl = document.getElementById('card-tpl');
  grid.innerHTML = '';
  list.forEach(item=>{
    const node = tpl.content.cloneNode(true);
    node.querySelector('.thumb').src = item.thumb;
    node.querySelector('.title').textContent = item.title;
    node.querySelector('.desc').textContent = item.desc;
    const a = document.createElement('a');
    a.href = item.url; a.textContent = 'Bekijk'; a.target = '_blank';
    node.querySelector('.actions').appendChild(a);
    grid.appendChild(node);
  });
}

document.getElementById('search').addEventListener('input', e=>{
  const q = e.target.value.toLowerCase();
  render(sample.filter(s => (s.title + ' ' + s.desc).toLowerCase().includes(q)));
});

render(sample);
