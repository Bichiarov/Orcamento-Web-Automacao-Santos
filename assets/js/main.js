import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, doc, getDoc, setDoc, addDoc, getDocs, query, orderBy, limit, serverTimestamp, runTransaction } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDv5O_X7F_NDYEoZYkfzgg5j-WLkNK-QLk",
  authDomain: "web-automacao-santos-pdvlegal.firebaseapp.com",
  projectId: "web-automacao-santos-pdvlegal",
  storageBucket: "web-automacao-santos-pdvlegal.firebasestorage.app",
  messagingSenderId: "228810100304",
  appId: "1:228810100304:web:eca86e1f9b889484a20b55"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const produtosPadrao = [
  { nome: "PDV Legal — Plano Base com Retaguarda", valor: 159.9 },
  { nome: "PDV adicional", valor: 49.9 },
  { nome: "Estoque", valor: 20 },
  { nome: "Financeiro", valor: 20 },
  { nome: "Tablet na Mesa", valor: 39.9 },
  { nome: "QR Code na Mesa", valor: 39.9 },
  { nome: "Controle de Portaria", valor: 39.9 },
  { nome: "BYP", valor: 299.9 },
  { nome: "Fidelidade Legal", valor: 249.9 },
  { nome: "Delivery Legal", valor: 249.9 },
  { nome: "Certificado Digital", valor: 199.9 },
  { nome: "Balanças Autônomas", valor: 39.9 },
  { nome: "KDS PDV Legal", valor: 39.9 },
  { nome: "Totem TokMenu", valor: 79.9 },
  { nome: "KDS TokMenu", valor: 39.9 }
];

const state = {
  numero: `WEB-${new Date().getFullYear()}-0000`,
  itens: [{ descricao: "PDV Legal — Plano Base com Retaguarda", quantidade: 1, valor: 159.9 }],
  descontos: [],
  precos: Object.fromEntries(produtosPadrao.map(p => [p.nome, p.valor]))
};

