const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const $ = (id) => document.getElementById(id);

const vendaCliente = [
  { id:'base', nome:'PDV Legal — Plano Base com Retaguarda', valor:149.90, qty:1, locked:true, checked:true },
  { id:'pdvAdicional', nome:'PDV adicional', valor:49.90, qty:0, checked:false },
  { id:'estoqueVenda', nome:'Estoque', valor:20.00, qty:1, checked:false },
  { id:'financeiroVenda', nome:'Financeiro', valor:20.00, qty:1, checked:false },
  { id:'tabletMesaVenda', nome:'Tablet na Mesa', valor:39.90, qty:1, checked:false },
  { id:'qrCodeMesaVenda', nome:'QR Code na Mesa', valor:39.90, qty:1, checked:false },
  { id:'controlePortariaVenda', nome:'Controle de Portaria', valor:39.90, qty:1, checked:false },
  { id:'bypVenda', nome:'BYP', valor:299.90, qty:1, checked:false },
  { id:'fidelidadeVenda', nome:'Fidelidade Legal', valor:249.90, qty:1, checked:false },
  { id:'deliveryVenda', nome:'Delivery Legal', valor:249.90, qty:1, checked:false },
  { id:'certificadoVenda', nome:'Certificado Digital', valor:199.90, qty:1, checked:false },
  { id:'balancasVenda', nome:'Balanças Autônomas', valor:39.90, qty:1, checked:false },
  { id:'kdsPdvVenda', nome:'KDS PDV Legal', valor:39.90, qty:1, checked:false },
  { id:'totemVenda', nome:'Totem TokMenu', valor:79.90, qty:1, checked:false },
  { id:'kdsTokVenda', nome:'KDS TokMenu — a cada 2 KDS ativos', valor:39.90, qty:1, checked:false }
];

const custos = [
  { id:'retaguarda', nome:'Retaguarda — obrigatório', valor:29.90, checked:true, locked:true },
  { id:'estoque', nome:'Estoque', valor:3, checked:true },
  { id:'fiscal', nome:'Fiscal', valor:5, checked:true },
  { id:'financeiro', nome:'Financeiro', valor:3, checked:true },
  { id:'mataFicha', nome:'Mata Ficha', valor:0, checked:false },
  { id:'integracaoDeliveries', nome:'Integração Deliveries', valor:0, checked:false },
  { id:'contaAssinada', nome:'Conta Assinada', valor:0, checked:false },
  { id:'validacaoCpf', nome:'Validação de CPF', valor:0, checked:false },
  { id:'servidorWindows', nome:'Servidor Windows', valor:0, checked:false },
  { id:'tabletMesa', nome:'Tablet na Mesa', valor:12, checked:false },
  { id:'qrCodeMesa', nome:'QR Code na Mesa', valor:12, checked:false },
  { id:'controlePortaria', nome:'Controle de Portaria', valor:12, checked:false },
  { id:'byp', nome:'BYP', valor:180, checked:false },
  { id:'fidelidadeLegal', nome:'Fidelidade Legal', valor:130, checked:false },
  { id:'deliveryLegal', nome:'Delivery Legal', valor:125, checked:false },
  { id:'certificadoDigital', nome:'Certificado Digital', valor:118, checked:false },
  { id:'balancas', nome:'Balanças Autônomas', valor:12, checked:false, qtyInput:'qtdBalancas' },
  { id:'kdsPDVLegal', nome:'KDS (PDV Legal)', valor:12, checked:false, qtyInput:'qtdKdsPdv' },
  { id:'totemTokMenu', nome:'Totem TokMenu', valor:25, checked:false, qtyInput:'qtdTotem' },
  { id:'kdsTokMenu', nome:'KDS TokMenu — R$ 12,00 a cada 2 KDS ativos', valor:12, checked:false, qtyInput:'qtdKdsTok', eachTwo:true }
];

