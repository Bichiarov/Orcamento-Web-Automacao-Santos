const BRL = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const $ = (id)=>document.getElementById(id);
const hoje = new Date();
const modulos = [
  {id:'retaguarda',nome:'Retaguarda — obrigatório',valor:29.9,padrao:true,fixo:true},
  {id:'estoque',nome:'Estoque',valor:3,padrao:true},
  {id:'fiscal',nome:'Fiscal',valor:5,padrao:true},
  {id:'financeiro',nome:'Financeiro',valor:3,padrao:true},
  {id:'mataFicha',nome:'Mata Ficha',valor:0},
  {id:'integracaoDeliveries',nome:'Integração Deliveries',valor:0},
  {id:'contaAssinada',nome:'Conta Assinada',valor:0},
  {id:'validacaoCpf',nome:'Validação de CPF',valor:0},
  {id:'servidorWindows',nome:'Servidor Windows',valor:0},
  {id:'tabletMesa',nome:'Tablet na Mesa',valor:12},
  {id:'qrCodeMesa',nome:'QR Code na Mesa',valor:12},
  {id:'controlePortaria',nome:'Controle de Portaria',valor:12},
  {id:'byp',nome:'BYP',valor:180},
  {id:'fidelidadeLegal',nome:'Fidelidade Legal',valor:130},
  {id:'deliveryLegal',nome:'Delivery Legal',valor:125},
  {id:'certificadoDigital',nome:'Certificado Digital',valor:118},
  {id:'balancas',nome:'Balanças Autônomas',valor:12,quantidade:true},
  {id:'kdsPDVLegal',nome:'KDS (PDV Legal)',valor:12,quantidade:true},
  {id:'totemTokMenu',nome:'Totem TokMenu',valor:25,quantidade:true},
  {id:'kdsTokMenu',nome:'KDS TokMenu — R$ 12,00 a cada 2 KDS ativos',valor:12,aCada2:true}
];
const state = {selecionados:{}, assinatura:''};
modulos.forEach(m=>state.selecionados[m.id]=!!m.padrao);
$('numeroContrato').value = `WEB-${hoje.getFullYear()}-001`;
$('dataContrato').value = hoje.toLocaleDateString('pt-BR');
function renderModulos(){
  const box = $('modulos'); box.innerHTML='';
  modulos.forEach(m=>{
    const row=document.createElement('label'); row.className='module'; row.style.marginBottom='0';
    row.innerHTML=`<span><input type="checkbox" ${state.selecionados[m.id]?'checked':''} ${m.fixo?'disabled':''} data-mod="${m.id}"> ${m.nome}</span><strong>${BRL.format(m.valor)}</strong>`;
    box.appendChild(row);
  });
  box.querySelectorAll('[data-mod]').forEach(chk=>chk.addEventListener('change',e=>{
    const id=e.target.dataset.mod;
    if(id==='retaguarda') { state.selecionados.retaguarda=true; e.target.checked=true; return; }
    state.selecionados[id]=e.target.checked;
    atualizarCamposQtd(); calcular();
  }));
}
function valNum(id){ return Math.max(0, Number($(id).value||0)); }
function atualizarCamposQtd(){
  document.querySelectorAll('[data-dep]').forEach(inp=>{
    const ativo=!!state.selecionados[inp.dataset.dep];
    inp.disabled=!ativo;
    if(!ativo) inp.value=0;
  });
}
function calcular(){
  const linhas=[];
  let total=0;
  modulos.forEach(m=>{
    if(!state.selecionados[m.id]) return;
    let qtd=1;
    if(m.id==='balancas') qtd=valNum('qtdBalancas');
    if(m.id==='kdsPDVLegal') qtd=valNum('qtdKdsPdv');
    if(m.id==='totemTokMenu') qtd=valNum('qtdTotem');
    if(m.id==='kdsTokMenu') qtd=Math.ceil(valNum('qtdKdsTok')/2);
    const linhaTotal=m.valor*qtd;
    total+=linhaTotal;
    linhas.push({nome:m.nome.replace(' — obrigatório',''),qtd,total:linhaTotal,mostrarQtd:qtd!==1});
  });
  const qtdPdvs=Math.max(1, valNum('qtdPdvs')||1);
  $('qtdPdvs').value=qtdPdvs;
  const custoPdvs=qtdPdvs*15; total+=custoPdvs;
  linhas.push({nome:'PDVs ativos',qtd:qtdPdvs,total:custoPdvs,mostrarQtd:true,unit:15});
  $('custoTotal').textContent=BRL.format(total);
  $('resumoPdvs').textContent=`${qtdPdvs} PDV(s) × R$ 15,00`;
  $('pvCustoTotal').textContent=BRL.format(total);
  const pv=$('pvLinhasCusto'); pv.innerHTML='';
  linhas.forEach(l=>{
    const p=document.createElement('p');
    const detalhe=l.unit?` — ${l.qtd} × ${BRL.format(l.unit)}`:(l.mostrarQtd?` — QTD. ${l.qtd}`:'');
    p.innerHTML=`<span>${l.nome}${detalhe}</span><strong>${BRL.format(l.total)}</strong>`;
    pv.appendChild(p);
  });
}
function syncText(){
  $('pvNumero').textContent=$('numeroContrato').value||'WEB-2026-001';
  $('pvData').textContent='Data: '+($('dataContrato').value||'--/--/----');
  $('pvRazao').textContent=$('clienteRazao').value||'________________________________';
  $('pvFantasia').textContent=$('clienteFantasia').value||'________________________________';
  $('pvCnpj').textContent=$('clienteCnpj').value||'________________';
  $('pvResponsavel').textContent=$('clienteResponsavel').value||'________________';
  $('pvCpf').textContent=$('clienteCpf').value||'________________';
  $('pvTelefone').textContent=$('clienteTelefone').value||'________________';
  $('pvEmail').textContent=$('clienteEmail').value||'________________';
  $('pvEndereco').textContent=$('clienteEndereco').value||'________________________________________________________________';
  $('pvVencimento').textContent=$('vencimento').value||'Todo dia 10';
  $('pvFidelidade').textContent=$('fidelidade').value||'Sem fidelidade mínima';
  $('pvValidade').textContent=$('validade').value||'30 dias';
  $('pvObservacoes').textContent=$('observacoes').value||'';
  $('pvAssinante').textContent=$('clienteResponsavel').value||'Contratante';
  $('pvCpfAssinatura').textContent=$('clienteCpf').value||'________________';
}
function setupAssinatura(){
  const canvas=$('assinatura'), ctx=canvas.getContext('2d'); let drawing=false;
  function pos(e){const r=canvas.getBoundingClientRect(); const t=e.touches&&e.touches[0]; const x=(t?t.clientX:e.clientX)-r.left; const y=(t?t.clientY:e.clientY)-r.top; return {x:x/r.width*canvas.width,y:y/r.height*canvas.height};}
  function start(e){e.preventDefault(); drawing=true; const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y);}
  function move(e){if(!drawing)return; e.preventDefault(); const p=pos(e); ctx.lineWidth=3; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='#0f172a'; ctx.lineTo(p.x,p.y); ctx.stroke(); state.assinatura=canvas.toDataURL('image/png'); const img=$('pvAssinatura'); img.src=state.assinatura; img.style.display='block';}
  function stop(){drawing=false;}
  canvas.addEventListener('mousedown',start); canvas.addEventListener('mousemove',move); canvas.addEventListener('mouseup',stop); canvas.addEventListener('mouseleave',stop);
  canvas.addEventListener('touchstart',start,{passive:false}); canvas.addEventListener('touchmove',move,{passive:false}); canvas.addEventListener('touchend',stop);
  $('limparAssinatura').addEventListener('click',()=>{ctx.clearRect(0,0,canvas.width,canvas.height); state.assinatura=''; const img=$('pvAssinatura'); img.removeAttribute('src'); img.style.display='none';});
}
renderModulos(); atualizarCamposQtd(); calcular(); syncText(); setupAssinatura();
document.querySelectorAll('input,textarea').forEach(el=>el.addEventListener('input',()=>{syncText(); calcular();}));
$('btnPrint').addEventListener('click',()=>window.print());