const $ = id => document.getElementById(id);
const money = v => Number(v || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
function hojeISO(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function dataBR(v){ if(!v) return ''; const [a,m,d]=v.split('-'); return `${d}/${m}/${a}`; }
function onlyNums(v){ return String(v||'').replace(/[^0-9]/g,''); }
function docLabel(v){ const n=onlyNums(v); if(!n.length) return 'CPF/CNPJ'; return n.length > 11 ? 'CNPJ' : 'CPF'; }
function fmtDoc(v){ const d=onlyNums(v).slice(0,14); if(d.length<=11) return d.replace(/([0-9]{3})([0-9])/,'$1.$2').replace(/([0-9]{3})([0-9])/,'$1.$2').replace(/([0-9]{3})([0-9]{1,2})$/,'$1-$2'); return d.replace(/([0-9]{2})([0-9])/,'$1.$2').replace(/([0-9]{3})([0-9])/,'$1.$2').replace(/([0-9]{3})([0-9])/,'$1/$2').replace(/([0-9]{4})([0-9]{1,2})$/,'$1-$2'); }
function safeFile(v){ return String(v||'cliente').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'_').toLowerCase(); }

let documentLookupTimer = null;
let lastLookupDocument = '';

function init(){
  $('data').value = hojeISO();
  produtosPadrao.forEach(p => $('produtoSelecionado').append(new Option(p.nome, p.nome)));
  renderPriceList(); bindEvents(); updatePreview();
}

function bindEvents(){
  ['clienteNome','data','telefone','responsavel','email','endereco','implementacao','validade','vencimento'].forEach(id=>$(id).addEventListener('input', updatePreview));
  $('documento').addEventListener('input', onDocumentoInput);
  $('addItem').onclick = addItem;
  $('clearBudget').onclick = () => { state.itens = []; state.descontos = []; updatePreview(); };
  $('removeLast').onclick = () => { state.itens.pop(); updatePreview(); };
  $('togglePrices').onclick = () => $('pricePanel').classList.toggle('hidden');
  $('resetPrices').onclick = () => { state.precos = Object.fromEntries(produtosPadrao.map(p => [p.nome, p.valor])); renderPriceList(); };
  $('addDiscount').onclick = addDiscount;
  $('generatePdfs').onclick = gerarOrcamentoPdf;
  const gerarContratoBtn = $('generateContract');
  if(gerarContratoBtn) gerarContratoBtn.onclick = gerarContratoPdf;
  $('sendWhats').onclick = enviarWhatsApp;
  $('saveBudget').onclick = salvarOrcamento;
  $('loadSaved').onclick = buscarSalvos;
}


function setLookupStatus(msg, type='info'){
  const el = $('docLookupStatus');
  if(!el) return;
  el.textContent = msg || '';
  el.className = `lookup-status ${type}`;
}

function preencherCliente(clienteData){
  if(!clienteData) return;
  if(clienteData.nome && !$('clienteNome').value) $('clienteNome').value = clienteData.nome;
  if(clienteData.responsavel && !$('responsavel').value) $('responsavel').value = clienteData.responsavel;
  if(clienteData.telefone && !$('telefone').value) $('telefone').value = clienteData.telefone;
  if(clienteData.email && !$('email').value) $('email').value = clienteData.email;
  if(clienteData.endereco && !$('endereco').value) $('endereco').value = clienteData.endereco;
  updatePreview();
}

async function buscarClienteSalvoPorDocumento(digitos){
  try{
    const ref = doc(db, 'clientes', digitos);
    const snap = await getDoc(ref);
    if(snap.exists()) return snap.data();
  }catch(err){
    console.warn('Não foi possível buscar cliente salvo:', err);
  }
  return null;
}

function limparCep(cep){ return String(cep || '').replace(/[^0-9]/g, ''); }

async function consultarCepPublico(cep){
  const cepLimpo = limparCep(cep);
  if(cepLimpo.length !== 8) return {};
  try{
    const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    if(!resposta.ok) return {};
    const dados = await resposta.json();
    if(dados.erro) return {};
    return dados;
  }catch(err){
    console.warn('Não foi possível consultar o CEP:', err);
    return {};
  }
}

function valorEndereco(dados, campos){
  for(const campo of campos){
    const valor = dados?.[campo];
    if(valor !== undefined && valor !== null && String(valor).trim() !== '') return String(valor).trim();
  }
  return '';
}

function montarEnderecoCnpj(dados){
  const tipoLogradouro = valorEndereco(dados, ['tipo_logradouro','descricao_tipo_de_logradouro','tipoLogradouro','tipo']);
  const logradouroBase = valorEndereco(dados, ['logradouro','nome_logradouro','descricao_logradouro','endereco_logradouro','rua','address','street']);
  const logradouro = [tipoLogradouro, logradouroBase]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const numero = valorEndereco(dados, ['numero','numero_logradouro','numero_endereco','numeroEstabelecimento','numero_estabelecimento','address_number','number']);
  const complemento = valorEndereco(dados, ['complemento','complemento_logradouro','complemento_endereco','address_complement']);
  const bairro = valorEndereco(dados, ['bairro','distrito','district']);
  const municipio = valorEndereco(dados, ['municipio','cidade','localidade','city']);
  const uf = valorEndereco(dados, ['uf','estado','state']);
  const cep = valorEndereco(dados, ['cep','zipcode']);

  const partes = [];
  if(logradouro) partes.push(numero ? `${logradouro}, nº ${numero}` : logradouro);
  if(complemento) partes.push(complemento);
  if(bairro) partes.push(bairro);
  if(municipio || uf) partes.push(`${municipio}${uf ? `/${uf}` : ''}`);
  if(cep) partes.push(`CEP: ${cep}`);
  return partes.join(', ');
}

async function consultarCnpjPublico(digitos){
  const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digitos}`);
  if(!resposta.ok) throw new Error('CNPJ não encontrado na consulta pública.');
  const dados = await resposta.json();

  const cepDados = await consultarCepPublico(dados.cep);
  const dadosCompletos = {
    ...dados,
    logradouro: dados.logradouro || dados.descricao_logradouro || dados.rua || cepDados.logradouro || '',
    numero: dados.numero || dados.numero_logradouro || dados.numero_endereco || dados.numeroEstabelecimento || dados.numero_estabelecimento || '',
    complemento: dados.complemento || dados.complemento_logradouro || dados.complemento_endereco || cepDados.complemento || '',
    bairro: dados.bairro || cepDados.bairro || '',
    municipio: dados.municipio || dados.cidade || cepDados.localidade || '',
    uf: dados.uf || dados.estado || cepDados.uf || '',
    cep: dados.cep || cepDados.cep || ''
  };

  return {
    nome: dados.nome_fantasia || dados.razao_social || '',
    responsavel: '',
    telefone: dados.ddd_telefone_1 || dados.ddd_telefone_2 || '',
    email: dados.email || '',
    endereco: montarEnderecoCnpj(dadosCompletos)
  };
}

async function preencherDadosPorDocumento(digitos){
  if(!digitos || digitos === lastLookupDocument) return;
  if(digitos.length !== 11 && digitos.length !== 14) return;

  lastLookupDocument = digitos;
  const isCnpj = digitos.length === 14;
  setLookupStatus(isCnpj ? 'Buscando CNPJ...' : 'Buscando cliente salvo...');

  const clienteSalvo = await buscarClienteSalvoPorDocumento(digitos);
  if(clienteSalvo){
    preencherCliente(clienteSalvo);
    setLookupStatus('Dados preenchidos pelo cadastro salvo.', 'ok');
    return;
  }

  if(!isCnpj){
    setLookupStatus('CPF não encontrado nos clientes salvos. Preencha manualmente.', 'warn');
    return;
  }

  try{
    const dadosCnpj = await consultarCnpjPublico(digitos);
    preencherCliente(dadosCnpj);
    setLookupStatus('Dados preenchidos pela consulta pública do CNPJ.', 'ok');
  }catch(err){
    console.warn(err);
    setLookupStatus('Não foi possível consultar este CNPJ. Preencha manualmente.', 'warn');
  }
}

function onDocumentoInput(e){
  e.target.value = fmtDoc(e.target.value);
  const digitos = onlyNums(e.target.value);
  $('docLabel').textContent = docLabel(e.target.value);
  updatePreview();
  clearTimeout(documentLookupTimer);
  setLookupStatus('');
  if(digitos.length === 11 || digitos.length === 14){
    documentLookupTimer = setTimeout(() => preencherDadosPorDocumento(digitos), 650);
  }else{
    lastLookupDocument = '';
  }
}

function renderPriceList(){
  const list = $('priceList'); list.innerHTML = '';
  produtosPadrao.forEach(p=>{
    const row = document.createElement('div'); row.className='price-item';
    row.innerHTML = `<span>${p.nome}</span><input type="number" step="0.01" value="${state.precos[p.nome] ?? p.valor}">`;
    row.querySelector('input').addEventListener('input', e => { state.precos[p.nome] = Number(e.target.value||0); });
    list.append(row);
  });
}

function addItem(){
  const nome = $('produtoSelecionado').value;
  const qtd = Math.max(1, Number($('quantidade').value || 1));
  state.itens.push({ descricao:nome, quantidade:qtd, valor:Number(state.precos[nome] || 0) }); updatePreview();
}
function addDiscount(){
  const valor = Number($('descontoValor').value || 0); if(valor <= 0) return;
  state.descontos.push({ tipo:$('descontoTipo').value, descricao:$('descontoDescricao').value || 'Desconto comercial', valor });
  $('descontoDescricao').value=''; $('descontoValor').value=''; updatePreview();
}

function getData(){
  const subtotal = state.itens.reduce((a,i)=>a + i.quantidade*i.valor,0);
  const descMensal = state.descontos.filter(d=>d.tipo==='mensalidade').reduce((a,d)=>a+d.valor,0);
  const descImpl = state.descontos.filter(d=>d.tipo==='implementacao').reduce((a,d)=>a+d.valor,0);
  const impl = Number($('implementacao').value || 0);
  return {
    numero: state.numero, data:$('data').value, validade:$('validade').value, vencimento:$('vencimento').value,
    cliente:{ nome:$('clienteNome').value, documento:$('documento').value, responsavel:$('responsavel').value, telefone:$('telefone').value, email:$('email').value, endereco:$('endereco').value },
    itens: state.itens, descontos: state.descontos,
    totais:{ subtotal, descMensal, descImpl, mensalidade:Math.max(0,subtotal-descMensal), implementacao:impl, implementacaoLiquida:Math.max(0,impl-descImpl) }
  };
}

function updatePreview(){
  const d = getData();
  $('numeroPreview').textContent = d.numero; $('dataPreview').textContent = dataBR(d.data);
  $('pvCliente').textContent = d.cliente.nome || '________________________________'; $('pvDocLabel').textContent = docLabel(d.cliente.documento)+':'; $('pvDocumento').textContent = d.cliente.documento || '________________';
  $('pvResponsavel').textContent = d.cliente.responsavel || '________________'; $('pvTelefone').textContent = d.cliente.telefone || '________________'; $('pvEmail').textContent = d.cliente.email || '________________'; $('pvEndereco').textContent = d.cliente.endereco || '________________';
  $('sigCliente').textContent = d.cliente.responsavel || 'Contratante'; $('sigDoc').textContent = `${docLabel(d.cliente.documento)}: ${d.cliente.documento || '________________'}`;
  const tbody=$('itemsTable'); tbody.innerHTML='';
  if(d.itens.length===0){ tbody.innerHTML='<tr><td colspan="4" style="text-align:center;color:#94a3b8">Nenhum item adicionado.</td></tr>'; }
  d.itens.forEach(i=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${i.descricao}</td><td>${i.quantidade}</td><td>${money(i.valor)}</td><td><b>${money(i.quantidade*i.valor)}</b></td>`; tbody.append(tr); });
  $('pvImplementacao').textContent = money(d.totais.implementacao); $('pvTotalImpl').textContent=money(d.totais.implementacaoLiquida); $('pvMensalidade').textContent=money(d.totais.mensalidade); $('pvVencimento').textContent=d.vencimento; $('pvValidade').textContent=d.validade;
  renderDiscounts(d); fillContract(d);
}
function renderDiscounts(d){
  $('descontosImpl').innerHTML=''; $('descontosMensal').innerHTML='';
  d.descontos.filter(x=>x.tipo==='implementacao').forEach(x=> $('descontosImpl').insertAdjacentHTML('beforeend', `<p class="discount-line"><span>${x.descricao}:</span><b>- ${money(x.valor)}</b></p>`));
  d.descontos.filter(x=>x.tipo==='mensalidade').forEach(x=> $('descontosMensal').insertAdjacentHTML('beforeend', `<p class="discount-line"><span>${x.descricao}:</span><b>- ${money(x.valor)}</b></p>`));
}
function fillContract(d){
  document.querySelectorAll('[data-campo="clienteNome"]').forEach(e=>e.textContent=d.cliente.nome||'CONTRATANTE');
  document.querySelectorAll('[data-campo="endereco"]').forEach(e=>e.textContent=d.cliente.endereco||'________________');
  document.querySelectorAll('[data-campo="documento"]').forEach(e=>e.textContent=d.cliente.documento||'________________');
  document.querySelectorAll('[data-campo="email"]').forEach(e=>e.textContent=d.cliente.email||'________________');
  document.querySelectorAll('[data-campo="responsavel"]').forEach(e=>e.textContent=d.cliente.responsavel||'________________');
  document.querySelectorAll('[data-campo="mensalidade"]').forEach(e=>e.textContent=money(d.totais.mensalidade));
  document.querySelectorAll('[data-campo="implementacao"]').forEach(e=>e.textContent=money(d.totais.implementacaoLiquida));
  document.querySelectorAll('[data-campo="data"]').forEach(e=>e.textContent=dataBR(d.data));
}

