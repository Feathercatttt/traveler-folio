from pathlib import Path
import sys,subprocess,json,zipfile,hashlib,base64,os,time
import importlib.util
spec=importlib.util.spec_from_file_location("update_release20",Path(__file__).with_name("update-release20.py"));mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);sign=mod.sign

ROOT=Path.cwd();W=ROOT/'work';D=W/'v20-update-qa';D.mkdir(exist_ok=True)
CSC='C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe'
refs=['System.dll','System.Core.dll','System.Drawing.dll','System.Windows.Forms.dll','System.Web.Extensions.dll','System.IO.Compression.dll','System.IO.Compression.FileSystem.dll']
def compile(dest,files,extra=[]):
    r=subprocess.run([CSC,'/nologo','/codepage:65001','/out:'+str(dest),*['/reference:'+s for s in refs],*extra,*map(str,files)],capture_output=True)
    if r.returncode:raise RuntimeError(r.stdout.decode('gbk',errors='replace'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def payload(version,win=None,apk=None):
    p={'app':'traveler-folio','schema':1,'version':version,'notes':'安全更新测试，不用于公开发布。'}
    for kind,file in [('windows',win),('android',apk)]:
        if file:
            p[kind]={'url':'https://github.com/Feathercatttt/traveler-folio/releases/download/v'+version+'/'+('TravelerFolio-Windows-Update.zip' if kind=='windows' else 'TravelerFolio-Android.apk'),'size':file.stat().st_size,'sha256':sha(file)}
            if kind=='android':p[kind].update(package='com.traveler.folio',versionCode=23)
    return p
fixture=D/'Fixture.cs';fixture.write_text('using System;using System.IO;class Fixture { [STAThread]static void Main(){File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"restarted.txt"),"ok");}}',encoding='utf8')
compile(D/'fixture.exe',[fixture],['/target:winexe'])
for mode in ['success','rollback']:
    target=D/mode;target.mkdir(exist_ok=True);(target/'owlbear').mkdir(exist_ok=True)
    (target/'旅人手札.exe').write_bytes((D/'fixture.exe').read_bytes());(target/'旅人手札.html').write_text('old html',encoding='utf8');(target/'owlbear/server.py').write_text('old server',encoding='utf8');(target/'zblocked.txt').write_text('old locked',encoding='utf8');(target/'userdata.keep').write_text('character preserved',encoding='utf8')
    z=D/(mode+'.zip')
    with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as f:
        f.write(D/'fixture.exe','TravelerFolio-Update/旅人手札.exe');f.writestr('TravelerFolio-Update/旅人手札.html','new html');f.writestr('TravelerFolio-Update/owlbear/server.py','new server');f.writestr('TravelerFolio-Update/new-file.txt','created');f.writestr('TravelerFolio-Update/zblocked.txt','new locked')
    manifest=D/(mode+'-manifest.json');sign(payload('0.21.1',win=z),manifest)
    (D/(mode+'-job.json')).write_text(json.dumps({'target':str(target),'pid':0,'package':str(z),'manifest':manifest.read_text(encoding='utf8')},ensure_ascii=False),encoding='utf8')
valid=json.loads((D/'success-manifest.json').read_text());raw=bytearray(base64.b64decode(valid['payload']));raw[-2]^=1;valid['payload']=base64.b64encode(raw).decode();(D/'tamper.json').write_text(json.dumps(valid),encoding='utf8')
for name,entry in [('traversal','TravelerFolio-Update/../../escape.txt'),('absolute','/absolute.txt'),('ads','TravelerFolio-Update/file.txt:stream'),('trailing','TravelerFolio-Update/a. /x.txt'),('symlink','TravelerFolio-Update/link')]:
    with zipfile.ZipFile(D/(name+'.zip'),'w') as z:
        info=zipfile.ZipInfo(entry)
        if name=='symlink':info.create_system=3;info.external_attr=0xa1ff<<16
        z.writestr(info,'danger')
harness=D/'Harness.cs';harness.write_text(r'''using System;using System.IO;using System.Collections.Generic;class Harness { static void Must(bool b,string s){if(!b)throw new Exception(s);Console.WriteLine("PASS "+s);}static void Main(string[] args){string d=args[0];var p=UpdateProtocol.Verify(File.ReadAllText(Path.Combine(d,"success-manifest.json")),"windows");Must(UpdateProtocol.Text(p,"version")=="0.21.1","RSA signed manifest cross-language verification");bool rejected=false;try{UpdateProtocol.Verify(File.ReadAllText(Path.Combine(d,"tamper.json")),"windows");}catch{rejected=true;}Must(rejected,"tampered manifest rejected");foreach(string name in new[]{"traversal","absolute","ads","trailing","symlink"}){string stage=Path.Combine(d,"stage-test-"+name);Directory.CreateDirectory(stage);rejected=false;try{Updater.Extract(Path.Combine(d,name+".zip"),stage);}catch{rejected=true;}Must(rejected,"unsafe archive rejected: "+name);}Must(UpdateProtocol.VersionOf("0.21.10")>UpdateProtocol.VersionOf("0.21.2"),"numeric version comparison");Updater.Install(Path.Combine(d,"success-job.json"),s=>{});Must(File.ReadAllText(Path.Combine(d,"success","旅人手札.html"))=="new html","installer applies update");Must(File.ReadAllText(Path.Combine(d,"success","userdata.keep"))=="character preserved","installer preserves unlisted data");using(var locked=new FileStream(Path.Combine(d,"rollback","zblocked.txt"),FileMode.Open,FileAccess.Read,FileShare.Read)){rejected=false;try{Updater.Install(Path.Combine(d,"rollback-job.json"),s=>{});}catch{rejected=true;}Must(rejected,"locked file prevents partial update");}Must(File.ReadAllText(Path.Combine(d,"rollback","旅人手札.html"))=="old html"&&!File.Exists(Path.Combine(d,"rollback","new-file.txt")),"failed update rolls back changed and new files");System.Threading.Thread.Sleep(500);Must(File.Exists(Path.Combine(d,"success","restarted.txt"))&&File.Exists(Path.Combine(d,"rollback","restarted.txt")),"application restarts after update or rollback");}}''',encoding='utf8')
compile(D/'Harness.exe',[harness,*[W/'windows-app'/n for n in ['Updater.cs','UpdateProtocol.cs','UpdateKey.cs']]],['/main:Harness'])
r=subprocess.run([str(D/'Harness.exe'),str(D)],capture_output=True,text=True,encoding='utf8',errors='replace');print(r.stdout);assert r.returncode==0,r.stderr
checks=[s[5:] for s in r.stdout.splitlines() if s.startswith('PASS ')]
apk=ROOT/'outputs/旅人手札-Android.apk';sign(payload('0.21.0',apk=apk),D/'android-manifest.json')
(W/'v21-updater-report.json').write_text(json.dumps({'success':True,'checks':checks,'errors':[]},indent=2),encoding='utf8')
