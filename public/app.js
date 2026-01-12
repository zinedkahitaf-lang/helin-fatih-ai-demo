(function () {
  const screens = ["home", "helin", "helin-result", "fatih", "error"].reduce((acc, k) => {
    acc[k] = document.getElementById(`screen-${k}`);
    return acc;
  }, {});

  const topTitle = document.getElementById("topTitle");
  const topSubtitle = document.getElementById("topSubtitle");
  const backBtn = document.getElementById("backBtn");

  const state = {
    birthDate: "",
    birthTime: null,
    birthPlace: "",
    profile: null,
  };

  function setTop(title, subtitle, canBack) {
    topTitle.textContent = title;
    topSubtitle.textContent = subtitle;
    backBtn.hidden = !canBack;
  }

  function activate(name, push = true) {
    Object.values(screens).forEach((el) => el.classList.remove("screen--active"));
    screens[name].classList.add("screen--active");

    if (name === "home") setTop("Tatlı Cadı Helin & Rüya Yorumcusu Fatih", "Astroloji & Rüya", false);
    if (name === "helin") setTop("Tatlı Cadı Helin", "Doğum Haritası & Aylık Yorum", true);
    if (name === "helin-result") setTop("Tatlı Cadı Helin", "Sonuç", true);
    if (name === "fatih") setTop("Rüya Yorumcusu Fatih", "Rüya Analizi", true);
    if (name === "error") setTop("Bir sorun oldu", "Bağlantı / Sunucu", true);

    if (push) history.pushState({ screen: name }, "", `#${name}`);
  }

  function initFromHash() {
    const h = (location.hash || "#home").replace("#", "");
    if (screens[h]) activate(h, false);
    else activate("home", false);
  }

  // navigation
  document.getElementById("goHelin").addEventListener("click", () => activate("helin"));
  document.getElementById("goFatih").addEventListener("click", () => activate("fatih"));
  document.getElementById("goHomeFromError").addEventListener("click", () => activate("home"));

  backBtn.addEventListener("click", () => {
    if (history.length > 1) history.back();
    else activate("home");
  });

  window.addEventListener("popstate", (ev) => {
    const s = (ev.state && ev.state.screen) ? ev.state.screen : (location.hash || "#home").replace("#", "");
    if (screens[s]) activate(s, false);
  });

  async function postJson(url, payload) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  function showError(message) {
    document.getElementById("errorText").textContent = message || "Bilinmeyen hata";
    activate("error");
  }

  function renderList(el, items) {
    if (!el) return;
    if (!Array.isArray(items) || items.length === 0) {
      el.textContent = "—";
      return;
    }
    el.innerHTML = `<ul>${items.map(x => `<li>${escapeHtml(String(x))}</li>`).join("")}</ul>`;
  }

  function escapeHtml(s) {
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Helin
  const helinForm = document.getElementById("helinForm");
  const helinBtn = document.getElementById("helinBtn");
  const helinStatus = document.getElementById("helinStatus");
  const unknownTime = document.getElementById("unknownTime");
  const birthTimeInput = document.getElementById("birthTime");

  unknownTime.addEventListener("change", () => {
    birthTimeInput.disabled = unknownTime.checked;
    birthTimeInput.style.opacity = unknownTime.checked ? "0.55" : "1";
    if (unknownTime.checked) birthTimeInput.value = "";
  });

  helinForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(helinForm);

    state.birthDate = String(fd.get("birthDate") || "").trim();
    state.birthPlace = String(fd.get("birthPlace") || "").trim();

    const t = String(fd.get("birthTime") || "").trim();
    state.birthTime = unknownTime.checked ? null : (t ? t : null);

    helinBtn.disabled = true;
    helinStatus.hidden = false;

    try {
      const out = await postJson("/api/helin", {
        birthDate: state.birthDate,
        birthTime: state.birthTime,
        birthPlace: state.birthPlace,
      });

      state.profile = out.profile || null;

      document.getElementById("outDate").textContent = state.birthDate || "—";
      document.getElementById("outTime").textContent = state.birthTime || "Bilinmiyor";
      document.getElementById("outPlace").textContent = state.birthPlace || "—";

      document.getElementById("sunBadge").textContent = `☀️ Güneş: ${out.profile?.sun_sign || "—"}`;
      document.getElementById("moonBadge").textContent = `🌙 Ay: ${out.profile?.moon_sign || "—"}`;
      document.getElementById("riseBadge").textContent = `⬆️ Yükselen: ${out.profile?.rising_sign || "—"}`;

      const monthly = out.monthly || {};
      document.getElementById("monthlyText").textContent = monthly.summary || out.summary || "—";

      document.getElementById("loveTxt").textContent = monthly.love ? "✓" : "—";
      document.getElementById("moneyTxt").textContent = monthly.money ? "✓" : "—";
      document.getElementById("moodTxt").textContent = monthly.mood ? "✓" : "—";
      document.getElementById("careerTxt").textContent = monthly.career ? "✓" : "—";
      document.getElementById("healthTxt").textContent = monthly.health ? "✓" : "—";
      document.getElementById("socialTxt").textContent = monthly.social ? "✓" : "—";

      // Aşağıdaki alanlar uzun metin olduğu için list/alan olarak basıyoruz:
      renderList(document.getElementById("ritualsList"), monthly.rituals);
      renderList(document.getElementById("warningsList"), monthly.warnings);
      renderList(document.getElementById("luckyList"), monthly.lucky_days);

      activate("helin-result");
    } catch (err) {
      showError(String(err?.message || err));
    } finally {
      helinBtn.disabled = false;
      helinStatus.hidden = true;
    }
  });

  document.getElementById("toFatihFromHelin").addEventListener("click", () => activate("fatih"));
  document.getElementById("toHelinFromFatih").addEventListener("click", () => activate("helin"));

  // Fatih
  const dreamBtn = document.getElementById("dreamBtn");
  const dreamInput = document.getElementById("dreamInput");
  const dreamAnswer = document.getElementById("dreamAnswer");
  const dreamText = document.getElementById("dreamText");
  const themeText = document.getElementById("themeText");
  const fatihStatus = document.getElementById("fatihStatus");
  const symbolCards = document.getElementById("symbolCards");
  const adviceList = document.getElementById("adviceList");
  const astroTitle = document.getElementById("astroTitle");
  const astroLink = document.getElementById("astroLink");

  dreamBtn.addEventListener("click", async () => {
    const dream = (dreamInput.value || "").trim();
    if (!dream) return alert("Rüyanı yaz lütfen 🙂");

    dreamBtn.disabled = true;
    fatihStatus.hidden = false;
    dreamAnswer.hidden = true;
    symbolCards.innerHTML = "";
    adviceList.textContent = "—";
    astroTitle.hidden = true;
    astroLink.hidden = true;

    try {
      const out = await postJson("/api/fatih", {
        dream,
        profile: state.profile,
      });

      themeText.textContent = out.theme || "—";
      dreamText.textContent = out.interpretation || "—";

      // Semboller kart kart
      const symbols = Array.isArray(out.symbols) ? out.symbols : [];
      symbolCards.innerHTML = symbols.map(s => {
        const sym = escapeHtml(String(s?.symbol || ""));
        const mean = escapeHtml(String(s?.meaning || ""));
        if (!sym && !mean) return "";
        return `<div class="symbol-card"><div class="symbol-card__t">${sym}</div><div class="symbol-card__m">${mean}</div></div>`;
      }).join("");

      renderList(adviceList, out.advice);

      const astro = String(out.astro_link || "").trim();
      if (astro) {
        astroTitle.hidden = false;
        astroLink.hidden = false;
        astroLink.textContent = astro;
      }

      dreamAnswer.hidden = false;
      dreamAnswer.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      showError(String(err?.message || err));
    } finally {
      dreamBtn.disabled = false;
      fatihStatus.hidden = true;
    }
  });

  initFromHash();
})();
// ✨ Karakterleri canlı gibi göster (güvenli animasyon)
window.addEventListener("load", () => {
  const cards = document.querySelectorAll("img, .card, .symbol, .character");

  cards.forEach((el) => {
    el.classList.add("character-alive");
  });
});
