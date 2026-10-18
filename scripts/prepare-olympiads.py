"""Prepare HARP's published AoPS proofs and exact pages from Evan Chen's IMO notes.
Requires pymupdf and pypdf. Inputs are cached upstream files, never generated proofs.
"""
import json,re,hashlib,sys,zipfile
from pathlib import Path
sys.path.insert(0,str(Path('.cache/pdf-runtime').resolve()))
import pymupdf as fitz
from pypdf import PdfReader
root=Path.cwd();out=[];skipped=[];assets={}
subject={'algebra':'Algebra','precalculus':'Algebra','number_theory':'Number theory','geometry':'Geometry','counting_and_probability':'Combinatorics'}
def normalize(source):
 source=re.sub(r'(?m)^\s*%.*$','',source)
 # Standard display environments occasionally appear without explicit math delimiters.
 source=re.sub(r'\\begin\{(equation\*?|align\*?|eqnarray\*?)\}([\s\S]*?)\\end\{\1\}',lambda m:'\\[\\begin{aligned}'+m[2]+'\\end{aligned}\\]',source)
 # Process prose separately, preserving every mathematical token.
 rx=r'(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$(?:\\\$|[^$])*?(?<!\\)\$)'
 parts=re.split(rx,source)
 for i in range(0,len(parts),2):
  s=parts[i]
  for command in ['emph','textbf','textit','textnormal','textsf','ts','vocab']:
   s=re.sub(r'\\'+command+r'\{([^{}]*)\}',r'\1',s)
  s=re.sub(r'\\(?:begin|end)\{(?:enumerate|itemize|center)\}(?:\[[^\]]*\])?','\n',s)
  s=re.sub(r'\\(?:item|ii)(?:\[([^\]]*)\])?',lambda m:'\n• '+(m[1]+' ' if m[1] else ''),s)
  s=s.replace('\\dots\\','… ').replace('\\dots','…').replace('\\ldots','…').replace('\\textellipsis','…').replace('~',' ').replace('``','“').replace("''",'”')
  s=re.sub(r'\\(?:noindent|smallskip|medskip|bigskip|par|allowbreak)\b','',s)
  s=s.replace('\\ ',' ').replace('\\\n','\n').replace('\\%', '%').replace('\\&','&')
  parts[i]=s
 return ''.join(parts).strip()
with zipfile.ZipFile('.cache/harp-raw.zip') as archive:
 rows=[json.loads(line) for line in archive.read(archive.namelist()[0]).decode().splitlines()]
for p in rows:
 if p['contest'] not in ['USAJMO','USAMO']:continue
 year=int(p['year']);number=int(p['number']);id=f"{year}-{p['contest'].lower()}-{number}"
 if not 1<=number<=6 or '[asy]' in p['problem']:
  skipped.append({'id':id,'reason':'Statement requires unsupported source diagram or identity'});continue
 sols=[]
 for key,value in p.items():
  if re.fullmatch(r'solution_\d+',key) and isinstance(value,str) and len(value.strip())>30:
   if '[asy]' in value or re.search(r'<img|\\includegraphics',value,re.I):
    skipped.append({'id':id,'solution':key,'reason':'This approach requires unavailable source diagram'});continue
   sols.append({'title':key.replace('_',' ').title(),'content':normalize(value),'format':'text','sourceName':'AoPS archive (HARP)','sourceUrl':p['url']})
 if not sols:skipped.append({'id':id,'reason':'No complete supported solution'});continue
 title=f"{year} {p['contest']} Problems/Problem {number}"
 if not p['url'].endswith(title.replace(' ','_')):
  skipped.append({'id':id,'reason':'Source URL identifies a different exam; excluded'});continue
 out.append(dict(id=id,title=title,contest=p['contest'],year=year,variant='',number=number,topics=[subject[p['subject']]] if p['subject'] in subject else [],problem=normalize(p['problem']),solution=sols[0]['content'],extraSolutions=sols[1:],answer='',sourceUrl=p['url'],archiveSource='HARP',archiveName='AoPS archive (HARP)',archiveUrl=p['url'],topicSource='https://github.com/aadityasingh/HARP',choices=[]))
