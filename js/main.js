const SECTIONS = {
  series: "Сериалы",
  channels: "Каналы",
  books: "Книги",
};

function el(tag, attrs = {}, text = "") {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  if (text) node.textContent = text;
  return node;
}

function emptyNote(container, text) {
  container.appendChild(el("p", { class: "empty" }, text));
}

async function loadData() {
  const response = await fetch("data.json");
  return response.json();
}

function renderBooks(container, books) {
  if (!books.length) {
    emptyNote(container, "Книги скоро появятся.");
    return;
  }
  books.forEach((book) => {
    const card = el("div", { class: "card" });
    card.appendChild(el("h3", {}, book.title));
    card.appendChild(el("p", {}, book.description || ""));
    if (book.url) {
      card.appendChild(el("a", { class: "btn", href: book.url, target: "_blank", rel: "noopener" }, "Читать"));
    }
    container.appendChild(card);
  });
}

function renderVideos(container, videos, playlists) {
  const groups = Object.keys(SECTIONS);
  groups.forEach((key) => {
    const items = videos.filter((video) => video.section === key);
    const lists = playlists.filter((list) => list.section === key);
    const block = el("section");
    block.appendChild(el("h2", {}, SECTIONS[key]));
    if (!items.length && !lists.length) {
      emptyNote(block, "Пока пусто.");
    } else {
      const grid = el("div", { class: "grid" });
      lists.forEach((list) => {
        const card = el("div", { class: "card video-card playlist-card" });
        card.appendChild(el("iframe", {
          src: `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(list.id)}`,
          title: list.title,
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture",
          allowfullscreen: "",
        }));
        card.appendChild(el("h3", {}, list.title));
        if (list.description) card.appendChild(el("p", {}, list.description));
        grid.appendChild(card);
      });
      items.forEach((video) => {
        const card = el("div", { class: "card video-card" });
        const frame = el("iframe", {
          src: `https://www.youtube.com/embed/${encodeURIComponent(video.id)}`,
          title: video.title,
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture",
          allowfullscreen: "",
        });
        card.appendChild(frame);
        card.appendChild(el("h3", {}, video.title));
        if (video.description) card.appendChild(el("p", {}, video.description));
        grid.appendChild(card);
      });
      block.appendChild(grid);
    }
    container.appendChild(block);
  });
}

function renderChannels(container, channels) {
  const block = el("section");
  block.appendChild(el("h2", {}, "Где читать и смотреть"));
  const grid = el("div", { class: "grid" });
  channels.forEach((channel) => {
    const card = el("div", { class: "card" });
    card.appendChild(el("h3", {}, channel.name));
    card.appendChild(el("a", { class: "btn", href: channel.url, target: "_blank", rel: "noopener" }, "Открыть"));
    grid.appendChild(card);
  });
  block.appendChild(grid);
  container.appendChild(block);
}

document.addEventListener("DOMContentLoaded", async () => {
  const data = await loadData();
  const page = document.body.dataset.page;

  if (page === "books") {
    renderBooks(document.getElementById("books"), data.books);
  }
  if (page === "playlist") {
    renderVideos(document.getElementById("playlist"), data.videos, data.playlists);
  }
  if (page === "home") {
    renderChannels(document.getElementById("channels"), data.channels);
  }
});