async function reservarNumero(){
  if(state.numero && !state.numero.endsWith('0000')) return state.numero;
  const ano = new Date().getFullYear(); const ref = doc(db,'controle',`numeracao_${ano}`);
  const novo = await runTransaction(db, async tx => { const snap=await tx.get(ref); const atual=snap.exists()?Number(snap.data().ultimoNumero||0):0; const prox=atual+1; tx.set(ref,{ultimoNumero:prox, atualizadoEm:serverTimestamp()},{merge:true}); return prox; });
  state.numero = `WEB-${ano}-${String(novo).padStart(4,'0')}`; updatePreview(); return state.numero;
}

async function elementToPdfFile(element, filename){
  const clone = element.cloneNode(true);
  clone.style.width = '210mm';
  clone.style.height = '297mm';
  clone.style.minHeight = '297mm';
  clone.style.maxHeight = '297mm';
  clone.style.margin = '0';
  clone.style.borderRadius = '0';
  clone.style.boxShadow = 'none';
  clone.style.overflow = 'hidden';

  const holder = document.createElement('div');
  holder.style.position = 'fixed';
  holder.style.left = '-10000px';
  holder.style.top = '0';
  holder.style.width = '210mm';
  holder.style.height = '297mm';
  holder.style.background = '#ffffff';
  holder.appendChild(clone);
  document.body.appendChild(holder);

  const canvas = await html2canvas(clone,{scale:2,useCORS:true,backgroundColor:'#ffffff',width:clone.scrollWidth,height:clone.scrollHeight});
  holder.remove();

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p','mm','a4');
  const img = canvas.toDataURL('image/jpeg',0.98);
  pdf.addImage(img,'JPEG',0,0,210,297);
  return new File([pdf.output('blob')],filename,{type:'application/pdf'});
}
async function contractToPdfFile(filename){
  const { jsPDF } = window.jspdf;
  const sourcePages = [...document.querySelectorAll('.contract-page')];

  const holder = document.createElement('div');
  holder.style.position = 'fixed';
  holder.style.left = '-10000px';
  holder.style.top = '0';
  holder.style.width = '210mm';
  holder.style.background = '#ffffff';
  holder.style.color = '#000000';
  holder.style.boxSizing = 'border-box';
  holder.style.padding = '5mm';
  holder.style.fontFamily = 'Arial, Helvetica, sans-serif';

  const flow = document.createElement('div');
  flow.style.width = '100%';
  flow.style.fontSize = '6.2px';
  flow.style.lineHeight = '1.03';

  sourcePages.forEach((page) => {
    const clone = page.cloneNode(true);
    clone.style.width = '100%';
    clone.style.minHeight = 'auto';
    clone.style.height = 'auto';
    clone.style.margin = '0';
    clone.style.padding = '0';
    clone.style.background = 'transparent';
    clone.style.boxShadow = 'none';
    clone.style.pageBreakAfter = 'auto';

    clone.querySelectorAll('h1').forEach(h => {
      h.style.fontSize = '10px';
      h.style.textAlign = 'center';
      h.style.margin = '0 0 2px 0';
      h.style.lineHeight = '1.05';
    });
    clone.querySelectorAll('h2').forEach(h => {
      h.style.fontSize = '8px';
      h.style.textAlign = 'center';
      h.style.margin = '0 0 2px 0';
      h.style.lineHeight = '1.05';
    });
    clone.querySelectorAll('h3').forEach(h => {
      h.style.fontSize = '6.6px';
      h.style.margin = '2px 0 1px 0';
      h.style.lineHeight = '1.03';
    });
    clone.querySelectorAll('p').forEach(par => {
      par.style.margin = '0 0 1px 0';
      par.style.lineHeight = '1.03';
      par.style.fontSize = '6.2px';
      par.style.textAlign = 'justify';
    });
    clone.querySelectorAll('.contract-signatures').forEach(block => {
      block.style.marginTop = '5px';
      block.style.gap = '10px';
    });

    flow.appendChild(clone);
  });

  holder.appendChild(flow);
  document.body.appendChild(holder);

  const canvas = await html2canvas(holder, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#ffffff',
    width: holder.scrollWidth,
    height: holder.scrollHeight,
    windowWidth: holder.scrollWidth,
    windowHeight: holder.scrollHeight
  });

  holder.remove();

  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/jpeg', 0.98);
  pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  return new File([pdf.output('blob')], filename, { type: 'application/pdf' });
}

