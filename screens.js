"use strict";

/* =================== MULAI =================== */
function start(){ if(!db.settings.setupDone) setupName(); else home(); }

/* ---------- Pengaturan awal ---------- */
function setupName(){
  render(
    '<h2 class="screen-title">Selamat datang</h2>'+
    '<p class="help">Atur sekali saja untuk memulai.</p>'+
    '<label for="nm">Nama usaha Anda</label>'+
    '<input id="nm" type="text" value="'+esc(db.settings.usahaName)+'" placeholder="contoh: Warung Ayam Geprek Budi" />'+
    '<label for="pin">Buat PIN pemilik (4 sampai 6 angka)</label>'+
    '<input id="pin" type="tel" inputmode="numeric" placeholder="contoh: 1234" />'+
    '<p class="help">PIN melindungi laporan keuangan dan pengaturan.</p>'+
    '<button class="btn primary big" id="next">Lanjut</button>'
  );
  on("next","click",function(){
    var nm=el("nm").value.trim(), pin=el("pin").value.trim();
    if(!nm){ announce("Nama usaha belum diisi."); el("nm").focus(); return; }
    if(!/^[0-9]{4,6}$/.test(pin)){ announce("PIN harus 4 sampai 6 angka."); el("pin").focus(); return; }
    db.settings.usahaName=nm; db.settings.ownerPin=pin; saveDB(); setupProducts();
  });
}
function setupProducts(){
  var list=db.products.length?db.products.map(function(p){return '<div class="list-item">'+esc(p.name)+' — '+rupiah(p.price)+'</div>';}).join(""):'<p class="muted">Belum ada produk.</p>';
  render(
    '<h2 class="screen-title">Daftar produk & harga</h2>'+
    '<p class="help">Masukkan barang atau jasa yang Anda jual. Bisa ditambah kapan saja nanti.</p>'+
    '<div class="card">'+list+'</div>'+
    '<label for="pn">Nama produk atau jasa</label>'+
    '<input id="pn" type="text" placeholder="contoh: Ayam Geprek" />'+
    '<label for="pp">Harga (rupiah)</label>'+
    '<input id="pp" type="tel" inputmode="numeric" placeholder="contoh: 15000" />'+
    '<button class="btn accent" id="add">Tambah produk</button>'+
    '<div class="divider"></div>'+
    '<button class="btn primary big" id="done">Selesai, mulai pakai</button>'
  );
  on("add","click",function(){ var n=el("pn").value.trim(),h=digits(el("pp").value); if(!n||h<=0){announce("Isi nama dan harga dengan benar.");return;} db.products.push({id:uid(),name:n,price:h}); saveDB(); announce("Produk "+n+" ditambahkan, harga "+terbilang(h)+" rupiah."); setupProducts(); });
  on("done","click",function(){ if(db.products.length===0){announce("Tambahkan minimal satu produk dulu."); el("pn").focus(); return;} db.settings.setupDone=true; saveDB(); announce("Selesai. Selamat berjualan."); home(); });
}

/* ---------- Beranda ---------- */
function home(){
  var today=todayStr();
  var txToday=db.transactions.filter(function(t){return t.dateStr===today;});
  var penjualanToday=txToday.reduce(function(a,t){return a+t.total;},0);
  var pend=db.transactions.filter(function(t){return !t.settled;});
  var note=pend.length?'<p class="help" role="note">Pengingat: ada '+pend.length+' transaksi belum lunas.</p>':'';
  var stat='<div class="statrow">'+
    '<div class="box"><span class="lbl">Penjualan hari ini</span><b>'+rupiah(penjualanToday)+'</b></div>'+
    '<div class="box"><span class="lbl">Transaksi hari ini</span><b>'+txToday.length+'</b></div>'+
    '<div class="box"><span class="lbl">Kas usaha</span><b>'+rupiah(neraca().kas)+'</b></div>'+
  '</div>';
  render(
    '<h2 class="screen-title">Menu utama</h2>'+note+stat+
    '<button class="btn primary big" id="m1">Penjualan baru<span class="sub">Catat barang/jasa yang baru terjual</span></button>'+
    '<button class="btn big" id="m2">Catat pengeluaran<span class="sub">Belanja bahan, listrik, sewa, dll</span></button>'+
    '<button class="btn big" id="m3">Daftar piutang<span class="sub">Pelanggan yang belum bayar</span></button>'+
    '<button class="btn big" id="m4">Riwayat transaksi<span class="sub">Perbaiki atau hapus catatan</span></button>'+
    '<button class="btn big" id="m5">Produk & harga<span class="sub">Tambah atau ubah daftar jualan</span></button>'+
    '<button class="btn big" id="m6">Laporan keuangan<span class="sub">Terkunci PIN. Laba rugi, neraca, unduh Excel</span></button>'+
    '<button class="btn big ghost" id="m7">Pengaturan<span class="sub">Terkunci PIN</span></button>'
  );
  on("m1","click",txStart); on("m2","click",expenseScreen); on("m3","click",debtsScreen);
  on("m4","click",historyScreen); on("m5","click",productScreen);
  on("m6","click",function(){ requirePin(reportScreen); }); on("m7","click",function(){ requirePin(settingsScreen); });
}
function requirePin(next){
  render('<h2 class="screen-title">Masukkan PIN pemilik</h2><label for="p">PIN</label><input id="p" type="tel" inputmode="numeric" /><button class="btn primary big" id="ok">Buka</button><button class="backlink" id="b">Kembali ke menu</button>');
  on("ok","click",function(){ if(el("p").value.trim()===db.settings.ownerPin) next(); else { announce("PIN salah."); el("p").value=""; el("p").focus(); } });
  on("b","click",home);
}

