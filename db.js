"use strict";

/* =================== PENYIMPANAN =================== */
var DB_KEY="bisnisnetra_pos_v1";
function blankDB(){
  return {
    settings:{ usahaName:"", ownerPin:"", phone:"", address:"", setupDone:false },
    products:[], transactions:[], expenses:[], capital:[], assets:[]
  };
}
var db=loadDB();
function loadDB(){
  try{
    var raw=localStorage.getItem(DB_KEY); if(!raw) return blankDB();
    var d=JSON.parse(raw), b=blankDB();
    for(var k in b){ if(!(k in d)) d[k]=b[k]; }
    for(var s in b.settings){ if(!(s in d.settings)) d.settings[s]=b.settings[s]; }
    return d;
  }catch(e){ return blankDB(); }
}
function saveDB(){ try{ localStorage.setItem(DB_KEY,JSON.stringify(db)); }catch(e){ alert("Data gagal disimpan di perangkat."); } }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
