package com.traveler.folio;
public final class NativeContract16 {
 public static void main(String[] args) throws Exception {
  String good="http://192.168.1.5:17633/t/abcdefghijklmnopqrstuvwxyzABCDEF/";if(!LanTransfer16.validate(good).equals(good))throw new AssertionError("Valid LAN URL rejected");
  String[] invalid={"https://192.168.1.5:17633/t/abcdefghijklmnopqrstuvwxyzABCDEF/","http://127.0.0.1:17633/t/abcdefghijklmnopqrstuvwxyzABCDEF/","http://8.8.8.8:17633/t/abcdefghijklmnopqrstuvwxyzABCDEF/","http://localhost:17633/t/abcdefghijklmnopqrstuvwxyzABCDEF/","http://user@192.168.1.5:17633/t/abcdefghijklmnopqrstuvwxyzABCDEF/","http://192.168.1.5:17633/t/abcdefghijklmnopqrstuvwxyzABCDEF/?next=secret","http://192.168.1.5:17633/api/state","http://192.168.1.5:17633/t/abcdefghijklmnopqrstuvwxyzABCDEF/../state","http://010.0.0.1:17633/t/abcdefghijklmnopqrstuvwxyzABCDEF/"};for(String url:invalid){try{LanTransfer16.validate(url);throw new AssertionError("Unsafe URL accepted");}catch(AssertionError e){throw e;}catch(Exception expected){}}
  System.out.println("Native LAN contract: valid private handoff accepted; nine non-handoff/public/ambiguous URLs rejected.");
 }
}