/* =================== PENJUALAN =================== */
var draft=null;
function txStart(){
  if(db.products.length===0){ announce("Belum ada produk. Tambahkan produk dulu."); productScreen(); return; }
  draft={items:[],discount:0,payment:null,customer:""}; txPick();
}
function txPick(){
  var btns=db.products.map(function(p){return '<button class="btn" data-id="'+p.id+'">'+esc(p.name)+'<span class="sub">'+rupiah(p.price)+'</span></button>';}).join("");
  var cart=draft.items.length?'<p class="help" role="note">Sudah dipilih: '+draft.items.map(function(i){return esc(i.name)+" ×"+i.qty;}).join(", ")+'.</p>':'';
  render('<h2 class="screen-title">Pilih produk</h2>'+cart+btns+'<button class="backlink" id="cancel">Batal & kembali ke menu</button>');
  each("[data-id]",function(b){ b.addEventListener("click",function(){ var p=db.products.filter(function(x){return x.id===b.getAttribute("data-id");})[0]; txQty(p); }); });
  on("cancel","click",home);
}
function txQty(product){
  var st={qty:1,price:product.price,editing:false};
  function draw(){
    var priceBlock=st.editing
      ? '<label for="pr">Harga satuan (rupiah)</label><input id="pr" type="tel" inputmode="numeric" value="'+st.price+'" /><button class="btn accent" id="apply">Terapkan harga</button>'
      : '<p class="help">Harga satuan: '+rupiah(st.price)+(st.price!==product.price?' (diubah dari '+rupiah(product.price)+')':'')+' <button class="backlink" id="edit" style="display:inline">Ubah harga</button></p>';
    render(
      '<h2 class="screen-title">Berapa '+esc(product.name)+'?</h2>'+
      '<div class="qty"><button id="minus" aria-label="Kurangi">−</button><span class="num" id="qn">'+st.qty+'</span><button id="plus" aria-label="Tambah">+</button></div>'+
      priceBlock+
      '<p class="total" id="tt">Total: '+rupiah(st.price*st.qty)+'</p>'+
      '<button class="btn primary big" id="ok">Pakai ini</button>'+
      '<button class="backlink" id="back">Kembali</button>'
    );
    on("minus","click",function(){ if(st.qty>1){st.qty--; sync();} });
    on("plus","click",function(){ st.qty++; sync(); });
    on("edit","click",function(){ st.editing=true; draw(); });
    on("apply","click",function(){ var v=digits(el("pr").value); if(v<=0){announce("Harga belum benar.");return;} st.price=v; st.editing=false; draw(); announce("Harga diubah menjadi "+terbilang(v)+" rupiah."); });
    on("ok","click",function(){ if(st.editing){var v=digits(el("pr").value); if(v>0) st.price=v;} draft.items.push({productId:product.id,name:product.name,price:st.price,qty:st.qty}); txAddMore(); });
    on("back","click",txPick);
  }
  function sync(){ el("qn").textContent=st.qty; el("tt").textContent="Total: "+rupiah(st.price*st.qty); announce("Jumlah "+terbilang(st.qty)+". Total "+terbilang(st.price*st.qty)+" rupiah."); }
  draw();
}
function txAddMore(){
  var sub=draft.items.reduce(function(a,i){return a+i.price*i.qty;},0);
  render('<h2 class="screen-title">Tambah produk lain?</h2><p class="help">Untuk pembeli yang sama. Sementara total '+rupiah(sub)+'.</p><button class="btn" id="more">Ya, tambah lagi</button><button class="btn primary big" id="cont">Tidak, lanjut</button>');
  on("more","click",txPick); on("cont","click",txDiscount);
}
function txDiscount(){
  var sub=draft.items.reduce(function(a,i){return a+i.price*i.qty;},0);
  render('<h2 class="screen-title">Ada diskon?</h2><p class="help">Subtotal '+rupiah(sub)+'. Isi potongan dalam rupiah, atau kosongkan jika tidak ada.</p><label for="dc">Diskon (rupiah)</label><input id="dc" type="tel" inputmode="numeric" value="0" /><button class="btn primary big" id="ok">Lanjut</button><button class="backlink" id="back">Kembali</button>');
  on("ok","click",function(){ var d=digits(el("dc").value); if(d>sub) d=sub; draft.discount=d; txPayment(); });
  on("back","click",txAddMore);
}
function txPayment(){
  render('<h2 class="screen-title">Cara pembayaran</h2><button class="btn primary" id="cash">Tunai (lunas)</button><button class="btn" id="tf">Transfer / QRIS (lunas)</button><button class="btn" id="up">Belum bayar (piutang)</button><button class="backlink" id="back">Kembali</button>');
  on("cash","click",function(){ draft.payment="cash"; txConfirm(); });
  on("tf","click",function(){ draft.payment="transfer"; txConfirm(); });
  on("up","click",function(){ draft.payment="unpaid"; txCustomer(); });
  on("back","click",txDiscount);
}
function txCustomer(){
  render('<h2 class="screen-title">Nama pembeli (piutang)</h2><p class="help">Agar mudah ditagih nanti.</p><label for="c">Nama pembeli</label><input id="c" type="text" /><button class="btn primary big" id="ok">Lanjut</button><button class="backlink" id="back">Kembali</button>');
  on("ok","click",function(){ var c=el("c").value.trim(); if(!c){announce("Nama belum diisi.");el("c").focus();return;} draft.customer=c; txConfirm(); });
  on("back","click",txPayment);
}
function calc(d){
  var sub=d.items.reduce(function(a,i){return a+i.price*i.qty;},0);
  var disc=d.discount||0; if(disc>sub) disc=sub;
  return {subtotal:sub,discount:disc,total:sub-disc};
}
function txConfirm(){
  var c=calc(draft);
  var items=draft.items.map(function(i){return esc(i.name)+" ×"+i.qty+" = "+rupiah(i.price*i.qty);}).join("<br>");
  var pay=draft.payment==="cash"?"Tunai":draft.payment==="transfer"?"Transfer/QRIS":"Belum bayar (piutang)";
  var disc=c.discount>0?'<br>Diskon: −'+rupiah(c.discount):'';
  render('<h2 class="screen-title">Periksa & simpan</h2><div class="card"><p>'+items+'</p><p>Subtotal: '+rupiah(c.subtotal)+disc+'<br>Pembayaran: '+pay+(draft.customer?'<br>Pembeli: '+esc(draft.customer):'')+'</p><p class="total">Total: '+rupiah(c.total)+'</p></div><button class="btn primary big" id="save">Simpan penjualan</button><button class="backlink" id="back">Kembali</button>');
  announce("Total "+terbilang(c.total)+" rupiah. Tekan simpan untuk menyimpan.");
  on("save","click",saveTx); on("back","click",txPayment);
}
function saveTx(){
  var c=calc(draft);
  var tx={id:uid(),createdAt:new Date().toISOString(),dateStr:todayStr(),items:draft.items.slice(),
    subtotal:c.subtotal,discount:c.discount,total:c.total,payment:draft.payment,customer:draft.customer||"",
    settled:draft.payment!=="unpaid",settledMethod:draft.payment!=="unpaid"?draft.payment:null,settledDate:draft.payment!=="unpaid"?todayStr():null};
  db.transactions.push(tx); saveDB(); txSaved(tx);
}
function txSaved(tx){
  render('<h2 class="screen-title">Penjualan tersimpan</h2><div class="card"><p class="total">'+rupiah(tx.total)+'</p><p class="muted">Untuk memperbaiki, buka Riwayat transaksi.</p></div><button class="btn accent" id="wa">Kirim struk ke WhatsApp</button><button class="btn primary big" id="home">Selesai, ke menu utama</button>');
  announce("Penjualan tersimpan, total "+terbilang(tx.total)+" rupiah.");
  on("wa","click",function(){ sendReceipt(tx); });
  on("home","click",home);
}
function sendReceipt(tx){
  var L=["*"+(db.settings.usahaName||"Usaha Saya")+"*"];
  if(db.settings.address) L.push(db.settings.address);
  if(db.settings.phone) L.push("Telp: "+db.settings.phone);
  L.push("--------------------","Tanggal: "+tglPanjang(tx.dateStr));
  tx.items.forEach(function(i){ L.push(i.name+" x"+i.qty+"  "+rupiah(i.price*i.qty)); });
  if(tx.discount>0) L.push("Diskon  −"+rupiah(tx.discount));
  L.push("--------------------","*TOTAL: "+rupiah(tx.total)+"*");
  L.push("Pembayaran: "+(tx.payment==="cash"?"Tunai":tx.payment==="transfer"?"Transfer/QRIS":"Belum bayar"));
  L.push("","Terima kasih 🙏");
  window.open("https://wa.me/?text="+encodeURIComponent(L.join("\n")),"_blank");
}

