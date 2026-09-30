/**vswr_calculator.js:*/
const C = 299792458;
const cx = (re, im = 0) => ({ re, im });
const add = (a, b) => cx(a.re + b.re, a.im + b.im);
const sub = (a, b) => cx(a.re - b.re, a.im - b.im);
const mul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
const abs = a => Math.hypot(a.re, a.im);
const cf = (a, k = 1, n = 2) => `${(a.re * k).toFixed(n)} ${a.im < 0 ? "−" : "+"} j${Math.abs(a.im * k).toFixed(n)}`;
const sh = x => Number.isFinite(x) ? x.toFixed(3) : "∞";
const $ = id => document.getElementById(id);
const num = id => parseFloat($(id).value);
 
// Transform a load impedance Zload through a lossless line of impedance Z0 over electrical length betalen (rad)
function transformZ(Z0, Zload, betalen) {
  const s = Math.sin(betalen), c = Math.cos(betalen), Z0c = cx(Z0);
  return mul(Z0c, div(add(mul(Zload, cx(c)), cx(0, Z0 * s)), add(mul(Z0c, cx(c)), mul(cx(0, s), Zload))));
}
// Admittance of a shorted stub of impedance Z0 over electrical length betalen (rad)
function stubY(Z0, betalen) {
  const sl = Math.sin(betalen), cl = Math.cos(betalen);
  if (Math.abs(sl) < 1e-12) return { shorted: true, Y: null };
  return { shorted: false, Y: cx(0, -cl / (sl * Z0)) };
}
 
function calc(p) {
  const beta = ln => 2 * Math.PI * p.f / (C * ln.vf);
 
  // Junction 1: line 1 transforms ZL, combined in parallel with stub 1
  const bd1 = beta(p.line1) * p.line1.len;
  const ZA1 = transformZ(p.line1.Z0, p.ZL, bd1);
  const YA1 = div(cx(1), ZA1);
  const bl1 = beta(p.stub1) * p.stub1.len;
  const st1 = stubY(p.stub1.Z0, bl1);
  const Zin1 = st1.shorted ? cx(0, 0) : div(cx(1), add(YA1, st1.Y));
 
  // Junction 2: line 2 transforms Zin1, combined in parallel with stub 2
  const bd2 = beta(p.line2) * p.line2.len;
  const ZA2 = transformZ(p.line2.Z0, Zin1, bd2);
  const YA2 = div(cx(1), ZA2);
  const bl2 = beta(p.stub2) * p.stub2.len;
  const st2 = stubY(p.stub2.Z0, bl2);
 
  let Y2 = null, g, vswr;
  if (st2.shorted) { g = 1; vswr = Infinity; }
  else {
    Y2 = add(YA2, st2.Y);
    const Yf = 1 / p.feed;
    g = abs(div(sub(cx(Yf), Y2), add(cx(Yf), Y2)));
    vswr = g >= 1 ? Infinity : (1 + g) / (1 - g);
  }
 
  const lam = ln => C * ln.vf / p.f;
  return {
    ZA1, Zin1, ZA2, Y2, g, vswr,
    d1: p.line1.len / lam(p.line1), s1: p.stub1.len / lam(p.stub1),
    d2: p.line2.len / lam(p.line2), s2: p.stub2.len / lam(p.stub2),
  };
}
 
function readLines() {
  return {
    line1: { Z0: num("z1"), len: num("l1") / 1000, vf: num("v1") },
    stub1: { Z0: num("z2"), len: num("l2") / 1000, vf: num("v2") },
    line2: { Z0: num("z3"), len: num("l3") / 1000, vf: num("v3") },
    stub2: { Z0: num("z4"), len: num("l4") / 1000, vf: num("v4") },
    feed: num("zf"),
  };
}
 