function todayBR(){ return new Date().toLocaleDateString('pt-BR'); }
function onlyNumbers(v){ return String(v || '').replace(/\D/g,''); }
function docType(v){ return onlyNumbers(v).length <= 11 ? 'CPF' : 'CNPJ'; }
function formatDoc(v){
  const d = onlyNumbers(v).slice(0,14);
  if(d.length <= 11){
    return d.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
  }
  return d.replace(/(\d{2})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1/$2').replace(/(\d{4})(\d{1,2})$/,'$1-$2');
}
function val(id){ return $(id)?.value || ''; }
function num(id){ return Math.max(0, Number(val(id) || 0)); }
function safe(txt){ return txt || '________________'; }

function renderVenda(){
  const box = $('saleTable');
  box.innerHTML = '';
  vendaCliente.forEach(item => {
    const row = document.createElement('div');
    row.className = 'check-row';
    row.innerHTML = `
      <input type="checkbox" ${item.checked?'checked':''} ${item.locked?'disabled':''} data-sale-check="${item.id}">
      <span class="name">${item.nome}</span>
      <span class="price">${brl.format(item.valor)}</span>
      <input class="qty" type="number" min="0" value="${item.qty}" data-sale-qty="${item.id}" ${!item.checked && !item.locked?'disabled':''}>
    `;
    box.appendChild(row);
  });
  box.querySelectorAll('[data-sale-check]').forEach(el => {
    el.addEventListener('change', e => {
      const item = vendaCliente.find(i => i.id === e.target.dataset.saleCheck);
      item.checked = e.target.checked;
      if(item.checked && item.qty === 0) item.qty = 1;
      renderVenda(); updateAll();
    });
  });
  box.querySelectorAll('[data-sale-qty]').forEach(el => {
    el.addEventListener('input', e => {
      const item = vendaCliente.find(i => i.id === e.target.dataset.saleQty);
      item.qty = Math.max(0, Number(e.target.value || 0));
      updateAll();
    });
  });
}

function renderCustos(){
  const box = $('costTable');
  box.innerHTML = '';
  custos.forEach(item => {
    const row = document.createElement('label');
    row.className = 'check-row';
    row.innerHTML = `
      <input type="checkbox" ${item.checked?'checked':''} ${item.locked?'disabled':''} data-cost-check="${item.id}">
      <span class="name">${item.nome}</span>
      <span class="price">${brl.format(item.valor)}</span>
    `;
    box.appendChild(row);
  });
  box.querySelectorAll('[data-cost-check]').forEach(el => {
    el.addEventListener('change', e => {
      const item = custos.find(i => i.id === e.target.dataset.costCheck);
      if(item.locked) return;
      item.checked = e.target.checked;
      updateQuantityLocks();
      updateAll();
    });
  });
}

function updateQuantityLocks(){
  custos.filter(c=>c.qtyInput).forEach(c => {
    const input = $(c.qtyInput);
    input.disabled = !c.checked;
    if(!c.checked) input.value = 0;
  });
}

function saleRows(){ return vendaCliente.filter(i => i.checked && Number(i.qty) > 0); }
function totalVenda(){ return saleRows().reduce((sum,i)=> sum + i.valor * Number(i.qty||0), 0); }

function pdvCost(){
  const qtd = Math.max(1, Number(val('qtdPdvs') || 1));
  const total = qtd <= 2 ? 15 : qtd * 10;
  const desc = qtd <= 2 ? `${qtd} PDV(S) — CUSTO TOTAL R$ 15,00` : `${qtd} PDVS — R$ 10,00 POR PDV`;
  return { qtd, total, desc };
}

function costRows(){
  const rows = custos.filter(c=>c.checked).map(c => {
    let q = 1;
    if(c.qtyInput){ q = Number(val(c.qtyInput) || 0); }
    if(c.eachTwo){ q = Math.ceil(q / 2); }
    return {...c, qtd:q, total:c.valor*q};
  }).filter(r=> r.total > 0 || r.valor === 0);
  const p = pdvCost();
  rows.push({id:'pdvs', nome:`PDVs ativos — ${p.desc}`, qtd:p.qtd, valor:0, total:p.total});
  return rows;
}
function totalCusto(){ return costRows().reduce((s,r)=>s+r.total,0); }

function updateContract(){
  $('docNumero').textContent = val('numeroContrato');
  $('docData').textContent = `Data: ${val('dataContrato')}`;
  $('docRazao').textContent = safe(val('razao'));
  $('docFantasia').textContent = safe(val('fantasia'));
  $('docDocLabel').textContent = `${docType(val('documento'))}:`;
  $('docDocumento').textContent = safe(val('documento'));
  $('docResponsavel').textContent = safe(val('responsavel'));
  $('docTelefone').textContent = safe(val('telefone'));
  $('docEmail').textContent = safe(val('email'));
  $('docEndereco').textContent = safe(val('endereco'));
  $('docAssinante').textContent = val('responsavel') || 'Contratante';
  $('docVencimento').textContent = val('vencimento');
  $('docFidelidade').textContent = val('fidelidade');
  $('docValidade').textContent = val('validadeProposta');
  $('docValidade2').textContent = val('validadeProposta');
  $('docObservacoes').textContent = val('observacoes');

  const saleBody = $('docSaleRows');
  saleBody.innerHTML = '';
  saleRows().forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${item.nome}</td><td>${item.qty}</td><td>${brl.format(item.valor)}</td><td>${brl.format(item.valor*item.qty)}</td>`;
    saleBody.appendChild(tr);
  });
  if(!saleRows().length){ saleBody.innerHTML = '<tr><td colspan="4">Nenhum serviço selecionado.</td></tr>'; }

  const imp = num('implantacao'); const desc = num('descontoImplantacao'); const impTotal = Math.max(0, imp-desc);
  $('docImplantacao').textContent = brl.format(imp);
  $('docDesconto').textContent = `- ${brl.format(desc)}`;
  $('docTotalImplantacao').textContent = brl.format(impTotal);
  $('docTotalVenda').textContent = brl.format(totalVenda());

  const cRows = $('docCostRows'); cRows.innerHTML = '';
  costRows().forEach(r => {
    const div = document.createElement('div'); div.className = 'cost-row';
    div.innerHTML = `<span>${r.nome}${r.qtd && r.qtd !== 1 && r.id !== 'pdvs' ? ` — QTD. ${r.qtd}` : ''}</span><strong>${brl.format(r.total)}</strong>`;
    cRows.appendChild(div);
  });
  $('docTotalCusto').textContent = brl.format(totalCusto());
}

function updateAll(){
  $('totalVenda').textContent = brl.format(totalVenda());
  const p = pdvCost();
  $('totalCusto').textContent = brl.format(totalCusto());
  $('regraPdvs').textContent = p.desc;
  updateContract();
}

function setupSignature(){
  const canvas = $('signature'); const ctx = canvas.getContext('2d'); let drawing = false;
  function pos(e){ const rect = canvas.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return {x:(t.clientX-rect.left)/rect.width*canvas.width, y:(t.clientY-rect.top)/rect.height*canvas.height}; }
  function start(e){ e.preventDefault(); drawing=true; const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); }
  function move(e){ if(!drawing)return; e.preventDefault(); const p=pos(e); ctx.lineTo(p.x,p.y); ctx.strokeStyle='#0f172a'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke(); const img=$('docSignature'); img.src=canvas.toDataURL('image/png'); img.style.display='block'; }
  function end(){ drawing=false; }
  canvas.addEventListener('mousedown',start); canvas.addEventListener('mousemove',move); canvas.addEventListener('mouseup',end); canvas.addEventListener('mouseleave',end);
  canvas.addEventListener('touchstart',start,{passive:false}); canvas.addEventListener('touchmove',move,{passive:false}); canvas.addEventListener('touchend',end);
  $('clearSignature').addEventListener('click',()=>{ctx.clearRect(0,0,canvas.width,canvas.height); $('docSignature').removeAttribute('src'); $('docSignature').style.display='none';});
}

function init(){
  $('numeroContrato').value = `WEB-${new Date().getFullYear()}-001`;
  $('dataContrato').value = todayBR();
  renderVenda(); renderCustos(); updateQuantityLocks(); setupSignature();
  document.querySelectorAll('input, textarea').forEach(el => el.addEventListener('input', () => {
    if(el.id === 'documento') { el.value = formatDoc(el.value); $('labelDocumento').textContent = docType(el.value); }
    updateAll();
  }));
  $('btnPrint').addEventListener('click', () => window.print());
  updateAll();
}
init();
