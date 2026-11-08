(() => {
  const C = CFG,
    $ = (s) => document.querySelector(s),
    $$ = (s) => [...document.querySelectorAll(s)];
  let L = localStorage.getItem("lang") || "en",
    bride = location.hash === "#bride",
    dateRevealed = false;
  const RM = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const t = (k) => I18N[L][k] || k,
    esc = (s) =>
      String(s).replace(
        /[&<>]/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c],
      );
  const day = (d) => {
    const n = new Date(d + "T00:00:00").getDay();
    return t(n == 1 ? "mon" : n == 2 ? "tue" : "wed_");
  };
  const dnum = (d) => +d.slice(8);
  function names() {
    const n = I18N.names[L];
    return bride ? [n.b, n.a] : [n.a, n.b];
  }
  function split(s) {
    return L == "hi"
      ? s
          .split(" ")
          .map((w) => `<span class=w><span class=c>${w}</span></span>`)
          .join(" ")
      : [...s]
          .map((c) => `<span class=w><span class=c>${c}</span></span>`)
          .join("");
  }
  function render() {
    document.documentElement.lang = L;
    document.body.classList.toggle("hi", L == "hi");
    $$("[data-i]").forEach((e) => (e.textContent = t(e.dataset.i)));
    const [a, b] = names();
    $$("[data-n]").forEach((e) => (e.textContent = e.dataset.n == "a" ? a : b));
    $("#nm").innerHTML =
      `<span aria-label="${a} & ${b}">${split(a)}<br>&amp;<br>${split(b)}</span>`;
    const ni = $$("#nm .c");
    ni.forEach((c, i) => (c.style.transitionDelay = 0.4 + i * 0.07 + "s"));
    $("#scratchSurface").setAttribute(
      "aria-label",
      t(dateRevealed ? "scratchDone" : "scratchButton"),
    );
    $("#revealedDate").textContent = t("revealedDate");
    $("#scratchHint").textContent = t(
      dateRevealed ? "scratchDone" : "scratchHint",
    );
    $$("#lng,#gl").forEach((e) => (e.textContent = t("lang")));
    // card (exact wording from the printed card)
    const hostsG = C.groomParents,
      hostsB = C.brideParents;
    $("#card").innerHTML = bride
      ? `<small>${esc(hostsB)}</small><small>${t("req_b")}</small><b class=nn>${b}</b><small>${t("weds")}</small><b class=nn>${a}</b><small>[${t("sof")} ${esc(hostsG)}]</small><small>${t("atres")}</small><small>${esc(C.residence)}</small>`
      : `<b>${esc(hostsG)}</b><small>${t("req")}</small><b class=nn>${a}</b><small>${t("weds")}</small><b class=nn>${b}</b><small>[${t("dof")} ${esc(hostsB)} ${t("of")} ${C.brideCity}]</small><small>${t("atres")}</small><small>${esc(C.residence)}</small>`;
    $("#rsv").innerHTML =
      `${esc(C.rsvp.names)}<br><a href="tel:${C.rsvp.phone}">${C.rsvp.phone}</a> (${esc(C.rsvp.contact)})`;
    // functions
    const f = (x) => x.replace(/-/g, "");
    let h = "";
    C.events.forEach((e) => {
      const v = C.venues[e.at],
        q = encodeURIComponent(v.name + " " + v.addr),
        s = f(e.date) + "T" + e.start.replace(":", "") + "00",
        en = e.end
          ? f(e.date) + "T" + e.end.replace(":", "") + "00"
          : f(e.date) +
            "T" +
            String(+e.start.slice(0, 2) + 1).padStart(2, "0") +
            e.start.slice(3) +
            "00";
      const g = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(a + " & " + b + " – " + t(e.id))}&dates=${s}/${en}&ctz=${C.tz}&location=${q}`;
      h += `<div class="ev rv"><div class=dd>${day(e.date)}, ${dnum(e.date)} ${I18N.months[L]} 2026</div><h4>${t(e.id)}</h4><p>${e.time}<br>${esc(v.name)}${e.at == "glitz" ? ", " + esc(v.addr) : ""}</p>
  <a class=btn target=_blank rel=noopener href="https://www.google.com/maps/search/?api=1&query=${q}">${t("dir")}</a><a class=btn target=_blank rel=noopener href="${g}">${t("gcal")}</a><a class=btn href="#" data-ics="${e.id}">${t("ics")}</a></div>`;
    });
    $$("#tl .ev").forEach((e) => e.remove());
    $("#tl").insertAdjacentHTML("beforeend", h);
    $$("[data-ics]").forEach(
      (x) =>
        (x.onclick = (ev) => {
          ev.preventDefault();
          ics(C.events.find((e) => e.id == x.dataset.ics));
        }),
    );
    io();
  }
  function ics(e) {
    const v = C.venues[e.at],
      f = (x) => x.replace(/-/g, ""),
      s = f(e.date) + "T" + e.start.replace(":", "") + "00",
      en = e.end
        ? f(e.date) + "T" + e.end.replace(":", "") + "00"
        : f(e.date) +
          "T" +
          String(+e.start.slice(0, 2) + 1).padStart(2, "0") +
          e.start.slice(3) +
          "00";
    const T = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:${e.id}@wedding\r\nDTSTART;TZID=${C.tz}:${s}\r\nDTEND;TZID=${C.tz}:${en}\r\nSUMMARY:${C.groom} & ${C.bride} - ${I18N.en[e.id]}\r\nLOCATION:${v.name}, ${v.addr}\r\nEND:VEVENT\r\nEND:VCALENDAR`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([T], { type: "text/calendar" }));
    a.download = e.id + ".ics";
    a.click();
  }
  let obs;
  function io() {
    obs && obs.disconnect();
    obs = new IntersectionObserver(
      (es) =>
        es.forEach((x) => x.isIntersecting && x.target.classList.add("in")),
      { threshold: 0.15 },
    );
    $$(".rv").forEach((e) => obs.observe(e));
  }
  $$("section>*:not(.arch):not(.hc)").forEach((e) => e.classList.add("rv"));
  const scratch = $("#scratchSurface");
  const scratchContext = scratch.getContext("2d");
  let scratchStarted = false;
  let scratching = false;
  let scratchPoint;
  function drawScratchSurface(preserve = false) {
    const rect = scratch.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    let previous;
    if (preserve && scratch.width && scratch.height) {
      previous = document.createElement("canvas");
      previous.width = scratch.width;
      previous.height = scratch.height;
      previous.getContext("2d").drawImage(scratch, 0, 0);
    }
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    scratch.width = Math.round(rect.width * scale);
    scratch.height = Math.round(rect.height * scale);
    scratchContext.setTransform(scale, 0, 0, scale, 0, 0);
    if (previous) {
      scratchContext.drawImage(previous, 0, 0, rect.width, rect.height);
      return;
    }
    const gradient = scratchContext.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, "#B85D4B");
    gradient.addColorStop(0.48, "#E4C47F");
    gradient.addColorStop(1, "#A64F40");
    scratchContext.fillStyle = gradient;
    scratchContext.fillRect(0, 0, rect.width, rect.height);
    scratchContext.strokeStyle = "rgba(255,255,255,.25)";
    scratchContext.lineWidth = 1;
    for (let x = -rect.height; x < rect.width; x += 16) {
      scratchContext.beginPath();
      scratchContext.moveTo(x, 0);
      scratchContext.lineTo(x + rect.height, rect.height);
      scratchContext.stroke();
    }
    scratchContext.strokeStyle = "rgba(255,248,225,.7)";
    scratchContext.lineWidth = 1.5;
    scratchContext.strokeRect(10, 10, rect.width - 20, rect.height - 20);
    scratchContext.fillStyle = "#FFF8E8";
    scratchContext.font = "36px Georgia, serif";
    scratchContext.textAlign = "center";
    scratchContext.textBaseline = "middle";
    scratchContext.fillText("Scratch Here", rect.width / 2, rect.height / 2);
  }
  function scratchPosition(event) {
    const rect = scratch.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  function eraseTo(point) {
    scratchContext.globalCompositeOperation = "destination-out";
    scratchContext.lineWidth = 38;
    scratchContext.lineCap = "round";
    scratchContext.lineJoin = "round";
    scratchContext.beginPath();
    scratchContext.moveTo(scratchPoint.x, scratchPoint.y);
    scratchContext.lineTo(point.x, point.y);
    scratchContext.stroke();
    scratchPoint = point;
    scratchStarted = true;
  }
  function revealDate() {
    dateRevealed = true;
    $("#revealedDate").hidden = false;
    $("#scratchHint").textContent = t("scratchDone");
    scratch.setAttribute("aria-label", t("scratchDone"));
    scratch.hidden = true;
    scratch.setAttribute("aria-pressed", "true");
    $("#scratchCard").classList.add("revealed");
  }
  function checkScratchProgress() {
    const pixels = scratchContext.getImageData(0, 0, scratch.width, scratch.height).data;
    let transparent = 0;
    let sampled = 0;
    for (let i = 3; i < pixels.length; i += 32) {
      sampled++;
      if (pixels[i] < 32) transparent++;
    }
    if (transparent / sampled >= 0.38) revealDate();
  }
  scratch.setAttribute("aria-pressed", "false");
  drawScratchSurface();
  scratch.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    scratching = true;
    scratch.setPointerCapture(event.pointerId);
    scratchPoint = scratchPosition(event);
    eraseTo(scratchPoint);
  });
  scratch.addEventListener("pointermove", (event) => {
    if (scratching) eraseTo(scratchPosition(event));
  });
  const endScratch = () => {
    if (!scratching) return;
    scratching = false;
    checkScratchProgress();
  };
  scratch.addEventListener("pointerup", endScratch);
  scratch.addEventListener("pointercancel", endScratch);
  scratch.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      revealDate();
    }
  });
  addEventListener("resize", () => {
    if (!scratch.hidden) drawScratchSurface(scratchStarted);
  });
  // language / hash
  $$("#lng,#gl").forEach(
    (b) =>
      (b.onclick = () => {
        L = L == "en" ? "hi" : "en";
        localStorage.setItem("lang", L);
        render();
        if (document.body.classList.contains("go"))
          $$("#nm .c").forEach((c) => (c.style.transform = "none"));
      }),
  );
  addEventListener("hashchange", () => {
    bride = location.hash === "#bride";
    render();
  });
  // countdown
  const T0 = new Date(C.countdownTo).getTime();
  setInterval(() => {
    let d = (Math.max(0, T0 - Date.now()) / 1e3) | 0;
    [
      (d / 86400) | 0,
      ((d % 86400) / 3600) | 0,
      ((d % 3600) / 60) | 0,
      d % 60,
    ].forEach((v, i) => ($("#c" + i).textContent = String(v).padStart(2, "0")));
  }, 1000);
  // timeline fill
  addEventListener(
    "scroll",
    () => {
      const r = $("#tl").getBoundingClientRect(),
        p = Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height));
      $("#fill").style.height = p * 100 + "%";
    },
    { passive: true },
  );
  if (C.monogram)
    $$(".seal").forEach(
      (s) =>
        (s.innerHTML = `<img src="${C.monogram}" alt="Anmol and Monika monogram">`),
    );
  // music
  const au = new Audio();
  au.loop = true;
  au.volume = 0.3;
  let want = false;
  if (C.music) {
    au.src = C.music;
    au.onerror = () => ($("#mus").hidden = true);
  } else $("#mus").hidden = true;
  const upd = () => ($("#mus").textContent = au.paused ? "♪" : "❚❚");
  $("#mus").onclick = () => {
    want = au.paused;
    au.paused ? au.play() : au.pause();
    upd();
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) au.pause();
    else if (want && !$("#vid").hidden === false) au.play().catch(() => {});
    upd();
  });
  // video
  if (C.video) {
    $("#film").hidden = false;
    const v = $("#vid");
    v.src = C.video;
    $("#film").onclick = () => {
      v.hidden = false;
      v.style.cssText =
        "position:fixed;inset:10% 4%;width:92%;z-index:85;background:#000";
      au.pause();
      v.play();
    };
    v.onended = v.onpause = () => {
      if (v.ended) {
        v.hidden = true;
        if (want) au.play();
        upd();
      }
    };
    v.onclick = null;
  }
  // gate
  $("#openBtn").onclick = () => {
    const g = $("#gate");
    g.classList.add("open");
    want = true;
    au.play()
      .then(upd)
      .catch(() => {});
    burst(true);
    setTimeout(() => {
      g.classList.add("done");
      document.body.classList.remove("locked");
      document.body.classList.add("go");
    }, 2300);
    setTimeout(() => g.remove(), 3400);
  };
  // share etc.
  const url = () => location.href;
  $("#shr").onclick = () => {
    const d = { title: "Anmol & Monika – Shubh Vivah", url: url() };
    navigator.share
      ? navigator.share(d).catch(() => {})
      : open(
          "https://wa.me/?text=" + encodeURIComponent(d.title + " " + d.url),
        );
  };
  $("#cpy").onclick = () => {
    navigator.clipboard && navigator.clipboard.writeText(url());
    const x = $("#toast");
    x.textContent = t("copied");
    x.classList.add("s");
    setTimeout(() => x.classList.remove("s"), 1800);
  };
  $("#pdf").onclick = () => print();
  $("#top").onclick = () =>
    scrollTo({ top: 0, behavior: RM ? "auto" : "smooth" });
  // petals: 3 parallax layers, flower palette by section
  const FL = {
    rose: ["#B3282D", "#D64550", "#FFF8EC"],
    marigold: ["#F2A31B", "#F7C948", "#E8710A"],
    lotus: ["#F4B6C2", "#FFF1F3", "#B3282D"],
    pink: ["#E88BB0", "#F5C2D6", "#FFF1F6"],
    ashoka: ["#5E8B4E", "#F2A31B", "#7BA05B"],
    rose2: ["#B3282D", "#C29B58", "#E8CF8F"],
  };
  const cv = $("#fx"),
    cx = cv.getContext("2d");
  let W,
    H,
    P = [],
    cur = "rose",
    sy = 0,
    vel = 0,
    last = 0;
  const sz = () => {
    W = cv.width = innerWidth;
    H = cv.height = innerHeight;
  };
  sz();
  addEventListener("resize", sz);
  function mk(l, top) {
    return {
      x: Math.random() * W,
      y: top ? -20 : Math.random() * H,
      l,
      r: (3 + l * 3) * (0.6 + Math.random() * 0.8),
      v: 0.25 + l * 0.45 + Math.random() * 0.3,
      a: Math.random() * 6,
      s: Math.random() * 2 - 1,
    };
  }
  for (let i = 0; i < 36; i++) P.push(mk(i % 3));
  function burst(on) {
    if (RM) return;
    cur = "marigold";
    for (let i = 0; i < 70; i++) {
      const p = mk(i % 3, 1);
      p.y = -Math.random() * H * 0.6;
      p.c = i % 2 ? "#F2A31B" : "#B3282D";
      P.push(p);
    }
    setTimeout(() => (P.length = Math.min(P.length, 36) && P.splice(36)), 6000);
  }
  addEventListener(
    "scroll",
    () => {
      const d = scrollY - sy;
      sy = scrollY;
      vel = Math.max(-30, Math.min(30, d));
    },
    { passive: true },
  );
  new IntersectionObserver(
    (es) =>
      es.forEach((e) => e.isIntersecting && (cur = e.target.dataset.fl || cur)),
    { threshold: 0.5 },
  ).constructor;
  const so = new IntersectionObserver(
    (es) => es.forEach((e) => e.isIntersecting && (cur = e.target.dataset.fl)),
    { threshold: 0.5 },
  );
  $$("section[data-fl]").forEach((s) => so.observe(s));
  function draw(ts) {
    const dt = Math.min(40, ts - last) / 16;
    last = ts;
    cx.clearRect(0, 0, W, H);
    const pal = FL[cur];
    vel *= 0.94;
    P.forEach((p, i) => {
      p.y += p.v * dt * (1 + Math.abs(vel) * 0.08 * (p.l + 1));
      p.x += Math.sin((p.a += 0.02)) * 0.5 + vel * 0.15 * (p.l + 1) * 0.3;
      if (p.y > H + 20 || p.x < -30 || p.x > W + 30)
        Object.assign(p, mk(p.l, 1));
      cx.save();
      cx.translate(p.x, p.y);
      cx.rotate(p.a + p.s);
      cx.globalAlpha = 0.35 + p.l * 0.2;
      cx.fillStyle =
        p.c && p.y < H * 0.8 && cur == "marigold" ? p.c : pal[i % 3];
      cx.beginPath();
      cx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 6.3);
      cx.fill();
      cx.restore();
    });
    requestAnimationFrame(draw);
  }
  if (!RM) requestAnimationFrame(draw);
  else cv.remove();
  render();
})();
