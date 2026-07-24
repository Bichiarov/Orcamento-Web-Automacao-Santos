import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, doc, getDoc, setDoc, addDoc, getDocs, query, orderBy, limit, serverTimestamp, runTransaction } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

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
const auth = getAuth(app);
let appInitialized = false;

const modulosBase = [
  "Gestão em Nuvem",
  "Gestão de entregas offline",
  "Emissão de fichas",
  "Integração Delivery iFood, 99 Food e Keeta",
  "Controle Fiado",
  "Gestão de Fichas",
  "Mesas e Comandas"
];

const produtosPadrao = [
  { tipo: "pacote", nome: "START", titulo: "Plano START", valor: 159.9, recorrencia: "Mensal", inclui: [...modulosBase] },
  { tipo: "pacote", nome: "ESSENCIAL", titulo: "Plano ESSENCIAL", valor: 199.9, recorrencia: "Mensal", inclui: [...modulosBase, "Estoque"] },
  { tipo: "pacote", nome: "PROFISSIONAL", titulo: "Plano PROFISSIONAL", valor: 259.9, recorrencia: "Mensal", inclui: [...modulosBase, "Estoque", "Financeiro"] },
  { tipo: "pacote", nome: "AVANÇADO", titulo: "Plano AVANÇADO", valor: 329.9, recorrencia: "Mensal", inclui: [...modulosBase, "Estoque", "Financeiro", "Controle de Portaria"] },
  { tipo: "pacote", nome: "ELITE", titulo: "Plano ELITE", valor: 389.9, recorrencia: "Mensal", inclui: [...modulosBase, "Estoque", "Financeiro", "Controle de Portaria", "Cardápio QR Code Mesas"] },

  { tipo: "produto", nome: "01 – Retaguarda 🖥️", titulo: "01 – Retaguarda 🖥️", valor: 60, recorrencia: "Mensal" },
  { tipo: "produto", nome: "02 – Módulo Estoque 📦", titulo: "02 – Módulo Estoque 📦", valor: 39.9, recorrencia: "Mensal" },
  { tipo: "produto", nome: "03 – Módulo Fiscal 🧾", titulo: "03 – Módulo Fiscal 🧾", valor: 0, recorrencia: "Mensal" },
  { tipo: "produto", nome: "04 – Módulo Financeiro 💰", titulo: "04 – Módulo Financeiro 💰", valor: 30, recorrencia: "Mensal" },
  { tipo: "produto", nome: "05 – Mata Ficha 🎫", titulo: "05 – Mata Ficha 🎫", valor: 0, recorrencia: "Mensal" },
  { tipo: "produto", nome: "06 – Integração Delivery 🛵", titulo: "06 – Integração Delivery 🛵", valor: 0, recorrencia: "Mensal" },
  { tipo: "produto", nome: "07 – Conta Assinada ✍️", titulo: "07 – Conta Assinada ✍️", valor: 0, recorrencia: "Mensal" },
  { tipo: "produto", nome: "08 – Validação de CPF 🔎", titulo: "08 – Validação de CPF 🔎", valor: 0, recorrencia: "Mensal" },
  { tipo: "produto", nome: "09 – Servidor Windows 🖥️", titulo: "09 – Servidor Windows 🖥️", valor: 0, recorrencia: "Mensal" },
  { tipo: "produto", nome: "10 – Tablet na Mesa 📱", titulo: "10 – Tablet na Mesa 📱", valor: 39.9, recorrencia: "Mensal" },
  { tipo: "produto", nome: "11 – QR Code na Mesa 📲", titulo: "11 – QR Code na Mesa 📲", valor: 39.9, recorrencia: "Mensal" },
  { tipo: "produto", nome: "12 – Controle de Portaria 🚪", titulo: "12 – Controle de Portaria 🚪", valor: 39.9, recorrencia: "Mensal" },
  { tipo: "produto", nome: "13 – BYP 🧮", titulo: "13 – BYP 🧮", valor: 299.9, recorrencia: "Mensal" },
  { tipo: "produto", nome: "14 – BYP Ticket 🎟️", titulo: "14 – BYP Ticket 🎟️", valor: 0, recorrencia: "Mensal" },
  { tipo: "produto", nome: "15 – Fidelidade Legal 🪪", titulo: "15 – Fidelidade Legal 🪪", valor: 249.9, recorrencia: "Mensal" },
  { tipo: "produto", nome: "16 – Delivery Legal 🍽️", titulo: "16 – Delivery Legal 🍽️", valor: 249.9, recorrencia: "Mensal" },
  { tipo: "produto", nome: "17 – Certificado Digital 🔐", titulo: "17 – Certificado Digital 🔐", valor: 199.9, recorrencia: "Anual" },
  { tipo: "produto", nome: "18 – Balança Autônoma ⚖️", titulo: "18 – Balança Autônoma ⚖️", valor: 39.9, recorrencia: "Mensal" },
  { tipo: "produto", nome: "19 – KDS (PDV Legal) 📺", titulo: "19 – KDS (PDV Legal) 📺", valor: 39.9, recorrencia: "Mensal" },
  { tipo: "produto", nome: "20 – Totem TokMenu ⚡", titulo: "20 – Totem TokMenu ⚡", valor: 79.9, recorrencia: "Mensal" },
  { tipo: "produto", nome: "21 – KDS TokMenu 📺", titulo: "21 – KDS TokMenu 📺", valor: 39.9, recorrencia: "Mensal" },
  { tipo: "produto", nome: "22 – PDV 🖨️", titulo: "22 – PDV 🖨️", valor: 20, recorrencia: "Mensal" },
  { tipo: "produto", nome: "23 – Treinamento e Implantação 🎓", titulo: "23 – Treinamento e Implantação 🎓", valor: 450, recorrencia: "Único" },
  { tipo: "produto", nome: "24 – Servidor Legal 🤙", titulo: "24 – Servidor Legal 🤙", valor: 0, recorrencia: "Mensal" }
];

