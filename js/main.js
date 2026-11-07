/* =========================================================
   8888888b · 个人主页脚本
   01 小工具 / 02 主题 / 03 导航 / 04 背景代码雨
   05 入场动画 / 06 终端打字 / 07 鼠标光晕
   08 24 点引擎 / 09 24 点界面
   ========================================================= */

/* ---------- 01 小工具 ---------- */
document.documentElement.classList.add("js");
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

/* ---------- 02 主题 ---------- */
const root = document.documentElement;
const palette = { ink: "#cbd0c9", accent: "#cdf564" }; // 代码雨颜色，随主题刷新
const themeToggle = $("#themeToggle");
const themeMeta = $('meta[name="theme-color"]');

function applyTheme(theme) {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  themeToggle?.setAttribute("aria-label", theme === "dark" ? "切换到浅色模式" : "切换到深色模式");
  themeMeta?.setAttribute("content", theme === "dark" ? "#08090a" : "#f3f4ee");
  refreshInkColors();
}

applyTheme(localStorage.getItem("theme") === "light" ? "light" : "dark");

themeToggle?.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  applyTheme(next);
});

/* ---------- 03 导航 ---------- */
const nav = $("#nav");
const navLinks = $$(".nav__link");
const sections = navLinks.map((link) => $(link.getAttribute("href"))).filter(Boolean);

function onScroll() {
  const y = window.scrollY;
  nav?.classList.toggle("is-scrolled", y > 12);

  const marker = y + window.innerHeight * 0.38;
  let current = null;
  sections.forEach((section) => {
    if (section.offsetTop <= marker) current = section;
  });
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    link.classList.toggle("is-active", Boolean(current) && href === "#" + current.id);
  });
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const yearEl = $("#year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

/* ---------- 04 背景代码雨 ---------- */
const canvas = $("#codeCanvas");
const ctx = canvas?.getContext("2d");
const CODE_LINES = [
  "print('Hello, World!')",
  "def solve(cards): return 24",
  "const el = document.querySelector('#app')",
  "#include <iostream>",
  "console.log('24 点')",
  "for i in range(n):",
  "public static void main(String[] args)",
  "git commit -m 'update'",
  "while (true) { think(); }",
  "std::cout << answer;",
  "SELECT * FROM ideas;",
  "export default function App()",
  "if (x == 24) return true;",
  "npm run build",
  'printf("%d\\n", 24);',
  "fn main() { }",
];
const drops = [];
let rafId = null;
let lastTime = 0;

// 函数声明会被提升：applyTheme 在脚本更早的位置就会调用到它
function cssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function refreshInkColors() {
  palette.ink = cssVar("--ink-soft") || "#cbd0c9";
  palette.accent = cssVar("--accent") || "#cdf564";
}

function seedDrops(width, height) {
  drops.length = 0;
  const count = Math.max(6, Math.min(18, Math.round(width / 260)));
  for (let i = 0; i < count; i += 1) drops.push(makeDrop(width, height, true));
}

function makeDrop(width, height, anywhere) {
  return {
    text: CODE_LINES[randInt(0, CODE_LINES.length - 1)],
    size: randInt(11, 15),
    x: anywhere ? rand(0, width) : width + rand(20, 260),
    y: rand(0, height),
    speed: rand(12, 38),
    alpha: rand(0.06, 0.22),
    accent: Math.random() < 0.22,
    drift: rand(-4, 4),
  };
}

function sizeCanvas() {
  if (!canvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  seedDrops(rect.width, rect.height);
}

function drawFrame(time) {
  if (!ctx || !canvas) return;
  const width = canvas.getBoundingClientRect().width;
  const height = canvas.getBoundingClientRect().height;
  const dt = Math.min((time - lastTime) / 1000 || 0, 0.05);
  lastTime = time;
  ctx.clearRect(0, 0, width, height);

  drops.forEach((drop) => {
    drop.x -= drop.speed * dt * 6;
    drop.y += drop.drift * dt;
    if (drop.x < -360) Object.assign(drop, makeDrop(width, height, false));

    ctx.font = `${drop.size}px "Cascadia Code", Consolas, monospace`;
    ctx.fillStyle = drop.accent ? palette.accent : palette.ink;
    ctx.globalAlpha = drop.accent ? Math.min(1, drop.alpha * 1.19) : drop.alpha;
    ctx.fillText(drop.text, drop.x, drop.y);
  });

  ctx.globalAlpha = 1;
  rafId = requestAnimationFrame(drawFrame);
}

function drawStatic() {
  if (!ctx || !canvas) return;
  const width = canvas.getBoundingClientRect().width;
  const height = canvas.getBoundingClientRect().height;
  ctx.clearRect(0, 0, width, height);
  drops.forEach((drop) => {
    ctx.font = `${drop.size}px Consolas, monospace`;
    ctx.fillStyle = drop.accent ? palette.accent : palette.ink;
    ctx.globalAlpha = drop.alpha;
    ctx.fillText(drop.text, drop.x, drop.y);
  });
  ctx.globalAlpha = 1;
}

function stopCanvas() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

function startCanvas() {
  if (!canvas || !ctx) return;
  stopCanvas();
  if (reduceMotion.matches) {
    lastTime = 0;
    drawStatic();
    return;
  }
  rafId = requestAnimationFrame(drawFrame);
}

if (canvas && ctx) {
  sizeCanvas();
  refreshInkColors();
  startCanvas();

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      sizeCanvas();
      startCanvas();
    }, 180);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopCanvas();
    else startCanvas();
  });
}

