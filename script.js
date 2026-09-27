/* ============================================================
   HASSOU TECHGROUP SOLUTIONS — PORTFOLIO V12.5
   Native ES module, no framework required.
   ============================================================ */

const root = document.documentElement;
const body = document.body;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const hasFinePointer = window.matchMedia('(pointer: fine)');

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function trackEvent(name, detail = {}) {
    // Analytics-ready without forcing a vendor. Connect GTM/GA/Plausible later if desired.
    if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: name, ...detail });
    }
    window.dispatchEvent(new CustomEvent('hassou:analytics', { detail: { name, ...detail } }));
}

function showToast(message) {
    const toast = qs('#siteToast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add('show');
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
        toast.classList.remove('show');
        window.setTimeout(() => { toast.hidden = true; }, 220);
    }, 2600);
}


/* ============================================================
   SITE INTRO
   ============================================================ */
function initSiteIntro() {
    const intro = qs('#siteIntro');
    if (!intro) return;

    const label = qs('#introRouteLabel');
    const routeLabels = {
        hero: 'Preparing the portfolio',
        problems: 'Opening Problems We Solve',
        'why-us': 'Opening Why Us',
        services: 'Opening Services',
        portfolio: 'Opening Case Studies',
        industries: 'Opening Industries & Use Cases',
        proof: 'Opening Developer Proof',
        recognition: 'Opening Recognition',
        process: 'Opening Process',
        capabilities: 'Opening Capabilities',
        delivery: 'Opening Delivery & Engagement',
        estimator: 'Opening Project Planner',
        team: 'Opening Our Team',
        faq: 'Opening FAQ',
        contact: 'Opening Contact'
    };
    const route = location.hash.slice(1) || 'hero';
    if (label) label.textContent = routeLabels[route] || 'Preparing your portfolio experience';

    // Do not replay the full-screen intro on every internal return in the same tab.
    // Deep links get an even faster handoff to the requested section.
    const alreadyShown = sessionStorage.getItem('hassou-intro-shown') === '1';
    if (prefersReducedMotion.matches || alreadyShown) {
        intro.remove();
        return;
    }

    sessionStorage.setItem('hassou-intro-shown', '1');
    const startedAt = performance.now();
    const minimumVisibleMs = location.hash ? 260 : 520;
    let dismissed = false;

    const dismiss = () => {
        if (dismissed) return;
        dismissed = true;
        const wait = Math.max(0, minimumVisibleMs - (performance.now() - startedAt));
        window.setTimeout(() => {
            intro.classList.add('is-dismissing');
            window.setTimeout(() => intro.remove(), 470);
        }, wait);
    };

    if (document.readyState === 'complete') dismiss();
    else window.addEventListener('load', dismiss, { once: true });
    window.setTimeout(dismiss, 1350);
}

/* ============================================================
   THEME
   ============================================================ */
function initTheme() {
    const button = qs('#themeToggle');
    if (!button) return;

    const stored = localStorage.getItem('hassou-theme');
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const initialTheme = stored || (systemPrefersLight ? 'light' : 'dark');

    const applyTheme = (theme) => {
        root.dataset.theme = theme;
        root.style.colorScheme = theme;
        const isLight = theme === 'light';
        button.innerHTML = `<i class="fas ${isLight ? 'fa-sun' : 'fa-moon'}" aria-hidden="true"></i><span class="sidebar-footer-label">Theme</span>`;
        button.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} theme`);
        const themeMeta = qs('meta[name="theme-color"]');
        if (themeMeta) themeMeta.content = isLight ? '#f7fbff' : '#020817';
    };

    applyTheme(initialTheme);

    button.addEventListener('click', () => {
        const next = root.dataset.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('hassou-theme', next);
        applyTheme(next);
        trackEvent('theme_changed', { theme: next });
    });
}

/* ============================================================
   MOBILE SIDEBAR
   ============================================================ */
function initMobileNavigation() {
    const toggle = qs('#mobileToggle');
    const sidebar = qs('#sidebar');
    const backdrop = qs('#sidebarBackdrop');
    if (!toggle || !sidebar) return;

    const setOpen = (open) => {
        const compact = window.innerWidth <= 980;
        const shouldOpen = Boolean(open && compact);
        sidebar.classList.toggle('open', shouldOpen);
        body.classList.toggle('nav-open', shouldOpen);
        toggle.setAttribute('aria-expanded', String(shouldOpen));
        toggle.setAttribute('aria-label', shouldOpen ? 'Close navigation' : 'Open navigation');
        toggle.innerHTML = `<i class="fas ${shouldOpen ? 'fa-xmark' : 'fa-bars'}" aria-hidden="true"></i>`;
        if (backdrop) backdrop.toggleAttribute('hidden', !shouldOpen);
    };

    toggle.addEventListener('click', () => setOpen(!sidebar.classList.contains('open')));
    backdrop?.addEventListener('click', () => setOpen(false));
    window.addEventListener('resize', () => { if (window.innerWidth > 980) setOpen(false); }, { passive: true });

    qsa('a[href^="#"]', sidebar).forEach((link) => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 980) setOpen(false);
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && sidebar.classList.contains('open')) {
            setOpen(false);
            toggle.focus();
        }
    });
}

/* ============================================================
   SAME-PAGE NAVIGATION
   Keeps sidebar, dock, command palette, footer, and CTA anchors in sync.
   ============================================================ */
function initSamePageNavigation() {
    const links = qsa('a[href^="#"]:not(.skip-link)');
    if (!links.length) return;

    let routeCueTimer = 0;
    const cueTarget = (target) => {
        if (!target) return;
        qsa('main section.is-route-target').forEach((section) => section.classList.remove('is-route-target'));
        target.classList.add('is-route-target');
        window.clearTimeout(routeCueTimer);
        routeCueTimer = window.setTimeout(() => target.classList.remove('is-route-target'), 820);
    };

    const setSidebarState = (targetId) => {
        const aliases = { 'featured-work': 'portfolio', 'start-path': 'contact' };
        const alias = aliases[targetId] || targetId;
        const sidebarLinks = qsa('.sidebar-nav a[href^="#"]');
        sidebarLinks.forEach((link) => {
            const active = link.getAttribute('href') === `#${alias}`;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
        const activeLink = sidebarLinks.find((link) => link.classList.contains('active'));
        const currentLabel = qs('#sidebarCurrentSection');
        if (currentLabel && activeLink) currentLabel.textContent = activeLink.dataset.label || activeLink.textContent.trim();
    };

    links.forEach((link) => {
        link.addEventListener('click', (event) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const hash = link.getAttribute('href');
            if (!hash || hash === '#') return;
            const target = document.getElementById(hash.slice(1));
            if (!target) return;

            event.preventDefault();
            setSidebarState(target.id);

            const quickContact = qs('#quickContact');
            if (quickContact && typeof quickContact.hidePopover === 'function') {
                try { quickContact.hidePopover(); } catch { /* Popover was already closed. */ }
            }

            target.scrollIntoView({
                behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
                block: 'start'
            });
            cueTarget(target);

            if (location.hash !== hash) history.pushState(null, '', hash);
            else history.replaceState(null, '', hash);
        });
    });

    const syncFromLocation = ({ scroll = true, behavior = 'auto' } = {}) => {
        const id = location.hash.slice(1) || 'hero';
        const target = document.getElementById(id);
        if (!target) return;
        setSidebarState(target.id);

        const activeSidebarLink = qs(`.sidebar-nav a[href="#${id}"]`) || qs('.sidebar-nav a.active');
        activeSidebarLink?.scrollIntoView({ block: 'nearest', behavior: 'auto' });

        if (scroll) {
            target.scrollIntoView({ behavior, block: 'start' });
            cueTarget(target);
        }
    };

    window.addEventListener('popstate', () => {
        syncFromLocation({ scroll: true, behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
    });

    window.addEventListener('hashchange', () => {
        syncFromLocation({ scroll: true, behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
    });

    // Re-apply the initial hash after layout, intro removal, fonts and images settle.
    // This prevents a URL such as #problems from showing the hero while the sidebar
    // highlights a different section.
    const restoreInitialHash = () => {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => syncFromLocation({ scroll: Boolean(location.hash), behavior: 'auto' }));
        });
    };
    if (document.readyState === 'complete') restoreInitialHash();
    else window.addEventListener('load', restoreInitialHash, { once: true });

    if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
            if (location.hash) syncFromLocation({ scroll: true, behavior: 'auto' });
        }).catch(() => {});
    }
}

