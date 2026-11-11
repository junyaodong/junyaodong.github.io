/* Theme toggle + footer "Last updated" */
(function () {
    var root = document.documentElement;
    var toggle = document.getElementById("theme-toggle");
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var animTimer;
    function syncTheme() {
        var dark = root.getAttribute("data-theme") === "dark";
        if (toggle) toggle.setAttribute("aria-pressed", dark ? "true" : "false");
        if (themeMeta) themeMeta.setAttribute("content", dark ? "#0e1116" : "#fcfbf8");
    }
    syncTheme();
    if (toggle) {
        toggle.addEventListener("click", function () {
            var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
            if (!reduceMotion) {
                // Cross-fade colours instead of snapping; the class is removed once done.
                root.classList.add("theme-anim");
                clearTimeout(animTimer);
                animTimer = setTimeout(function () { root.classList.remove("theme-anim"); }, 350);
            }
            root.setAttribute("data-theme", next);
            try { sessionStorage.setItem("theme", next); } catch (e) {}
            syncTheme();
        });
    }

    var updatedEl = document.getElementById("last-updated");
    if (updatedEl) {
        var fmtUpdated = function (d) {
            if (!d || isNaN(d.getTime())) return;
            var tz = { timeZone: "Asia/Singapore" };
            var datePart = d.toLocaleDateString("en-US", Object.assign({ month: "short", day: "numeric", year: "numeric" }, tz));
            var timePart = d.toLocaleTimeString("en-GB", Object.assign({ hour: "2-digit", minute: "2-digit", hour12: false }, tz));
            updatedEl.textContent = "Last updated: " + datePart + ", " + timePart + " SGT";
        };
        fetch("https://api.github.com/repos/junyaodong/junyaodong.github.io/commits/main")
            .then(function (res) { return res.ok ? res.json() : null; })
            .then(function (data) {
                var iso = data && data.commit && data.commit.committer && data.commit.committer.date;
                fmtUpdated(iso ? new Date(iso) : (document.lastModified ? new Date(document.lastModified) : null));
            })
            .catch(function () {
                if (document.lastModified) fmtUpdated(new Date(document.lastModified));
            });
    }
})();


/* Nav: border once scrolled, active-section highlight, brand visibility */
(function () {
    var nav = document.querySelector(".nav");
    var strip = document.querySelector(".nav-links");
    var sections = [];
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (a) {
        var el = document.getElementById(a.getAttribute("href").slice(1));
        if (el) sections.push({ el: el, link: a });
    });

    var active = null;
    function setActive(link) {
        if (link === active) return;
        if (active) active.removeAttribute("aria-current");
        active = link;
        if (!link) return;
        link.setAttribute("aria-current", "location");
        // Phone nav is a horizontally scrolling strip: keep the active link in view.
        if (strip && strip.scrollWidth > strip.clientWidth) {
            var left = link.getBoundingClientRect().left - strip.getBoundingClientRect().left + strip.scrollLeft;
            strip.scrollTo({ left: left - (strip.clientWidth - link.offsetWidth) / 2, behavior: "smooth" });
        }
    }

    // The active section is the last one whose top has passed a line a little
    // below the nav. Above the first section nothing is active; at the very
    // bottom the last section wins even if it is too short to reach the line.
    var ticking = false;
    function update() {
        ticking = false;
        if (nav) nav.classList.toggle("scrolled", window.scrollY > 8);
        if (!sections.length) return;
        var line = (nav ? nav.offsetHeight : 0) + Math.min(window.innerHeight * 0.3, 240);
        var current = null;
        sections.forEach(function (s) {
            if (s.el.getBoundingClientRect().top <= line) current = s.link;
        });
        var doc = document.documentElement;
        if (window.scrollY > 8 && window.innerHeight + window.scrollY >= doc.scrollHeight - 2) {
            current = sections[sections.length - 1].link;
        }
        setActive(current);
    }
    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
    }
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("load", requestUpdate);
    update();

    // Soften the nav brand while the large hero name is visible directly below it.
    var heroName = document.querySelector(".hero h1");
    if (nav && heroName && "IntersectionObserver" in window) {
        nav.classList.add("at-hero");
        new IntersectionObserver(function (entries) {
            nav.classList.toggle("at-hero", entries[0].isIntersecting);
        }, { rootMargin: "-" + nav.offsetHeight + "px 0px 0px 0px" }).observe(heroName);
    }
})();

/* Campus & city visitor beacon (Cloudflare Worker + D1) */
(function () {
    try {
        if (location.hostname === "localhost" || location.hostname === "127.0.0.1") return;
        var payload = JSON.stringify({
            p: (location.pathname || "/") + (location.hash || ""),
            r: document.referrer || "",
            l: navigator.language || "",
            s: (screen && screen.width && screen.height) ? (screen.width + "x" + screen.height) : ""
        });
        var endpoint = "https://jd-visitor-radar.idjyiq.workers.dev/e";
        if (navigator.sendBeacon) {
            navigator.sendBeacon(endpoint, new Blob([payload], { type: "text/plain" }));
        } else {
            fetch(endpoint, { method: "POST", body: payload, keepalive: true }).catch(function () {});
        }
    } catch (e) {}
})();
