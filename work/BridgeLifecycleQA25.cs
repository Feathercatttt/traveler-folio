using System;using System.IO;using System.Net;using System.Diagnostics;using System.Reflection;using System.Threading;
internal static class BridgeLifecycleQA25 {
 static string Session(){using(var c=new WebClient()){c.Proxy=null;return c.DownloadString("http://localhost:17764/api/session");}}
 static Process Start(string root,string script){var p=Process.Start(new ProcessStartInfo(Path.Combine(root,"runtime","python.exe"),"\""+script+"\" --port 17764 --data-dir \""+Path.Combine(root,"bridge-data")+"\""){UseShellExecute=false,CreateNoWindow=true,WindowStyle=ProcessWindowStyle.Hidden});for(int n=0;n<50;n++){try{if(Session().Contains("0.23.0"))return p;}catch{}Thread.Sleep(100);}throw new Exception("Legacy fixture did not start");}
 static void Main(string[] args){string root=args[0],other=args[1],report=Path.Combine(root,"lifecycle-result.txt");Process old=null,foreign=null;try{
  Program.BaseDir=root;Program.DataDir=Path.Combine(root,"data");Directory.CreateDirectory(Program.DataDir);Program.BaseUrl="http://localhost:17764";Program.Testing=true;
  string version=Path.Combine(root,"owlbear","plugin-version.json");File.WriteAllText(version,"{\"version\":\"0.23.0\",\"protocol\":\"0.21\"}");old=Start(root,Path.Combine(root,"owlbear","server.py"));File.WriteAllText(version,"{\"version\":\"0.25.1\",\"protocol\":\"0.21\"}");
  var start=typeof(Program).GetMethod("StartBridge",BindingFlags.Static|BindingFlags.NonPublic);start.Invoke(null,null);if(!old.HasExited||!Session().Contains("0.25.1"))throw new Exception("Stale own-folder bridge was reused");Program.OwnedBridge.Kill();Program.OwnedBridge.WaitForExit(5000);Program.OwnedBridge.Dispose();Program.OwnedBridge=null;
  foreign=Start(root,Path.Combine(other,"server.py"));bool rejected=false;try{start.Invoke(null,null);}catch(TargetInvocationException e){rejected=e.InnerException.Message.Contains("旧版本地插件");}if(!rejected||foreign.HasExited)throw new Exception("A different folder's process was stopped or accepted");
  File.WriteAllText(report,"PASS: same-folder stale plugin replaced; unrelated folder rejected without stopping it");
 }catch(Exception e){File.WriteAllText(report,e.ToString());Environment.ExitCode=1;}finally{foreach(var p in new[]{old,foreign,Program.OwnedBridge})if(p!=null)try{if(!p.HasExited)p.Kill();p.WaitForExit(5000);}catch{}}}
}
