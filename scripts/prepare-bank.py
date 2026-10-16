"""Build an AoPS-derived cache; omit questions requiring unavailable diagrams.
Inputs: amc2k, E2H-AMC, and exact-statement MATH topic matches. No generated math.
"""
import json,re,collections,pathlib,argparse
root=pathlib.Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--input-dir',type=pathlib.Path,required=True,help='Directory containing amc2k.json, e2h-amc.json, and amc-topic-tags.json')
inputs=parser.parse_args().input_dir
amc=json.loads((inputs/'amc2k.json').read_text());e2h=json.loads((inputs/'e2h-amc.json').read_text())
tagfile=json.loads((inputs/'amc-topic-tags.json').read_text());tags=tagfile['tags']
topicmap={'algebra':'Algebra','geometry':'Geometry','number-theory':'Number theory','combinatorics':'Combinatorics'}
label=re.compile(r'\\(?:textbf|text|mathrm|mathbf)\s*\{\s*\(?([A-E])\)?\s*\}|\(([A-E])\)')
def get_answer(solution):
 values=[]
 for box in re.finditer(r'\\(?:boxed|fbox)\s*\{',solution):
  depth=1;i=box.end()
  while i<len(solution) and depth:
   if solution[i]=='{':depth+=1
   if solution[i]=='}':depth-=1
   i+=1
  inside=solution[box.end():i-1]
  plain=re.sub(r'\\(?:textbf|text|mathrm|mathbf|bf)\s*','',inside)
  plain=re.sub(r'[{}\s()]','',plain)
  if re.match(r'^[A-E](?:$|[^A-Za-z])',plain):values.append(plain[0])
 return values[-1] if values and len(set(values))==1 else None
records=[]
for x in amc:
 m=re.search(r'/(\d{4})(_Fall)?_AMC_(10|12)([AB]?)_Problems/Problem_(\d+)$',x['url'])
 if not m or '[asy]' in x['problem'] or '[asy]' in x['solution']:continue
 ans=get_answer(x['solution'])
 if not ans:continue
 year,fall,contest,variant,num=m.groups();title=x['url'].split('index.php/')[1].replace('_',' ')
 p=x['problem'].strip();choices=[]
 # Only separate choice rows when all five standard labels are unambiguous.
 marks=list(label.finditer(p));last=marks[-5:]
 if len(last)==5 and [a.group(1) or a.group(2) for a in last]==list('ABCDE'):
  for i,match in enumerate(last):
   txt=p[match.end():last[i+1].start() if i<4 else len(p)].strip()
   txt=re.sub(r'^(?:\s|}|\\\s|\\[,;:!]|\\quad|\\qquad|\$)+','',txt)
   txt=re.sub(r'(?:\s|\\qquad|\\quad|\$)+$','',txt)
   choices.append({'letter':chr(65+i),'tex':txt})
  p=p[:last[0].start()].rstrip().rstrip('$').rstrip()
 if len(choices)!=5:continue
 topics=[topicmap[tags[x['url']]['topic']]] if x['url'] in tags else []
 records.append(dict(id=f'{year}-{("fall-" if fall else "")}amc{contest}{variant.lower()}-{num}',title=title,contest='AMC '+contest,year=int(year),variant=('Fall ' if fall else '')+variant,number=int(num),topics=topics,problem=p,originalProblem=x['problem'].strip(),solution=x['solution'].strip(),answer=ans,sourceUrl=x['url'],archiveSource='amc2k',choices=choices))
for x in e2h:
 if x['tag']!='AIME' or '[asy]' in x['problem'] or '[asy]' in x['solution'] or not re.fullmatch(r'\d{1,3}',x['answer'].strip()):continue
 year=int(x['year']);number=int(x['index']);variant=x['subtest'] if x['subtest'] in ['I','II'] else ''
 title=f'{year} AIME'+(f' {variant}' if variant else '')+f' Problems/Problem {number}'
 url='https://artofproblemsolving.com/wiki/index.php/'+title.replace(' ','_')
 topics=[topicmap[tags[url]['topic']]] if url in tags else []
 records.append(dict(id=f'{year}-aime{variant.lower()}-{number}',title=title,contest='AIME',year=year,variant=variant,number=number,topics=topics,problem=x['problem'],solution=x['solution'],answer=str(int(x['answer'])),sourceUrl=url,archiveSource='Easy2Hard-Bench',choices=[]))
records=list({x['id']:x for x in records}.values())
records.sort(key=lambda x:(-x['year'],x['contest'],x['variant'],x['number']))
# Known disputed problems are excluded unless their full official key can be fetched.
disputed={'2012-amc12b-12','2015-amc10a-20','2022-aimeii-8'}
records=[r for r in records if r['id'] not in disputed]
for r in records:
 assert r['solution'] and r['problem'] and r['sourceUrl'].startswith('https://artofproblemsolving.com/wiki/')
 assert 1<=r['number']<=(15 if r['contest']=='AIME' else 25)
 assert (r['answer'].isdigit() and 0<=int(r['answer'])<=999) if r['contest']=='AIME' else r['answer'] in 'ABCDE'
(root/'data/problems.json').write_text(json.dumps(records,separators=(',',':')))
cat=[{k:r[k] for k in ['id','title','contest','year','variant','number','topics','sourceUrl']} for r in records]
(root/'public/catalog.json').write_text(json.dumps(cat,separators=(',',':')))
(root/'data/topic-provenance.json').write_text(json.dumps(tagfile,indent=2))
print('Verified cache',len(records),'By contest',dict(collections.Counter(r['contest'] for r in records)))
print('Tagged by contest/topic',dict(collections.Counter((r['contest'],t) for r in records for t in r['topics'])))
print('Years',min(r['year'] for r in records),max(r['year'] for r in records))
