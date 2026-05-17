const produtos = [
  { nome: "PDV Legal — Plano Base com Retaguarda", valor: 149.9 },
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

let itens = [{ descricao: "PDV Legal — Plano Base com Retaguarda", quantidade: 1, valor: 149.9 }];
let descontos = [];
const numeroContrato = `WEB-${new Date().getFullYear()}-001`;
const observacaoPadrao = "Suporte remoto e presencial conforme disponibilidade técnica. Equipamentos, internet, certificado digital, computador, impressoras e periféricos não inclusos, salvo quando descritos neste contrato.";

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
  const totalDescontos = descontos.reduce((acc, item) => acc + Number(item.valor || 0), 0);
  return { subtotal, totalDescontos, mensalidade: Math.max(0, subtotal - totalDescontos) };
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
  setText('outDescontos', moeda(total.totalDescontos));
  setText('outMensalidade', moeda(total.mensalidade));
  setText('outVencimento', `Vencimento: ${getValue('vencimento') || 'Todo dia 10'}`);
  setText('outValidade', `Validade da proposta: ${getValue('validade') || '10 dias'}`);
  setText('outValidadeTexto', getValue('validade') || '10 dias');
  setText('assinaturaCliente', getValue('clienteResponsavel') || 'Contratante');
  setText('assinaturaDoc', documento || '________________');
  setText('outObservacoes', getValue('observacoes') || observacaoPadrao);

  const tbody = $('itensTabela');
  tbody.innerHTML = itens.map(item => `<tr><td>${item.descricao}</td><td class="center">${item.quantidade}</td><td class="right">${moeda(item.valor)}</td><td class="right"><b>${moeda(item.quantidade * item.valor)}</b></td></tr>`).join('');
  const descontosEl = $('descontosLista');
  descontosEl.innerHTML = descontos.map(item => `<p class="line green"><span>${item.descricao}:</span><b>- ${moeda(item.valor)}</b></p>`).join('');
}
function preencherProdutos(){
  const select = $('produtoSelecionado');
  select.innerHTML = produtos.map(p => `<option value="${p.nome}">${p.nome}</option>`).join('');
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
  descontos.push({ descricao: getValue('descontoDescricao') || 'Desconto comercial', valor });
  $('descontoDescricao').value = '';
  $('descontoValor').value = '';
  atualizar();
}
function limparContrato(){
  itens = [{ descricao: "PDV Legal — Plano Base com Retaguarda", quantidade: 1, valor: 149.9 }];
  descontos = [];
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
  const canvas = await html2canvas(elemento, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  const imgData = canvas.toDataURL('image/jpeg', 0.98);
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210, pageHeight = 297, margin = 5;
  const usableWidth = pageWidth - margin * 2, usableHeight = pageHeight - margin * 2;
  const ratio = canvas.width / canvas.height;
  let imgWidth = usableWidth, imgHeight = imgWidth / ratio;
  if(imgHeight > usableHeight){ imgHeight = usableHeight; imgWidth = imgHeight * ratio; }
  pdf.addImage(imgData, 'JPEG', (pageWidth-imgWidth)/2, (pageHeight-imgHeight)/2, imgWidth, imgHeight);
  const cliente = (getValue('clienteNome') || 'cliente').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return new File([pdf.output('blob')], `orcamento_pdv_legal_${cliente}_${numeroContrato}.pdf`, { type: 'application/pdf' });
}
async function baixarPdf(){
  const arquivo = await gerarPdfArquivo();
  if(!arquivo) return;
  const url = URL.createObjectURL(arquivo);
  const a = document.createElement('a');
  a.href = url; a.download = arquivo.name; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
async function enviarWhatsApp(){
  const total = totais();
  const texto = [
    'Olá! Segue em anexo a proposta/contrato de serviços PDV Legal da Web Automação Santos.',
    '',
    `Cliente: ${getValue('clienteNome') || 'Não informado'}`,
    `${tipoDocumento(getValue('clienteDocumento'))}: ${getValue('clienteDocumento') || 'Não informado'}`,
    `Contrato: ${numeroContrato}`,
    `Data: ${dataBR(getValue('dataContrato'))}`,
    `Validade: ${getValue('validade') || '10 dias'}`,
    `Mensalidade: ${moeda(total.mensalidade)}`,
    `Taxa de implementação: ${moeda(getValue('implementacao'))}`
  ].join('\n');
  const arquivo = await gerarPdfArquivo();
  if(arquivo && navigator.canShare && navigator.canShare({ files: [arquivo] })){
    await navigator.share({ title: 'Orçamento PDV Legal', text: texto, files: [arquivo] });
    return;
  }
  if(arquivo){
    const url = URL.createObjectURL(arquivo);
    const a = document.createElement('a');
    a.href = url; a.download = arquivo.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(texto + '\n\nO PDF foi baixado. Anexe o arquivo nesta conversa do WhatsApp.')}`, '_blank', 'noopener,noreferrer');
}
function iniciar(){
  preencherProdutos();
  $('dataContrato').value = hojeISO();
  $('observacoes').value = observacaoPadrao;
  $('docNumero').textContent = numeroContrato;
  ['clienteNome','dataContrato','clienteDocumento','clienteTelefone','clienteResponsavel','clienteEmail','clienteEndereco','validade','vencimento','implementacao','observacoes'].forEach(id => $(id).addEventListener('input', atualizar));
  $('clienteDocumento').addEventListener('input', (e) => { e.target.value = formatarDocumento(e.target.value); atualizar(); });
  $('btnAdicionarItem').addEventListener('click', adicionarItem);
  $('btnAdicionarDesconto').addEventListener('click', adicionarDesconto);
  $('btnLimpar').addEventListener('click', limparContrato);
  $('btnRemoverUltimo').addEventListener('click', removerUltimoItem);
  $('btnGerarPdf').addEventListener('click', baixarPdf);
  $('btnWhatsApp').addEventListener('click', enviarWhatsApp);
  atualizar();
}
document.addEventListener('DOMContentLoaded', iniciar);
