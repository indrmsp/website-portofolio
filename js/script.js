/**
 * Sakura Terminal — Portfolio Client Engine
 * Strict vanilla JavaScript. Zero external dependencies.
 */
(() => {
  "use strict";

  // 1. Utilities & Helpers

  const prefersReducedMotion = () => {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  // 2. Boot Screen Module

  const bootScreen = {
    screenEl: document.getElementById("boot"),
    skipBtn: document.getElementById("boot-skip-btn"),
    linesContainer: document.getElementById("boot-lines"),
    timerId: null,
    isDismissed: false,
    sessionKey: "sakuraTerminal.booted",
    activeTimers: [],

    setPageInert(isInert) {
      const landmarks = document.querySelectorAll("#site-header, #main-content, #site-footer");
      landmarks.forEach((el) => {
        if (isInert) {
          el.setAttribute("inert", "");
        } else {
          el.removeAttribute("inert");
        }
      });
    },

    init() {
      if (!this.screenEl) return;

      // Check if previously booted in this tab session
      try {
        if (sessionStorage.getItem(this.sessionKey) === "true") {
          this.dismiss(true);
          return;
        }
      } catch (err) {
        // Fallback gracefully if sessionStorage is restricted
      }

      // Mark underlying landmarks inert and focus the skip control for accessible modal dialog behavior
      this.setPageInert(true);
      if (this.skipBtn) {
        this.skipBtn.focus();
      }

      // If user prefers reduced motion, render immediately and auto-dismiss quickly
      if (prefersReducedMotion()) {
        this.timerId = setTimeout(() => this.dismiss(), 1500);
      } else {
        // Enforce hard cap of 4.0 seconds for auto-dismiss
        this.timerId = setTimeout(() => this.dismiss(), 4000);
        this.typewriteLines();
      }

      // Explicit keyboard dismissal handlers (Escape, Enter, Space)
      const handleKeyDismiss = (evt) => {
        if (this.isDismissed) return;
        if (evt.key === "Escape" || evt.key === "Enter" || evt.key === " ") {
          evt.preventDefault();
          this.dismiss();
        }
      };

      const handleClickDismiss = () => {
        if (this.isDismissed) return;
        this.dismiss();
      };

      this.screenEl.addEventListener("click", handleClickDismiss);
      window.addEventListener("keydown", handleKeyDismiss);

      if (this.skipBtn) {
        this.skipBtn.addEventListener("click", (evt) => {
          evt.stopPropagation();
          this.dismiss();
        });
      }
    },

    typewriteLines() {
      if (!this.linesContainer) return;
      const lines = Array.from(this.linesContainer.querySelectorAll(".boot-line"));
      if (lines.length === 0) return;

      const lineData = lines.map((el) => ({
        el,
        text: el.textContent.trim(),
        hasPrompt: el.classList.contains("boot-line--prompt")
      }));

      // Hide all lines initially for sequential reveal
      lineData.forEach((item) => {
        item.el.style.visibility = "hidden";
      });

      // Cadence tuned to 20ms/char (within 18-35 ms/char spec), scheduling full sequence under 3s
      let currentDelay = 40;
      lineData.forEach((item) => {
        const lineTimeout = setTimeout(() => {
          if (this.isDismissed) return;
          item.el.style.visibility = "visible";

          if (item.hasPrompt) {
            item.el.textContent = "> READY. PRESS ENTER OR ESC TO CONTINUE ";
            const cursorSpan = document.createElement("span");
            cursorSpan.className = "cursor";
            cursorSpan.setAttribute("aria-hidden", "true");
            cursorSpan.textContent = "\u2588";
            item.el.appendChild(cursorSpan);
          } else {
            const fullText = item.text;
            item.el.textContent = "";
            let charIndex = 0;
            const typeInterval = setInterval(() => {
              if (this.isDismissed) {
                clearInterval(typeInterval);
                return;
              }
              if (charIndex < fullText.length) {
                item.el.textContent += fullText.charAt(charIndex);
                charIndex++;
              } else {
                clearInterval(typeInterval);
              }
            }, 20);
            this.activeTimers.push(typeInterval);
          }
        }, currentDelay);

        this.activeTimers.push(lineTimeout);
        currentDelay += item.hasPrompt ? 100 : (item.text.length * 20 + 70);
      });
    },

    dismiss(immediate = false) {
      if (this.isDismissed) return;
      this.isDismissed = true;

      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }

      this.activeTimers.forEach((id) => {
        clearTimeout(id);
        clearInterval(id);
      });
      this.activeTimers = [];

      // Release landmarks from inert state
      this.setPageInert(false);

      if (this.screenEl) {
        this.screenEl.classList.add("is-hidden");
        this.screenEl.setAttribute("aria-hidden", "true");
        this.screenEl.setAttribute("inert", "");
      }

      try {
        sessionStorage.setItem(this.sessionKey, "true");
      } catch (err) {
        // Storage access handled gracefully
      }

      if (!immediate) {
        const targetFocus = document.getElementById("profile-title") || document.getElementById("main-content");
        if (targetFocus) {
          targetFocus.setAttribute("tabindex", "-1");
          targetFocus.focus({ preventScroll: true });
        }
      }
    }
  };

  // 3. Navigation Module

  const navigation = {
    toggleBtn: document.getElementById("nav-toggle"),
    menuEl: document.getElementById("primary-nav"),
    navLinks: document.querySelectorAll(".nav-menu__link"),
    sections: document.querySelectorAll("section[id]"),

    init() {
      if (this.toggleBtn && this.menuEl) {
        this.toggleBtn.addEventListener("click", () => this.toggleMenu());
      }

      // Close mobile menu on link click
      this.navLinks.forEach((link) => {
        link.addEventListener("click", () => {
          this.closeMenu();
        });
      });

      // Close on Escape key
      window.addEventListener("keydown", (evt) => {
        if (evt.key === "Escape" && this.menuEl && this.menuEl.classList.contains("is-open")) {
          this.closeMenu();
          if (this.toggleBtn) this.toggleBtn.focus();
        }
      });

      // Top button smooth scroll
      const topBtn = document.getElementById("back-to-top-btn");
      if (topBtn) {
        topBtn.addEventListener("click", (evt) => {
          evt.preventDefault();
          window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion() ? "auto" : "smooth"
          });
        });
      }

      this.initIntersectionObserver();
    },

    toggleMenu() {
      const isOpen = this.menuEl.classList.toggle("is-open");
      this.toggleBtn.setAttribute("aria-expanded", String(isOpen));
    },

    closeMenu() {
      if (this.menuEl) {
        this.menuEl.classList.remove("is-open");
      }
      if (this.toggleBtn) {
        this.toggleBtn.setAttribute("aria-expanded", "false");
      }
    },

    initIntersectionObserver() {
      if (!("IntersectionObserver" in window)) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const currentId = entry.target.getAttribute("id");
            this.navLinks.forEach((link) => {
              const href = link.getAttribute("href");
              if (href === `#${currentId}`) {
                link.classList.add("is-active");
              } else {
                link.classList.remove("is-active");
              }
            });
          }
        });
      }, {
        rootMargin: "-20% 0px -70% 0px",
        threshold: 0
      });

      this.sections.forEach((sec) => observer.observe(sec));
    }
  };

  // 4. Attributes Progress Bars Observer

  const attributesObserver = {
    progressBars: document.querySelectorAll(".pixel-progress"),

    init() {
      if (this.progressBars.length === 0) return;

      if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
        this.progressBars.forEach((bar) => this.fillBar(bar));
        return;
      }

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.fillBar(entry.target);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });

      this.progressBars.forEach((bar) => observer.observe(bar));
    },

    fillBar(bar) {
      const fillEl = bar.querySelector(".pixel-progress__fill");
      const targetVal = bar.getAttribute("aria-valuenow") || "0";
      if (fillEl) {
        requestAnimationFrame(() => {
          fillEl.style.setProperty("--progress-width", `${targetVal}%`);
        });
      }
    }
  };

  // 5. Project Gallery Module (GitHub Repositories)

  const projectGallery = {
    gridEl: document.getElementById("github-projects-grid"),
    badgeEl: document.getElementById("repo-count-badge"),
    refreshBtn: document.getElementById("refresh-repos-btn"),
    username: "indrmsp",

    knownProjects: {
      "website-portofolio": {
        featured: true,
        role: "Fullstack Developer",
        description: "Personal developer portfolio featuring a retro Japanese terminal interface built with zero-dependency vanilla web standards and dynamic GitHub repository synchronization.",
        stack: ["HTML5", "CSS3 (TOKENS)", "VANILLA JAVASCRIPT", "GITHUB REST API", "RETRO TERMINAL"],
        challenges: "Implementing an authentic retro monospace aesthetic with strict zero border-radius, keyboard-driven navigation, embedded terminal emulation, and resilient static fallback behavior when GitHub API requests fail or reach unauthenticated rate limits.",
        results: "Pure vanilla implementation with zero external runtime dependencies, full keyboard navigation with reduced-motion support, and graceful fallback to static repository markup when network or API limits occur."
      }
    },

    init() {
      if (!this.gridEl) return;

      if (this.refreshBtn) {
        this.refreshBtn.addEventListener("click", () => this.fetchRepos(true));
      }

      this.fetchRepos(false);
    },

    async fetchRepos(isManual = false) {
      if (this.badgeEl) {
        this.badgeEl.textContent = isManual ? "REFRESHING REPOSITORIES..." : "FETCHING GITHUB...";
      }

      try {
        const response = await fetch(`https://api.github.com/users/${this.username}/repos?sort=updated&per_page=10`);
        if (!response.ok) {
          throw new Error(`GitHub API returned status ${response.status}`);
        }
        const rawRepos = await response.json();
        const repos = Array.isArray(rawRepos)
          ? rawRepos.filter((r) => Boolean(this.knownProjects[r.name]))
          : [];

        if (repos.length > 0) {
          this.renderRepos(repos);
          if (this.badgeEl) {
            this.badgeEl.textContent = `${repos.length} REPOSITORIES SYNCED`;
          }
        } else {
          if (this.badgeEl) {
            this.badgeEl.textContent = "STATIC REPO VIEW ACTIVE";
          }
        }
      } catch (err) {
        // In case of rate-limiting or offline, keep the static fallback cards intact
        if (this.badgeEl) {
          this.badgeEl.textContent = "STATIC REPO VIEW // API LIMITED";
        }
      }
    },

    createMissionField(label, text) {
      const field = document.createElement("div");
      field.className = "mission-field";

      const labelEl = document.createElement("span");
      labelEl.className = "mission-label";
      labelEl.textContent = label;

      const proseEl = document.createElement("p");
      proseEl.className = "mission-prose";
      proseEl.textContent = text;

      field.appendChild(labelEl);
      field.appendChild(proseEl);
      return field;
    },

    renderRepos(repos) {
      this.gridEl.textContent = "";

      repos.forEach((repo) => {
        const verified = this.knownProjects[repo.name];
        const isFeatured = Boolean(verified && (verified.featured || repos.length === 1));

        const card = document.createElement("article");
        card.className = isFeatured ? "panel mission-card mission-card--featured" : "panel mission-card";

        // Header
        const header = document.createElement("div");
        header.className = "panel__header";

        const titleSpan = document.createElement("span");
        titleSpan.className = "panel__title";
        titleSpan.textContent = `MISSION \u00B7 ${repo.name}`;

        const statusDiv = document.createElement("div");
        statusDiv.className = "mission-card__status";

        const starSpan = document.createElement("span");
        starSpan.className = "status-cleared";
        starSpan.textContent = `\u2605 ${Number(repo.stargazers_count) || 0}`;

        const forkSpan = document.createElement("span");
        forkSpan.className = "difficulty";
        forkSpan.textContent = isFeatured ? "\u2605 FEATURED" : `\u26B2 ${Number(repo.forks_count) || 0}`;

        statusDiv.appendChild(starSpan);
        statusDiv.appendChild(forkSpan);
        header.appendChild(titleSpan);
        header.appendChild(statusDiv);
        card.appendChild(header);

        // Body
        const body = document.createElement("div");
        body.className = "mission-card__body";

        // 1. Role (only when verified)
        if (verified && verified.role) {
          body.appendChild(this.createMissionField("ROLE", verified.role));
        }

        // 2. Description
        const descText = repo.description || (verified && verified.description) || "Public repository on GitHub.";
        body.appendChild(this.createMissionField("DESCRIPTION", descText));

        // 3. Stack
        const stackItems = (Array.isArray(repo.topics) && repo.topics.length > 0)
          ? repo.topics.map((t) => t.toUpperCase())
          : (verified ? verified.stack : (repo.language ? [repo.language.toUpperCase()] : []));

        if (stackItems.length > 0) {
          const stackField = document.createElement("div");
          stackField.className = "mission-field";
          const stackLabel = document.createElement("span");
          stackLabel.className = "mission-label";
          stackLabel.textContent = "STACK";
          const stackContainer = document.createElement("div");
          stackContainer.className = "mission-stack";

          stackItems.forEach((tech) => {
            const chip = document.createElement("span");
            chip.className = "tech-chip";
            chip.textContent = tech;
            stackContainer.appendChild(chip);
          });

          stackField.appendChild(stackLabel);
          stackField.appendChild(stackContainer);
          body.appendChild(stackField);
        }

        // 4. Challenges (only when verified)
        if (verified && verified.challenges) {
          body.appendChild(this.createMissionField("CHALLENGES", verified.challenges));
        }

        // 5. Results (only when verified)
        if (verified && verified.results) {
          body.appendChild(this.createMissionField("RESULTS", verified.results));
        }

        // Footer
        const footer = document.createElement("div");
        footer.className = "mission-card__footer";

        const link = document.createElement("a");
        link.className = "retro-link";
        link.href = encodeURI(repo.html_url);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "VIEW REPOSITORY \u2197";
        footer.appendChild(link);

        if (repo.updated_at) {
          const updatedDate = String(repo.updated_at).substring(0, 10);
          const timeEl = document.createElement("time");
          timeEl.className = "mission-code";
          timeEl.setAttribute("datetime", updatedDate);
          timeEl.textContent = `UPDATED: ${updatedDate}`;
          footer.appendChild(timeEl);
        }

        body.appendChild(footer);
        card.appendChild(body);
        this.gridEl.appendChild(card);
      });
    }
  };

  // 6. Terminal Shell Module

  const terminal = {
    formEl: document.getElementById("terminal-form"),
    inputEl: document.getElementById("terminal-input"),
    outputEl: document.getElementById("terminal-output"),
    history: [],
    historyIndex: -1,
    commands: [
      "help",
      "about",
      "skills",
      "projects",
      "journey",
      "contact",
      "clear",
      "whoami",
      "date",
      "theme"
    ],

    init() {
      if (!this.formEl || !this.inputEl || !this.outputEl) return;

      // Handle command submission
      this.formEl.addEventListener("submit", (evt) => {
        evt.preventDefault();
        const rawCmd = this.inputEl.value.trim();
        if (rawCmd) {
          this.runCommand(rawCmd);
        }
        this.inputEl.value = "";
      });

      // Keyboard navigation (History & Tab completion)
      this.inputEl.addEventListener("keydown", (evt) => {
        if (evt.key === "ArrowUp") {
          evt.preventDefault();
          this.navigateHistory(-1);
        } else if (evt.key === "ArrowDown") {
          evt.preventDefault();
          this.navigateHistory(1);
        } else if (evt.key === "Tab") {
          evt.preventDefault();
          this.autocomplete(this.inputEl.value);
        }
      });

      // Focus input when clicking anywhere in output area
      this.outputEl.addEventListener("click", () => {
        this.inputEl.focus();
      });

      // Initialize theme if previously saved
      this.initSavedTheme();
    },

    navigateHistory(direction) {
      if (this.history.length === 0) return;

      if (direction === -1) {
        // Going back in history
        if (this.historyIndex === -1) {
          this.historyIndex = this.history.length - 1;
        } else if (this.historyIndex > 0) {
          this.historyIndex -= 1;
        }
      } else {
        // Going forward in history
        if (this.historyIndex < this.history.length - 1 && this.historyIndex !== -1) {
          this.historyIndex += 1;
        } else {
          this.historyIndex = -1;
          this.inputEl.value = "";
          return;
        }
      }

      if (this.historyIndex >= 0 && this.historyIndex < this.history.length) {
        this.inputEl.value = this.history[this.historyIndex];
      }
    },

    autocomplete(currentVal) {
      const trimmed = currentVal.trim().toLowerCase();
      if (!trimmed) return;

      const matches = this.commands.filter((cmd) => cmd.startsWith(trimmed));
      if (matches.length === 1) {
        this.inputEl.value = matches[0];
      } else if (matches.length > 1) {
        this.printSystemLine(`Matches: ${matches.join("  ")}`);
      }
    },

    runCommand(raw) {
      // Record history
      this.history.push(raw);
      this.historyIndex = -1;

      // Echo user input
      this.printUserLine(raw);

      const normalized = raw.toLowerCase().trim();

      switch (normalized) {
        case "help":
          this.renderHelp();
          break;
        case "about":
          this.renderAbout();
          break;
        case "skills":
          this.renderSkills();
          break;
        case "projects":
          this.renderProjects();
          break;
        case "journey":
          this.renderJourney();
          break;
        case "contact":
          this.renderContact();
          break;
        case "clear":
          this.clearOutput();
          break;
        case "whoami":
          this.renderWhoami();
          break;
        case "date":
          this.renderDate();
          break;
        case "theme":
          this.toggleTheme();
          break;
        default:
          this.renderNotFound(raw);
          break;
      }

      this.scrollToBottom();
    },

    printUserLine(rawText) {
      const line = document.createElement("p");
      line.className = "term-line term-line--user";
      line.textContent = `visitor@sakura:~$ ${rawText}`;
      this.outputEl.appendChild(line);
    },

    printSystemLine(text) {
      const line = document.createElement("p");
      line.className = "term-line term-line--sys";
      line.textContent = text;
      this.outputEl.appendChild(line);
    },

    renderHelp() {
      const table = document.createElement("table");
      table.className = "term-table";
      table.setAttribute("aria-label", "Available terminal commands");

      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      const thCmd = document.createElement("th");
      thCmd.textContent = "COMMAND";
      const thDesc = document.createElement("th");
      thDesc.textContent = "DESCRIPTION";
      headerRow.appendChild(thCmd);
      headerRow.appendChild(thDesc);
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      const helpData = [
        ["help", "Show this command reference table"],
        ["about", "Display engineer summary and architectural core"],
        ["skills", "List technical proficiencies and star rankings"],
        ["projects", "Display backend mission briefs and metrics"],
        ["journey", "Condensed career journey and milestones"],
        ["contact", "Direct communication endpoints and social links"],
        ["clear", "Clear the terminal display buffer"],
        ["whoami", "Display current session identity & credentials"],
        ["date", "Output current system ISO timestamp"],
        ["theme", "Toggle site-wide dark/light visual theme"]
      ];

      helpData.forEach(([cmd, desc]) => {
        const row = document.createElement("tr");
        const tdCmd = document.createElement("td");
        tdCmd.className = "term-highlight";
        tdCmd.textContent = cmd;

        const tdDesc = document.createElement("td");
        tdDesc.textContent = desc;

        row.appendChild(tdCmd);
        row.appendChild(tdDesc);
        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      this.outputEl.appendChild(table);
    },

    renderAbout() {
      const line = document.createElement("p");
      line.className = "term-line term-line--out";
      line.textContent =
        "OPERATOR: Indra [@indrmsp]\n" +
        "ROLE: Entry-Level Backend Engineer (0 YOE)\n" +
        "SUBCLASS: Cloud / DevOps\n" +
        "CORE FOCUS: Building reliable backend foundations with Go & Gin, PostgreSQL databases, Docker containerization, Kafka event streaming, and k6 benchmarking.";
      this.outputEl.appendChild(line);
    },

    renderSkills() {
      const skillsData = [
        "Golang & Gin Framework           ★★★★☆  4/5",
        "PostgreSQL & Database Design     ★★★☆☆  3/5",
        "Docker & Containerization        ★★★★☆  4/5",
        "Redis In-Memory Caching          ★★★☆☆  3/5",
        "Apache Kafka Event Streaming     ★★★☆☆  3/5",
        "k6 Performance Testing           ★★★☆☆  3/5",
        "Linux & DevOps Tooling           ★★★☆☆  3/5",
        "Kubernetes Basics                ★★☆☆☆  2/5"
      ];

      const p = document.createElement("p");
      p.className = "term-line term-line--out";
      p.textContent = skillsData.join("\n");
      this.outputEl.appendChild(p);
    },

    renderProjects() {
      const projectsData = [
        "1. website-portofolio -> Sakura Terminal (Retro Japanese Monospace Portfolio)",
        "   ROLE: Fullstack Developer",
        "   STACK: HTML5, CSS3 (Custom Tokens), Vanilla JavaScript (ES2020), GitHub REST API",
        "   CHALLENGES: Zero-dependency CRT terminal UI with keyboard navigation and retro styling",
        "   RESULTS: Zero external dependencies, keyboard navigation, and reliable static fallback",
        "   URL: https://github.com/indrmsp/website-portofolio",
        "",
        "STATUS: 1 public repository currently live. Upcoming backend microservices in progress.",
        "Type 'contact' or visit https://github.com/indrmsp for all public updates."
      ];

      const p = document.createElement("p");
      p.className = "term-line term-line--out";
      p.textContent = projectsData.join("\n");
      this.outputEl.appendChild(p);
    },

    renderJourney() {
      const journeyData = [
        "1. 2022 - 2026    | INFORMATICS — Telkom University Purwokerto",
        "2. 2026 - PRESENT | JUNIOR BACKEND ENGINEER",
        "3. FUTURE         | TO BE CONTINUED..."
      ];

      const p = document.createElement("p");
      p.className = "term-line term-line--out";
      p.textContent = journeyData.join("\n");
      this.outputEl.appendChild(p);
    },

    renderContact() {
      const container = document.createElement("div");
      container.className = "term-line term-line--out";

      const contacts = [
        { label: "GITHUB", url: "https://github.com/indrmsp", display: "https://github.com/indrmsp" },
        { label: "LINKEDIN", url: "https://www.linkedin.com/in/indrmsp", display: "https://www.linkedin.com/in/indrmsp" },
        { label: "EMAIL", url: "mailto:indrmsp@gmail.com", display: "indrmsp@gmail.com" }
      ];

      contacts.forEach(({ label, url, display }) => {
        const line = document.createElement("div");
        const link = document.createElement("a");
        link.className = "term-link";
        link.href = encodeURI(url);
        if (!url.startsWith("mailto:")) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }
        link.textContent = display;

        const labelNode = document.createElement("span");
        labelNode.textContent = `${label.padEnd(9, " ")}: `;
        line.appendChild(labelNode);
        line.appendChild(link);
        container.appendChild(line);
      });

      this.outputEl.appendChild(container);
    },

    clearOutput() {
      this.outputEl.textContent = "";
      this.printSystemLine("Console buffer cleared. Type 'help' for command manual.");
    },

    renderWhoami() {
      const p = document.createElement("p");
      p.className = "term-line term-line--out";
      p.textContent = "visitor [GUEST_SESSION: AUTH_OK] — Granted read privileges on systems dossier.";
      this.outputEl.appendChild(p);
    },

    renderDate() {
      const p = document.createElement("p");
      p.className = "term-line term-line--out";
      p.textContent = `SYSTEM_TIME: ${new Date().toISOString()}`;
      this.outputEl.appendChild(p);
    },

    toggleTheme() {
      const doc = document.documentElement;
      const currentTheme = doc.getAttribute("data-theme") || "dark";
      const newTheme = currentTheme === "dark" ? "light" : "dark";

      if (newTheme === "light") {
        doc.setAttribute("data-theme", "light");
      } else {
        doc.removeAttribute("data-theme");
      }

      try {
        localStorage.setItem("sakuraTerminal.theme", newTheme);
      } catch (err) {
        // Storage access handled gracefully
      }

      this.printSystemLine(`Visual theme swapped to [${newTheme.toUpperCase()}].`);
    },

    initSavedTheme() {
      try {
        const savedTheme = localStorage.getItem("sakuraTerminal.theme");
        if (savedTheme === "light") {
          document.documentElement.setAttribute("data-theme", "light");
        }
      } catch (err) {
        // Storage access handled gracefully
      }
    },

    renderNotFound(cmd) {
      const p = document.createElement("p");
      p.className = "term-line term-line--err";
      p.textContent = `command not found: ${cmd}. Type 'help' to inspect available system commands.`;
      this.outputEl.appendChild(p);
    },

    scrollToBottom() {
      this.outputEl.scrollTop = this.outputEl.scrollHeight;
    }
  };

  // 7. Clipboard Helper Module

  const clipboardHelper = {
    btnEl: document.getElementById("copy-email-btn"),
    emailTextEl: document.getElementById("email-address-text"),

    init() {
      if (!this.btnEl || !this.emailTextEl) return;

      this.btnEl.addEventListener("click", () => {
        const email = this.emailTextEl.textContent.trim();
        this.copyToClipboard(email);
      });
    },

    copyToClipboard(text) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(() => this.indicateSuccess())
          .catch(() => this.fallbackCopy(text));
      } else {
        this.fallbackCopy(text);
      }
    },

    fallbackCopy(text) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (success) {
          this.indicateSuccess();
        }
      } catch (err) {
        // In extreme restriction, select visual text for user to copy manually
        const range = document.createRange();
        range.selectNodeContents(this.emailTextEl);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    },

    indicateSuccess() {
      const originalText = this.btnEl.textContent;
      this.btnEl.textContent = "COPIED \u2713";
      this.btnEl.classList.add("is-copied");

      setTimeout(() => {
        this.btnEl.textContent = originalText;
        this.btnEl.classList.remove("is-copied");
      }, 2000);
    }
  };

  // 8. Initialization on DOM Ready

  document.addEventListener("DOMContentLoaded", () => {
    bootScreen.init();
    navigation.init();
    attributesObserver.init();
    projectGallery.init();
    terminal.init();
    clipboardHelper.init();
  });
})();