function update() {
  const msg = $("msg"), out = $("out");
  const L = readLines();
  const flat = [L.line1.Z0, L.line1.len, L.line1.vf, L.stub1.Z0, L.stub1.len, L.stub1.vf,
                L.line2.Z0, L.line2.len, L.line2.vf, L.stub2.Z0, L.stub2.len, L.stub2.vf, L.feed];
  if (flat.some(Number.isNaN)) { msg.textContent = "Fill in all line parameters."; out.innerHTML = ""; return; }
  if (L.line1.Z0 <= 0 || L.stub1.Z0 <= 0 || L.line2.Z0 <= 0 || L.stub2.Z0 <= 0 || L.feed <= 0 ||
      L.line1.vf <= 0 || L.stub1.vf <= 0 || L.line2.vf <= 0 || L.stub2.vf <= 0 ||
      L.line1.len < 0 || L.stub1.len < 0 || L.line2.len < 0 || L.stub2.len < 0) {
    msg.textContent = "Z0 and velocity factors must be positive; lengths cannot be negative."; out.innerHTML = ""; return;
  }
  let rows = "", err = "";
  for (let i = 0; i < 3; i++) {
    const f = num("f" + i), r = num("r" + i), x = num("x" + i);
    if ([f, r, x].some(Number.isNaN) || f <= 0) { err = `Frequency ${i + 1}: enter a positive frequency and a load.`; continue; }
    const res = calc({ f: f * 1e6, ZL: cx(r, x), ...L });
    rows += `<tr><td>${i + 1}</td><td>${f}</td><td>${res.d1.toFixed(4)}</td><td>${res.s1.toFixed(4)}</td>` +
      `<td>${cf(res.Zin1)}</td><td>${res.d2.toFixed(4)}</td><td>${res.s2.toFixed(4)}</td>` +
      `<td>${res.Y2 ? cf(res.Y2, 1000, 3) : "∞ (short)"}</td>` +
      `<td>${res.g.toFixed(4)}</td><td class="hl">${sh(res.vswr)}</td></tr>`;
  }
  msg.textContent = err;
  out.innerHTML = rows;
}
 
function pick(minId, maxId, decimals) {
  let lo = num(minId), hi = num(maxId);
  if (Number.isNaN(lo) || Number.isNaN(hi)) return null;
  if (lo > hi) [lo, hi] = [hi, lo];
  const v = lo + Math.random() * (hi - lo);
  return Number(v.toFixed(decimals));
}
function randomize() {
  const targets = [["z1", "z1min", "z1max", 1], ["l1", "l1min", "l1max", 1],
                   ["z2", "z2min", "z2max", 1], ["l2", "l2min", "l2max", 1],
                   ["z3", "z3min", "z3max", 1], ["l3", "l3min", "l3max", 1],
                   ["z4", "z4min", "z4max", 1], ["l4", "l4min", "l4max", 1],
                   ["zf", "zfmin", "zfmax", 1]];
  for (const [id, mn, mx, d] of targets) {
    const v = pick(mn, mx, d);
    if (v === null) { $("msg").textContent = "Fill in every range before randomizing."; return; }
    if ((id[0] === "z") && (Math.min(num(mn), num(mx)) <= 0)) { $("msg").textContent = "Z0 ranges must be above 0."; return; }
    if ((id[0] === "l") && (Math.min(num(mn), num(mx)) < 0)) { $("msg").textContent = "Length ranges cannot be negative."; return; }
    $(id).value = v;
  }
  update();
}
 
