"""Replace archived drawing code with exact crops of the publisher's original diagrams."""
import json,re,sys,hashlib,html,base64
from pathlib import Path
sys.path.insert(0,str(Path('.cache/pdf-runtime').resolve()))
import pymupdf as fitz
# Reviewed vertical bounds isolate the statement's figure, above any solution text.
figures={'2023-imo-5':(237,361),'2022-usajmo-3':(237,416),'2022-usamo-2':(237,416),'2021-usamo-3':(231,280),'2009-usamo-3':(250,328),'2004-imo-3':(182,238)}
records=json.loads(Path('data/problems.json').read_text());assets={}
for id,(top,bottom) in figures.items():
 year,contest,number=id.split('-');kind='JMO' if contest=='usajmo' else contest.upper()
 source=f'https://web.evanchen.cc/exams/{kind}-{year}-notes.pdf';doc=fitz.open(f'.cache/olympiads/{kind}-{year}.pdf')
 entry=next(t for t in doc.get_toc() if t[1].split(',')[0].endswith(f'{year}/{number}'))
 page=doc[entry[2]-1]
 pieces=[d['rect'] for d in page.get_drawings() if d['rect'].y0>=top and d['rect'].y1<=bottom and d['rect'].width>0]
 pieces += [fitz.Rect(b[:4]) for b in page.get_text('blocks') if b[1]>=top and b[3]<=bottom]
 assert pieces,id
 rect=fitz.Rect(pieces[0])
 for box in pieces[1:]:rect|=box
 rect+=(-3,-3,3,3);assert rect.y0>130 and rect.y1<bottom+4,id
 pix=page.get_pixmap(matrix=fitz.Matrix(3,3),clip=rect,alpha=False)
 path='/diagrams/'+hashlib.sha256((source+f'#statement-figure-{number}').encode()).hexdigest()[:24]+'.svg'
 png=base64.b64encode(pix.tobytes('png')).decode()
 Path('public'+path).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{round(rect.width*1.3)}" height="{round(rect.height*1.3)}" viewBox="0 0 {pix.width} {pix.height}"><image width="{pix.width}" height="{pix.height}" href="data:image/png;base64,{png}"/></svg>')
 pix.save(f'.cache/{id}-figure.png')
 assets[path]={'sourceUrl':source,'page':entry[2],'problem':id,'clip':list(rect),'method':'Exact original statement figure rendered from the published PDF at 3x resolution.'}
 for p in records:
  if p['id']!=id:continue
  if r'\begin{asy}' not in p['problem']:continue
  p['problem']=re.sub(r'\\begin\{asy\}[\s\S]*?\\end\{asy\}',f'<img src="{path}" alt="Original diagram for {year} {contest.upper()} problem {number}">',html.escape(p['problem'],quote=False));p['problemFormat']='html'
Path('data/problems.json').write_text(json.dumps(records,separators=(',',':')))
report_path=Path('data/olympiad-import-report.json');report=json.loads(report_path.read_text());report.setdefault('statementAssets',{}).update(assets);report_path.write_text(json.dumps(report,indent=2))
# Preserve the same repaired statements in cached candidates for subsequent imports.
candidates=Path('.cache/olympiad-candidates.json')
if candidates.exists():
 rows=json.loads(candidates.read_text());by_id={p['id']:p for p in records}
 for p in rows:
  if p['id'] in figures and p.get('archiveName')=='Evan Chen':p['problem']=by_id[p['id']]['problem'];p['problemFormat']='html'
 candidates.write_text(json.dumps(rows))
print('Restored',len(assets),'original statement diagrams.')