# Exact subject labels from the author's MOHS table, not keyword inference.
labels={};text='\n'.join(page.extract_text() for page in PdfReader('.cache/mohs-official.pdf').pages)
for m in re.finditer(r'\bIMO\s+(20\d\d)((?:\s+[ACGN]\s+\d+){6})',text):
 labels[int(m[1])]=re.findall(r'([ACGN])\s+\d+',m[2])
topic={'A':'Algebra','C':'Combinatorics','G':'Geometry','N':'Number theory'}
Path('public/proof-pages').mkdir(exist_ok=True)
def flatten(items):
 for item in items:
  if isinstance(item,list):yield from flatten(item)
  else:yield item
for year in range(2020,2027):
 if not Path(f'.cache/olympiads/IMO-{year}.tex').exists() or not Path(f'.cache/olympiads/IMO-{year}.pdf').exists():continue
 tex=Path(f'.cache/olympiads/IMO-{year}.tex').read_text()
 sections=list(re.finditer(r'\\subsection\{IMO\s+'+str(year)+r'/(\d)[^\n]*',tex))
 assert len(sections)==6,(year,'section identity')
 reader=PdfReader(f'.cache/olympiads/IMO-{year}.pdf');doc=fitz.open(f'.cache/olympiads/IMO-{year}.pdf')
 bookmarks=[]
 for item in flatten(reader.outline):
  m=re.match(r'IMO\s+'+str(year)+r'/(\d)',item.title)
  if m:bookmarks.append((int(m[1]),reader.get_destination_page_number(item)))
 assert [n for n,_ in bookmarks]==list(range(1,7)),(year,bookmarks)
 for index,section in enumerate(sections):
  number=int(section[1]);content=tex[section.end():sections[index+1].start() if index+1<6 else len(tex)]
  statement=re.search(r'\\begin\{mdframed\}(?:\[[^\n]*\])?\s*([\s\S]*?)\\end\{mdframed\}',content)
  assert statement,(year,number,'No statement')
  start=bookmarks[index][1];end=bookmarks[index+1][1] if index+1<6 else len(doc)
  assert end>start and str(year) in doc[start].get_text(),(year,number,'Page boundaries')
  images=[];source=f'https://web.evanchen.cc/exams/IMO-{year}-notes.pdf'
  for page in range(start,end):
   name=hashlib.sha256(f'{source}#page={page+1}'.encode()).hexdigest()[:24]+'.svg';path='/proof-pages/'+name
   svg=doc[page].get_svg_image(text_as_path=True)
   # MuPDF emits self-contained paths and internal glyph references only.
   assert '<script' not in svg.lower() and '<foreignobject' not in svg.lower()
   Path('public'+path).write_text(svg);assets[path]={'sourceUrl':source,'page':page+1,'problem':f'{year}-imo-{number}'}
   images.append(f'<img src="{path}" alt="Published solution page {page+1} for IMO {year}, problem {number}">')
  assert year in labels,(year,'Missing published subject labels')
  title=f'{year} IMO Problems/Problem {number}';url='https://artofproblemsolving.com/wiki/index.php/'+title.replace(' ','_')
  out.append(dict(id=f'{year}-imo-{number}',title=title,contest='IMO',year=year,variant='',number=number,topics=[topic[labels[year][number-1]]],problem=re.sub(r'(?<!\n)\n(?!\n)',' ',normalize(statement[1])),solution=''.join(images),solutionFormat='html',answer='',sourceUrl=url,archiveSource='Evan Chen solution notes',archiveName='Evan Chen',archiveUrl=source+'#page='+str(start+1),topicSource='https://web.evanchen.cc/upload/MOHS-hardness.pdf',choices=[]))
Path('.cache/olympiad-candidates.json').write_text(json.dumps(out))
Path('.cache/olympiad-import-report.json').write_text(json.dumps({'sources':['https://github.com/aadityasingh/HARP','https://web.evanchen.cc/problems.html'],'topicSources':['https://github.com/aadityasingh/HARP','https://web.evanchen.cc/upload/MOHS-hardness.pdf'],'method':'Real exam identity and source-number checks. HARP supplies human-authored AoPS proofs. IMO solution pages are exact, self-contained SVG exports of the published PDF; page ranges come from source bookmarks. No generated solutions. Unsupported individual approaches are omitted rather than deleting diagrams.','assets':assets,'skipped':skipped},indent=2))
print('Prepared',len(out),'proof problems;',len(assets),'published solution pages')