function worstCase() {
  const msg = $("msg"), keys = ["z1", "l1", "z2", "l2", "z3", "l3", "z4", "l4", "zf"], rg = {};
  for (const k of keys) {
    let lo = num(k + "min"), hi = num(k + "max");
    if (Number.isNaN(lo) || Number.isNaN(hi)) { msg.textContent = "Fill in every range first."; return; }
    if (lo > hi) [lo, hi] = [hi, lo];
    if (k[0] === "z" && lo <= 0) { msg.textContent = "Z0 ranges must be above 0."; return; }
    if (k[0] === "l" && lo < 0) { msg.textContent = "Length ranges cannot be negative."; return; }
    rg[k] = [lo, hi];
  }
  const vf = { v1: num("v1"), v2: num("v2"), v3: num("v3"), v4: num("v4") };
  const pts = [0, 1, 2].map(i => ({ i, f: num("f" + i), r: num("r" + i), x: num("x" + i) }))
    .filter(p => [p.f, p.r, p.x].every(Number.isFinite) && p.f > 0);
  if (!pts.length || Object.values(vf).some(v => !(v > 0))) { msg.textContent = "Enter valid frequencies, loads and velocity factors."; return; }
  msg.textContent = "";
 
  const toLines = s => ({
    line1: { Z0: s.z1, len: s.l1 / 1000, vf: vf.v1 }, stub1: { Z0: s.z2, len: s.l2 / 1000, vf: vf.v2 },
    line2: { Z0: s.z3, len: s.l3 / 1000, vf: vf.v3 }, stub2: { Z0: s.z4, len: s.l4 / 1000, vf: vf.v4 },
    feed: s.zf,
  });
  const score = s => {
    let best = { v: 0, i: -1 };
    for (const p of pts) {
      const r = calc({ f: p.f * 1e6, ZL: cx(p.r, p.x), ...toLines(s) });
      if (r.vswr > best.v) best = { v: r.vswr, i: p.i };
    }
    return best;
  };
  const rnd = k => rg[k][0] + Math.random() * (rg[k][1] - rg[k][0]);
  let bestS = null, best = { v: -1 };
  for (let n = 0; n < 20000; n++) {                       // random search
    const s = {}; keys.forEach(k => s[k] = rnd(k));
    const sc = score(s);
    if (sc.v > best.v) { best = sc; bestS = s; }
  }
  const N = 6000;
  for (let n = 0; n < N && Number.isFinite(best.v); n++) { // local refinement
    const w = 0.1 * Math.pow(1 - n / N, 3) + 1e-9, s = { ...bestS };
    keys.forEach(k => {
      if (Math.random() < 0.5) {
        const span = rg[k][1] - rg[k][0];
        s[k] = Math.min(rg[k][1], Math.max(rg[k][0], s[k] + (Math.random() * 2 - 1) * w * span));
      }
    });
    const sc = score(s);
    if (sc.v > best.v) { best = sc; bestS = s; }
  }
  ["z1", "l1", "z2", "l2", "z3", "l3", "z4", "l4", "zf"].forEach(k => { $(k).value = +bestS[k].toFixed(k[0] === "l" ? 3 : 1); });
  update();
  const vtxt = Number.isFinite(best.v) ? best.v.toFixed(2) : "∞ (a stub shorts a junction)";
  $("worstout").innerHTML = `Biggest VSWR found: <b>${vtxt}</b> at frequency ${best.i + 1} (${num("f" + best.i)} MHz).<br>` +
    `Line1 ${$("z1").value} Ω, ${$("l1").value} mm · Stub1 ${$("z2").value} Ω, ${$("l2").value} mm · ` +
    `Line2 ${$("z3").value} Ω, ${$("l3").value} mm · Stub2 ${$("z4").value} Ω, ${$("l4").value} mm · ` +
    `Feed ${$("zf").value} Ω. Values loaded into the inputs above.`;
}
 
$("calc").addEventListener("click", update);
$("rand").addEventListener("click", randomize);
$("worst").addEventListener("click", worstCase);
update();
/**
The code is organised as follows:

calc(p) does the physics: it moves the load to the junction, adds the shorted-stub admittance, and returns |Γ| and the VSWR on the feed line and the load line.
update() reads the inputs, validates them, and rebuilds the results table.
randomize() and pick() fill the line inputs with random values from your ranges.
worstCase() runs the random search plus local refinement for the biggest VSWR.
The file expects the element IDs used in vswr_calculator.html, so keep the two files together.
 */