/* =================== PRODUK =================== */
function productScreen(){
  var list=db.products.map(function(p){return '<div class="list-item">'+esc(p.name)+' — '+rupiah(p.price)+' <button class="backlink" data-edit="'+p.id+'" style="display:inline">ubah</button> <button class="backlink" data-del="'+p.id+'" style="display:inline">hapus</button></div>';}).join("");
  render('<h2 class="screen-title">Produk & harga</h2><div class="card">'+(list||'<p class="muted">Belum ada produk.</p>')+'</div><label for="n">Nama produk/jasa</label><input id="n" type="text" /><label for="h">Harga (rupiah)</label><input id="h" type="tel" inputmode="numeric" /><button class="btn accent" id="add">Tambah produk</button><button class="backlink" id="back">Kembali ke menu</button>');
  on("add","click",function(){ var n=el("n").value.trim(),h=digits(el("h").value); if(!n||h<=0){announce("Isi nama dan harga.");return;} db.products.push({id:uid(),name:n,price:h}); saveDB(); announce("Produk "+n+" ditambahkan."); productScreen(); });
  each("[data-del]",function(b){ b.addEventListener("click",function(){ db.products=db.products.filter(function(x){return x.id!==b.getAttribute("data-del");}); saveDB(); productScreen(); }); });
  each("[data-edit]",function(b){ b.addEventListener("click",function(){ editProduct(b.getAttribute("data-edit")); }); });
  on("back","click",home);
}
function editProduct(id){
  var p=db.products.filter(function(x){return x.id===id;})[0]; if(!p){productScreen();return;}
  render('<h2 class="screen-title">Ubah produk</h2><label for="n">Nama</label><input id="n" type="text" value="'+esc(p.name)+'" /><label for="h">Harga (rupiah)</label><input id="h" type="tel" inputmode="numeric" value="'+p.price+'" /><button class="btn primary big" id="ok">Simpan</button><button class="backlink" id="back">Kembali</button>');
  on("ok","click",function(){ var n=el("n").value.trim(),h=digits(el("h").value); if(!n||h<=0){announce("Isi nama dan harga.");return;} p.name=n; p.price=h; saveDB(); announce("Produk diperbarui."); productScreen(); });
  on("back","click",productScreen);
}

