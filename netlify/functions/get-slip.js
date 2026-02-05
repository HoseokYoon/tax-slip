const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

function normalizeName(v) {
  return (v || "").replace(/\s+/g, "").trim();
}
function normalizeDob(v) {
  return (v || "").replace(/\D/g, "").slice(0, 6);
}

exports.handler = async (event) => {
  try {
    const name = normalizeName(event.queryStringParameters?.name);
    const dob = normalizeDob(event.queryStringParameters?.dob);

    if (!name || dob.length !== 6) {
      return { statusCode: 400, body: "Bad Request" };
    }

    // page map 로드
    const mapPath = path.join(process.cwd(), "private", "page_map.json");
    const pageMap = JSON.parse(fs.readFileSync(mapPath, "utf8"));

    const key = `${name}|${dob}`;
    const pageIndex = pageMap[key];

    if (pageIndex === undefined) {
      return { statusCode: 404, body: "Not Found" };
    }

    // 원본 PDF 로드
    const masterPath = path.join(process.cwd(), "private", "master.pdf");
    const masterBytes = fs.readFileSync(masterPath);

    // 해당 페이지만 추출
    const src = await PDFDocument.load(masterBytes);
    const out = await PDFDocument.create();

    const [copied] = await out.copyPages(src, [pageIndex]);
    out.addPage(copied);

    const outBytes = await out.save();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
      },
      body: Buffer.from(outBytes).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (e) {
    return { statusCode: 500, body: "Server Error" };
  }
};