/* ============================================================
   ADVANCED SIDEBAR + COMMAND PALETTE
   - Desktop compact mode is persisted locally.
   - Ctrl/Cmd + K opens quick navigation.
   - Arrow keys move through visible command results.
   ============================================================ */
function initAdvancedSidebar() {
    const collapse = qs('#sidebarCollapse');
    const sidebar = qs('#sidebar');
    const palette = qs('#commandPalette');
    const paletteButton = qs('#commandPaletteButton');
    const paletteSearch = qs('#commandSearch');
    const paletteItems = qsa('[data-command-item]', palette || document);
    const paletteEmpty = qs('#commandEmpty');
    const closeButtons = qsa('[data-command-close]', palette || document);
    const desktopQuery = window.matchMedia('(min-width: 981px)');

    const setCollapsed = (collapsed, persist = true) => {
        const shouldCollapse = Boolean(collapsed && desktopQuery.matches);
        body.classList.toggle('sidebar-collapsed', shouldCollapse);
        collapse?.setAttribute('aria-expanded', String(!shouldCollapse));
        collapse?.setAttribute('aria-label', shouldCollapse ? 'Expand sidebar' : 'Collapse sidebar');
        collapse?.setAttribute('title', shouldCollapse ? 'Expand sidebar' : 'Collapse sidebar');
        const icon = qs('i', collapse || document);
        if (icon) icon.className = `fas ${shouldCollapse ? 'fa-angles-right' : 'fa-angles-left'}`;
        if (persist) localStorage.setItem('hassou-sidebar-collapsed', shouldCollapse ? '1' : '0');
    };

    if (collapse && sidebar) {
        setCollapsed(localStorage.getItem('hassou-sidebar-collapsed') === '1', false);
        collapse.addEventListener('click', () => {
            const next = !body.classList.contains('sidebar-collapsed');
            setCollapsed(next);
            trackEvent('sidebar_toggled', { collapsed: next });
        });
        desktopQuery.addEventListener?.('change', () => setCollapsed(localStorage.getItem('hassou-sidebar-collapsed') === '1', false));
    }

    if (!(palette instanceof HTMLDialogElement) || !paletteButton || !paletteSearch) return;

    let activeIndex = 0;

    const visibleItems = () => paletteItems.filter((item) => !item.hidden);

    const paintActive = () => {
        const items = visibleItems();
        if (!items.length) return;
        activeIndex = Math.max(0, Math.min(activeIndex, items.length - 1));
        paletteItems.forEach((item) => item.classList.remove('command-active'));
        items[activeIndex].classList.add('command-active');
    };

    const filterItems = () => {
        const query = paletteSearch.value.trim().toLowerCase();
        paletteItems.forEach((item) => {
            const haystack = `${item.textContent} ${item.dataset.search || ''}`.toLowerCase();
            item.hidden = Boolean(query && !haystack.includes(query));
        });
        activeIndex = 0;
        paintActive();
        if (paletteEmpty) paletteEmpty.hidden = visibleItems().length > 0;
    };

    const openPalette = () => {
        if (!palette.open) palette.showModal();
        paletteSearch.value = '';
        paletteItems.forEach((item) => { item.hidden = false; });
        if (paletteEmpty) paletteEmpty.hidden = true;
        activeIndex = 0;
        paintActive();
        requestAnimationFrame(() => paletteSearch.focus());
        trackEvent('command_palette_opened');
    };

    const closePalette = () => {
        if (palette.open) palette.close();
        paletteButton.focus({ preventScroll: true });
    };

    paletteButton.addEventListener('click', openPalette);
    closeButtons.forEach((button) => button.addEventListener('click', closePalette));
    palette.addEventListener('click', (event) => {
        const rect = palette.getBoundingClientRect();
        const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
        if (!inside) palette.close();
    });

    paletteSearch.addEventListener('input', filterItems);
    paletteSearch.addEventListener('keydown', (event) => {
        const items = visibleItems();
        if (!items.length) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            activeIndex = (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
            paintActive();
            items[activeIndex].scrollIntoView({ block: 'nearest' });
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            items[activeIndex]?.click();
        }
    });

    paletteItems.forEach((item) => item.addEventListener('click', () => {
        palette.close();
        trackEvent('command_palette_navigation', { target: item.getAttribute('href') || '' });
    }));

    document.addEventListener('keydown', (event) => {
        const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
        if (!isShortcut) return;
        event.preventDefault();
        if (palette.open) closePalette(); else openPalette();
    });
}

/* ============================================================
   AMBIENT POINTER + HERO PARALLAX (rAF throttled)
   ============================================================ */
