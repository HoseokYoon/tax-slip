from pypdf import PdfReader
import re, json, os

PDF_PATH = os.path.join("private", "master.pdf")

# 공백/줄바꿈 제거 후 매칭할 패턴(붙은 문자열 기준)
name_re = re.compile(r"성명([가-힣]{2,10})")
dob_re  = re.compile(r"주민등록번호(\d{6})-")

reader = PdfReader(PDF_PATH)
page_map = {}

for i, page in enumerate(reader.pages):
    text = page.extract_text() or ""
    compact = re.sub(r"\s+", "", text)  # ★ 핵심: 모든 공백/줄바꿈 제거

    nm = name_re.search(compact)
    dm = dob_re.search(compact)

    if nm and dm:
        name = nm.group(1)
        dob = dm.group(1)
        page_map[f"{name}|{dob}"] = i

print(f"Mapped: {len(page_map)} / {len(reader.pages)} pages")

out_path = os.path.join("private", "page_map.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(page_map, f, ensure_ascii=False, indent=2)

print("Wrote:", out_path)
