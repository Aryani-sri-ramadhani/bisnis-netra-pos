"use strict";

/* =================== FORMAT =================== */
function rupiah(n){ n=Math.round(n||0); return (n<0?"-Rp ":"Rp ")+Math.abs(n).toLocaleString("id-ID"); }
function pad(n){ return (n<10?"0":"")+n; }
function todayStr(){ var d=new Date(); return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
function monthOf(s){ return (s||"").slice(0,7); }
function thisMonth(){ return todayStr().slice(0,7); }
function namaBulan(ym){ var b=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]; var p=ym.split("-"); return b[parseInt(p[1],10)-1]+" "+p[0]; }
function tglPanjang(s){ var b=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]; var p=s.split("-"); return parseInt(p[2],10)+" "+b[parseInt(p[1],10)-1]+" "+p[0]; }
function addMonth(ym,delta){ var p=ym.split("-"); var d=new Date(parseInt(p[0],10),parseInt(p[1],10)-1+delta,1); return d.getFullYear()+"-"+pad(d.getMonth()+1); }
function cleanPhone(num){ num=String(num||"").replace(/\D/g,""); if(num.charAt(0)==="0") num="62"+num.slice(1); return num; }
function terbilang(n){
  n=Math.round(Math.abs(n)); if(n===0) return "nol";
  var sa=["","satu","dua","tiga","empat","lima","enam","tujuh","delapan","sembilan","sepuluh","sebelas"];
  function w(x){
    if(x<12) return sa[x];
    if(x<20) return w(x-10)+" belas";
    if(x<100){var p=Math.floor(x/10),r=x%10;return sa[p]+" puluh"+(r?" "+sa[r]:"");}
    if(x<200) return "seratus"+(x-100?" "+w(x-100):"");
    if(x<1000){var p=Math.floor(x/100),r=x%100;return sa[p]+" ratus"+(r?" "+w(r):"");}
    if(x<2000) return "seribu"+(x-1000?" "+w(x-1000):"");
    if(x<1000000){var p=Math.floor(x/1000),r=x%1000;return w(p)+" ribu"+(r?" "+w(r):"");}
    if(x<1000000000){var p=Math.floor(x/1000000),r=x%1000000;return w(p)+" juta"+(r?" "+w(r):"");}
    var p=Math.floor(x/1000000000),r=x%1000000000;return w(p)+" miliar"+(r?" "+w(r):"");
  }
  return w(n);
}

/* =================== KERANGKA TAMPILAN =================== */
var app=document.getElementById("app");
function announce(m){ var e=document.getElementById("announce"); e.textContent=""; setTimeout(function(){ e.textContent=m; },60); }
function setHeader(){ document.getElementById("appSub").textContent=db.settings.usahaName||"POS sederhana untuk usaha anggota"; }
/* render memasang isi layar SECARA SINKRON agar tombol langsung dapat perintah; transisi hanya lewat opacity. */
function render(html){
  app.innerHTML=html; setHeader();
  var t=app.querySelector(".screen-title"); if(t){ t.setAttribute("tabindex","-1"); t.focus(); }
  app.style.opacity=0; requestAnimationFrame(function(){ requestAnimationFrame(function(){ app.style.transition="opacity .18s"; app.style.opacity=1; }); });
}
function el(id){ return document.getElementById(id); }
function on(id,ev,fn){ var e=el(id); if(e) e.addEventListener(ev,fn); }
function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function digits(v){ return parseInt(String(v||"").replace(/\D/g,""),10)||0; }
function each(sel,fn){ Array.prototype.forEach.call(app.querySelectorAll(sel),fn); }