function initPointerEffects() {
    if (prefersReducedMotion.matches || !hasFinePointer.matches) return;

    const heroVisual = qs('#heroVisual');
    let frame = 0;
    let latestEvent = null;

    const update = () => {
        frame = 0;
        if (!latestEvent) return;

        const xPercent = (latestEvent.clientX / window.innerWidth) * 100;
        const yPercent = (latestEvent.clientY / window.innerHeight) * 100;
        root.style.setProperty('--mouse-x', `${xPercent.toFixed(2)}%`);
        root.style.setProperty('--mouse-y', `${yPercent.toFixed(2)}%`);

        if (heroVisual) {
            const rect = heroVisual.getBoundingClientRect();
            const inside = latestEvent.clientX >= rect.left && latestEvent.clientX <= rect.right && latestEvent.clientY >= rect.top && latestEvent.clientY <= rect.bottom;

            if (inside) {
                const normalizedX = (latestEvent.clientX - rect.left) / rect.width - 0.5;
                const normalizedY = (latestEvent.clientY - rect.top) / rect.height - 0.5;
                root.style.setProperty('--hero-ry', `${(normalizedX * 5).toFixed(2)}deg`);
                root.style.setProperty('--hero-rx', `${(-normalizedY * 4).toFixed(2)}deg`);
                root.style.setProperty('--hero-x', `${(normalizedX * 5).toFixed(2)}px`);
                root.style.setProperty('--hero-y', `${(normalizedY * 5).toFixed(2)}px`);
            }
        }
    };

    document.addEventListener('pointermove', (event) => {
        latestEvent = event;
        if (!frame) frame = requestAnimationFrame(update);
    }, { passive: true });

    heroVisual?.addEventListener('pointerleave', () => {
        root.style.setProperty('--hero-ry', '0deg');
        root.style.setProperty('--hero-rx', '0deg');
        root.style.setProperty('--hero-x', '0px');
        root.style.setProperty('--hero-y', '0px');
    });
}


/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
function initCustomCursor() {
    const dot = qs('#cursorDot');
    const ring = qs('#cursorRing');
    if (!dot || !ring || prefersReducedMotion.matches || !hasFinePointer.matches) return;

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;
    let rafId = 0;

    const render = () => {
        rafId = 0;
        ringX += (pointerX - ringX) * 0.18;
        ringY += (pointerY - ringY) * 0.18;
        dot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
        if (Math.abs(pointerX - ringX) > 0.1 || Math.abs(pointerY - ringY) > 0.1) {
            rafId = requestAnimationFrame(render);
        }
    };

    const schedule = () => {
        if (!rafId) rafId = requestAnimationFrame(render);
    };

    document.addEventListener('pointermove', (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        body.classList.add('hassou-pointer-active');
        schedule();
    }, { passive: true });

    document.addEventListener('pointerleave', () => body.classList.remove('hassou-pointer-active'));
    document.addEventListener('pointerenter', () => body.classList.add('hassou-pointer-active'));

    qsa('a, button, input, select, textarea, summary, [role="button"]').forEach((element) => {
        element.addEventListener('pointerenter', () => ring.classList.add('is-hovering'));
        element.addEventListener('pointerleave', () => ring.classList.remove('is-hovering'));
    });
}

/* ============================================================
   CARD SPOTLIGHT + LIGHTWEIGHT 3D TILT
   ============================================================ */
function initCardInteractions() {
    if (prefersReducedMotion.matches || !hasFinePointer.matches) return;

    const cards = qsa('.interactive-card, .project-card, .service-card, .featured-case, .process-step, .team-card, .capability-card, .portfolio-card, .case-card, .case-story-card, .architecture-demo, .estimator-shell');

    cards.forEach((card) => {
        let frame = 0;
        let latest = null;

        const update = () => {
            frame = 0;
            if (!latest) return;
            const rect = card.getBoundingClientRect();
            const x = Math.max(0, Math.min(rect.width, latest.clientX - rect.left));
            const y = Math.max(0, Math.min(rect.height, latest.clientY - rect.top));
            card.style.setProperty('--spot-x', `${(x / rect.width) * 100}%`);
            card.style.setProperty('--spot-y', `${(y / rect.height) * 100}%`);

            const nx = x / rect.width - 0.5;
            const ny = y / rect.height - 0.5;

            if (card.classList.contains('portfolio-card')) {
                card.style.setProperty('--card-ry', `${(nx * 3.6).toFixed(2)}deg`);
                card.style.setProperty('--card-rx', `${(-ny * 3.0).toFixed(2)}deg`);
            } else if (card.matches('#why-us .interactive-card, .service-card, .capability-card, .team-card')) {
                card.style.setProperty('--soft-ry', `${(nx * 2.2).toFixed(2)}deg`);
                card.style.setProperty('--soft-rx', `${(-ny * 1.8).toFixed(2)}deg`);
            }
        };

        card.addEventListener('pointermove', (event) => {
            latest = event;
            if (!frame) frame = requestAnimationFrame(update);
        }, { passive: true });

        card.addEventListener('pointerleave', () => {
            card.style.setProperty('--spot-x', '50%');
            card.style.setProperty('--spot-y', '50%');
            card.style.setProperty('--card-rx', '0deg');
            card.style.setProperty('--card-ry', '0deg');
            card.style.setProperty('--soft-rx', '0deg');
            card.style.setProperty('--soft-ry', '0deg');
        });
    });
}

/* ============================================================
   MAGNETIC CTAs
   ============================================================ */
function initMagneticElements() {
    if (prefersReducedMotion.matches || !hasFinePointer.matches) return;

    qsa('.btn:not(:disabled), .filter-btn, .quick-contact-button').forEach((element) => {
        element.addEventListener('pointermove', (event) => {
            const rect = element.getBoundingClientRect();
            const x = event.clientX - (rect.left + rect.width / 2);
            const y = event.clientY - (rect.top + rect.height / 2);
            const strength = element.classList.contains('quick-contact-button') ? 0.18 : 0.12;
            element.style.setProperty('--mag-x', `${(x * strength).toFixed(2)}px`);
            element.style.setProperty('--mag-y', `${(y * strength).toFixed(2)}px`);
        });

        element.addEventListener('pointerleave', () => {
            element.style.setProperty('--mag-x', '0px');
            element.style.setProperty('--mag-y', '0px');
        });
    });
}

/* ============================================================
   SECTION ENTER MOTION
   Adds a subtle one-time body class once visitors move beyond hero.
   ============================================================ */
function initPageMotionState() {
    if (!('IntersectionObserver' in window)) return;
    const hero = qs('#hero');
    if (!hero) return;

    const observer = new IntersectionObserver(([entry]) => {
        body.classList.toggle('past-hero', !entry.isIntersecting);
    }, { threshold: 0.18 });

    observer.observe(hero);
}

/* ============================================================
   HERO DYNAMIC SUPPORTING LINE
   Primary value proposition remains static for clarity.
   ============================================================ */
function initHeroDynamicLine() {
    const target = qs('#heroDynamicLine');
    if (!target || prefersReducedMotion.matches) return;

    const phrases = [
        'Web, application and database solutions.',
        'Workflow-first systems for real operations.',
        'Interface, application logic, data and delivery.',
        'Built around requirements—not generic templates.',
        'Web platform or application-based system: scope decides.'
    ];

    let index = 0;
    window.setInterval(() => {
        index = (index + 1) % phrases.length;
        target.animate(
            [
                { opacity: 1, transform: 'translateY(0)' },
                { opacity: 0, transform: 'translateY(-4px)', offset: 0.45 },
                { opacity: 0, transform: 'translateY(4px)', offset: 0.55 },
                { opacity: 1, transform: 'translateY(0)' }
            ],
            { duration: 420, easing: 'ease' }
        );
        window.setTimeout(() => { target.textContent = phrases[index]; }, 210);
    }, 3600);
}