/* ---------- 05 入场动画 ---------- */
const revealTargets = $$("[data-reveal]");
if ("IntersectionObserver" in window && !reduceMotion.matches) {
  const revealer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const siblings = Array.from(entry.target.parentElement.children).filter((node) =>
          node.hasAttribute("data-reveal")
        );
        const index = Math.max(0, siblings.indexOf(entry.target));
        entry.target.style.transitionDelay = `${Math.min(index * 90, 320)}ms`;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  revealTargets.forEach((el) => revealer.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add("is-visible"));
}

/* ---------- 06 终端打字 ---------- */
const terminalBody = $("#terminalBody");
if (terminalBody) {
  const lines = $$(".ln", terminalBody);
  const playTyping = () => {
    if (reduceMotion.matches) {
      terminalBody.classList.add("is-done");
      return;
    }
    terminalBody.classList.add("is-typing");
    lines.forEach((line, i) => {
      window.setTimeout(() => {
        line.style.transitionDelay = "0ms";
        line.style.opacity = "1";
        line.style.transform = "none";
        if (i === lines.length - 1) terminalBody.classList.add("is-done");
      }, 180 + i * 190);
    });
  };

  if ("IntersectionObserver" in window) {
    const watcher = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          playTyping();
          watcher.disconnect();
        });
      },
      { threshold: 0.35 }
    );
    watcher.observe(terminalBody);
  } else {
    playTyping();
  }
}

/* ---------- 07 鼠标光晕 ---------- */
const hero = $(".hero");
if (hero && !reduceMotion.matches) {
  let glowRaf = 0;
  hero.addEventListener("pointermove", (event) => {
    if (glowRaf) return;
    glowRaf = requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const mx = ((event.clientX - rect.left) / rect.width) * 100;
      const my = ((event.clientY - rect.top) / rect.height) * 100;
      hero.style.setProperty("--mx", `${mx.toFixed(2)}%`);
      hero.style.setProperty("--my", `${my.toFixed(2)}%`);
      glowRaf = 0;
    });
  });
}

