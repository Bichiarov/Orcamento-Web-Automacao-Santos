const produtos = [
  { nome: "PDV Legal — Plano Base com Retaguarda", valor: 149.90 },
  { nome: "PDV adicional", valor: 49.90 },
  { nome: "Estoque", valor: 20.00 },
  { nome: "Financeiro", valor: 20.00 },
  { nome: "Tablet na Mesa", valor: 39.90 },
  { nome: "QR Code na Mesa", valor: 39.90 },
  { nome: "Controle de Portaria", valor: 39.90 },
  { nome: "BYP", valor: 299.90 },
  { nome: "Fidelidade Legal", valor: 249.90 },
  { nome: "Delivery Legal", valor: 249.90 },
  { nome: "Certificado Digital", valor: 199.90 },
  { nome: "Balanças Autônomas", valor: 39.90 },
  { nome: "KDS PDV Legal", valor: 39.90 },
  { nome: "Totem TokMenu", valor: 79.90 },
  { nome: "KDS TokMenu", valor: 39.90 }
];

let itens = [{ descricao: "PDV Legal — Plano Base com Retaguarda", quantidade: 1, valor: 149.90 }];
let descontos = [];

const $ = (id) => document.getElementById(id);
const moeda = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dataBR(valor) {
  if (!valor) return "--/--/----";
  const [ano, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${ano}`;
}

function apenasNumeros(valor) {
  return String(valor || "").replace(/[^0-9]/g, "");
}

function tipoDocumento(valor) {
  const qtd = apenasNumeros(valor).length;
  if (qtd === 0) return "CPF/CNPJ";
  return qtd > 11 ? "CNPJ" : "CPF";
}

function formatarDocumento(valor) {
  const d = apenasNumeros(valor).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/([0-9]{3})([0-9])/, "$1.$2")
      .replace(/([0-9]{3})([0-9])/, "$1.$2")
      .replace(/([0-9]{3})([0-9]{1,2})$/, "$1-$2");
  }
  return d
    .replace(/([0-9]{2})([0-9])/, "$1.$2")
    .replace(/([0-9]{3})([0-9])/, "$1.$2")
    .replace(/([0-9]{3})([0-9])/, "$1/$2")
    .replace(/([0-9]{4})([0-9]{1,2})$/, "$1-$2");
}

function popularProdutos() {
  const select = $("produtoSelecionado");
  produtos.forEach((p) => {
    const option = document.createElement("option");
    option.value = p.nome;
    option.textContent = p.nome;
    select.appendChild(option);
  });
  select.title = select.value;
  select.addEventListener("change", () => { select.title = select.value; });
}

function adicionarItem() {
  const nome = $("produtoSelecionado").value;
  const produto = produtos.find((p) => p.nome === nome);
  const quantidade = Math.max(1, Number($("quantidade").value || 1));
  itens.push({ descricao: produto.nome, quantidade, valor: produto.valor });
  renderizar();
}

function adicionarDesconto() {
  const valor = Number($("descontoValor").value || 0);
  if (valor <= 0) return;
  descontos.push({ descricao: $("descontoDescricao").value || "Desconto comercial", valor });
  $("descontoDescricao").value = "";
  $("descontoValor").value = "";
  renderizar();
}

function limparOrcamento() {
  itens = [{ descricao: "PDV Legal — Plano Base com Retaguarda", quantidade: 1, valor: 149.90 }];
  descontos = [];
  renderizar();
}

function removerUltimoItem() {
  if (itens.length > 1) itens.pop();
  renderizar();
}

function calcular() {
  const subtotal = itens.reduce((acc, item) => acc + item.quantidade * item.valor, 0);
  const totalDescontos = descontos.reduce((acc, d) => acc + d.valor, 0);
  const mensalidade = Math.max(0, subtotal - totalDescontos);
  return { subtotal, totalDescontos, mensalidade };
}

function atualizarDadosCliente() {
  const doc = $("documento").value;
  $("docLabel").textContent = tipoDocumento(doc);
  $("pvDocLabel").textContent = `${tipoDocumento(doc)}:`;
  $("pvCliente").textContent = $("clienteNome").value || "________________________________";
  $("pvDocumento").textContent = doc || "________________";
  $("pvResponsavel").textContent = $("responsavel").value || "________________";
  $("pvTelefone").textContent = $("telefone").value || "________________";
  $("pvEmail").textContent = $("email").value || "________________";
  $("pvEndereco").textContent = $("endereco").value || "________________";
  $("assinaturaCliente").textContent = $("responsavel").value || "Contratante";
  $("assinaturaDoc").textContent = `${tipoDocumento(doc)}: ${doc || "________________"}`;
  $("dataPreview").textContent = `Data: ${dataBR($("dataContrato").value)}`;
  $("pvVencimento").textContent = `Vencimento: ${$("vencimento").value || "Todo dia 10"}`;
  $("pvValidade").textContent = `Validade da proposta: ${$("validade").value || "10 dias"}`;
}

function renderizar() {
  const tbody = $("itensTabela");
  tbody.innerHTML = "";
  itens.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.descricao}</td><td>${item.quantidade}</td><td>${moeda(item.valor)}</td><td><strong>${moeda(item.quantidade * item.valor)}</strong></td>`;
    tbody.appendChild(tr);
  });

  const descontosLista = $("descontosLista");
  descontosLista.innerHTML = "";
  if (descontos.length === 0) {
    descontosLista.innerHTML = `<p><span>Nenhum desconto aplicado</span><strong>${moeda(0)}</strong></p>`;
  } else {
    descontos.forEach((d) => {
      const p = document.createElement("p");
      p.innerHTML = `<span>${d.descricao}</span><strong>- ${moeda(d.valor)}</strong>`;
      descontosLista.appendChild(p);
    });
  }

  const totais = calcular();
  $("totalDescontos").textContent = moeda(totais.totalDescontos);
  $("mensalidadeTotal").textContent = moeda(totais.mensalidade);
  atualizarDadosCliente();
}