/* =================== PENGELUARAN =================== */
function expenseScreen(){
  var cats=["Belanja bahan/stok","Gaji/upah","Listrik & Air","Sewa tempat","Transport","Kemasan","Pulsa/Data","Peralatan","Lain-lain"];
  render('<h2 class="screen-title">Catat pengeluaran</h2><label for="cat">Kategori</label><select id="cat">'+cats.map(function(c){return '<option>'+c+'</option>';}).join("")+'</select><label for="amt">Jumlah (rupiah)</label><input id="amt" type="tel" inputmode="numeric" /><label for="note">Catatan (boleh kosong)</label><input id="note" type="text" /><button class="btn primary big" id="save">Simpan pengeluaran</button><button class="backlink" id="back">Kembali ke menu</button>');
  on("save","click",function(){ var a=digits(el("amt").value); if(a<=0){announce("Jumlah belum benar.");el("amt").focus();return;} db.expenses.push({id:uid(),dateStr:todayStr(),createdAt:new Date().toISOString(),category:el("cat").value,amount:a,note:el("note").value.trim()}); saveDB(); announce("Pengeluaran "+el("cat").value+" "+terbilang(a)+" rupiah tersimpan."); home(); });
  on("back","click",home);
}

/* =================== PIUTANG =================== */
function debtsScreen(){
  var pend=db.transactions.filter(function(t){return !t.settled;});
  var tot=pend.reduce(function(a,t){return a+t.total;},0);
  var items=pend.length?pend.map(function(t){return '<div class="list-item"><strong>'+esc(t.customer||"Tanpa nama")+'</strong> — '+rupiah(t.total)+'<br><span class="muted">'+t.items.map(function(i){return esc(i.name);}).join(", ")+' · '+t.dateStr+'</span><br><button class="btn accent" data-id="'+t.id+'" style="margin-top:8px">Tandai sudah lunas</button></div>';}).join(""):'<p class="muted">Tidak ada piutang. Semua lunas.</p>';
  render('<h2 class="screen-title">Daftar piutang</h2><p class="help">'+(pend.length?"Ada "+pend.length+" belum bayar, total "+rupiah(tot)+".":"")+'</p>'+items+'<button class="backlink" id="back">Kembali ke menu</button>');
  each("[data-id]",function(b){ b.addEventListener("click",function(){ settle(b.getAttribute("data-id"),"debts"); }); });
  on("back","click",home);
}
function settle(id,from){
  var t=db.transactions.filter(function(x){return x.id===id;})[0]; if(!t) return;
  render('<h2 class="screen-title">Lunas dengan cara apa?</h2><p class="help">'+esc(t.customer||"Pembeli")+' membayar '+rupiah(t.total)+'.</p><button class="btn primary" id="cash">Tunai</button><button class="btn" id="tf">Transfer / QRIS</button><button class="backlink" id="back">Kembali</button>');
  function done(m){ t.settled=true; t.settledMethod=m; t.settledDate=todayStr(); saveDB(); announce("Piutang "+(t.customer||"")+" ditandai lunas."); from==="detail"?txDetail(id):debtsScreen(); }
  on("cash","click",function(){ done("cash"); }); on("tf","click",function(){ done("transfer"); });
  on("back","click",function(){ from==="detail"?txDetail(id):debtsScreen(); });
}