/* ============================================================
   REVEALS
   ============================================================ */
function initRevealObserver() {
    const elements = qsa('.reveal');
    if (!elements.length) return;

    if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
        elements.forEach((el) => el.classList.add('visible'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    elements.forEach((element) => observer.observe(element));
}

/* ============================================================
   SCROLLSPY
   ============================================================ */
function initScrollSpy() {
    const sections = qsa('main section[id]');
    const links = qsa('.sidebar-nav a[href^="#"]');
    if (!sections.length || !links.length) return;

    const aliases = new Map([['featured-work', 'portfolio'], ['start-path', 'contact']]);
    const linkMap = new Map(links.map((link) => [link.getAttribute('href')?.slice(1), link]));
    const currentLabel = qs('#sidebarCurrentSection');

    const activate = (sectionId) => {
        const navId = aliases.get(sectionId) || sectionId;
        const activeLink = linkMap.get(navId);
        if (!activeLink) return;

        links.forEach((link) => {
            const active = link === activeLink;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
        if (currentLabel) currentLabel.textContent = activeLink.dataset.label || activeLink.textContent.trim() || navId;
        activeLink.scrollIntoView({ block: 'nearest', behavior: 'auto' });

        const dockLink = qs(`.mobile-dock [data-dock-target="${navId}"]`);
        if (dockLink) {
            qsa('.mobile-dock [data-dock-target]').forEach((link) => {
                const active = link === dockLink;
                link.classList.toggle('active', active);
                if (active) link.setAttribute('aria-current', 'page');
                else link.removeAttribute('aria-current');
            });
        }

        const nextHash = `#${navId}`;
        if (!document.querySelector('dialog[open]') && location.hash !== nextHash) {
            history.replaceState(null, '', nextHash);
        }
    };

    if (!('IntersectionObserver' in window)) {
        activate(location.hash.slice(1) || 'hero');
        return;
    }

    const visible = new Map();
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
            else visible.delete(entry.target.id);
        });

        const current = [...visible.entries()]
            .sort((a, b) => b[1] - a[1])[0]?.[0];
        if (current) activate(current);
    }, {
        rootMargin: '-18% 0px -58% 0px',
        threshold: [0.01, 0.08, 0.2, 0.4, 0.65]
    });

    sections.forEach((section) => observer.observe(section));
    activate(location.hash.slice(1) || 'hero');
}

/* ============================================================
   SCROLL PROGRESS + SMART ARROW (one rAF scroll loop)
   ============================================================ */
function initScrollUi() {
    const progressBar = qs('#progress-bar');
    const arrow = qs('#scrollArrow');
    const icon = qs('#arrowIcon');
    const tooltip = qs('#arrowTooltip');
    if (!progressBar && !arrow) return;

    let ticking = false;

    const update = () => {
        ticking = false;
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const scrollTop = window.scrollY;
        const ratio = Math.min(1, Math.max(0, scrollTop / maxScroll));

        if (progressBar) progressBar.style.width = `${ratio * 100}%`;
        const sidebarProgress = qs('#sidebarProgressFill');
        if (sidebarProgress) sidebarProgress.style.width = `${ratio * 100}%`;

        if (arrow && icon && tooltip) {
            const goUp = scrollTop > maxScroll * 0.48;
            icon.className = `fas ${goUp ? 'fa-chevron-up' : 'fa-chevron-down'}`;
            tooltip.textContent = goUp ? 'Scroll to top' : 'Scroll down';
            arrow.setAttribute('aria-label', goUp ? 'Scroll to top' : 'Scroll down');
            arrow.dataset.direction = goUp ? 'up' : 'down';
        }
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });

    arrow?.addEventListener('click', () => {
        const direction = arrow.dataset.direction || 'down';
        const behavior = prefersReducedMotion.matches ? 'auto' : 'smooth';
        if (direction === 'up') {
            window.scrollTo({ top: 0, behavior });
        } else {
            const currentSection = qsa('main section[id]').find((section) => {
                const rect = section.getBoundingClientRect();
                return rect.top <= window.innerHeight * 0.45 && rect.bottom > window.innerHeight * 0.45;
            });
            const sections = qsa('main section[id]');
            const currentIndex = currentSection ? sections.indexOf(currentSection) : -1;
            const next = sections[currentIndex + 1] || qs('#contact');
            next?.scrollIntoView({ behavior, block: 'start' });
        }
    });

    update();
}

/* ============================================================
   PORTFOLIO FILTERS + VIEW TRANSITIONS
   ============================================================ */
function initPortfolioFilters() {
    const buttons = qsa('.filter-btn');
    const items = qsa('.portfolio-item[data-category]');
    if (!buttons.length || !items.length) return;

    items.forEach((item, index) => {
        item.style.viewTransitionName = `project-card-${index + 1}`;
    });

    const applyFilter = (value) => {
        items.forEach((item) => {
            const categories = (item.dataset.category || '').split(/\s+/).filter(Boolean);
            const shouldShow = value === 'all' || categories.includes(value);
            item.hidden = !shouldShow;
            if (shouldShow) item.classList.add('visible');
        });
    };

    buttons.forEach((button) => {
        button.addEventListener('click', async () => {
            const filter = button.dataset.filter || 'all';
            buttons.forEach((item) => {
                const active = item === button;
                item.classList.toggle('active', active);
                item.setAttribute('aria-pressed', String(active));
            });

            const update = () => applyFilter(filter);
            if ('startViewTransition' in document && !prefersReducedMotion.matches) {
                document.startViewTransition(update);
            } else {
                update();
            }

            trackEvent('portfolio_filter_changed', { filter });
        });
    });
}

/* ============================================================
   NATIVE <dialog> CASE STUDIES
   ============================================================ */
function initDialogs() {
    const dialogs = qsa('dialog.case-dialog');
    if (!dialogs.length) return;

    const openDialog = (id, source = 'unknown') => {
        const dialog = document.getElementById(id);
        if (!(dialog instanceof HTMLDialogElement)) return;
        if (!dialog.open) dialog.showModal();
        trackEvent('case_study_opened', { case_study: id, source });
    };

    qsa('[data-dialog-open]').forEach((button) => {
        button.addEventListener('click', () => openDialog(button.dataset.dialogOpen, 'portfolio'));
    });

    dialogs.forEach((dialog) => {
        qsa('[data-dialog-close]', dialog).forEach((button) => {
            button.addEventListener('click', () => dialog.close());
        });

        dialog.addEventListener('click', (event) => {
            const rect = dialog.getBoundingClientRect();
            const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
            if (!inside) dialog.close();
        });

        dialog.addEventListener('close', () => {
            if (location.hash === `#${dialog.id}`) history.replaceState(null, '', location.pathname + location.search);
        });
    });

    const hashId = location.hash.slice(1);
    if (hashId && document.getElementById(hashId)?.matches('dialog.case-dialog')) {
        requestAnimationFrame(() => openDialog(hashId, 'url_hash'));
    }
}