function downloadFile(file){ const url=URL.createObjectURL(file); const a=document.createElement('a'); a.href=url; a.download=file.name; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),800); }
async function gerarOrcamentoPdf(){ await reservarNumero(); const d=getData(); const base=`${safeFile(d.cliente.nome)}_${d.numero}`; downloadFile(await elementToPdfFile($('orcamentoDoc'),`orcamento_${base}.pdf`)); }
async function gerarContratoPdf(){ await reservarNumero(); const d=getData(); const base=`${safeFile(d.cliente.nome)}_${d.numero}`; downloadFile(await contractToPdfFile(`contrato_${base}.pdf`)); }
async function enviarWhatsApp(){ await reservarNumero(); const d=getData(); downloadFile(await elementToPdfFile($('orcamentoDoc'),`orcamento_${safeFile(d.cliente.nome)}_${d.numero}.pdf`)); const msg = `Olá! Tudo bem? Somos da Web Automação Santos. Segue o orçamento comercial do PDV Legal preparado para sua empresa.\n\nO orçamento em PDF foi baixado no dispositivo. Anexe o arquivo nesta conversa do WhatsApp.`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,'_blank','noopener,noreferrer'); }
async function salvarCliente(d){
  const digitos = onlyNums(d.cliente.documento);
  if(!digitos) return;
  await setDoc(doc(db, 'clientes', digitos), {
    ...d.cliente,
    documentoNumeros: digitos,
    tipoDocumento: digitos.length > 11 ? 'CNPJ' : 'CPF',
    atualizadoEm: serverTimestamp(),
    criadoEm: serverTimestamp()
  }, { merge: true });
}
async function salvarOrcamento(){ await reservarNumero(); const d=getData(); await salvarCliente(d); await addDoc(collection(db,'orcamentos'),{...d, documentoNumeros: onlyNums(d.cliente.documento), criadoEm:serverTimestamp(), atualizadoEm:serverTimestamp(), status:'Aberto'}); alert('Orçamento salvo com sucesso.'); }
async function buscarSalvos(){
  const list=$('savedList'); list.innerHTML='Carregando...'; list.classList.remove('hidden'); let snaps=[];
  try{ const q=query(collection(db,'orcamentos'), orderBy('criadoEm','desc'), limit(15)); snaps=(await getDocs(q)).docs; }catch(e){ snaps=(await getDocs(collection(db,'orcamentos'))).docs; }
  list.innerHTML=''; if(!snaps.length){list.innerHTML='<div class="saved-item">Nenhum orçamento salvo encontrado.</div>';return;}
  snaps.forEach(s=>{ const d=s.data(); const el=document.createElement('div'); el.className='saved-item'; el.innerHTML=`<b>${d.numero||'Sem número'}</b><br>${d.cliente?.nome||'Cliente não informado'}<br>${money(d.totais?.mensalidade||0)}`; el.onclick=()=>loadBudget(d); list.append(el); });
}
function loadBudget(d){ state.numero=d.numero||state.numero; state.itens=d.itens||[]; state.descontos=d.descontos||[]; $('clienteNome').value=d.cliente?.nome||''; $('documento').value=d.cliente?.documento||''; $('responsavel').value=d.cliente?.responsavel||''; $('telefone').value=d.cliente?.telefone||''; $('email').value=d.cliente?.email||''; $('endereco').value=d.cliente?.endereco||''; $('data').value=d.data||hojeISO(); $('validade').value=d.validade||'10 dias'; $('vencimento').value=d.vencimento||'Todo dia 10'; $('implementacao').value=d.totais?.implementacao||450; updatePreview(); window.scrollTo({top:0,behavior:'smooth'}); }

init();