function getProduto(nome){
  return produtosPadrao.find(p => p.nome === nome) || produtosPadrao[0];
}

function valorAtualProduto(nome){
  const produto = getProduto(nome);
  return Number(state.precos[nome] ?? produto.valor ?? 0);
}

function atualizarValorUnitarioSelecionado(){
  const campo = $('valorUnitarioItem');
  const seletor = $('produtoSelecionado');
  if(!campo || !seletor) return;
  campo.value = valorAtualProduto(seletor.value).toFixed(2);
}

const state = {
  numero: `WEB-${new Date().getFullYear()}-0000`,
  itens: [],
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
  if(appInitialized) return;
  appInitialized = true;
  $('data').value = hojeISO();
  const seletor = $('produtoSelecionado');
  seletor.innerHTML = '';
  const grupoPacotes = document.createElement('optgroup');
  grupoPacotes.label = 'PACOTES';
  produtosPadrao.filter(p => p.tipo === 'pacote').forEach(p => grupoPacotes.append(new Option(p.nome, p.nome)));
  const grupoProdutos = document.createElement('optgroup');
  grupoProdutos.label = 'PRODUTOS E SERVIÇOS';
  produtosPadrao.filter(p => p.tipo !== 'pacote').forEach(p => grupoProdutos.append(new Option(p.nome, p.nome)));
  seletor.append(grupoPacotes, grupoProdutos);
  atualizarValorUnitarioSelecionado();
  renderPriceList(); bindEvents(); updatePreview();
}

