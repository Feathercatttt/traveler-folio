from pathlib import Path
import urllib.request,json,zipfile,io
root=Path('work/windows-deps').resolve();root.mkdir(parents=True,exist_ok=True)
meta=json.load(urllib.request.urlopen('https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/index.json',timeout=40));stable=[v for v in meta['versions'] if '-' not in v];version=stable[-1]
url=f'https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/{version}/microsoft.web.webview2.{version}.nupkg';data=urllib.request.urlopen(url,timeout=60).read();(root/'webview2.nupkg').write_bytes(data)
with zipfile.ZipFile(io.BytesIO(data)) as z:
 for name in z.namelist():
  if name.endswith('/'):continue
  if name.startswith('lib/net462/') or name=='build/native/x64/WebView2Loader.dll' or 'LICENSE' in name.upper():
   dest=root/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(z.read(name))
print('WebView2 SDK '+version,flush=True)
rawpage=urllib.request.urlopen('https://www.python.org/downloads/windows/',timeout=40).read();import gzip
page=(gzip.decompress(rawpage) if rawpage[:2]==b'\x1f\x8b' else rawpage).decode('utf8')
import re
urls=re.findall(r'href="(https://www.python.org/ftp/python/3\.13\.[0-9]+/python-3\.13\.[0-9]+-embed-amd64.zip)"',page)
url=urls[0];data=urllib.request.urlopen(url,timeout=60).read();(root/'python-embed.zip').write_bytes(data)
folder=root/'python';folder.mkdir(exist_ok=True)
with zipfile.ZipFile(io.BytesIO(data)) as z:z.extractall(folder)
(root/'dependency-versions.json').write_text(json.dumps({'webview2':version,'webview2URL':url.replace(url, f'https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/{version}/microsoft.web.webview2.{version}.nupkg'),'pythonURL':url},indent=2),encoding='utf8')
print('Portable Python '+url.rsplit('/',1)[-1],flush=True)