/* ---------- 08 24 点引擎 ---------- */
function gcd(a, b) {
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

// 分数运算：全部用整数分子分母，避开浮点误差
function frac(n, d = 1) {
  if (d === 0) return null;
  if (d < 0) [n, d] = [-n, -d];
  const g = gcd(Math.abs(n), Math.abs(d));
  return { n: n / g, d: d / g };
}

const fAdd = (a, b) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
const fSub = (a, b) => frac(a.n * b.d - b.n * a.d, a.d * b.d);
const fMul = (a, b) => frac(a.n * b.n, a.d * b.d);
const fDiv = (a, b) => (b.n === 0 ? null : frac(a.n * b.d, a.d * b.n));
const isTwentyFour = (f) => f && f.n === 24 * f.d;

function combinePairs(a, b) {
  const out = [];
  const push = (value, expr) => {
    if (value) out.push({ v: value, e: `(${expr})` });
  };
  push(fAdd(a.v, b.v), `${a.e} + ${b.e}`);
  push(fSub(a.v, b.v), `${a.e} - ${b.e}`);
  push(fSub(b.v, a.v), `${b.e} - ${a.e}`);
  push(fMul(a.v, b.v), `${a.e} × ${b.e}`);
  push(fDiv(a.v, b.v), `${a.e} ÷ ${b.e}`);
  push(fDiv(b.v, a.v), `${b.e} ÷ ${a.e}`);
  return out;
}

function searchSolution(items) {
  if (items.length === 1) return isTwentyFour(items[0].v) ? items[0].e : null;
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const rest = items.filter((_, k) => k !== i && k !== j);
      const merged = combinePairs(items[i], items[j]);
      for (let k = 0; k < merged.length; k += 1) {
        const found = searchSolution([...rest, merged[k]]);
        if (found) return found;
      }
    }
  }
  return null;
}

function trimOuterParentheses(expr) {
  if (!expr.startsWith("(") || !expr.endsWith(")")) return expr;
  let depth = 0;
  for (let i = 0; i < expr.length; i += 1) {
    if (expr[i] === "(") depth += 1;
    else if (expr[i] === ")") depth -= 1;
    if (depth === 0) {
      return i === expr.length - 1 ? trimOuterParentheses(expr.slice(1, -1)) : expr;
    }
  }
  return expr;
}

function solve24(nums) {
  const solution = searchSolution(nums.map((n) => ({ v: frac(n), e: String(n) })));
  return solution ? trimOuterParentheses(solution) : null;
}

function tokenize(source) {
  const normalized = source
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–—]/g, "-")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/＋/g, "+")
    .replace(/－/g, "-");

  const tokens = [];
  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    if (ch === " ") continue;
    if (/[0-9]/.test(ch)) {
      let num = ch;
      while (i + 1 < normalized.length && /[0-9]/.test(normalized[i + 1])) {
        num += normalized[i + 1];
        i += 1;
      }
      tokens.push({ type: "num", value: Number(num) });
      continue;
    }
    if ("+-*/()".includes(ch)) {
      tokens.push({ type: ch });
      continue;
    }
    return { error: `算式里不能有「${ch}」` };
  }
  return { tokens };
}

const PRECEDENCE = { "+": 1, "-": 1, "*": 2, "/": 2 };

// 调度场算法 → 逆波兰 → 用分数求值
function evaluate(tokens) {
  const output = [];
  const ops = [];
  for (const token of tokens) {
    if (token.type === "num") {
      output.push({ v: frac(token.value) });
    } else if (token.type === "(") {
      ops.push(token);
    } else if (token.type === ")") {
      while (ops.length && ops[ops.length - 1].type !== "(") output.push(ops.pop());
      if (!ops.length) return { error: "括号没配对" };
      ops.pop();
    } else {
      while (
        ops.length &&
        ops[ops.length - 1].type !== "(" &&
        PRECEDENCE[ops[ops.length - 1].type] >= PRECEDENCE[token.type]
      ) {
        output.push(ops.pop());
      }
      ops.push(token);
    }
  }
  while (ops.length) {
    const op = ops.pop();
    if (op.type === "(") return { error: "括号没配对" };
    output.push(op);
  }

  const stack = [];
  for (const item of output) {
    if (item.v) {
      stack.push(item.v);
      continue;
    }
    if (stack.length < 2) return { error: "算式不完整" };
    const b = stack.pop();
    const a = stack.pop();
    let result = null;
    if (item.type === "+") result = fAdd(a, b);
    if (item.type === "-") result = fSub(a, b);
    if (item.type === "*") result = fMul(a, b);
    if (item.type === "/") result = fDiv(a, b);
    if (!result) return { error: "不能除以 0" };
    stack.push(result);
  }
  if (stack.length !== 1) return { error: "算式不完整" };
  return { value: stack[0] };
}