/* ============================================================
   POPOVER FALLBACK
   ============================================================ */
function initQuickContact() {
    const button = qs('#quickContactButton');
    const popover = qs('#quickContact');
    if (!button || !popover) return;

    if (!('showPopover' in HTMLElement.prototype)) {
        popover.removeAttribute('popover');
        popover.hidden = true;

        button.addEventListener('click', () => {
            popover.hidden = !popover.hidden;
            popover.classList.toggle('fallback-open', !popover.hidden);
        });

        document.addEventListener('click', (event) => {
            if (!popover.hidden && !popover.contains(event.target) && event.target !== button && !button.contains(event.target)) {
                popover.hidden = true;
                popover.classList.remove('fallback-open');
            }
        });
    }

    qsa('a', popover).forEach((link) => link.addEventListener('click', () => trackEvent('quick_contact_clicked', { target: link.textContent.trim() })));
}

/* ============================================================
   INTERACTIVE ARCHITECTURE
   ============================================================ */
function initArchitectureDemo() {
    const nodes = qsa('[data-architecture]');
    const description = qs('#architectureDescription');
    const detailList = qs('#architectureDetails');
    if (!nodes.length || !description || !detailList) return;

    const content = {
        users: {
            description: 'Every architecture starts with people, roles, permissions, and the real workflow the system must support.',
            bullets: ['Identify user roles and responsibilities', 'Map tasks, approvals, and pain points', 'Design for the actual operating environment']
        },
        interface: {
            description: 'The interface layer turns business rules into clear actions across browser-based or application-oriented screens.',
            bullets: ['Responsive or platform-appropriate components', 'Clear validation and feedback states', 'Task-focused dashboards, forms, and application screens']
        },
        api: {
            description: 'The application layer processes actions, applies business rules, validates input, and coordinates data-backed workflows. The final technology depends on platform requirements.',
            bullets: ['Business logic and workflow handling', 'Validation and state changes', 'Integration between interface actions and data services']
        },
        database: {
            description: 'The data layer keeps records structured so information can be stored, retrieved, updated, filtered, and presented in operational views or reports.',
            bullets: ['Structured record organization', 'Data flows for assessments and operations', 'Reporting-oriented queries, summaries, and result views']
        }
    };

    const selectNode = (node) => {
        nodes.forEach((item) => item.classList.toggle('active', item === node));
        const data = content[node.dataset.architecture];
        if (!data) return;
        description.textContent = data.description;
        detailList.replaceChildren(...data.bullets.map((text) => {
            const li = document.createElement('li');
            li.textContent = text;
            return li;
        }));
        trackEvent('architecture_layer_selected', { layer: node.dataset.architecture });
    };

    nodes.forEach((node) => node.addEventListener('click', () => selectNode(node)));
}

/* ============================================================
   PROJECT PLANNER / COMPLEXITY ESTIMATOR
   ============================================================ */
function initProjectEstimator() {
    const form = qs('#estimatorForm');
    const complexity = qs('#complexityValue');
    const meter = qs('#complexityMeter');
    const reason = qs('#complexityReason');
    const preview = qs('#briefPreview');
    const useButton = qs('#useBriefButton');
    const copyButton = qs('#copyBriefButton');
    if (!form || !complexity || !meter || !reason || !preview || !useButton) return;

    let currentBrief = '';
    let currentType = '';

    const calculate = () => {
        const data = new FormData(form);
        const type = data.get('estimator_type') || 'Custom Management System';
        const stage = data.get('estimator_stage') || 'New idea / early planning';
        const roles = data.get('estimator_roles') || '1–3';
        const environment = data.get('estimator_environment') || 'Browser / online';
        const features = data.getAll('estimator_features');
        const delivery = data.getAll('estimator_delivery');
        const timeline = data.get('estimator_timeline') || 'Flexible / discuss first';
        const notes = String(data.get('estimator_notes') || '').trim();

        const typeScore = {
            'Business Website': 1,
            'Web Application': 2,
            'Application-Based System': 3,
            'Existing System Upgrade': 2,
            'Custom Management System': 3
        }[type] || 2;

        const roleScore = { '1–3': 1, '4–6': 2, '7+': 3 }[roles] || 1;
        const environmentScore = environment === 'Local / limited connectivity' ? 2 : environment === 'Dedicated application' ? 1 : 0;
        const advancedFeatures = new Set(['Notifications', 'File uploads', 'Data export / reporting', 'Appointments / Scheduling', 'Offline / local workflow', 'External integration']);
        const advancedCount = features.filter((feature) => advancedFeatures.has(feature)).length;
        const score = typeScore + roleScore + environmentScore + Math.ceil(features.length / 3) + advancedCount;

        let level = 'Low';
        let width = 32;
        let explanation = 'A focused project with a small number of user roles and core features can usually be scoped with fewer moving parts.';

        if (score >= 11) {
            level = 'High';
            width = 88;
            explanation = 'Multiple roles, workflows, advanced features, or deployment constraints increase coordination across interface, business logic, data, testing, integration, and release planning.';
        } else if (score >= 6) {
            level = 'Medium';
            width = 62;
            explanation = 'A multi-user solution with several core features typically needs structured planning across interface, application logic, data, validation, testing, and deployment.';
        }

        const featureText = features.length ? features.join(', ') : 'Core features to be defined during discovery';
        const deliveryText = delivery.length ? delivery.join(', ') : 'Delivery and handover items to be confirmed';
        const noteText = notes || 'Current workflow / main pain point to be discussed during discovery';
        currentBrief = [
            `Project type: ${type}`,
            `Current situation: ${stage}`,
            `User roles: ${roles}`,
            `Primary environment: ${environment}`,
            `Requested features: ${featureText}`,
            `Preferred delivery items: ${deliveryText}`,
            `Preferred timeline: ${timeline}`,
            `Workflow / priority: ${noteText}`,
            `Initial complexity indicator: ${level}`,
            '',
            'I would like to discuss the current workflow, users, priorities, technical requirements, delivery scope, timeline, and next steps.'
        ].join('\n');
        currentType = type;

        complexity.textContent = level;
        meter.style.width = `${width}%`;
        reason.textContent = explanation;
        preview.textContent = currentBrief.replaceAll('\n', ' · ');
    };

    form.addEventListener('change', calculate);
    form.addEventListener('input', (event) => {
        if (event.target?.matches('textarea, input[type="text"]')) calculate();
    });

    useButton.addEventListener('click', () => {
        const contactMessage = qs('#contactMessage');
        const projectType = qs('#projectType');
        const projectStage = qs('#projectStage');
        const timeline = qs('#timeline');
        if (!contactMessage || !projectType) return;

        const data = new FormData(form);
        const typeMap = { 'Existing System Upgrade': 'System Maintenance / Enhancement' };
        const optionValue = typeMap[currentType] || currentType;
        if (qsa('option', projectType).some((option) => option.value === optionValue)) projectType.value = optionValue;

        const stage = data.get('estimator_stage');
        if (projectStage && qsa('option', projectStage).some((option) => option.value === stage)) projectStage.value = stage;

        const preferredTimeline = data.get('estimator_timeline');
        const timelineMap = { '3+ months': '3–6 months' };
        const mappedTimeline = timelineMap[preferredTimeline] || preferredTimeline;
        if (timeline && qsa('option', timeline).some((option) => option.value === mappedTimeline)) timeline.value = mappedTimeline;

        contactMessage.value = currentBrief;
        contactMessage.dispatchEvent(new Event('input', { bubbles: true }));
        qs('#contact')?.scrollIntoView({ behavior: prefersReducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
        window.setTimeout(() => contactMessage.focus({ preventScroll: true }), prefersReducedMotion.matches ? 0 : 550);
        trackEvent('project_brief_used', { project_type: currentType, complexity: complexity.textContent });
    });

    copyButton?.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(currentBrief);
            showToast('Project brief copied.');
            trackEvent('project_brief_copied', { project_type: currentType, complexity: complexity.textContent });
        } catch {
            showToast('Copy was unavailable. You can select the brief text manually.');
        }
    });

    calculate();
}