function bindEvents(){
  ['clienteNome','data','telefone','responsavel','email','endereco','implementacao','validade','vencimento'].forEach(id=>$(id).addEventListener('input', updatePreview));
  $('documento').addEventListener('input', onDocumentoInput);
  $('produtoSelecionado').addEventListener('change', atualizarValorUnitarioSelecionado);
  $('valorUnitarioItem').addEventListener('input', () => {});
  $('addItem').onclick = addItem;
  $('clearBudget').onclick = () => { state.itens = []; state.descontos = []; updatePreview(); if(!$('pricePanel').classList.contains('hidden')) renderPriceList(); };
  $('removeLast').onclick = () => { if(state.itens.length > 0) state.itens.pop(); updatePreview(); if(!$('pricePanel').classList.contains('hidden')) renderPriceList(); };
  $('togglePrices').onclick = () => {
    renderPriceList();
    $('pricePanel').classList.toggle('hidden');
  };
  $('resetPrices').onclick = () => {
    state.itens = state.itens.map(item => {
      const produto = getProduto(item.nome);
      return { ...item, valor: Number(produto.valor || 0) };
    });
    state.precos = Object.fromEntries(produtosPadrao.map(p => [p.nome, p.valor]));
    renderPriceList();
    atualizarValorUnitarioSelecionado();
    updatePreview();
  };
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

function preencherCliente(clienteData, sobrescrever=false){
  if(!clienteData) return;
  if(sobrescrever){
    if(clienteData.nome) $('clienteNome').value = clienteData.nome;
    if(clienteData.responsavel) $('responsavel').value = clienteData.responsavel;
    if(clienteData.telefone) $('telefone').value = clienteData.telefone;
    if(clienteData.email) $('email').value = clienteData.email;
    if(clienteData.endereco) $('endereco').value = clienteData.endereco;
  }else{
    if(clienteData.nome && !$('clienteNome').value) $('clienteNome').value = clienteData.nome;
    if(clienteData.responsavel && !$('responsavel').value) $('responsavel').value = clienteData.responsavel;
    if(clienteData.telefone && !$('telefone').value) $('telefone').value = clienteData.telefone;
    if(clienteData.email && !$('email').value) $('email').value = clienteData.email;
    if(clienteData.endereco && !$('endereco').value) $('endereco').value = clienteData.endereco;
  }
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

function enderecoWebAutomacao(){
  return 'Rua Engenheiro Alfredo Capelache, 121, Apt 02, Aparecida, Santos/SP, CEP: 11035230';
}

function montarEnderecoCnpj(dados){
  const cnpj = onlyNums(dados.cnpj || dados.documento || '');
  if(cnpj === '23349902000133') return enderecoWebAutomacao();

  const tipo = dados.tipo_logradouro || dados.descricao_tipo_de_logradouro || '';
  const logradouro = dados.logradouro || dados.nome_logradouro || dados.descricao_logradouro || dados.rua || '';
  const rua = [tipo, logradouro].filter(Boolean).join(' ').trim();
  const numero = dados.numero || dados.numero_logradouro || dados.numeroLogradouro || '';
  const complemento = dados.complemento || dados.complemento_logradouro || dados.apartamento || dados.sala || '';
  return [rua ? (numero ? `${rua}, ${numero}` : rua) : '', complemento, dados.bairro, dados.municipio || dados.cidade, dados.uf, dados.cep ? `CEP: ${dados.cep}` : '']
    .filter(Boolean)
    .join(', ');
}

async function consultarCnpjPublico(digitos){
  if(digitos === '23349902000133'){
    return {
      nome: 'ALEXANDER EMIDIO BICHIAROV 30642954895',
      responsavel: 'ALEXANDER EMIDIO BICHIAROV',
      telefone: '',
      email: '',
      endereco: enderecoWebAutomacao()
    };
  }
  if(digitos === '23515297000123'){
    return {
      nome: '23.515.297 RAFAEL R',
      responsavel: 'RAFAEL',
      telefone: '',
      email: '',
      endereco: 'Rua Doutor Bernardo Browne, 172, Estuário, Santos/SP, CEP: 11025240'
    };
  }

  const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digitos}`);
  if(!resposta.ok) throw new Error('CNPJ não encontrado na consulta pública.');
  const dados = await resposta.json();
  const qsa = Array.isArray(dados.qsa) && dados.qsa.length ? dados.qsa[0] : null;
  const responsavel =
    dados.responsavel_federativo ||
    dados.responsavel ||
    dados.nome_responsavel ||
    qsa?.nome_socio ||
    qsa?.nome ||
    '';

  return {
    nome: dados.nome_fantasia || dados.razao_social || '',
    responsavel,
    telefone: dados.ddd_telefone_1 || dados.ddd_telefone_2 || '',
    email: dados.email || '',
    endereco: montarEnderecoCnpj({...dados, cnpj: digitos})
  };
}

async function preencherDadosPorDocumento(digitos){
  if(!digitos || digitos === lastLookupDocument) return;
  if(digitos.length !== 11 && digitos.length !== 14) return;

  lastLookupDocument = digitos;
  const isCnpj = digitos.length === 14;
  setLookupStatus(isCnpj ? 'Buscando CNPJ...' : 'Buscando cliente salvo...');

  const clienteSalvo = await buscarClienteSalvoPorDocumento(digitos);
  if(clienteSalvo && !isCnpj){
    preencherCliente(clienteSalvo, true);
    setLookupStatus('Dados preenchidos pelo cadastro salvo.', 'ok');
    return;
  }

  if(!isCnpj){
    setLookupStatus('CPF não encontrado nos clientes salvos. Preencha manualmente.', 'warn');
    return;
  }

  try{
    const dadosCnpj = await consultarCnpjPublico(digitos);
    const mesclado = {...(clienteSalvo || {}), ...dadosCnpj};
    preencherCliente(mesclado, true);
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
  if(digitos !== lastLookupDocument){
    ['clienteNome','responsavel','telefone','email','endereco'].forEach(id => { if($(id)) $(id).value = ''; });
  }
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
  const list = $('priceList');
  if(!list) return;
  list.innerHTML = '';

  if(state.itens.length === 0){
    list.innerHTML = '<div class="price-empty">Nenhum item lançado no orçamento. Adicione um produto ou pacote primeiro.</div>';
    return;
  }

  const titulo = document.createElement('div');
  titulo.className = 'price-group-title';
  titulo.textContent = 'ITENS LANÇADOS NO ORÇAMENTO';
  list.append(titulo);

  state.itens.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'price-item launched-price-item';
    row.innerHTML = `
      <span>
        ${item.descricao || item.nome}
        <small>${item.recorrencia || 'Mensal'} • Qtd.: ${item.quantidade}</small>
      </span>
      <input type="number" step="0.01" min="0" value="${Number(item.valor || 0).toFixed(2)}" aria-label="Valor de ${item.descricao || item.nome}">
    `;
    row.querySelector('input').addEventListener('input', e => {
      const novoValor = Number(String(e.target.value || '').replace(',', '.') || 0);
      state.itens[index].valor = Number.isFinite(novoValor) ? novoValor : 0;
      updatePreview();
    });
    list.append(row);
  });
}

function addItem(){
  const nome = $('produtoSelecionado').value;
  const produto = getProduto(nome);
  const qtd = Math.max(1, Number($('quantidade').value || 1));
  const valorDigitado = Number(String($('valorUnitarioItem')?.value || '').replace(',', '.') || 0);
  const valorFinal = Number.isFinite(valorDigitado) ? valorDigitado : valorAtualProduto(produto.nome);
  state.precos[produto.nome] = valorFinal;
  state.itens.push({
    descricao: produto.titulo || produto.nome,
    nome: produto.nome,
    tipo: produto.tipo,
    recorrencia: produto.recorrencia || 'Mensal',
    inclui: produto.inclui || [],
    quantidade: qtd,
    valor: valorFinal
  });
  updatePreview();
  if(!$('pricePanel').classList.contains('hidden')) renderPriceList();
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
  d.itens.forEach(i=>{
    const tr=document.createElement('tr');
    const inclui = Array.isArray(i.inclui) && i.inclui.length
      ? `<div class="package-description"><strong>Inclui:</strong><ul>${i.inclui.map(x => `<li>${x}</li>`).join('')}</ul></div>`
      : '';
    tr.innerHTML=`<td class="item-name-cell"><strong>${i.descricao}</strong><small>${i.recorrencia || 'Mensal'}</small>${inclui}</td><td>${i.quantidade}</td><td>${money(i.valor)}</td><td><b>${money(i.quantidade*i.valor)}</b></td>`;
    tbody.append(tr);
  });
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
  holder.style.color = '#0f172a';
  holder.style.boxSizing = 'border-box';
  holder.style.padding = '14mm 14mm 16mm 14mm';
  holder.style.fontFamily = 'Arial, Helvetica, sans-serif';

  const flow = document.createElement('div');
  flow.style.width = '100%';
  flow.style.fontSize = '12px';
  flow.style.lineHeight = '1.2';

  sourcePages.forEach((page, index) => {
    const clone = page.cloneNode(true);
    clone.style.width = '100%';
    clone.style.minHeight = 'auto';
    clone.style.height = 'auto';
    clone.style.margin = index === sourcePages.length - 1 ? '0' : '0 0 6mm 0';
    clone.style.padding = '0';
    clone.style.background = 'transparent';
    clone.style.boxShadow = 'none';
    clone.style.pageBreakAfter = 'auto';
    clone.querySelectorAll('h1').forEach(h => {
      h.style.fontSize = '18px';
      h.style.textAlign = 'center';
      h.style.margin = '0 0 4mm 0';
    });
    clone.querySelectorAll('h2').forEach(h => {
      h.style.fontSize = '13px';
      h.style.textAlign = 'center';
      h.style.margin = '0 0 4mm 0';
    });
    clone.querySelectorAll('h3').forEach(h => {
      h.style.fontSize = '11px';
      h.style.margin = '4mm 0 1.5mm 0';
      h.style.lineHeight = '1.15';
    });
    clone.querySelectorAll('p').forEach(par => {
      par.style.margin = '0 0 1.6mm 0';
      par.style.lineHeight = '1.2';
      par.style.fontSize = '11px';
    });
    clone.querySelectorAll('.contract-signatures').forEach(block => {
      block.style.marginTop = '6mm';
    });
    flow.appendChild(clone);
  });

  holder.appendChild(flow);
  document.body.appendChild(holder);

  const canvas = await html2canvas(holder, {
    scale: 2,
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
  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const pageHeight = 297;
  let remaining = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  remaining -= pageHeight;

  while (remaining > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    remaining -= pageHeight;
  }

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
function loadBudget(d){
  state.numero=d.numero||state.numero;
  state.itens=(d.itens||[]).map(item => {
    const produto = getProduto(item.nome || item.descricao);
    return {
      ...item,
      descricao: item.descricao || produto.titulo || produto.nome,
      nome: item.nome || produto.nome,
      tipo: item.tipo || produto.tipo,
      recorrencia: item.recorrencia || produto.recorrencia || 'Mensal',
      inclui: item.inclui || produto.inclui || []
    };
  });
  state.descontos=d.descontos||[];
  $('clienteNome').value=d.cliente?.nome||''; $('documento').value=d.cliente?.documento||''; $('responsavel').value=d.cliente?.responsavel||''; $('telefone').value=d.cliente?.telefone||''; $('email').value=d.cliente?.email||''; $('endereco').value=d.cliente?.endereco||''; $('data').value=d.data||hojeISO(); $('validade').value=d.validade||'10 dias'; $('vencimento').value=d.vencimento||'Todo dia 10'; $('implementacao').value=d.totais?.implementacao||450; updatePreview(); window.scrollTo({top:0,behavior:'smooth'});
}

function setupAuth(){
  const loginScreen = $('loginScreen');
  const appShell = $('appShell');
  const loginForm = $('loginForm');
  const loginError = $('loginError');
  const userEmail = $('userEmail');
  const logoutBtn = $('logoutBtn');

  if(loginForm){
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if(loginError) loginError.textContent = '';
      const email = $('loginEmail').value.trim();
      const senha = $('loginSenha').value;
      try{
        await signInWithEmailAndPassword(auth, email, senha);
      }catch(error){
        if(loginError) loginError.textContent = 'E-mail ou senha inválidos. Verifique os dados e tente novamente.';
      }
    });
  }

  if(logoutBtn){
    logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
    });
  }

  onAuthStateChanged(auth, (user) => {
    if(user){
      if(loginScreen) loginScreen.classList.add('hidden');
      if(appShell) appShell.classList.remove('hidden');
      if(userEmail) userEmail.textContent = user.email || 'Usuário logado';
      init();
    }else{
      if(appShell) appShell.classList.add('hidden');
      if(loginScreen) loginScreen.classList.remove('hidden');
    }
  });
}

setupAuth();