function enviarWhatsApp() {
  const totais = calcular();
  const texto = [
    "Olá! Segue a proposta/contrato de serviços PDV Legal da Web Automação Santos.",
    "",
    `Cliente: ${$("clienteNome").value || "Não informado"}`,
    `${tipoDocumento($("documento").value)}: ${$("documento").value || "Não informado"}`,
    `Contrato: ${$("numeroContrato").textContent}`,
    `Data: ${dataBR($("dataContrato").value)}`,
    `Validade: ${$("validade").value || "10 dias"}`,
    `Mensalidade: ${moeda(totais.mensalidade)}`,
    "",
    "Para enviar em PDF, gere o PDF e anexe o arquivo no WhatsApp."
  ].join("\n");
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
}

function configurarEventos() {
  ["clienteNome", "responsavel", "telefone", "email", "endereco", "dataContrato", "validade", "vencimento"].forEach((id) => {
    $(id).addEventListener("input", renderizar);
  });
  $("documento").addEventListener("input", (e) => {
    e.target.value = formatarDocumento(e.target.value);
    renderizar();
  });
  $("adicionarItem").addEventListener("click", adicionarItem);
  $("adicionarDesconto").addEventListener("click", adicionarDesconto);
  $("limparOrcamento").addEventListener("click", limparOrcamento);
  $("removerUltimo").addEventListener("click", removerUltimoItem);
  $("imprimir").addEventListener("click", () => window.print());
  $("baixarPdf").addEventListener("click", () => window.print());
  $("whatsapp").addEventListener("click", enviarWhatsApp);
}

document.addEventListener("DOMContentLoaded", () => {
  $("dataContrato").value = hojeISO();
  $("numeroContrato").textContent = `WEB-${new Date().getFullYear()}-001`;
  popularProdutos();
  configurarEventos();
  renderizar();
});