/* =================== RIWAYAT =================== */
function historyScreen(){
  var tx=db.transactions.slice().sort(function(a,b){return b.createdAt<a.createdAt?-1:1;}).slice(0,40);
  var items=tx.length?tx.map(function(t){ return '<div class="list-item"><strong>'+rupiah(t.total)+'</strong> · '+t.dateStr+(t.settled?"":" · belum lunas")+'<br><span class="muted">'+t.items.map(function(i){return esc(i.name)+" ×"+i.qty;}).join(", ")+'</span><br><button class="btn" data-id="'+t.id+'" style="margin-top:8px">Buka / perbaiki</button></div>'; }).join(""):'<p class="muted">Belum ada transaksi.</p>';
  render('<h2 class="screen-title">Riwayat transaksi</h2><p class="help">40 transaksi terakhir.</p>'+items+'<button class="backlink" id="back">Kembali ke menu</button>');
  each("[data-id]",function(b){ b.addEventListener("click",function(){ txDetail(b.getAttribute("data-id")); }); });
  on("back","click",home);
}
function txDetail(id){
  var t=db.transactions.filter(function(x){return x.id===id;})[0]; if(!t){ historyScreen(); return; }
  var items=t.items.map(function(i){return esc(i.name)+" ×"+i.qty+" = "+rupiah(i.price*i.qty);}).join("<br>");
  render('<h2 class="screen-title">Detail transaksi</h2><div class="card"><p>'+items+(t.discount>0?'<br>Diskon −'+rupiah(t.discount):'')+'</p><p class="total">'+rupiah(t.total)+'</p><p class="muted">Tanggal '+t.dateStr+' · '+(t.settled?"lunas":"belum lunas")+(t.customer?" · "+esc(t.customer):"")+'</p></div>'+
    '<label for="d">Ubah tanggal</label><input id="d" type="date" value="'+t.dateStr+'" /><button class="btn accent" id="savedate">Simpan tanggal</button>'+
    (t.settled?'':'<button class="btn" id="settle">Tandai sudah lunas</button>')+
    '<button class="btn danger" id="del">Hapus transaksi ini</button>'+
    '<button class="backlink" id="back">Kembali ke riwayat</button>');
  on("savedate","click",function(){ var v=el("d").value; if(!/^\d{4}-\d{2}-\d{2}$/.test(v)){announce("Tanggal belum benar.");return;} t.dateStr=v; if(t.settled&&t.settledDate) t.settledDate=v; saveDB(); announce("Tanggal diperbarui."); txDetail(id); });
  on("settle","click",function(){ settle(id,"detail"); });
  on("del","click",function(){ render('<h2 class="screen-title">Hapus transaksi?</h2><p class="help">Tindakan ini permanen.</p><button class="btn danger" id="yes">Ya, hapus</button><button class="btn primary" id="no">Tidak, batal</button>'); on("yes","click",function(){ db.transactions=db.transactions.filter(function(x){return x.id!==id;}); saveDB(); announce("Transaksi dihapus."); historyScreen(); }); on("no","click",function(){ txDetail(id); }); });
  on("back","click",historyScreen);
}

/* =================== PERHITUNGAN KEUANGAN =================== */
function labaRugi(ym){
  var tx=db.transactions.filter(function(t){return monthOf(t.dateStr)===ym;});
  var penjualan=tx.reduce(function(a,t){return a+t.subtotal;},0);
  var diskon=tx.reduce(function(a,t){return a+(t.discount||0);},0);
  var pendapatan=penjualan-diskon;
  var exp=db.expenses.filter(function(e){return monthOf(e.dateStr)===ym;});
  var bebanCat={}; exp.forEach(function(e){ bebanCat[e.category]=(bebanCat[e.category]||0)+e.amount; });
  var totalBeban=exp.reduce(function(a,e){return a+e.amount;},0);
  return {ym:ym,penjualan:penjualan,diskon:diskon,pendapatan:pendapatan,bebanCat:bebanCat,totalBeban:totalBeban,laba:pendapatan-totalBeban,count:tx.length};
}
function neraca(){
  var t=db.transactions;
  var received=t.filter(function(x){return x.settled;}).reduce(function(a,x){return a+x.total;},0);
  var unpaid=t.filter(function(x){return !x.settled;}).reduce(function(a,x){return a+x.total;},0);
  var revenue=received+unpaid;
  var E=db.expenses.reduce(function(a,x){return a+x.amount;},0);
  var M=db.capital.filter(function(c){return c.type==="modal";}).reduce(function(a,c){return a+c.amount;},0);
  var P=db.capital.filter(function(c){return c.type==="prive";}).reduce(function(a,c){return a+c.amount;},0);
  var Akas=db.assets.filter(function(x){return x.acquire==="kas";}).reduce(function(a,x){return a+x.cost;},0);
  var Amod=db.assets.filter(function(x){return x.acquire!=="kas";}).reduce(function(a,x){return a+x.cost;},0);
  var kas=M-P+received-E-Akas;
  var piutang=unpaid;
  var asetTetap=Akas+Amod;
  var totalAset=kas+piutang+asetTetap;
  var modalDisetor=M-P+Amod;
  var labaDitahan=revenue-E;
  var totalEkuitas=modalDisetor+labaDitahan;
  return {kas:kas,piutang:piutang,asetTetap:asetTetap,totalAset:totalAset,modalDisetor:modalDisetor,labaDitahan:labaDitahan,totalEkuitas:totalEkuitas,seimbang:Math.round(totalAset)===Math.round(totalEkuitas)};
}

