from pathlib import Path
from PIL import Image
import shutil,subprocess,json
root=Path(__file__).resolve().parent.parent;out=root/'outputs/旅人手札-Windows';out.mkdir(exist_ok=True);deps=root/'work/windows-deps';source=root/'work/windows-app'
Image.open(source/'icon.png').save(source/'folio.ico',sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
shutil.copyfile(source/'folio.ico',out/'folio.ico');shutil.copyfile(root/'outputs/旅人手札.html',out/'旅人手札.html');shutil.copytree(root/'outputs/owlbear',out/'owlbear',dirs_exist_ok=True,ignore=shutil.ignore_patterns('user-data','__pycache__','src'));shutil.copytree(deps/'python',out/'runtime',dirs_exist_ok=True)
for f in ['Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll']:shutil.copyfile(deps/'lib/net462'/f,out/f)
shutil.copyfile(deps/'build/native/x64/WebView2Loader.dll',out/'WebView2Loader.dll')
for p in deps.rglob('*'):
 if p.is_file() and 'LICENSE' in p.name.upper():shutil.copyfile(p,out/('WebView2-'+p.name))
args=['C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe','/nologo','/target:winexe','/platform:x64','/optimize+','/codepage:65001','/win32manifest:'+str(source/'app.manifest'),'/win32icon:'+str(source/'folio.ico'),'/out:'+str(out/'旅人手札.exe'),'/reference:System.dll','/reference:System.Core.dll','/reference:System.Drawing.dll','/reference:System.Windows.Forms.dll','/reference:System.Web.Extensions.dll','/reference:'+str(out/'Microsoft.Web.WebView2.Core.dll'),'/reference:'+str(out/'Microsoft.Web.WebView2.WinForms.dll'),str(source/'Program.cs')]
r=subprocess.run(args,capture_output=True,text=True,encoding='utf8',errors='replace');print(r.stdout);print(r.stderr);assert r.returncode==0
runtimeInstaller=root/'work/windows-deps/WebView2Installer/MicrosoftEdgeWebView2RuntimeInstallerX64-complete.exe';runtimeInfo=root/'work/v16-runtime-info.json'
if runtimeInstaller.exists() and runtimeInfo.exists():
 import hashlib
 assert hashlib.sha256(runtimeInstaller.read_bytes()).hexdigest()==json.loads(runtimeInfo.read_text(encoding='utf8'))['sha256']
 shutil.copyfile(runtimeInstaller,out/'MicrosoftEdgeWebView2RuntimeInstallerX64.exe')
qa=root/'work/windows-qa';qa.mkdir(exist_ok=True);shutil.copyfile(root/'work/v13-android-code.txt',qa/'phone-code.txt');print('Built Windows EXE', (out/'旅人手札.exe').stat().st_size)