/* ============================================================
   CONTACT FORM — PRODUCTION FORMSPREE FLOW
   - Progressive enhancement: the HTML action works without JS.
   - AJAX submission keeps visitors on the portfolio when JS is available.
   - Draft autosave, offline awareness, client-side validation, duplicate-click
     protection, timeout handling, rate-limit feedback, and a real success state.
   ============================================================ */
function initContactForm() {
    const form = qs('#contactForm');
    const status = qs('#formStatus');
    const feedback = qs('#formFeedback');
    const fallbackLink = qs('#formFallbackLink');
    const successPanel = qs('#inquirySuccess');
    const successReference = qs('#successReference');
    const sendAnother = qs('#sendAnotherInquiry');
    const clearDraftButton = qs('#clearInquiryDraft');
    const networkState = qs('#formNetworkState');
    if (!form || !status) return;

    const submitButton = qs('button[type="submit"]', form);
    const buttonLabel = qs('span', submitButton);
    const buttonIcon = qs('i', submitButton);
    const contactEmail = (body.dataset.contactEmail || 'tgroupsolutions.dev2026@gmail.com').trim();
    const configuredId = (form.dataset.formspreeId || body.dataset.formspreeId || '').trim();
    const formspreeEndpoint = form.action || (configuredId ? `https://formspree.io/f/${encodeURIComponent(configuredId)}` : '');
    const draftKey = form.dataset.draftKey || 'hassou-project-inquiry-draft-v1';
    const consent = qs('#contactConsent');
    const honeypot = qs('#companyWebsite');
    const referenceInput = qs('#inquiryReference');
    const submittedAtInput = qs('#submittedAt');
    const sourceUrlInput = qs('#sourceUrl');
    const maxDraftAge = 14 * 24 * 60 * 60 * 1000;
    let submitting = false;
    let draftTimer = 0;

    const fields = qsa('input:not([type="checkbox"]):not([type="hidden"]), select, textarea', form)
        .filter((field) => field.id && field.id !== 'companyWebsite');

    const setStatus = (message, type = '') => {
        status.textContent = message;
        status.className = `form-status ${type}`.trim();
        feedback?.classList.toggle('has-message', Boolean(message));
        fallbackLink?.toggleAttribute('hidden', type !== 'error');
    };

    const setFieldError = (field, message = '') => {
        if (!field) return;
        field.setAttribute('aria-invalid', message ? 'true' : 'false');
        const error = qs(`[data-error-for="${field.id}"]`, form);
        if (error) error.textContent = message;
    };

    const getErrorMessage = (field) => {
        const validity = field.validity;
        if (validity.valueMissing) return 'This field is required.';
        if (validity.typeMismatch) return 'Enter a valid email address.';
        if (validity.tooShort) return `Please enter at least ${field.minLength} characters.`;
        if (validity.patternMismatch) return 'Please check the format of this field.';
        return 'Please check this field.';
    };

    const validateField = (field) => {
        const valid = field.checkValidity();
        setFieldError(field, valid ? '' : getErrorMessage(field));
        return valid;
    };

    const makeReference = () => {
        const now = new Date();
        const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('');
        const random = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `HASSOU TechGroup Solutions-${date}-${random}`;
    };

    const buildFallbackMail = () => {
        const data = new FormData(form);
        const subject = `HASSOU TechGroup Solutions Project Inquiry — ${data.get('project_type') || 'Custom System'}`;
        const message = [
            `Name: ${data.get('name') || ''}`,
            `Email: ${data.get('email') || ''}`,
            `Phone: ${data.get('phone') || 'Not specified'}`,
            `Preferred reply: ${data.get('preferred_contact') || 'Email'}`,
            `Organization: ${data.get('organization') || 'Not specified'}`,
            `Project type: ${data.get('project_type') || 'Not specified'}`,
            `Project stage: ${data.get('project_stage') || 'Not specified'}`,
            `User scope: ${data.get('user_scope') || 'Not specified'}`,
            `Budget: ${data.get('budget') || 'Not specified'}`,
            `Timeline: ${data.get('timeline') || 'Not specified'}`,
            '',
            'Project brief:',
            data.get('message') || ''
        ].join('\n');
        if (fallbackLink) fallbackLink.href = `mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    };

    const getDraft = () => {
        try {
            const raw = localStorage.getItem(draftKey);
            if (!raw) return null;
            const draft = JSON.parse(raw);
            if (!draft.savedAt || Date.now() - draft.savedAt > maxDraftAge) {
                localStorage.removeItem(draftKey);
                return null;
            }
            return draft;
        } catch {
            return null;
        }
    };

    const saveDraft = () => {
        try {
            const data = {};
            qsa('input, select, textarea', form).forEach((field) => {
                if (!field.name || field.type === 'hidden' || field.name === '_gotcha') return;
                data[field.name] = field.type === 'checkbox' ? field.checked : field.value;
            });
            localStorage.setItem(draftKey, JSON.stringify({ savedAt: Date.now(), data }));
        } catch {
            // Private browsing/storage restrictions should never block the form.
        }
    };

    const clearDraft = (showMessage = false) => {
        try { localStorage.removeItem(draftKey); } catch {}
        if (showMessage) setStatus('Saved draft cleared. The form is ready for a new project brief.', 'info');
    };

    const restoreDraft = () => {
        const draft = getDraft();
        if (!draft?.data) return;
        Object.entries(draft.data).forEach(([name, value]) => {
            const field = form.elements.namedItem(name);
            if (!field || field instanceof RadioNodeList) return;
            if (field.type === 'checkbox') field.checked = Boolean(value);
            else field.value = String(value ?? '');
        });
        setStatus('Your unfinished project inquiry was restored from this device.', 'info');
    };

    const updateNetworkState = () => {
        const online = navigator.onLine;
        if (networkState) {
            networkState.classList.toggle('is-offline', !online);
            networkState.innerHTML = `<i class="fas ${online ? 'fa-wifi' : 'fa-triangle-exclamation'}" aria-hidden="true"></i> ${online ? 'Online' : 'Offline — draft preserved'}`;
        }
        if (!online && !submitting) {
            buildFallbackMail();
            setStatus('You appear to be offline. Your draft is saved locally; reconnect before sending, or use the email option.', 'error');
        } else if (online && status.classList.contains('error') && status.textContent.includes('offline')) {
            setStatus('Connection restored. You can send your inquiry now.', 'info');
        }
    };

    const celebrateSuccess = () => {
        if (!successPanel || prefersReducedMotion.matches) return;
        const burst = document.createElement('div');
        burst.className = 'success-burst';
        for (let i = 0; i < 18; i += 1) {
            const particle = document.createElement('span');
            particle.style.setProperty('--i', String(i));
            burst.appendChild(particle);
        }
        successPanel.appendChild(burst);
        window.setTimeout(() => burst.remove(), 1600);
    };

    const showSuccess = (reference, projectType) => {
        form.hidden = true;
        successPanel?.removeAttribute('hidden');
        if (successReference) successReference.textContent = reference;
        successPanel?.focus({ preventScroll: true });
        successPanel?.scrollIntoView({ behavior: prefersReducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
        clearDraft(false);
        setStatus('', '');
        celebrateSuccess();
        trackEvent('contact_form_submitted', { project_type: projectType || 'not_specified', method: 'formspree' });
    };

    fields.forEach((field) => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
            if (field.getAttribute('aria-invalid') === 'true') validateField(field);
            window.clearTimeout(draftTimer);
            draftTimer = window.setTimeout(saveDraft, 250);
        });
        field.addEventListener('change', saveDraft);
    });

    consent?.addEventListener('change', () => {
        setFieldError(consent, consent.checked ? '' : 'Please confirm the project-terms acknowledgement.');
        saveDraft();
    });

    clearDraftButton?.addEventListener('click', () => {
        form.reset();
        fields.forEach((field) => setFieldError(field, ''));
        setFieldError(consent, '');
        clearDraft(true);
        qs('#contactName', form)?.focus();
    });

    sendAnother?.addEventListener('click', () => {
        successPanel?.setAttribute('hidden', '');
        form.hidden = false;
        form.reset();
        form.dataset.started = '';
        setStatus('', '');
        qs('#contactName', form)?.focus();
        form.scrollIntoView({ behavior: prefersReducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
    });

    window.addEventListener('online', updateNetworkState);
    window.addEventListener('offline', updateNetworkState);
    updateNetworkState();
    restoreDraft();
    buildFallbackMail();

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (submitting) return;

        if (honeypot?.value) {
            form.reset();
            clearDraft(false);
            return;
        }

        const fieldValidity = fields.map(validateField);
        const consentValid = consent ? consent.checked : true;
        if (consent && !consentValid) setFieldError(consent, 'Please confirm the project-terms acknowledgement.');

        if (fieldValidity.includes(false) || !consentValid) {
            setStatus('Please correct the highlighted fields before continuing.', 'error');
            qs('[aria-invalid="true"]', form)?.focus();
            trackEvent('contact_form_validation_error');
            return;
        }

        if (!navigator.onLine) {
            buildFallbackMail();
            setStatus('You are offline, so the inquiry cannot be sent yet. Your draft is safe on this device. Reconnect and retry, or use the email option.', 'error');
            return;
        }

        if (!formspreeEndpoint || !formspreeEndpoint.includes('formspree.io/f/')) {
            buildFallbackMail();
            setStatus('The secure inquiry endpoint is not configured correctly. Please use the email option while the form connection is being restored.', 'error');
            return;
        }

        const reference = makeReference();
        if (referenceInput) referenceInput.value = reference;
        if (submittedAtInput) submittedAtInput.value = new Date().toISOString();
        if (sourceUrlInput) sourceUrlInput.value = location.href;

        const data = new FormData(form);
        data.set('subject', `HASSOU TechGroup Solutions Project Inquiry — ${data.get('project_type') || 'Custom System'} — ${reference}`);
        data.set('inquiry_reference', reference);
        data.set('submitted_at', new Date().toISOString());
        data.set('source_url', location.href);
        data.set('recipient_context', contactEmail);

        submitting = true;
        submitButton.disabled = true;
        submitButton.setAttribute('aria-busy', 'true');
        if (buttonLabel) buttonLabel.textContent = 'Sending securely…';
        if (buttonIcon) buttonIcon.className = 'fas fa-circle-notch fa-spin';
        setStatus('Sending your project inquiry securely… Please keep this tab open for a moment.', 'info');
        fallbackLink?.setAttribute('hidden', '');

        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 20000);

        try {
            const response = await fetch(formspreeEndpoint, {
                method: 'POST',
                body: data,
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });

            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                let message = '';
                if (Array.isArray(result.errors)) message = result.errors.map((item) => item.message).filter(Boolean).join(' ');
                if (response.status === 429) message = 'Too many submissions were sent in a short period. Please wait a moment and try again.';
                if (response.status >= 500) message = 'The contact service is temporarily unavailable. Please try again shortly.';
                throw new Error(message || `The contact service returned status ${response.status}.`);
            }

            showSuccess(reference, data.get('project_type'));
            form.reset();
        } catch (error) {
            console.error('Contact form submission failed:', error);
            buildFallbackMail();
            const message = error?.name === 'AbortError'
                ? 'The request took too long to complete. Your form was not cleared. Please retry, or use the email option.'
                : `${error?.message || 'We could not send the inquiry automatically.'} Your form was not cleared, so you can retry without retyping it.`;
            setStatus(message, 'error');
            saveDraft();
            trackEvent('contact_form_error', { reason: error?.name || 'request_error' });
        } finally {
            window.clearTimeout(timeout);
            submitting = false;
            submitButton.disabled = false;
            submitButton.removeAttribute('aria-busy');
            if (buttonLabel) buttonLabel.textContent = 'Send Project Inquiry';
            if (buttonIcon) buttonIcon.className = 'fas fa-paper-plane';
        }
    });

    form.addEventListener('focusin', () => {
        if (!form.dataset.started) {
            form.dataset.started = 'true';
            trackEvent('contact_form_started');
        }
    }, { once: true });
}

/* ============================================================
   SECTION-SPECIFIC MOTION + PROCESS PROGRESSION
   ============================================================ */
function initSectionMotion() {
    const sections = qsa('.section-motion');
    if (!sections.length) return;

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle('is-active', entry.isIntersecting);
                if (entry.isIntersecting) entry.target.dataset.motionSeen = 'true';
            });
        }, { threshold: 0.12, rootMargin: '-8% 0px -12% 0px' });
        sections.forEach((section) => observer.observe(section));
    } else {
        sections.forEach((section) => section.classList.add('is-active'));
    }

    if (prefersReducedMotion.matches) return;

    const processShell = qs('#processShell');
    const processSteps = processShell ? qsa('.process-step', processShell) : [];
    let scheduled = false;

    const update = () => {
        scheduled = false;
        const viewport = window.innerHeight || 1;

        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            const travel = rect.height + viewport;
            const progress = Math.max(0, Math.min(1, (viewport - rect.top) / travel));
            section.style.setProperty('--section-progress', progress.toFixed(3));
        });

        if (processShell && processSteps.length) {
            const rect = processShell.getBoundingClientRect();
            const start = viewport * 0.72;
            const end = viewport * 0.26;
            const progress = Math.max(0, Math.min(1, (start - rect.top) / Math.max(1, rect.height - end + start)));
            processShell.style.setProperty('--process-progress', `${(progress * 100).toFixed(1)}%`);

            const currentIndex = Math.min(processSteps.length - 1, Math.max(0, Math.floor(progress * processSteps.length)));
            processSteps.forEach((step, index) => {
                step.classList.toggle('is-passed', index < currentIndex || progress >= 0.99);
                step.classList.toggle('is-current', index === currentIndex && progress > 0.03 && progress < 0.99);
            });
        }
    };

    const schedule = () => {
        if (!scheduled) {
            scheduled = true;
            requestAnimationFrame(update);
        }
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    schedule();
}

/* ============================================================
   GENERIC CTA ANALYTICS
   ============================================================ */
function initCtaTracking() {
    qsa('a.btn, button.btn').forEach((element) => {
        element.addEventListener('click', () => {
            const label = element.textContent.trim().replace(/\s+/g, ' ');
            trackEvent('cta_clicked', { label });
        });
    });
}



/* ============================================================
   MOBILE BOTTOM DOCK
   Adds thumb-friendly navigation on compact screens while the full sidebar
   remains available from the menu button.
   ============================================================ */
function initMobileDock() {
    const dock = qs('#mobileDock');
    if (!dock) return;
    const links = qsa('[data-dock-target]', dock);
    const sections = links
        .map((link) => document.getElementById(link.dataset.dockTarget))
        .filter(Boolean);

    const setActive = (id) => {
        links.forEach((link) => {
            const active = link.dataset.dockTarget === id;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
    };

    links.forEach((link) => link.addEventListener('click', () => setActive(link.dataset.dockTarget)));

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) setActive(visible.target.id);
        }, { rootMargin: '-25% 0px -55% 0px', threshold: [0.01, 0.15, 0.35] });
        sections.forEach((section) => observer.observe(section));
    }
    setActive(location.hash.slice(1) || 'hero');
}

/* ============================================================
   PWA / INSTALLABLE PORTFOLIO
   ============================================================ */
function initPwa() {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register(new URL('sw.js', import.meta.url)).catch(() => {
                // The portfolio remains fully usable without service-worker support.
            });
        }, { once: true });
    }

    let deferredPrompt = null;
    const quickContact = qs('#quickContact');

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredPrompt = event;
        if (!quickContact || qs('#installAppButton', quickContact)) return;

        const installButton = document.createElement('button');
        installButton.type = 'button';
        installButton.id = 'installAppButton';
        installButton.className = 'quick-contact-install';
        installButton.innerHTML = '<i class="fas fa-download" aria-hidden="true"></i><span>Install HASSOU TechGroup Solutions app</span>';
        quickContact.appendChild(installButton);

        installButton.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            trackEvent('pwa_install_prompt', { outcome: choice.outcome });
            deferredPrompt = null;
            installButton.remove();
        });
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        qs('#installAppButton')?.remove();
        trackEvent('pwa_installed');
    });
}

/* ============================================================
   CURRENT YEAR
   ============================================================ */
function initYear() {
    const year = qs('#currentYear');
    if (year) year.textContent = String(new Date().getFullYear());
}

/* ============================================================
   BOOT
   ============================================================ */
function boot() {
    initSiteIntro();
    initTheme();
    initMobileNavigation();
    initSamePageNavigation();
    initAdvancedSidebar();
    initPointerEffects();
    initCustomCursor();
    initCardInteractions();
    initMagneticElements();
    initPageMotionState();
    initSectionMotion();
    initHeroDynamicLine();
    initRevealObserver();
    initScrollSpy();
    initScrollUi();
    initPortfolioFilters();
    initDialogs();
    initQuickContact();
    initArchitectureDemo();
    initProjectEstimator();
    initContactForm();
    initMobileDock();
    initCtaTracking();
    initPwa();
    initYear();
}

boot();


/* ============================================================
   V11 HERO ENHANCEMENTS (micro-interactions + counters)
   ============================================================ */
(function initV11Enhancements() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    const initHeroSpotlight = () => {
        const heroVisual = document.querySelector('#heroVisual');
        if (!heroVisual || prefersReduced.matches || !window.matchMedia('(pointer:fine)').matches) return;

        const setSpot = (event) => {
            const rect = heroVisual.getBoundingClientRect();
            const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
            const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
            heroVisual.style.setProperty('--hero-spot-x', `${x.toFixed(2)}%`);
            heroVisual.style.setProperty('--hero-spot-y', `${y.toFixed(2)}%`);
            heroVisual.style.setProperty('--hero-spot-opacity', '1');
        };

        heroVisual.addEventListener('pointerenter', setSpot, { passive: true });
        heroVisual.addEventListener('pointermove', setSpot, { passive: true });
        heroVisual.addEventListener('pointerleave', () => {
            heroVisual.style.setProperty('--hero-spot-opacity', '0');
            heroVisual.style.setProperty('--hero-spot-x', '50%');
            heroVisual.style.setProperty('--hero-spot-y', '50%');
        });
    };

    const initProofCounters = () => {
        const counters = [...document.querySelectorAll('.proof-item strong[data-count]')];
        if (!counters.length) return;

        const animate = (element) => {
            if (element.dataset.animated === 'true') return;
            element.dataset.animated = 'true';
            const target = Number(element.dataset.count || 0);
            const suffix = element.dataset.suffix || '';
            if (!Number.isFinite(target) || prefersReduced.matches) {
                element.textContent = `${target}${suffix}`;
                return;
            }
            const duration = 1100;
            const start = performance.now();
            const step = (now) => {
                const progress = Math.min(1, (now - start) / duration);
                const eased = 1 - Math.pow(1 - progress, 3);
                const value = Math.round(target * eased);
                element.textContent = `${value}${suffix}`;
                if (progress < 1) requestAnimationFrame(step);
                else element.textContent = `${target}${suffix}`;
            };
            requestAnimationFrame(step);
        };

        if (!('IntersectionObserver' in window)) {
            counters.forEach(animate);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animate(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.65 });

        counters.forEach((counter) => observer.observe(counter));
    };

    const run = () => {
        initHeroSpotlight();
        initProofCounters();
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
    else run();
})();