/* =================== LAPORAN =================== */
function reportScreen(){ drawReport(thisMonth()); }
function drawReport(ym){
  var lr=labaRugi(ym), nr=neraca();
  var bebanRows=Object.keys(lr.bebanCat).map(function(k){return '<div class="ln"><span>'+esc(k)+'</span><span>'+rupiah(lr.bebanCat[k])+'</span></div>';}).join("");
  render(
    '<h2 class="screen-title">Laporan keuangan</h2>'+
    '<div class="row" style="margin-bottom:12px"><button class="btn" id="prev">Bulan sebelumnya</button><button class="btn" id="next">Berikutnya</button></div>'+
    '<div class="card ledger"><p class="muted">Laporan Laba Rugi — '+namaBulan(ym)+'</p>'+
      '<div class="ln"><span>Penjualan (bruto)</span><span>'+rupiah(lr.penjualan)+'</span></div>'+
      (lr.diskon>0?'<div class="ln"><span>Diskon</span><span>−'+rupiah(lr.diskon)+'</span></div>':'')+
      '<div class="ln totline"><span>Pendapatan bersih</span><span>'+rupiah(lr.pendapatan)+'</span></div>'+
      (bebanRows?'<div class="ln" style="margin-top:8px"><span><strong>Beban usaha</strong></span><span></span></div>'+bebanRows:'')+
      '<div class="ln totline"><span>Total beban</span><span>'+rupiah(lr.totalBeban)+'</span></div>'+
      '<div class="ln totline"><span>Laba bersih</span><span style="color:'+(lr.laba<0?'var(--warn)':'var(--ok)')+'">'+rupiah(lr.laba)+'</span></div>'+
    '</div>'+
    '<div class="card ledger"><p class="muted">Laporan Posisi Keuangan (Neraca) — per '+tglPanjang(todayStr())+'</p>'+
      '<div class="ln"><span>Kas & setara kas</span><span>'+rupiah(nr.kas)+'</span></div>'+
      '<div class="ln"><span>Piutang usaha</span><span>'+rupiah(nr.piutang)+'</span></div>'+
      '<div class="ln"><span>Aset tetap (harga perolehan)</span><span>'+rupiah(nr.asetTetap)+'</span></div>'+
      '<div class="ln totline"><span>Total aset</span><span>'+rupiah(nr.totalAset)+'</span></div>'+
      '<div class="ln" style="margin-top:8px"><span>Modal disetor (bersih)</span><span>'+rupiah(nr.modalDisetor)+'</span></div>'+
      '<div class="ln"><span>Laba ditahan</span><span>'+rupiah(nr.labaDitahan)+'</span></div>'+
      '<div class="ln totline"><span>Total ekuitas</span><span>'+rupiah(nr.totalEkuitas)+'</span></div>'+
      '<p class="muted" style="margin-top:8px">'+(nr.seimbang?"Seimbang ✓":"Perlu diperiksa")+'</p>'+
    '</div>'+
    '<button class="btn accent big" id="dl">Unduh laporan Excel</button>'+
    '<button class="btn" id="wa">Bagikan ringkasan ke WhatsApp</button>'+
    '<button class="backlink" id="back">Kembali ke menu</button>'
  );
  on("prev","click",function(){ drawReport(addMonth(ym,-1)); });
  on("next","click",function(){ drawReport(addMonth(ym,1)); });
  on("dl","click",function(){ exportExcel(ym); });
  on("wa","click",function(){ var L=["*Laporan Keuangan "+(db.settings.usahaName||"")+"*","Periode: "+namaBulan(ym),"","Pendapatan: "+rupiah(lr.pendapatan),"Total beban: "+rupiah(lr.totalBeban),"*Laba bersih: "+rupiah(lr.laba)+"*","","Kas: "+rupiah(nr.kas),"Piutang: "+rupiah(nr.piutang)]; window.open("https://wa.me/?text="+encodeURIComponent(L.join("\n")),"_blank"); });
  on("back","click",home);
  announce("Laporan "+namaBulan(ym)+". Laba bersih "+terbilang(lr.laba)+" rupiah. "+(nr.seimbang?"Neraca seimbang.":""));
}
function calkLines(){
  return [
    "CATATAN ATAS LAPORAN KEUANGAN",
    "1. Identitas entitas: "+(db.settings.usahaName||"")+(db.settings.address?", "+db.settings.address:"")+(db.settings.phone?", telp "+db.settings.phone:"")+".",
    "2. Dasar penyusunan: laporan disusun mengikuti format SAK EMKM dengan basis akrual dan pengukuran biaya historis.",
    "3. Pendapatan diakui pada saat barang/jasa diserahkan kepada pembeli.",
    "4. Aset tetap dicatat sebesar harga perolehan. Penyusutan belum diterapkan pada laporan ini.",
    "5. Piutang usaha merupakan penjualan yang barang/jasanya telah diserahkan namun belum dibayar pembeli.",
    "6. Uang usaha dipisahkan dari uang pribadi melalui pencatatan setoran modal dan pengambilan pribadi."
  ];
}
function exportExcel(ym){
  try{
    var lr=labaRugi(ym), nr=neraca();
    var wb=XLSX.utils.book_new();
    var head=[[db.settings.usahaName||"Usaha Saya"],[db.settings.address||""],["Telp: "+(db.settings.phone||"")],[]];
    var lrA=head.concat([["LAPORAN LABA RUGI"],["Periode",namaBulan(ym)],[],
      ["Penjualan (bruto)",lr.penjualan],["Diskon",-lr.diskon],["Pendapatan bersih",lr.pendapatan],[]]);
    Object.keys(lr.bebanCat).forEach(function(k){ lrA.push(["Beban "+k,lr.bebanCat[k]]); });
    lrA.push(["Total beban",lr.totalBeban],[],["LABA BERSIH",lr.laba]);
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(lrA),"Laba Rugi");
    var nrA=head.concat([["LAPORAN POSISI KEUANGAN (NERACA)"],["Per tanggal",tglPanjang(todayStr())],[],
      ["ASET"],["Kas & setara kas",nr.kas],["Piutang usaha",nr.piutang],["Aset tetap (harga perolehan)",nr.asetTetap],["Total aset",nr.totalAset],[],
      ["EKUITAS"],["Modal disetor (bersih)",nr.modalDisetor],["Laba ditahan",nr.labaDitahan],["Total ekuitas",nr.totalEkuitas],[],
      ["Status",nr.seimbang?"Seimbang":"Perlu diperiksa"]]);
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(nrA),"Neraca");
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(calkLines().map(function(x){return [x];})),"Catatan");
    var txA=[["Tanggal","Produk","Subtotal","Diskon","Total","Pembayaran","Status","Pembeli"]];
    db.transactions.filter(function(t){return monthOf(t.dateStr)===ym;}).forEach(function(t){
      txA.push([t.dateStr,t.items.map(function(i){return i.name+" x"+i.qty;}).join("; "),t.subtotal,t.discount||0,t.total,
        t.payment==="cash"?"Tunai":t.payment==="transfer"?"Transfer":"Piutang",t.settled?"Lunas":"Belum",t.customer||""]);
    });
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(txA),"Transaksi");
    XLSX.writeFile(wb,"Laporan-Keuangan-"+ym+".xlsx");
    announce("File Excel laporan "+namaBulan(ym)+" sedang diunduh.");
  }catch(e){ announce("Maaf, pembuatan Excel gagal. Pastikan aplikasi sudah terbuka penuh."); }
}

