pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

async function extractText(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    content.items.forEach(item => {
      text += item.str + " ";
    });
  }
  return text;
}

function diffText(a, b) {
  const aWords = a.split(" ");
  const bWords = b.split(" ");

  let result = "";
  bWords.forEach(word => {
    if (!aWords.includes(word)) {
      result += "+ " + word + "\n";
    }
  });

  return result || "No differences found";
}

async function compare() {
  const f1 = document.getElementById("pdf1").files[0];
  const f2 = document.getElementById("pdf2").files[0];

  if (!f1 || !f2) {
    alert("Select both PDFs");
    return;
  }

  const t1 = await extractText(f1);
  const t2 = await extractText(f2);

  document.getElementById("output").innerText =
    diffText(t1, t2);
}
