(function () {
    var toggle = document.getElementById("theme-toggle");
    if (toggle) {
        toggle.addEventListener("click", function () {
            var dark = document.documentElement.getAttribute("data-theme") === "dark";
            var next = dark ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", next);
            try { sessionStorage.setItem("theme", next); } catch (e) {}
        });
    }

    var updatedEl = document.getElementById("last-updated");
    if (updatedEl) {
        fetch("https://api.github.com/repos/junyaodong/junyaodong.github.io/commits/main")
            .then(function (res) { return res.ok ? res.json() : null; })
            .then(function (data) {
                var iso = data && data.commit && data.commit.committer && data.commit.committer.date;
                var d = iso ? new Date(iso) : (document.lastModified ? new Date(document.lastModified) : null);
                if (!d || isNaN(d.getTime())) return;
                updatedEl.textContent = "Last updated: " + d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
            })
            .catch(function () {});
    }

    function fmt(n) {
        if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k";
        return String(n);
    }
    var links = document.querySelectorAll("[data-repo]");
    if (!links.length) return;
    var uniq = [];
    links.forEach(function (a) {
        if (uniq.indexOf(a.dataset.repo) === -1) uniq.push(a.dataset.repo);
    });
    Promise.all(uniq.map(function (repo) {
        var parts = repo.split("/");
        var owner = parts[0];
        var name = parts.slice(1).join("/");
        if (!owner || !name) return Promise.resolve([repo, null]);
        return fetch("https://api.github.com/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(name))
            .then(function (res) { return res.ok ? res.json() : null; })
            .then(function (data) {
                return [repo, data && typeof data.stargazers_count === "number" ? data.stargazers_count : null];
            })
            .catch(function () { return [repo, null]; });
    })).then(function (rows) {
        var map = {};
        rows.forEach(function (row) { map[row[0]] = row[1]; });
        links.forEach(function (a) {
            var count = map[a.dataset.repo];
            var el = a.querySelector(".star-count");
            if (count == null || !el) return;
            el.textContent = fmt(count);
            a.classList.add("stars-loaded");
        });
    });
})();


/* Visual polish: nav shadow, scroll-spy, scroll reveal */
(function () {
    var nav = document.querySelector(".nav");
    var onScroll = function () { if (nav) nav.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (!("IntersectionObserver" in window)) return;

    var navLinks = {};
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (a) {
        navLinks[a.getAttribute("href").slice(1)] = a;
    });
    var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            var a = navLinks[e.target.id];
            if (!a || !e.isIntersecting) return;
            Object.keys(navLinks).forEach(function (k) { navLinks[k].removeAttribute("aria-current"); });
            a.setAttribute("aria-current", "true");
        });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(navLinks).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) spy.observe(el);
    });

    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var items = document.querySelectorAll(".section-head, .theme-head, .pub, .oss-card, .news-row, .talk");
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            var el = e.target;
            el.classList.add("is-in");
            io.unobserve(el);
            // Drop reveal classes afterwards so hover transforms work normally.
            setTimeout(function () { el.classList.remove("reveal", "is-in"); }, 700);
        });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    items.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
    document.documentElement.classList.add("reveal-on");
})();