/* =================== PENGATURAN =================== */
function settingsScreen(){
  render('<h2 class="screen-title">Pengaturan</h2>'+
    '<button class="btn" id="id">Identitas usaha</button>'+
    '<button class="btn" id="cap">Modal & pengambilan pribadi</button>'+
    '<button class="btn" id="as">Daftar aset</button>'+
    '<button class="btn" id="pin">Ubah PIN</button>'+
    '<button class="btn accent" id="bk">Cadangkan data (unduh)</button>'+
    '<button class="btn" id="rs">Pulihkan data dari file</button>'+
    '<input id="rsfile" type="file" accept=".json,application/json" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);" />'+
    '<button class="backlink" id="back">Kembali ke menu</button>');
  on("id","click",idScreen); on("cap","click",capScreen); on("as","click",assetScreen); on("pin","click",pinScreen);
  on("bk","click",backup); on("rs","click",function(){ el("rsfile").click(); }); on("rsfile","change",restore);
  on("back","click",home);
}
function idScreen(){
  render('<h2 class="screen-title">Identitas usaha</h2><label for="nm">Nama usaha</label><input id="nm" type="text" value="'+esc(db.settings.usahaName)+'" /><label for="ph">Telepon (boleh kosong)</label><input id="ph" type="text" value="'+esc(db.settings.phone)+'" /><label for="ad">Alamat (boleh kosong)</label><input id="ad" type="text" value="'+esc(db.settings.address)+'" /><button class="btn primary big" id="ok">Simpan</button><button class="backlink" id="back">Kembali</button>');
  on("ok","click",function(){ var nm=el("nm").value.trim(); if(!nm){announce("Nama usaha belum diisi.");return;} db.settings.usahaName=nm; db.settings.phone=el("ph").value.trim(); db.settings.address=el("ad").value.trim(); saveDB(); announce("Tersimpan."); settingsScreen(); });
  on("back","click",settingsScreen);
}
function capScreen(){
  var list=db.capital.slice().reverse().slice(0,20).map(function(c){return '<div class="list-item">'+(c.type==="modal"?"Setor modal":"Ambil pribadi")+' — '+rupiah(c.amount)+'<br><span class="muted">'+c.dateStr+(c.note?" · "+esc(c.note):"")+'</span></div>';}).join("");
  render('<h2 class="screen-title">Modal & pengambilan pribadi</h2><p class="help">Memisahkan uang usaha dari uang pribadi agar laci dan laporan akurat.</p><div class="card">'+(list||'<p class="muted">Belum ada catatan.</p>')+'</div><label for="amt">Jumlah (rupiah)</label><input id="amt" type="tel" inputmode="numeric" /><label for="note">Catatan (boleh kosong)</label><input id="note" type="text" /><button class="btn accent" id="modal">Setor modal (uang masuk usaha)</button><button class="btn" id="prive">Ambil untuk pribadi (uang keluar)</button><button class="backlink" id="back">Kembali</button>');
  function add(type){ var a=digits(el("amt").value); if(a<=0){announce("Jumlah belum benar.");return;} db.capital.push({id:uid(),type:type,amount:a,dateStr:todayStr(),note:el("note").value.trim(),createdAt:new Date().toISOString()}); saveDB(); announce((type==="modal"?"Setoran modal ":"Pengambilan pribadi ")+terbilang(a)+" rupiah tercatat."); capScreen(); }
  on("modal","click",function(){ add("modal"); }); on("prive","click",function(){ add("prive"); }); on("back","click",settingsScreen);
}
function assetScreen(){
  var list=db.assets.map(function(a){return '<div class="list-item">'+esc(a.name)+' — '+rupiah(a.cost)+'<br><span class="muted">'+(a.acquire==="kas"?"dibeli dari kas usaha":"dari modal pribadi")+'</span> <button class="backlink" data-del="'+a.id+'" style="display:inline">hapus</button></div>';}).join("");
  render('<h2 class="screen-title">Daftar aset</h2><p class="help">Contoh: etalase, kompor, gerobak, alat. Dicatat sebesar harga beli.</p><div class="card">'+(list||'<p class="muted">Belum ada aset.</p>')+'</div><label for="n">Nama aset</label><input id="n" type="text" /><label for="c">Harga perolehan (rupiah)</label><input id="c" type="tel" inputmode="numeric" /><button class="btn accent" id="kas">Tambah (dibeli dari kas usaha)</button><button class="btn" id="mod">Tambah (dari modal pribadi)</button><button class="backlink" id="back">Kembali</button>');
  function add(ac){ var n=el("n").value.trim(),c=digits(el("c").value); if(!n||c<=0){announce("Isi nama dan harga.");return;} db.assets.push({id:uid(),name:n,cost:c,acquire:ac,dateStr:todayStr(),createdAt:new Date().toISOString()}); saveDB(); announce("Aset "+n+" tercatat."); assetScreen(); }
  on("kas","click",function(){ add("kas"); }); on("mod","click",function(){ add("modal"); });
  each("[data-del]",function(b){ b.addEventListener("click",function(){ db.assets=db.assets.filter(function(x){return x.id!==b.getAttribute("data-del");}); saveDB(); assetScreen(); }); });
  on("back","click",settingsScreen);
}
function pinScreen(){
  render('<h2 class="screen-title">Ubah PIN</h2><label for="o">PIN lama</label><input id="o" type="tel" inputmode="numeric" /><label for="n">PIN baru (4-6 angka)</label><input id="n" type="tel" inputmode="numeric" /><button class="btn primary big" id="ok">Simpan</button><button class="backlink" id="back">Kembali</button>');
  on("ok","click",function(){ if(el("o").value.trim()!==db.settings.ownerPin){announce("PIN lama salah.");return;} var n=el("n").value.trim(); if(!/^[0-9]{4,6}$/.test(n)){announce("PIN baru harus 4-6 angka.");return;} db.settings.ownerPin=n; saveDB(); announce("PIN diubah."); settingsScreen(); });
  on("back","click",settingsScreen);
}
function backup(){ var blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}); var u=URL.createObjectURL(blob); var a=document.createElement("a"); a.href=u; a.download="cadangan-"+(db.settings.usahaName||"usaha").replace(/\s+/g,"-").toLowerCase()+"-"+todayStr()+".json"; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u); announce("File cadangan diunduh. Simpan di tempat aman."); }
function restore(ev){ var f=ev.target.files[0]; if(!f) return; var r=new FileReader(); r.onload=function(){ try{ var d=JSON.parse(r.result); if(!d.settings||!d.transactions) throw 0; var b=blankDB(); for(var k in b){ if(!(k in d)) d[k]=b[k]; } for(var s in b.settings){ if(!(s in d.settings)) d.settings[s]=b.settings[s]; } db=d; saveDB(); announce("Data berhasil dipulihkan."); home(); }catch(e){ announce("File tidak dikenali. Pemulihan dibatalkan."); } }; r.readAsText(f); }
