from pathlib import Path
import subprocess,tempfile,json
R=Path.cwd();W=R/'work';root=Path(tempfile.mkdtemp(prefix='cleanup28-',dir=W));target=root/'app';job=root/'update';target.mkdir();job.mkdir()
names=json.loads((W/'retire-docs28.json').read_text(encoding='utf8'))
for n in names:(target/n).write_text('legacy',encoding='utf8')
for n in ['使用说明.txt','LICENSE.txt','我写的村规.txt','v0.99我的笔记.txt']:(target/n).write_text('preserve',encoding='utf8')
source=root/'Harness.cs';source.write_text('using System;class Harness{static void Main(string[] args){Updater.RetireLegacyDocs28(args[0],args[1]);}}',encoding='utf8')
exe=root/'Harness.exe';cmd=['C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe','/nologo','/target:exe','/main:Harness','/codepage:65001','/out:'+str(exe),*[ '/reference:'+r for r in ['System.dll','System.Core.dll','System.Windows.Forms.dll','System.Drawing.dll','System.Web.Extensions.dll','System.IO.Compression.dll','System.IO.Compression.FileSystem.dll']],str(source),*[str(W/'windows-app'/n) for n in ['Updater.cs','UpdateProtocol.cs','UpdateKey.cs','LegacyFiles28.cs']]]
r=subprocess.run(cmd,capture_output=True);assert r.returncode==0,r.stdout.decode('utf8','replace');subprocess.run([str(exe.resolve()),str(target.resolve()),str(job.resolve())],check=True)
assert all(not (target/n).exists() and (job/'retired-guides28'/n).read_text()=='legacy' for n in names)
assert len(list(target.iterdir()))==4
report={'success':True,'checks':['Compiled actual Windows updater retires only '+str(len(names))+' named legacy guide files and retains backup copies','Current guide, licenses and user-created rules/text files remain untouched']};(W/'v29-cleanup-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print(report)
