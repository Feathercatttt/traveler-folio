"""Explicit, expiring LAN handoff. No character API or file system is exposed."""
import ipaddress,json,secrets,socket,socketserver,threading,time,urllib.parse
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from pathlib import Path
MAX_CODE=34*1024*1024
class LocalTransferHTTPServer(ThreadingHTTPServer):
 # HTTPServer otherwise performs a reverse DNS lookup for 0.0.0.0 on Windows.
 # The transfer URLs use actual IP addresses, so a DNS-derived name is unnecessary.
 def server_bind(self):
  socketserver.TCPServer.server_bind(self)
  self.server_name='folio-local-transfer';self.server_port=self.server_address[1]

class TransferService:
 def __init__(self,port):
  self.port=port;self.lock=threading.RLock();self.server=None;self.timer=None;self.clear()
 def clear(self):
  self.token='';self.code='';self.incoming=None;self.expires=0;self.cached_addresses=[]
 def addresses(self):
  found=[]
  try:
   with socket.socket(socket.AF_INET,socket.SOCK_DGRAM) as s:
    s.connect(('192.0.2.1',9));found.append(s.getsockname()[0])
  except OSError:pass
  try:found.extend(x[4][0] for x in socket.getaddrinfo(socket.gethostname(),None,socket.AF_INET))
  except OSError:pass
  return list(dict.fromkeys(a for a in found if ipaddress.ip_address(a).is_private and not ipaddress.ip_address(a).is_loopback))
 def start(self,code):
  if not isinstance(code,str) or not code.startswith(('LS13.G.','LS16.L.')) or len(code)>MAX_CODE:raise ValueError('请先生成有效的互通文件')
  self.stop();owner=self
  class Handler(BaseHTTPRequestHandler):
   def log_message(self,*a):pass
   def send(self,status,body,kind='text/plain; charset=utf-8',download=False):
    if isinstance(body,str):body=body.encode('utf8')
    self.send_response(status);self.send_header('Content-Type',kind);self.send_header('Content-Length',str(len(body)));self.send_header('Cache-Control','no-store');self.send_header('Referrer-Policy','no-referrer');self.send_header('X-Content-Type-Options','nosniff');self.send_header('X-Frame-Options','DENY')
    if download:self.send_header('Content-Disposition','attachment; filename="Traveler-Folio.folio"')
    self.end_headers()
    try:self.wfile.write(body)
    except (BrokenPipeError,ConnectionResetError):pass
   def route(self):
    with owner.lock:
     path=urllib.parse.urlparse(self.path).path
     if not owner.token or time.time()>owner.expires:return None
     prefix='/t/'+owner.token+'/'
     if not path.startswith(prefix):return None
     return path[len(prefix):]
   def do_GET(self):
    route=self.route()
    if route=='':self.send(200,Path(__file__).with_name('transfer.html').read_bytes(),'text/html; charset=utf-8')
    elif route=='download':
     with owner.lock:self.send(200,owner.code,download=True)
    else:self.send(404,'互通链接已结束或无效，请在电脑重新生成二维码。')
   def do_POST(self):
    if self.route()!='upload':self.send(404,'互通链接已失效');return
    origin=self.headers.get('Origin');expected='http://'+self.headers.get('Host','')
    if origin and origin!=expected:self.send(403,'请在扫码打开的页面上传');return
    try:
     size=int(self.headers.get('Content-Length','0'))
     if size<8 or size>MAX_CODE:raise ValueError('文件大小不正确')
     self.connection.settimeout(30);code=self.rfile.read(size).decode('utf-8-sig').strip()
     if not code.startswith(('LS13.G.','LS16.L.')):raise ValueError('请上传手札“保存互通文件”生成的 .folio 文件')
     with owner.lock:
      if self.route()!='upload':raise ValueError('互通已结束')
      if owner.incoming is not None:raise ValueError('已有一份待接收文件，请先在电脑预览或重新开始互通')
      owner.incoming={'id':secrets.token_hex(12),'code':code,'created':time.time()}
     self.send(200,'已传到电脑，等待电脑预览并确认导入。')
    except (ValueError,UnicodeError,TimeoutError):self.send(400,'文件无效、传输未完成或已有待接收文件，请检查电脑后重试。')
  try:
   server=LocalTransferHTTPServer(('0.0.0.0',self.port),Handler);server.daemon_threads=True
  except OSError:raise ValueError('互通端口被占用，请关闭旧版互通或应用后重试')
  with self.lock:
   self.cached_addresses=self.addresses();self.server=server;self.token=secrets.token_urlsafe(24);self.code=code;self.expires=time.time()+20*60
  threading.Thread(target=server.serve_forever,daemon=True).start();self.timer=threading.Timer(20*60,self.stop);self.timer.daemon=True;self.timer.start()
  return self.status()
 def status(self):
  with self.lock:
   active=bool(self.token and time.time()<self.expires)
   return {'active':active,'expires':self.expires,'urls':['http://'+a+':'+str(self.port)+'/t/'+self.token+'/' for a in self.cached_addresses] if active else [],'pending':{'id':self.incoming['id'],'created':self.incoming['created']} if self.incoming else None}
 def receive(self):
  with self.lock:return self.incoming or {}
 def acknowledge(self,uid):
  with self.lock:
   if self.incoming and self.incoming['id']==uid:self.incoming=None
  return {'ok':True}
 def stop(self):
  with self.lock:
   if self.timer:self.timer.cancel();self.timer=None
   server=self.server;self.server=None;self.clear()
  if server:server.shutdown();server.server_close()
  return {'ok':True}
