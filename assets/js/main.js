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
const $ = (id) => document.getElementById(id);
function moeda(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});} 
function hojeISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function dataBR(v){if(!v)return '';const [a,m,d]=v.split('-');return `${d}/${m}/${a}`;}
function nums(v){return String(v||'').replace(/[^0-9]/g,'');}
function tipoDoc(v){return nums(v).length>11?'CNPJ':'CPF/CNPJ';}
function formatDoc(v){const d=nums(v).slice(0,14); if(d.length<=11){return d.replace(/([0-9]{3})([0-9])/,'$1.$2').replace(/([0-9]{3})([0-9])/,'$1.$2').replace(/([0-9]{3})([0-9]{1,2})$/,'$1-$2');} return d.replace(/([0-9]{2})([0-9])/,'$1.$2').replace(/([0-9]{3})([0-9])/,'$1.$2').replace(/([0-9]{3})([0-9])/,'$1/$2').replace(/([0-9]{4})([0-9]{1,2})$/,'$1-$2');}
function init(){
  $('dataContrato').value = hojeISO(); $('dataPreview').textContent = `Data: ${dataBR($('dataContrato').value)}`;
  $('numeroContrato').textContent = `WEB-${new Date().getFullYear()}-001`;
  produtos.forEach(p=>{const o=document.createElement('option');o.value=p.nome;o.textContent=p.nome;$('produtoSelect').appendChild(o);});
  bind(); render();
}
function bind(){
  ['clienteNome','responsavel','telefone','email','endereco','validade','vencimento','dataContrato'].forEach(id=>$(id).addEventListener('input',render));
  $('documento').addEventListener('input',e=>{e.target.value=formatDoc(e.target.value);render();});
  $('adicionarItem').onclick=()=>{const p=produtos.find(x=>x.nome===$('produtoSelect').value);const q=Math.max(1,Number($('quantidade').value||1));itens.push({descricao:p.nome,quantidade:q,valor:p.valor});render();};
  $('adicionarDesconto').onclick=()=>{const v=Number($('descontoValor').value||0);if(v<=0)return;descontos.push({descricao:$('descontoDescricao').value||'Desconto comercial',valor:v});$('descontoDescricao').value='';$('descontoValor').value='';render();};
  $('limparOrcamento').onclick=()=>{itens=[{descricao:'PDV Legal — Plano Base com Retaguarda',quantidade:1,valor:149.9}];descontos=[];render();};
  $('removerUltimo').onclick=()=>{if(itens.length>1)itens.pop();render();};
  $('imprimir').onclick=()=>window.print();
  $('whatsapp').onclick=()=>{window.print();const texto=[`Olá! Segue a proposta/contrato de serviços PDV Legal da Web Automação Santos.`,``,`Cliente: ${$('clienteNome').value||'Não informado'}`,`${tipoDoc($('documento').value)}: ${$('documento').value||'Não informado'}`,`Data: ${dataBR($('dataContrato').value)}`,`Validade: ${$('validade').value}`,`Mensalidade: ${$('mensalidade').textContent}`,``,`O PDF gerado para anexar no WhatsApp usa exatamente a mesma via A4 da impressão.`].join('\n');setTimeout(()=>window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`,'_blank','noopener,noreferrer'),600);};
}
function render(){
  $('dataPreview').textContent=`Data: ${dataBR($('dataContrato').value)}`;
  $('labelDocumento').textContent=tipoDoc($('documento').value);$('pDocTipo').textContent=tipoDoc($('documento').value);$('assDocTipo').textContent=tipoDoc($('documento').value);
  $('pCliente').textContent=$('clienteNome').value||'________________________________';$('pDocumento').textContent=$('documento').value||'________________';$('assDocumento').textContent=$('documento').value||'________________';
  $('pResponsavel').textContent=$('responsavel').value||'________________';$('assCliente').textContent=$('responsavel').value||'Contratante';
  $('pTelefone').textContent=$('telefone').value||'________________';$('pEmail').textContent=$('email').value||'________________';$('pEndereco').textContent=$('endereco').value||'________________';
  $('pVencimento').textContent=$('vencimento').value||'Todo dia 10';$('pValidade').textContent=$('validade').value||'10 dias';
  const body=$('itensBody');body.innerHTML='';itens.forEach(item=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${item.descricao}</td><td>${item.quantidade}</td><td>${moeda(item.valor)}</td><td><strong>${moeda(item.quantidade*item.valor)}</strong></td>`;body.appendChild(tr);});
  const dp=$('descontosPreview');dp.innerHTML='';descontos.forEach(d=>{const p=document.createElement('p');p.className='line';p.innerHTML=`<span>${d.descricao}</span><strong>- ${moeda(d.valor)}</strong>`;dp.appendChild(p);});
  const subtotal=itens.reduce((a,i)=>a+i.quantidade*i.valor,0);const desc=descontos.reduce((a,d)=>a+Number(d.valor||0),0);const total=Math.max(0,subtotal-desc);
  $('totalDescontos').textContent=moeda(desc);$('mensalidade').textContent=moeda(total);
}
init();
