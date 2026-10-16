"""Sign public update metadata. The private key is local-only, never a build input."""
from pathlib import Path
import base64, hashlib, json, sys, datetime
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization

ROOT=Path(__file__).resolve().parent.parent
KEY=ROOT/'work/update-signing/release.pem'
PUB=ROOT/'work/update-public.json'
def init():
    KEY.parent.mkdir(exist_ok=True)
    if not KEY.exists():
        key=rsa.generate_private_key(public_exponent=65537,key_size=3072)
        KEY.write_bytes(key.private_bytes(serialization.Encoding.PEM,serialization.PrivateFormat.PKCS8,serialization.NoEncryption()))
    key=serialization.load_pem_private_key(KEY.read_bytes(),password=None)
    nums=key.public_key().public_numbers()
    enc=lambda n:base64.b64encode(n.to_bytes((n.bit_length()+7)//8,'big')).decode()
    der=base64.b64encode(key.public_key().public_bytes(serialization.Encoding.DER,serialization.PublicFormat.SubjectPublicKeyInfo)).decode()
    xml='<RSAKeyValue><Modulus>'+enc(nums.n)+'</Modulus><Exponent>'+enc(nums.e)+'</Exponent></RSAKeyValue>'
    PUB.write_text(json.dumps({'algorithm':'RSA-SHA256','spki':der,'xml':xml},indent=2),encoding='utf8')
    (ROOT/'work/windows-app/UpdateKey.cs').write_text('internal static class UpdateKey { internal const string Xml = '+json.dumps(xml)+'; }\n',encoding='utf8')
    (ROOT/'work/android-app/src/com/traveler/folio/UpdateKey.java').write_text('package com.traveler.folio;\nfinal class UpdateKey { static final String SPKI = '+json.dumps(der)+'; }\n',encoding='utf8')
    print('Update public key generated; private key stays in work/update-signing (excluded from distribution).')
def sign(payload,dest):
    key=serialization.load_pem_private_key(KEY.read_bytes(),password=None)
    raw=json.dumps(payload,ensure_ascii=False,separators=(',',':'),sort_keys=True).encode()
    signature=key.sign(raw,padding.PKCS1v15(),hashes.SHA256())
    dest=Path(dest);dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps({'payload':base64.b64encode(raw).decode(),'signature':base64.b64encode(signature).decode()},indent=2)+'\n',encoding='utf8')
    print('Signed update manifest:',dest.name)
if __name__=='__main__':
    if sys.argv[1]=='init':init()
    elif sys.argv[1]=='sign':sign(json.loads(Path(sys.argv[2]).read_text(encoding='utf8')),sys.argv[3])
