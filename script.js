pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

const KEYWORDS = [
  "salary","notice","termination","penalty","bond",
  "liability","refund","bonus","fine","charges"
];

async function extractText(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    content.items.forEach(it => text += it.str + " ");
  }
  return normalize(text);
}

function normalize(t) {
  return t.replace(/\s+/g, " ").trim();
}

function sentences(t) {
  return t.split(". ")
    .map(s => s.trim())
    .filter(s => s.length > 20);
}

function similarity(a, b) {
  const aw = new Set(a.split(" "));
  const bw = new Set(b.split(" "));
  let match = 0;
  aw.forEach(w => bw.has(w) && match++);
  return match / Math.max(aw.size, bw.size);
}

function detectNumbers(t) {
  return t.match(/\b₹?\d+(\.\d+)?%?\b/g) || [];
}

async function compare() {
  const f1 = pdf1.files[0];
  const f2 = pdf2.files[0];
  if (!f1 || !f2) return alert("Select both PDFs");

  left.innerHTML = right.innerHTML = "Processing…";
  summary.innerHTML = "";

  const t1 = await extractText(f1);
  const t2 = await extractText(f2);

  const s1 = sentences(t1);
  const s2 = sentences(t2);

  let added = 0, removed = 0, modified = 0;

  const only = document.getElementById("onlyChanges").checked;

  left.innerHTML = "";
  right.innerHTML = "";

  s1.forEach(a => {
    let best = s2.find(b => similarity(a, b) > 0.8);
    if (!best) {
      removed++;
      left.innerHTML += `<div class="removed">${a}</div>`;
      if (!only) right.innerHTML += `<div></div>`;
    } else if (a !== best) {
      modified++;
      left.innerHTML += `<div class="modified">${a}</div>`;
      right.innerHTML += `<div class="modified">${best}</div>`;
    } else if (!only) {
      left.innerHTML += `<div>${a}</div>`;
      right.innerHTML += `<div>${best}</div>`;
    }
  });

  s2.forEach(b => {
    if (!s1.find(a => similarity(a, b) > 0.8)) {
      added++;
      right.innerHTML += `<div class="added">${b}</div>`;
      if (!only) left.innerHTML += `<div></div>`;
    }
  });

  const nums = [...new Set([...detectNumbers(t1), ...detectNumbers(t2)])];
  const hits = KEYWORDS.filter(k => t1.includes(k) || t2.includes(k));

  summary.innerHTML = `
    Added: ${added} |
    Removed: ${removed} |
    Modified: ${modified}<br>
    Keywords: ${hits.join(", ") || "None"}<br>
    Numbers detected: ${nums.join(", ") || "None"}
  `;
}