function formatValue(f) {
  if (!f) return "?";
  if (f.d === 1) return String(f.n);
  return (f.n / f.d).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

/* ---------- 09 24 点界面 ---------- */
const cardsEl = $("#cards");
const formEl = $("#gameForm");
const inputEl = $("#expr");
const msgEl = $("#gameMsg");
const newRoundBtn = $("#newRound");
const answerBtn = $("#showAnswer");
const gameState = { cards: [], solution: null, solved: false };

function setMessage(text, tone = "") {
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.classList.remove("is-ok", "is-bad", "is-hint");
  if (tone) msgEl.classList.add(tone);
}

function renderCards() {
  if (!cardsEl) return;
  $$(".tile", cardsEl).forEach((tile, i) => {
    tile.textContent = String(gameState.cards[i] ?? "—");
    tile.classList.remove("is-done");
    tile.style.animation = "none";
    void tile.offsetWidth; // 强制重排，让发牌动画每次都能重播
    tile.style.animation = "";
    tile.style.animationDelay = `${i * 60}ms`;
    tile.classList.add("is-dealt");
  });
}

function dealRound() {
  let cards = [];
  let solution = null;
  let attempts = 0;
  do {
    cards = [0, 0, 0, 0].map(() => randInt(1, 13)).sort((a, b) => a - b);
    solution = solve24(cards);
    attempts += 1;
  } while (!solution && attempts < 240);

  gameState.cards = cards;
  gameState.solution = solution;
  gameState.solved = false;
  if (inputEl) inputEl.value = "";
  setMessage("支持 + − × ÷ 和括号，也可以直接打 * / ÷。");
  renderCards();
}

function checkAnswer(raw) {
  const text = raw.trim();
  if (!text) {
    setMessage("先写一个算式吧。", "is-hint");
    return false;
  }

  const parsed = tokenize(text);
  if (parsed.error) {
    setMessage(parsed.error, "is-bad");
    return false;
  }

  const numbers = parsed.tokens.filter((t) => t.type === "num").map((t) => t.value);
  const remaining = [...gameState.cards];
  const stray = numbers.find((value) => {
    const index = remaining.indexOf(value);
    if (index === -1) return true;
    remaining.splice(index, 1);
    return false;
  });

  if (numbers.length !== gameState.cards.length || stray !== undefined) {
    setMessage(`四个数字 ${gameState.cards.join("、")} 都要用上，而且各用一次。`, "is-bad");
    return false;
  }

  const result = evaluate(parsed.tokens);
  if (result.error) {
    setMessage(result.error, "is-bad");
    return false;
  }

  if (!isTwentyFour(result.value)) {
    setMessage(`算出来是 ${formatValue(result.value)}，还差一点。`, "is-bad");
    return false;
  }

  gameState.solved = true;
  $$(".tile", cardsEl).forEach((tile) => tile.classList.add("is-done"));
  setMessage("正好 24。这组牌就是这么做出来的。", "is-ok");
  return true;
}

formEl?.addEventListener("submit", (event) => {
  event.preventDefault();
  checkAnswer(inputEl.value);
});

newRoundBtn?.addEventListener("click", () => {
  dealRound();
  inputEl?.focus();
});

answerBtn?.addEventListener("click", () => {
  if (!gameState.solution) {
    setMessage("这组牌没有可行解，换一组试试。", "is-hint");
    return;
  }
  setMessage(`可行解：${gameState.solution}`, "is-hint");
});

if (cardsEl) dealRound();
