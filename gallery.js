(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  const lookbook = $(".lookbook-grid");
  if (!lookbook) return;

  let activeIndex = 0;
  let timer;
  const cards = $$(".look-card", lookbook);

  function visibleWidth() { return cards[0]?.getBoundingRect?.().width || cards[0]?.getBoundingClientRect().width || 0; }

  function goTo(index) {
    if (!cards.length) return;
    activeIndex = (index + cards.length) % cards.length;
    cards[activeIndex].scrollIntoView({behavior:"smooth",block:"nearest",inline:"start"});
  }

  function startAuto() {
    if (window.innerWidth > 800) return;
    clearInterval(timer);
    timer = setInterval(() => goTo(activeIndex + 1), 3800);
  }

  lookbook.addEventListener("scroll", () => {
    if (window.innerWidth <= 800 && cards.length) {
      const left = lookbook.scrollLeft;
      activeIndex = cards.reduce((closest, card, index) => {
        return Math.abs(card.offsetLeft - left) < Math.abs(cards[closest].offsetLeft - left) ? index : closest;
      }, 0);
    }
  }, {passive:true});

  $$("[data-gallery-prev]").forEach(button => button.addEventListener("click", () => { clearInterval(timer); goTo(activeIndex - 1); startAuto(); }));
  $$("[data-gallery-next]").forEach(button => button.addEventListener("click", () => { clearInterval(timer); goTo(activeIndex + 1); startAuto(); }));

  window.addEventListener("resize", startAuto);
  startAuto();
})();
