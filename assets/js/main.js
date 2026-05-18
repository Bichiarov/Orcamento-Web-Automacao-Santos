// Firebase — Web Automação Santos / PDV Legal
const firebaseConfig = {
  apiKey: "AIzaSyDv5O_X7F_NDYEoZYkfzgg5j-WLkNK-QLk",
  authDomain: "web-automacao-santos-pdvlegal.firebaseapp.com",
  projectId: "web-automacao-santos-pdvlegal",
  storageBucket: "web-automacao-santos-pdvlegal.firebasestorage.app",
  messagingSenderId: "228810100304",
  appId: "1:228810100304:web:eca86e1f9b889484a20b55"
};

let db = null;
try {
  if (window.firebase) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
  }
} catch (erro) {
  console.warn('Firebase não inicializado:', erro);
}

const produtos = [
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

let itens = [{ descricao: "PDV Legal — Plano Base com Retaguarda", quantidade: 1, valor: 159.9 }];
let descontos = [];
let orcamentoAtualId = null;
let numeroConfirmadoNoBanco = false;

function formatarNumeroContrato(seq, ano = new Date().getFullYear()){
  return `WEB-${ano}-${String(seq).padStart(4,'0')}`;
}

function numeroPendente(){
  return `WEB-${new Date().getFullYear()}-PENDENTE`;
}

let numeroContrato = numeroPendente();

async function reservarNumeroOrcamento(){
  if(numeroConfirmadoNoBanco && numeroContrato && !numeroContrato.includes('PENDENTE')){
    return numeroContrato;
  }
  if(!db){
    throw new Error('Firebase não carregou. Não é possível gerar numeração única.');
  }

  const ano = new Date().getFullYear();
  const controleRef = db.collection('controle').doc(`numeracao_${ano}`);
  let novoNumero = null;

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(controleRef);
    const ultimo = snap.exists ? Number(snap.data().ultimoNumero || 0) : 0;
    const proximo = ultimo + 1;
    novoNumero = formatarNumeroContrato(proximo, ano);
    transaction.set(controleRef, {
      ultimoNumero: proximo,
      ano,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });

  numeroContrato = novoNumero;
  numeroConfirmadoNoBanco = true;
  atualizar();
  return numeroContrato;
}

function iniciarNovoOrcamento(){
  orcamentoAtualId = null;
  numeroConfirmadoNoBanco = false;
  numeroContrato = numeroPendente();
}

const $ = (id) => document.getElementById(id);
function moeda(valor){ return Number(valor || 0).toLocaleString('pt-BR', {style:'currency', currency:'BRL'}); }
function hojeISO(){ const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function dataBR(v){ if(!v) return ''; const [a,m,d] = v.split('-'); return `${d}/${m}/${a}`; }
function apenasNumeros(v){ return String(v || '').replace(/[^0-9]/g, ''); }
function tipoDocumento(v){ return apenasNumeros(v).length > 11 ? 'CNPJ' : 'CPF/CNPJ'; }
function formatarDocumento(v){
  const d = apenasNumeros(v).slice(0,14);
  if(d.length <= 11){
    return d.replace(/([0-9]{3})([0-9])/, '$1.$2').replace(/([0-9]{3})([0-9])/, '$1.$2').replace(/([0-9]{3})([0-9]{1,2})$/, '$1-$2');
  }
  return d.replace(/([0-9]{2})([0-9])/, '$1.$2').replace(/([0-9]{3})([0-9])/, '$1.$2').replace(/([0-9]{3})([0-9])/, '$1/$2').replace(/([0-9]{4})([0-9]{1,2})$/, '$1-$2');
}
function getValue(id){ return $(id)?.value || ''; }
function setText(id, text){ const el = $(id); if(el) el.textContent = text; }
function totais(){
  const subtotal = itens.reduce((acc, item) => acc + item.quantidade * item.valor, 0);
  const totalDescontosMensalidade = descontos
    .filter(item => item.tipo === 'mensalidade')
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);
  const totalDescontosImplementacao = descontos
    .filter(item => item.tipo === 'implementacao')
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);
  const implementacaoBruta = Number(getValue('implementacao') || 0);
  return {
    subtotal,
    totalDescontosMensalidade,
    totalDescontosImplementacao,
    mensalidade: Math.max(0, subtotal - totalDescontosMensalidade),
    implementacaoLiquida: Math.max(0, implementacaoBruta - totalDescontosImplementacao)
  };
}
function atualizar(){
  const documento = getValue('clienteDocumento');
  const docTipo = tipoDocumento(documento);
  const total = totais();
  setText('docNumero', numeroContrato);
  setText('docData', `Data: ${dataBR(getValue('dataContrato'))}`);
  setText('docLabel', docTipo);
  setText('outDocLabel', docTipo);
  setText('assinaturaDocLabel', docTipo);
  setText('outClienteNome', getValue('clienteNome') || '________________________________');
  setText('outDocumento', documento || '________________');
  setText('outResponsavel', getValue('clienteResponsavel') || '________________');
  setText('outTelefone', getValue('clienteTelefone') || '________________');
  setText('outEmail', getValue('clienteEmail') || '________________');
  setText('outEndereco', getValue('clienteEndereco') || '________________');
  setText('outImplementacao', moeda(getValue('implementacao')));
  setText('outImplementacaoFinal', moeda(total.implementacaoLiquida));
  setText('outMensalidade', moeda(total.mensalidade));
  setText('outSubtotalMensalidade', total.totalDescontosMensalidade > 0 ? `Subtotal: ${moeda(total.subtotal)}` : '');
  setText('outVencimento', `Vencimento: ${getValue('vencimento') || 'Todo dia 10'}`);
  setText('outValidade', `Validade da proposta: ${getValue('validade') || '10 dias'}`);
  setText('outValidadeTexto', getValue('validade') || '10 dias');
  setText('assinaturaCliente', getValue('clienteResponsavel') || 'Contratante');
  setText('assinaturaDoc', documento || '________________');

  const tbody = $('itensTabela');
  tbody.innerHTML = itens.map(item => `<tr><td>${item.descricao}</td><td class="center">${item.quantidade}</td><td class="right">${moeda(item.valor)}</td><td class="right"><b>${moeda(item.quantidade * item.valor)}</b></td></tr>`).join('');
  const descontosImplementacaoEl = $('descontosImplementacaoLista');
  if (descontosImplementacaoEl) {
    descontosImplementacaoEl.innerHTML = descontos
      .filter(item => item.tipo === 'implementacao')
      .map(item => `<p class="line green"><span>${item.descricao}:</span><b>- ${moeda(item.valor)}</b></p>`)
      .join('');
  }
  const descontosMensalidadeEl = $('descontosMensalidadeLista');
  if (descontosMensalidadeEl) {
    descontosMensalidadeEl.innerHTML = descontos
      .filter(item => item.tipo === 'mensalidade')
      .map(item => `<p class="line green-light"><span>${item.descricao}:</span><b>- ${moeda(item.valor)}</b></p>`)
      .join('');
  }
}
function preencherProdutos(){
  const select = $('produtoSelecionado');
  select.innerHTML = produtos.map(p => `<option value="${p.nome}">${p.nome}</option>`).join('');
  select.title = select.value;
  select.addEventListener('change', () => { select.title = select.value; });
}
function adicionarItem(){
  const nome = getValue('produtoSelecionado');
  const produto = produtos.find(p => p.nome === nome);
  const quantidade = Math.max(1, Number(getValue('quantidade') || 1));
  itens.push({ descricao: produto.nome, quantidade, valor: produto.valor });
  atualizar();
}
function adicionarDesconto(){
  const valor = Number(getValue('descontoValor') || 0);
  if(valor <= 0) return;
  descontos.push({
    descricao: getValue('descontoDescricao') || 'Desconto comercial',
    valor,
    tipo: getValue('descontoTipo') || 'mensalidade'
  });
  $('descontoDescricao').value = '';
  $('descontoValor').value = '';
  $('descontoTipo').value = 'mensalidade';
  atualizar();
}
function limparContrato(){
  itens = [{ descricao: "PDV Legal — Plano Base com Retaguarda", quantidade: 1, valor: 159.9 }];
  descontos = [];
  iniciarNovoOrcamento();
  atualizar();
}
function removerUltimoItem(){
  if(itens.length > 1) itens.pop();
  atualizar();
}
async function gerarPdfArquivo(){
  if(!window.html2canvas || !window.jspdf){
    alert('Bibliotecas de PDF não carregaram. Verifique sua conexão com a internet ou use a impressão do navegador.');
    return null;
  }
  atualizar();
  const elemento = $('printArea');

  // Clona a via de impressão em tamanho A4 fixo. Isso evita que o PDF mobile
  // seja gerado no formato estreito da tela do celular.
  const clone = elemento.cloneNode(true);
  clone.id = 'printAreaExport';
  clone.classList.add('pdf-export');
  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1123,
      windowWidth: 794,
      windowHeight: 1123,
      scrollX: 0,
      scrollY: 0
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Preenche exatamente uma página A4.
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

    const cliente = (getValue('clienteNome') || 'cliente').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return new File([pdf.output('blob')], `orcamento_pdv_legal_${cliente}_${numeroContrato}.pdf`, { type: 'application/pdf' });
  } finally {
    clone.remove();
  }
}
async function baixarPdf(){
  try {
    await reservarNumeroOrcamento();
  } catch(erro) {
    console.error('Erro ao reservar número:', erro);
    alert('Não foi possível gerar uma numeração única. Verifique o Firebase/Firestore.');
    return;
  }
  const arquivo = await gerarPdfArquivo();
  if(!arquivo) return;
  const url = URL.createObjectURL(arquivo);
  const a = document.createElement('a');
  a.href = url; a.download = arquivo.name; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
async function enviarWhatsApp(){
  try {
    await reservarNumeroOrcamento();
  } catch(erro) {
    console.error('Erro ao reservar número:', erro);
    alert('Não foi possível gerar uma numeração única. Verifique o Firebase/Firestore.');
    return;
  }
  const total = totais();
  const texto = [
    'Olá! Tudo bem? Somos da Web Automação Santos. Segue o orçamento comercial do PDV Legal preparado para sua empresa.',
    '',
    `Cliente: ${getValue('clienteNome') || 'Não informado'}`,
    `${tipoDocumento(getValue('clienteDocumento'))}: ${getValue('clienteDocumento') || 'Não informado'}`,
    `Contrato: ${numeroContrato}`,
    `Data: ${dataBR(getValue('dataContrato'))}`,
    `Validade: ${getValue('validade') || '10 dias'}`,
    `Mensalidade: ${moeda(total.mensalidade)}`,
    `Taxa de implementação: ${moeda(total.implementacaoLiquida)}`
  ].join('\n');

  const arquivo = await gerarPdfArquivo();
  if(!arquivo) return;

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  const podeCompartilharArquivo = navigator.canShare && navigator.canShare({ files: [arquivo] });

  if(isMobile && podeCompartilharArquivo){
    try{
      await navigator.share({
        title: 'Orçamento PDV Legal — Web Automação Santos',
        text: texto,
        files: [arquivo]
      });
      return;
    }catch(e){
      console.warn('Compartilhamento nativo cancelado ou indisponível. Usando fallback.', e);
    }
  }

  const url = URL.createObjectURL(arquivo);
  const a = document.createElement('a');
  a.href = url;
  a.download = arquivo.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  window.open(`https://wa.me/?text=${encodeURIComponent(texto + '\n\nO orçamento oficial em PDF A4 foi baixado no dispositivo. Anexe esse arquivo nesta conversa do WhatsApp.')}`, '_blank', 'noopener,noreferrer');
}

function dadosAtuaisDoOrcamento(){
  const total = totais();
  return {
    numero: numeroContrato,
    data: getValue('dataContrato'),
    validade: getValue('validade') || '10 dias',
    vencimento: getValue('vencimento') || 'Todo dia 10',
    status: 'Aberto',
    cliente: {
      nome: getValue('clienteNome'),
      documento: getValue('clienteDocumento'),
      tipoDocumento: tipoDocumento(getValue('clienteDocumento')),
      responsavel: getValue('clienteResponsavel'),
      telefone: getValue('clienteTelefone'),
      email: getValue('clienteEmail'),
      endereco: getValue('clienteEndereco')
    },
    itens: itens.map(item => ({
      descricao: item.descricao,
      quantidade: Number(item.quantidade || 0),
      valorUnitario: Number(item.valor || 0),
      valorTotal: Number(item.quantidade || 0) * Number(item.valor || 0)
    })),
    descontos: descontos.map(item => ({
      descricao: item.descricao,
      valor: Number(item.valor || 0),
      tipo: item.tipo || 'mensalidade'
    })),
    totais: {
      subtotalMensalidade: total.subtotal,
      descontoMensalidade: total.totalDescontosMensalidade,
      taxaImplementacao: Number(getValue('implementacao') || 0),
      descontoImplementacao: total.totalDescontosImplementacao,
      totalMensalidade: total.mensalidade,
      totalImplementacao: total.implementacaoLiquida
    },
    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
  };
}

async function salvarOrcamento(){
  if(!db){
    alert('Firebase não carregou. Verifique sua conexão e se o Firestore está ativado.');
    return;
  }
  try{
    await reservarNumeroOrcamento();
    atualizar();
    const dados = dadosAtuaisDoOrcamento();
    const docId = numeroContrato;
    const ref = db.collection('orcamentos').doc(docId);
    const existente = await ref.get();
    if(!existente.exists){
      dados.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
    } else {
      dados.criadoEm = existente.data().criadoEm || firebase.firestore.FieldValue.serverTimestamp();
    }
    await ref.set(dados, { merge: true });
    orcamentoAtualId = docId;
    alert(`Orçamento ${numeroContrato} salvo com sucesso.`);
    await listarOrcamentos(false);
    return docId;
  }catch(erro){
    console.error('Erro ao salvar orçamento:', erro);
    alert('Não foi possível salvar o orçamento no Firebase. Verifique as regras do Firestore e a conexão.');
  }
}

function mostrarListaOrcamentos(mostrar=true){
  const box = $('orcamentosSalvos');
  if(box) box.style.display = mostrar ? 'block' : 'none';
}

async function listarOrcamentos(mostrar=true){
  if(!db){
    alert('Firebase não carregou. Verifique sua conexão e se o Firestore está ativado.');
    return;
  }
  const lista = $('listaOrcamentos');
  if(!lista) return;
  mostrarListaOrcamentos(mostrar);
  lista.innerHTML = '<div class="saved-empty">Carregando orçamentos...</div>';
  try{
    let docs = [];
    try{
      const snap = await db.collection('orcamentos').orderBy('criadoEm','desc').limit(20).get({ source: 'server' });
      snap.forEach(doc => docs.push({ id: doc.id, data: doc.data() }));
    }catch(erroOrdenado){
      console.warn('Busca ordenada falhou. Tentando busca simples sem orderBy:', erroOrdenado);
      const snap = await db.collection('orcamentos').limit(20).get({ source: 'server' });
      snap.forEach(doc => docs.push({ id: doc.id, data: doc.data() }));
      docs.sort((a,b) => {
        const na = String(a.data.numero || a.id || '');
        const nb = String(b.data.numero || b.id || '');
        return nb.localeCompare(na, 'pt-BR', { numeric: true });
      });
    }

    if(!docs.length){
      lista.innerHTML = '<div class="saved-empty">Nenhum orçamento salvo ainda.</div>';
      return;
    }

    lista.innerHTML = '';
    docs.forEach(({ id, data: d }) => {
      const el = document.createElement('div');
      el.className = 'saved-card';
      el.innerHTML = `
        <div>
          <strong>${d.numero || 'Sem número'}</strong>
          <span>${d.cliente?.nome || 'Cliente não informado'}</span>
          <small>${d.data ? dataBR(d.data) : ''} • Mensalidade ${moeda(d.totais?.totalMensalidade || 0)}</small>
        </div>
        <button type="button" data-id="${id}">Abrir</button>
      `;
      el.querySelector('button').addEventListener('click', () => carregarOrcamento(id));
      lista.appendChild(el);
    });
  }catch(erro){
    console.error('Erro ao listar orçamentos:', erro);
    lista.innerHTML = `<div class="saved-empty">Erro ao buscar orçamentos: ${erro.message || erro}. Verifique as regras do Firestore e se o app no PC está usando a versão atualizada.</div>`;
  }
}

async function carregarOrcamento(id){
  if(!db) return;
  try{
    const doc = await db.collection('orcamentos').doc(id).get();
    if(!doc.exists){ alert('Orçamento não encontrado.'); return; }
    const d = doc.data();
    numeroContrato = d.numero || numeroContrato;
    numeroConfirmadoNoBanco = !!d.numero;
    orcamentoAtualId = id;
    $('clienteNome').value = d.cliente?.nome || '';
    $('clienteDocumento').value = d.cliente?.documento || '';
    $('clienteResponsavel').value = d.cliente?.responsavel || '';
    $('clienteTelefone').value = d.cliente?.telefone || '';
    $('clienteEmail').value = d.cliente?.email || '';
    $('clienteEndereco').value = d.cliente?.endereco || '';
    $('dataContrato').value = d.data || hojeISO();
    $('validade').value = d.validade || '10 dias';
    $('vencimento').value = d.vencimento || 'Todo dia 10';
    $('implementacao').value = d.totais?.taxaImplementacao ?? 450;
    itens = Array.isArray(d.itens) && d.itens.length ? d.itens.map(item => ({
      descricao: item.descricao,
      quantidade: Number(item.quantidade || 1),
      valor: Number(item.valorUnitario || item.valor || 0)
    })) : [{ descricao: "PDV Legal — Plano Base com Retaguarda", quantidade: 1, valor: 159.9 }];
    descontos = Array.isArray(d.descontos) ? d.descontos.map(item => ({
      descricao: item.descricao,
      valor: Number(item.valor || 0),
      tipo: item.tipo || 'mensalidade'
    })) : [];
    atualizar();
    mostrarListaOrcamentos(false);
  }catch(erro){
    console.error('Erro ao carregar orçamento:', erro);
    alert('Não foi possível carregar o orçamento.');
  }
}

function iniciar(){
  preencherProdutos();
  $('dataContrato').value = hojeISO();
  $('docNumero').textContent = numeroContrato;
  ['clienteNome','dataContrato','clienteDocumento','clienteTelefone','clienteResponsavel','clienteEmail','clienteEndereco','validade','vencimento','implementacao'].forEach(id => $(id).addEventListener('input', atualizar));
  $('descontoTipo').addEventListener('change', atualizar);
  $('clienteDocumento').addEventListener('input', (e) => { e.target.value = formatarDocumento(e.target.value); atualizar(); });
  $('btnAdicionarItem').addEventListener('click', adicionarItem);
  $('btnAdicionarDesconto').addEventListener('click', adicionarDesconto);
  $('btnLimpar').addEventListener('click', limparContrato);
  $('btnRemoverUltimo').addEventListener('click', removerUltimoItem);
  $('btnGerarPdf').addEventListener('click', baixarPdf);
  $('btnWhatsApp').addEventListener('click', enviarWhatsApp);
  $('btnSalvarOrcamento').addEventListener('click', salvarOrcamento);
  $('btnBuscarOrcamentos').addEventListener('click', () => listarOrcamentos(true));
  atualizar();
}
document.addEventListener('DOMContentLoaded', iniciar);
