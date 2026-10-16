
param([switch]$NoOpen,[int]$TestProcessId=0,[int]$TestSeconds=0,[string]$AuditPath='')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Windows.Forms -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
using System.Windows.Forms;
public static class FolioNative6 {
 public delegate bool EnumProc(IntPtr h,IntPtr p);
 [StructLayout(LayoutKind.Sequential)] public struct Rect {public int Left,Top,Right,Bottom;}
 [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h,out Rect r);
 [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb,IntPtr p);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h,StringBuilder b,int n);
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);
 [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
 [DllImport("user32.dll",EntryPoint="GetWindowLongPtrW")] static extern IntPtr GetLong64(IntPtr h,int i);
 [DllImport("user32.dll",EntryPoint="GetWindowLongW")] static extern int GetLong32(IntPtr h,int i);
 [DllImport("user32.dll",EntryPoint="SetWindowLongPtrW")] static extern IntPtr SetLong64(IntPtr h,int i,IntPtr v);
 [DllImport("user32.dll",EntryPoint="SetWindowLongW")] static extern int SetLong32(IntPtr h,int i,int v);
 public static long GetStyle(IntPtr h){return IntPtr.Size==8?GetLong64(h,-20).ToInt64():GetLong32(h,-20);}
 public static void SetStyle(IntPtr h,long v){if(IntPtr.Size==8)SetLong64(h,-20,new IntPtr(v));else SetLong32(h,-20,(int)v);}
 [DllImport("user32.dll")] public static extern bool SetLayeredWindowAttributes(IntPtr h,uint key,byte alpha,uint flags);
 [DllImport("user32.dll")] public static extern bool GetLayeredWindowAttributes(IntPtr h,out uint key,out byte alpha,out uint flags);
 [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h,IntPtr after,int x,int y,int w,int z,uint flags);
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
 [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h,int cmd);
 [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h,uint msg,IntPtr w,IntPtr l);
 [DllImport("user32.dll",SetLastError=true)] public static extern bool RegisterHotKey(IntPtr h,int id,uint modifiers,uint key);
 [DllImport("user32.dll")] public static extern bool UnregisterHotKey(IntPtr h,int id);
 public static string Title(IntPtr h){var b=new StringBuilder(2048);GetWindowText(h,b,b.Capacity);return b.ToString();}
}
public sealed class FolioHotkey6 : NativeWindow,IDisposable {
 public Action Activated;
 public bool Registered;
 public int HotkeyError;
 public string Shortcut;
 public FolioHotkey6(){var p=new CreateParams();p.Caption="FolioQuickHotkey";p.Parent=new IntPtr(-3);CreateHandle(p);Registered=FolioNative6.RegisterHotKey(Handle,606,0x4003,0x51);Shortcut="Ctrl+Alt+Q";if(!Registered){Registered=FolioNative6.RegisterHotKey(Handle,606,0x4007,0x51);Shortcut="Ctrl+Alt+Shift+Q";}HotkeyError=Registered?0:Marshal.GetLastWin32Error();}
 protected override void WndProc(ref Message m){if(m.Msg==0x312&&m.WParam.ToInt32()==606&&Activated!=null)Activated();base.WndProc(ref m);}
 public void Dispose(){FolioNative6.UnregisterHotKey(Handle,606);DestroyHandle();}
}
'@
$script:folioTracked=@{}
$script:folioAudit=New-Object System.Collections.Generic.List[object]
$script:folioExit=$false
$script:folioStarted=Get-Date
$folioCreated=$false
$folioMutex=New-Object System.Threading.Mutex($true,'Local\AdventurerFolioDesktop6',[ref]$folioCreated)
$folioHtml=Join-Path $PSScriptRoot '旅人手札.html'
if(-not $folioCreated){
 if(-not $NoOpen -and (Test-Path -LiteralPath $folioHtml)){Start-Process -FilePath $folioHtml}
 $folioMutex.Dispose()
 exit
}
function Restore-FolioWindows {
 foreach($record in @($script:folioTracked.Values)){
  $windowHandle=[IntPtr]$record.Handle
  if(-not [FolioNative6]::IsWindow($windowHandle)){continue}
  $ownerProcess=[uint32]0
  [void][FolioNative6]::GetWindowThreadProcessId($windowHandle,[ref]$ownerProcess)
  if($ownerProcess -ne $record.ProcessId){continue}
  if(-not ([FolioNative6]::Title($windowHandle)).StartsWith('旅人手札 · 桌面速查 · ')){continue}
  $styleNow=[FolioNative6]::GetStyle($windowHandle)
  if(($record.Style -band 0x80000) -ne 0){
   [FolioNative6]::SetStyle($windowHandle,($styleNow -bor 0x80000))
   if($record.AlphaKnown){[void][FolioNative6]::SetLayeredWindowAttributes($windowHandle,$record.ColorKey,$record.OriginalAlpha,$record.Flags)}
  }else{[FolioNative6]::SetStyle($windowHandle,($styleNow -band (-bnot 0x80000)))}
  $order=if(($record.Style -band 8) -ne 0){[IntPtr](-1)}else{[IntPtr](-2)}
  [void][FolioNative6]::SetWindowPos($windowHandle,$order,0,0,0,0,0x13)
 }
}
$folioContext=New-Object System.Windows.Forms.ApplicationContext
$folioTray=New-Object System.Windows.Forms.NotifyIcon
$folioTray.Icon=[System.Drawing.SystemIcons]::Information
$folioTray.Text='旅人手札桌面浮窗 · Ctrl+Alt+Q唤回'
$folioTray.Visible=$true
$folioMenu=New-Object System.Windows.Forms.ContextMenuStrip
$folioHint=$folioMenu.Items.Add('Ctrl+Alt+Q：唤回 / 展开浮窗')
$folioHint.Enabled=$false
$folioQuit=$folioMenu.Items.Add('退出桌面助手')
$folioQuit.add_Click({$script:folioExit=$true})
$folioTray.ContextMenuStrip=$folioMenu
$folioHotkey=New-Object FolioHotkey6
$folioTray.Text=if($folioHotkey.Registered){"旅人手札桌面浮窗 · "+$folioHotkey.Shortcut+"唤回"}else{"旅人手札桌面浮窗 · 双击托盘图标唤回"}
$folioHint.Text=if($folioHotkey.Registered){$folioHotkey.Shortcut+"：唤回 / 展开浮窗"}else{"快捷键被占用；双击托盘图标唤回"}
$folioHotkey.Activated=[Action]{
 if($AuditPath){$script:folioAudit.Add(@{HotkeyActivated=$true})}
 foreach($record in @($script:folioTracked.Values)){
  $windowHandle=[IntPtr]$record.Handle
  if([FolioNative6]::IsWindow($windowHandle) -and ([FolioNative6]::Title($windowHandle)).StartsWith('旅人手札 · 桌面速查 · ')){
   [void][FolioNative6]::ShowWindow($windowHandle,9)
   [void][FolioNative6]::SetWindowPos($windowHandle,[IntPtr]::Zero,0,0,$record.ExpandedWidth,$record.ExpandedHeight,0x16)
   [void][FolioNative6]::SetForegroundWindow($windowHandle)
   [void][FolioNative6]::PostMessage($windowHandle,0x100,[IntPtr]0x78,[IntPtr]0)
   [void][FolioNative6]::PostMessage($windowHandle,0x101,[IntPtr]0x78,[IntPtr]0)
   break
  }
 }
}
$folioTray.add_DoubleClick({$folioHotkey.Activated.Invoke()})
$folioTimer=New-Object System.Windows.Forms.Timer
$folioTimer.Interval=300
$folioTimer.add_Tick({
 if($script:folioExit -or ($TestSeconds -gt 0 -and ((Get-Date)-$script:folioStarted).TotalSeconds -ge $TestSeconds)){$folioTimer.Stop();$folioContext.ExitThread();return}
 try{
  $callback=[FolioNative6+EnumProc]{
   param([IntPtr]$windowHandle,[IntPtr]$unused)
   $caption=[FolioNative6]::Title($windowHandle)
   if($caption -notmatch '^旅人手札 · 桌面速查 · (置顶|不置顶) · (\d{2,3})%'){return $true}
   $pinValue=$Matches[1] -eq '置顶'
   $opacityValue=[Math]::Max(60,[Math]::Min(100,[int]$Matches[2]))
   $ownerProcess=[uint32]0
   [void][FolioNative6]::GetWindowThreadProcessId($windowHandle,[ref]$ownerProcess)
   if($TestProcessId -gt 0){if($ownerProcess -ne $TestProcessId){return $true}}
   else{
    try{$processName=(Get-Process -Id $ownerProcess -ErrorAction Stop).ProcessName}catch{return $true}
    if($processName -notin @('msedge','chrome','firefox','brave','vivaldi','opera')){return $true}
   }
   $key=$windowHandle.ToInt64().ToString()
   if(-not $script:folioTracked.ContainsKey($key)){
    $originalKey=[uint32]0;$originalAlpha=[byte]255;$originalFlags=[uint32]0
    $alphaKnown=[FolioNative6]::GetLayeredWindowAttributes($windowHandle,[ref]$originalKey,[ref]$originalAlpha,[ref]$originalFlags)
    $script:folioTracked[$key]=@{Handle=$windowHandle.ToInt64();ProcessId=$ownerProcess;Style=[FolioNative6]::GetStyle($windowHandle);AlphaKnown=$alphaKnown;ColorKey=$originalKey;OriginalAlpha=$originalAlpha;Flags=$originalFlags;AppliedAlpha=-1;AppliedPin=$null;ExpandedWidth=430;ExpandedHeight=790}
   }
   $record=$script:folioTracked[$key]
   $bounds=New-Object FolioNative6+Rect
   if([FolioNative6]::GetWindowRect($windowHandle,[ref]$bounds) -and ($bounds.Bottom-$bounds.Top) -gt 240){$record.ExpandedWidth=$bounds.Right-$bounds.Left;$record.ExpandedHeight=$bounds.Bottom-$bounds.Top}
   if($record.ProcessId -ne $ownerProcess){$script:folioTracked.Remove($key);return $true}
   $alphaByte=[byte][Math]::Round(255*$opacityValue/100)
   if($record.AppliedAlpha -ne $alphaByte){
    $styleNow=[FolioNative6]::GetStyle($windowHandle)
    [FolioNative6]::SetStyle($windowHandle,($styleNow -bor 0x80000))
    $alphaOK=[FolioNative6]::SetLayeredWindowAttributes($windowHandle,0,$alphaByte,2)
    $record.AppliedAlpha=[int]$alphaByte
   }else{$alphaOK=$true}
   if($record.AppliedPin -ne $pinValue){
    $order=if($pinValue){[IntPtr](-1)}else{[IntPtr](-2)}
    $pinOK=[FolioNative6]::SetWindowPos($windowHandle,$order,0,0,0,0,0x13)
    $record.AppliedPin=$pinValue
   }else{$pinOK=$true}
   if($AuditPath){$script:folioAudit.Add(@{Title=$caption;ProcessId=$ownerProcess;Alpha=[int]$alphaByte;Pin=$pinValue;AlphaOK=$alphaOK;PinOK=$pinOK})}
   return $true
  }
  [void][FolioNative6]::EnumWindows($callback,[IntPtr]::Zero)
  foreach($key in @($script:folioTracked.Keys)){if(-not [FolioNative6]::IsWindow([IntPtr]$script:folioTracked[$key].Handle)){$script:folioTracked.Remove($key)}}
  if($script:folioExit -or ($TestSeconds -gt 0 -and ((Get-Date)-$script:folioStarted).TotalSeconds -ge $TestSeconds)){
   $folioTimer.Stop()
   $folioContext.ExitThread()
  }
 }catch{if($AuditPath){$script:folioAudit.Add(@{Error=$_.Exception.Message})}}
})
if($AuditPath){@{HotkeyHandle=$folioHotkey.Handle.ToInt64();HotkeyRegistered=$folioHotkey.Registered;Shortcut=$folioHotkey.Shortcut;HotkeyError=$folioHotkey.HotkeyError;Events=@()}|ConvertTo-Json -Depth 3|Set-Content -LiteralPath $AuditPath -Encoding UTF8}
try{
 if(-not $NoOpen -and (Test-Path -LiteralPath $folioHtml)){Start-Process -FilePath $folioHtml}
 $folioTimer.Start()
 [System.Windows.Forms.Application]::Run($folioContext)
}finally{
 $folioTimer.Stop()
 Restore-FolioWindows
 if($AuditPath){@{HotkeyHandle=$folioHotkey.Handle.ToInt64();HotkeyRegistered=$folioHotkey.Registered;Shortcut=$folioHotkey.Shortcut;HotkeyError=$folioHotkey.HotkeyError;Events=$script:folioAudit.ToArray()}|ConvertTo-Json -Depth 6|Set-Content -LiteralPath $AuditPath -Encoding UTF8}
 $folioHotkey.Dispose()
 $folioTimer.Dispose()
 $folioTray.Visible=$false
 $folioTray.Dispose()
 $folioMenu.Dispose()
 $folioContext.Dispose()
 $folioMutex.ReleaseMutex()
 $folioMutex.Dispose()
}
