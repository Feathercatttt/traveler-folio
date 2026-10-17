from pathlib import Path
import shutil,subprocess,uuid,json
R=Path.cwd();W=R/'work';WIN=R/'outputs/旅人手札-Windows';root=W/('windows-qa-lifecycle26-'+uuid.uuid4().hex[:8]);root.mkdir();(root/'owlbear').mkdir();other=root/'other-folder';other.mkdir()
shutil.copytree(WIN/'runtime',root/'runtime')
for folder in [root/'owlbear',other]:
 for name in ['server.py','transfer_service.py','once_service18.py','plugin-version.json']:shutil.copyfile(R/'outputs/owlbear'/name,folder/name)
(other/'plugin-version.json').write_text('{"version":"0.23.0","protocol":"0.21"}',encoding='utf8')
for p in WIN.glob('*.dll'):shutil.copyfile(p,root/p.name)
refs=['System','System.Core','System.Management','System.Drawing','System.Windows.Forms','System.Web.Extensions']
args=['C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe','/nologo','/target:exe','/platform:x64','/codepage:65001','/main:BridgeLifecycleQA27','/out:'+str(root/'test.exe'),*['/reference:'+x+'.dll' for x in refs],*['/reference:'+str(root/n) for n in ['Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll']],*[str(W/'windows-app'/n) for n in ['Program.cs','Updates.cs','UpdateProtocol.cs','UpdateKey.cs','BridgeLifecycle24.cs']],str(W/'BridgeLifecycleQA27.cs')]
r=subprocess.run(args,capture_output=True,text=True,encoding='utf8',errors='replace');assert r.returncode==0,r.stderr+r.stdout
r=subprocess.run([str(root/'test.exe'),str(root),str(other)],timeout=90,capture_output=True);detail=(root/'lifecycle-result.txt').read_text(encoding='utf-8-sig');assert r.returncode==0,detail;assert detail.startswith('PASS:'),detail
report={'success':True,'checks':['An actual old Folio service in the same installation folder is stopped and replaced with v0.25','A service from a different folder is rejected and kept running'],'errors':[]};(W/'v27-lifecycle-report.json').write_text(json.dumps(report,indent=2),encoding='utf8');print(detail)
