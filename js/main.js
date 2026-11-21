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

function splitParagraphs(text) {
  return (text || "").split("\n\n").map((part) => part.trim()).filter(Boolean);
}

function renderBooks(container, books) {
  if (!books.length) {
    emptyNote(container, "Книги скоро появятся.");
    return;
  }
  books.forEach((book) => {
    const card = el("article", { class: "card book-card" });
    const wrap = el("div", { class: "cover-wrap" });
    if (book.cover) {
      wrap.appendChild(el("img", { class: "cover", src: book.cover, alt: `Обложка: ${book.title}`, loading: "lazy" }));
    }
    wrap.appendChild(el("span", { class: "badge-18", title: "Материал для взрослых" }, "18+"));
    card.appendChild(wrap);
    card.appendChild(el("h3", {}, book.title));
    if (book.author) card.appendChild(el("p", { class: "meta" }, book.author));
    if (book.tags && book.tags.length) {
      const tags = el("div", { class: "tags" });
      book.tags.forEach((tag) => tags.appendChild(el("span", { class: "tag" }, `#${tag}`)));
      card.appendChild(tags);
    }
    splitParagraphs(book.description).forEach((part) => card.appendChild(el("p", {}, part)));
    if (book.url) {
      card.appendChild(el("a", { class: "btn", href: book.url, target: "_blank", rel: "noopener" }, "Читать на Litnet"));
    }
    container.appendChild(card);
  });
}

function renderSlider(books) {
  const slider = document.getElementById("slider");
  const track = document.getElementById("slides");
  const dots = document.getElementById("dots");
  const items = books.filter((book) => book.cover);
  if (!items.length) {
    slider.closest("section").hidden = true;
    return;
  }
  items.forEach((book, i) => {
    const slide = el("div", { class: "slide" });
    const wrap = el("div", { class: "cover-wrap" });
    wrap.appendChild(el("img", { src: book.cover, alt: `Обложка: ${book.title}`, loading: "lazy" }));
    wrap.appendChild(el("span", { class: "badge-18" }, "18+"));
    slide.appendChild(wrap);
    const info = el("div");
    info.appendChild(el("h3", {}, book.title));
    info.appendChild(el("p", {}, splitParagraphs(book.description)[0] || ""));
    if (book.url) {
      info.appendChild(el("a", { class: "btn", href: book.url, target: "_blank", rel: "noopener" }, "Читать на Litnet"));
    }
    slide.appendChild(info);
    track.appendChild(slide);
    const dot = el("button", { class: "dot", "aria-label": `Слайд ${i + 1}` });
    dot.addEventListener("click", () => {
      go(i);
      restart();
    });
    dots.appendChild(dot);
  });

  const total = items.length;
  let index = 0;
  let timer = null;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function go(i) {
    index = (i + total) % total;
    track.style.transform = `translateX(-${index * 100}%)`;
    [...dots.children].forEach((d, k) => d.classList.toggle("active", k === index));
  }

  function restart() {
    clearInterval(timer);
    if (!reduceMotion && total > 1) timer = setInterval(() => go(index + 1), 6000);
  }

  slider.querySelector(".prev").addEventListener("click", () => { go(index - 1); restart(); });
  slider.querySelector(".next").addEventListener("click", () => { go(index + 1); restart(); });
  slider.addEventListener("mouseenter", () => clearInterval(timer));
  slider.addEventListener("mouseleave", restart);

  if (total < 2) {
    slider.querySelectorAll(".arrow").forEach((a) => { a.hidden = true; });
    dots.hidden = true;
  }
  go(0);
  restart();
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
        card.appendChild(el("iframe", {
          src: `https://www.youtube.com/embed/${encodeURIComponent(video.id)}`,
          title: video.title,
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture",
          allowfullscreen: "",
        }));
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
  channels.forEach((channel) => {
    const card = el("a", { class: "card channel-card", href: channel.url, target: "_blank", rel: "noopener" });
    card.appendChild(el("h3", {}, channel.name));
    card.appendChild(el("p", {}, "Открыть →"));
    container.appendChild(card);
  });
}

function markActiveLink() {
  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav a").forEach((a) => {
    if (a.getAttribute("href") === current) a.setAttribute("aria-current", "page");
  });
}

function initReveal() {
  const items = [...document.querySelectorAll("section, .hero, .card")].filter((node) => !node.closest("[hidden]"));
  if (!("IntersectionObserver" in window)) {
    items.forEach((node) => node.classList.add("in"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach((node) => {
    node.classList.add("reveal");
    observer.observe(node);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  markActiveLink();
  const data = await loadData();
  const page = document.body.dataset.page;

  if (page === "books") {
    renderBooks(document.getElementById("books"), data.books);
  }
  if (page === "playlist") {
    renderVideos(document.getElementById("playlist"), data.videos, data.playlists);
  }
  if (page === "home") {
    renderSlider(data.books);
    renderChannels(document.getElementById("channels"), data.channels);
  }
  initReveal();
});
