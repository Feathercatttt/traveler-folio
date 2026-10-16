from pathlib import Path
import urllib.request,xml.etree.ElementTree as ET,json,hashlib,zipfile,concurrent.futures,time
root=Path('work/android-sdk').resolve();root.mkdir(parents=True,exist_ok=True);repo=ET.fromstring(Path('work/android-repository.xml').read_bytes());jobs=[]
for package,target in [('platforms;android-36','platforms/android-36'),('build-tools;36.0.0','build-tools/36.0.0'),('platform-tools','platform-tools')]:
 p=next(p for p in repo.findall('remotePackage') if p.get('path')==package)
 a=next(a for a in p.findall('archives/archive') if a.findtext('host-os') in (None,'windows'))
 jobs.append((package,target,a.findtext('complete/url'),a.findtext('complete/checksum')))
def get(job):
 package,target,url,sha=job;dest=root/'downloads'/url;dest.parent.mkdir(exist_ok=True)
 if not dest.exists() or hashlib.sha1(dest.read_bytes()).hexdigest()!=sha:
  tmp=dest.with_suffix('.part');urllib.request.urlretrieve('https://dl.google.com/android/repository/'+url,tmp);assert hashlib.sha1(tmp.read_bytes()).hexdigest()==sha;tmp.replace(dest)
 with zipfile.ZipFile(dest) as z:
  names=[s for s in z.namelist() if s and not s.endswith('/')];prefix=names[0].split('/')[0]+'/'
  folder=root/target;folder.mkdir(parents=True,exist_ok=True)
  for name in names:
   relative=name.removeprefix(prefix);output=(folder/relative).resolve();assert output.is_relative_to(folder.resolve());output.parent.mkdir(parents=True,exist_ok=True);output.write_bytes(z.read(name))
 print('Ready '+package,flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as e:list(e.map(get,jobs))
(root/'download-evidence.json').write_text(json.dumps({'officialRepository':'https://dl.google.com/android/repository/repository2-3.xml','packages':jobs},indent=2),encoding='utf8')
