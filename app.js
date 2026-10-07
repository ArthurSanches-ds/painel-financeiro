import { supabase } from './supabase.js'

// ── SESSÃO ──
const { data: { session } } = await supabase.auth.getSession()
if (!session) window.location.href = 'login.html'

const userId = session.user.id
document.getElementById('userEmail').textContent = session.user.email

// ── HELPERS ──
const fmt = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const num = v => parseFloat(String(v ?? '').replace(',', '.'))
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const hoje = new Date()
const mesAtual = hoje.getMonth() + 1   // 1-12
const anoAtual = hoje.getFullYear()
const hojeISO = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`

const FONTES = [
    { id: 'vilarejo', nome: 'Vilarejo', icone: '💼', cor: '#26d9a0' },
    { id: 'gs',       nome: 'GS Soluções Digitais', icone: '📣', cor: '#4a9eff' },
    { id: 'gs3d',     nome: 'GS 3D Studio', icone: '🖨️', cor: '#e8a820' },
    { id: 'uber',     nome: 'Uber', icone: '🚗', cor: '#9b7fe8' },
]

// ── ESTADO ──
let abaAtiva = 'home'
let selMes = mesAtual
let selAno = anoAtual
let fonteAberta = null      // fonte com formulário de lançamento aberto
let editandoGasto = null    // id do gasto em edição
let formGastoAberto = false

let dados = { gastos: [], entradas: [] }

// ── LÓGICA DE MÊS ──
const chaveMes = (m, a) => a * 12 + (m - 1)

function entradasDoMes(m, a) {
    return dados.entradas.filter(e => {
        const [ano, mes] = e.data.split('-').map(Number)
        return mes === m && ano === a
    })
}

// Número da parcela no mês (1..total) ou null se não for parcelado
function parcelaNoMes(g, m, a) {
    if (!g.parcelas_total) return null
    return chaveMes(m, a) - chaveMes(g.parcela_inicio_mes, g.parcela_inicio_ano) + 1
}

// Gasto conta no mês? Recorrentes sempre; parcelados só dentro do intervalo
function gastoAtivo(g, m, a) {
    const p = parcelaNoMes(g, m, a)
    return p === null || (p >= 1 && p <= g.parcelas_total)
}

const gastosDoMes = (m, a) => dados.gastos.filter(g => gastoAtivo(g, m, a))
const pagoNoMes = (g, m, a) => g.pago_mes === m && g.pago_ano === a

function resumoMes(m, a) {
    const entradas = entradasDoMes(m, a).reduce((s, e) => s + Number(e.valor), 0)
    const gastos = gastosDoMes(m, a)
    const contas = gastos.reduce((s, g) => s + Number(g.valor), 0)
    const pago = gastos.filter(g => pagoNoMes(g, m, a)).reduce((s, g) => s + Number(g.valor), 0)
    return { entradas, contas, pago, pendente: contas - pago, sobra: entradas - contas }
}

// ── CARREGAR ──
async function carregarDados() {
    const [gastos, entradas] = await Promise.all([
        supabase.from('gastos').select('*').eq('user_id', userId).order('id'),
        supabase.from('entradas').select('*').eq('user_id', userId).order('data', { ascending: false }),
    ])
    if (gastos.error) console.error(gastos.error)
    if (entradas.error) {
        console.error(entradas.error)
        alert('Erro ao carregar entradas. Você já rodou o SQL de migração no Supabase?')
    }
    dados.gastos = gastos.data || []
    dados.entradas = entradas.data || []
    renderAba(abaAtiva)
}

// ── ENTRADAS ──
function abrirFonte(id) {
    fonteAberta = fonteAberta === id ? null : id
    renderAba('home')
    if (fonteAberta) document.getElementById('entValor')?.focus()
}

async function salvarEntrada() {
    const valor = num(document.getElementById('entValor').value)
    const data = document.getElementById('entData').value
    if (!valor || valor <= 0 || !data) return alert('Preencha valor e data!')
    const { error } = await supabase.from('entradas').insert({ user_id: userId, fonte: fonteAberta, valor, data })
    if (error) return alert('Erro ao salvar: ' + error.message)
    fonteAberta = null
    await carregarDados()
}

async function deletarEntrada(id) {
    if (!confirm('Apagar este recebimento?')) return
    await supabase.from('entradas').delete().eq('id', id)
    await carregarDados()
}

function mudarMes(delta) {
    const k = chaveMes(selMes, selAno) + delta
    selAno = Math.floor(k / 12)
    selMes = (k % 12) + 1
    fonteAberta = null
    renderAba(abaAtiva)
}

// ── GASTOS ──
function abrirFormGasto() {
    formGastoAberto = !formGastoAberto
    editandoGasto = null
    renderAba('gastos')
}

function toggleParcelado() {
    const on = document.getElementById('gastoParcelado').checked
    document.getElementById('camposParcela').style.display = on ? 'grid' : 'none'
}

async function salvarGasto() {
    const descricao = document.getElementById('gastoDesc').value.trim()
    const valor = num(document.getElementById('gastoValor').value)
    const tipo = document.getElementById('gastoTipo').value
    const diaRaw = parseInt(document.getElementById('gastoDia').value)
    const dia_vencimento = diaRaw >= 1 && diaRaw <= 31 ? diaRaw : null
    const parcelado = document.getElementById('gastoParcelado').checked

    if (!descricao || !valor) return alert('Preencha descrição e valor!')

    const registro = { descricao, valor, tipo, dia_vencimento, parcelas_total: null, parcela_inicio_mes: null, parcela_inicio_ano: null }

    if (parcelado) {
        const total = parseInt(document.getElementById('gastoParcTotal').value)
        const atual = parseInt(document.getElementById('gastoParcAtual').value)
        if (!total || total < 2 || !atual || atual < 1 || atual > total) return alert('Parcelas inválidas! Ex: estou na 3 de 10.')
        // "Este mês é a parcela X" → calcula o mês da 1ª parcela
        const k = chaveMes(mesAtual, anoAtual) - (atual - 1)
        registro.parcelas_total = total
        registro.parcela_inicio_ano = Math.floor(k / 12)
        registro.parcela_inicio_mes = (k % 12) + 1
    }

    const { error } = editandoGasto !== null
        ? await supabase.from('gastos').update(registro).eq('id', editandoGasto)
        : await supabase.from('gastos').insert({ ...registro, user_id: userId })
    if (error) return alert('Erro ao salvar: ' + error.message)

    editandoGasto = null
    formGastoAberto = false
    await carregarDados()
}

function editarGasto(id) {
    editandoGasto = id
    formGastoAberto = true
    renderAba('gastos')
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function deletarGasto(id) {
    if (!confirm('Apagar este gasto?')) return
    await supabase.from('gastos').delete().eq('id', id)
    await carregarDados()
}

async function togglePagoGasto(id) {
    const g = dados.gastos.find(x => String(x.id) === String(id))
    const jaPago = pagoNoMes(g, mesAtual, anoAtual)
    await supabase.from('gastos').update({
        pago_mes: jaPago ? null : mesAtual,
        pago_ano: jaPago ? null : anoAtual,
    }).eq('id', id)
    await carregarDados()
}

// Status do bloco no mês atual
function statusGasto(g) {
    if (pagoNoMes(g, mesAtual, anoAtual)) return { cls: 'pago', label: '✅ Pago', ordem: 3 }
    if (!g.dia_vencimento) return { cls: 'neutro', label: 'Sem vencimento', ordem: 2 }
    const diff = g.dia_vencimento - hoje.getDate()
    if (diff < 0) return { cls: 'atrasado', label: `Venceu dia ${g.dia_vencimento}`, ordem: 0 }
    if (diff === 0) return { cls: 'breve', label: 'Vence hoje', ordem: 1 }
    if (diff <= 3) return { cls: 'breve', label: `Vence em ${diff} dia${diff > 1 ? 's' : ''}`, ordem: 1 }
    return { cls: 'neutro', label: `Vence dia ${g.dia_vencimento}`, ordem: 2 }
}

// ── NAVEGAÇÃO ──
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
        this.classList.add('active')
        abaAtiva = this.dataset.tab
        renderAba(abaAtiva)
    })
})

function renderAba(aba) {
    const c = document.getElementById('conteudo')
    if (aba === 'home') c.innerHTML = paginaHome()
    if (aba === 'gastos') c.innerHTML = paginaGastos()
    if (aba === 'dashboard') c.innerHTML = paginaDashboard()
}

function seletorMes() {
    const ehAtual = selMes === mesAtual && selAno === anoAtual
    return `
        <div class="mes-nav">
            <button class="mes-btn" onclick="mudarMes(-1)">‹</button>
            <div class="mes-nome">${MESES[selMes - 1]} ${selAno}${ehAtual ? '' : ' <span class="mes-tag">histórico</span>'}</div>
            <button class="mes-btn" onclick="mudarMes(1)">›</button>
        </div>`
}

// ── PÁGINAS ──
function paginaHome() {
    const r = resumoMes(selMes, selAno)
    const entMes = entradasDoMes(selMes, selAno)

    const cardsFontes = FONTES.map(f => {
        const lista = entMes.filter(e => e.fonte === f.id)
        const total = lista.reduce((s, e) => s + Number(e.valor), 0)
        const aberto = fonteAberta === f.id
        return `
            <div class="fonte-card ${aberto ? 'aberto' : ''}" style="--cor:${f.cor}">
                <div class="fonte-topo">
                    <div>
                        <div class="kpi-label">${f.icone} ${f.nome}</div>
                        <div class="kpi-valor">${fmt(total)}</div>
                        <div class="fonte-sub">${lista.length} recebimento${lista.length === 1 ? '' : 's'}</div>
                    </div>
                    <button class="fonte-add" onclick="abrirFonte('${f.id}')" title="Lançar recebimento">${aberto ? '×' : '+'}</button>
                </div>
                ${aberto ? `
                <div class="fonte-form">
                    <input type="number" step="0.01" inputmode="decimal" id="entValor" placeholder="Valor recebido"/>
                    <input type="date" id="entData" value="${selMes === mesAtual && selAno === anoAtual ? hojeISO : `${selAno}-${String(selMes).padStart(2, '0')}-01`}"/>
                    <button class="btn-salvar" onclick="salvarEntrada()">Salvar</button>
                </div>` : ''}
                ${lista.length ? `
                <div class="fonte-lista">
                    ${lista.map(e => `
                        <div class="fonte-item">
                            <span>${e.data.split('-').reverse().slice(0, 2).join('/')}</span>
                            <span>${fmt(e.valor)}</span>
                            <button class="btn-mini" onclick="deletarEntrada('${e.id}')" title="Apagar">✕</button>
                        </div>`).join('')}
                </div>` : ''}
            </div>`
    }).join('')

    return `
        ${seletorMes()}
        <div class="saldo-card">
            <div class="saldo-label">Sobra do mês</div>
            <div class="saldo-valor ${r.sobra < 0 ? 'negativo' : ''}">${fmt(r.sobra)}</div>
            <div class="saldo-meta">
                <div class="saldo-meta-item"><span class="lbl">Entrou</span><span class="val verde">${fmt(r.entradas)}</span></div>
                <div class="saldo-meta-item"><span class="lbl">Contas do mês</span><span class="val vermelho">${fmt(r.contas)}</span></div>
                <div class="saldo-meta-item"><span class="lbl">Falta pagar</span><span class="val azul">${fmt(r.pendente)}</span></div>
            </div>
        </div>
        <div class="fontes-grid">${cardsFontes}</div>
    `
}

function paginaGastos() {
    const r = resumoMes(mesAtual, anoAtual)
    const ativos = gastosDoMes(mesAtual, anoAtual)
        .map(g => ({ g, st: statusGasto(g) }))
        .sort((a, b) => a.st.ordem - b.st.ordem || (a.g.dia_vencimento || 99) - (b.g.dia_vencimento || 99))

    const g = editandoGasto !== null ? dados.gastos.find(x => String(x.id) === String(editandoGasto)) : null
    const parcAtualEdit = g?.parcelas_total ? parcelaNoMes(g, mesAtual, anoAtual) : ''

    const form = formGastoAberto ? `
        <div class="card-form">
            <div class="form-title">${g ? '✏️ Editar Gasto' : '+ Novo Gasto'}</div>
            <div class="form-row">
                <div class="field"><label>Descrição</label><input type="text" id="gastoDesc" placeholder="Ex: Aluguel" value="${esc(g?.descricao)}"/></div>
                <div class="field"><label>Valor ${g?.parcelas_total ? 'da parcela' : ''} (R$)</label><input type="number" step="0.01" inputmode="decimal" id="gastoValor" placeholder="0,00" value="${g?.valor ?? ''}"/></div>
            </div>
            <div class="form-row">
                <div class="field"><label>Tipo</label>
                    <select id="gastoTipo">
                        <option value="Fixo" ${g?.tipo === 'Fixo' ? 'selected' : ''}>Fixo</option>
                        <option value="Variável" ${g?.tipo === 'Variável' ? 'selected' : ''}>Variável</option>
                    </select>
                </div>
                <div class="field"><label>Dia do vencimento</label><input type="number" min="1" max="31" id="gastoDia" placeholder="Ex: 10" value="${g?.dia_vencimento ?? ''}"/></div>
            </div>
            <label class="check-linha">
                <input type="checkbox" id="gastoParcelado" onchange="toggleParcelado()" ${g?.parcelas_total ? 'checked' : ''}/>
                É parcelado (valor acima = valor da parcela)
            </label>
            <div class="form-row" id="camposParcela" style="display:${g?.parcelas_total ? 'grid' : 'none'}">
                <div class="field"><label>Total de parcelas</label><input type="number" min="2" id="gastoParcTotal" placeholder="Ex: 10" value="${g?.parcelas_total ?? ''}"/></div>
                <div class="field"><label>Parcela deste mês</label><input type="number" min="1" id="gastoParcAtual" placeholder="Ex: 3" value="${parcAtualEdit ?? ''}"/></div>
            </div>
            <button class="btn-salvar" onclick="salvarGasto()">${g ? '✔ Atualizar' : 'Salvar Gasto'}</button>
        </div>` : ''

    const blocos = ativos.length === 0
        ? '<p class="vazio">Nenhum gasto ainda. Toque em "+ Novo gasto".</p>'
        : ativos.map(({ g, st }) => {
            const p = parcelaNoMes(g, mesAtual, anoAtual)
            const pago = st.cls === 'pago'
            return `
            <div class="gasto-bloco ${st.cls}">
                <div class="gb-topo">
                    <span class="badge ${g.tipo === 'Fixo' ? 'badge-red' : 'badge-gold'}">${esc(g.tipo)}</span>
                    ${p ? `<span class="badge badge-blue">${p}/${g.parcelas_total}</span>` : ''}
                </div>
                <div class="gb-nome">${esc(g.descricao)}</div>
                <div class="gb-valor">${fmt(g.valor)}</div>
                <div class="gb-status">${st.label}</div>
                <div class="gb-acoes">
                    <button class="gb-pagar" onclick="togglePagoGasto('${g.id}')">${pago ? 'Desmarcar' : '✓ Paguei'}</button>
                    <button class="btn-edit" onclick="editarGasto('${g.id}')">✏️</button>
                    <button class="btn-del" onclick="deletarGasto('${g.id}')">✕</button>
                </div>
            </div>`
        }).join('')

    return `
        <div class="section-title">💸 Contas de ${MESES[mesAtual - 1]}</div>
        <div class="kpi-grid">
            <div class="kpi-card" style="--cor:#f05070"><div class="kpi-label">📋 Total do mês</div><div class="kpi-valor">${fmt(r.contas)}</div></div>
            <div class="kpi-card" style="--cor:#26d9a0"><div class="kpi-label">✅ Pago</div><div class="kpi-valor">${fmt(r.pago)}</div></div>
            <div class="kpi-card" style="--cor:#4a9eff"><div class="kpi-label">⏳ Falta pagar</div><div class="kpi-valor">${fmt(r.pendente)}</div></div>
            <div class="kpi-card" style="--cor:#e8a820"><div class="kpi-label">💰 Sobra prevista</div><div class="kpi-valor">${fmt(r.sobra)}</div></div>
        </div>
        <button class="btn-acao vermelho" style="width:100%;margin-bottom:16px" onclick="abrirFormGasto()">${formGastoAberto ? 'Fechar' : '+ Novo gasto'}</button>
        ${form}
        <div class="gastos-grid">${blocos}</div>
    `
}

function paginaDashboard() {
    const r = resumoMes(selMes, selAno)
    const entMes = entradasDoMes(selMes, selAno)

    const distrib = FONTES.map(f => {
        const v = entMes.filter(e => e.fonte === f.id).reduce((s, e) => s + Number(e.valor), 0)
        const pct = r.entradas > 0 ? (v / r.entradas * 100) : 0
        return `
            <div class="progress-row">
                <div class="progress-meta">
                    <span class="progress-label">${f.icone} ${f.nome}</span>
                    <span class="progress-val" style="color:${f.cor}">${fmt(v)} (${pct.toFixed(1)}%)</span>
                </div>
                <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${f.cor}"></div></div>
            </div>`
    }).join('')

    // Últimos 6 meses até o mês selecionado
    const k0 = chaveMes(selMes, selAno)
    // Antes do primeiro recebimento lançado não há dado real: não projeta contas para trás
    const primeira = dados.entradas.reduce((min, e) => {
        const [a, m] = e.data.split('-').map(Number)
        return Math.min(min, chaveMes(m, a))
    }, Infinity)
    const hist = Array.from({ length: 6 }, (_, i) => {
        const k = k0 - (5 - i)
        const m = (k % 12) + 1, a = Math.floor(k / 12)
        const vazio = { entradas: 0, contas: 0 }
        return { label: MESES_CURTOS[m - 1], ...(k < primeira ? vazio : resumoMes(m, a)) }
    })
    const max = Math.max(...hist.map(h => Math.max(h.entradas, h.contas)), 1)

    return `
        ${seletorMes()}
        <div class="saldo-card" style="margin-bottom:20px">
            <div class="saldo-label">Sobra de ${MESES[selMes - 1]}</div>
            <div class="saldo-valor ${r.sobra < 0 ? 'negativo' : ''}">${fmt(r.sobra)}</div>
            <div class="saldo-meta">
                <div class="saldo-meta-item"><span class="lbl">Entrou</span><span class="val verde">${fmt(r.entradas)}</span></div>
                <div class="saldo-meta-item"><span class="lbl">Contas</span><span class="val vermelho">${fmt(r.contas)}</span></div>
                <div class="saldo-meta-item"><span class="lbl">% que sobrou</span><span class="val azul">${r.entradas > 0 ? (r.sobra / r.entradas * 100).toFixed(1) + '%' : '—'}</span></div>
            </div>
        </div>
        <div class="chart-wrap">
            <div class="chart-title">Últimos 6 meses</div>
            <div class="bar-chart">
                ${hist.map(h => `
                <div class="bar-col" title="Entrou ${fmt(h.entradas)} · Contas ${fmt(h.contas)}">
                    <div style="display:flex;gap:3px;align-items:flex-end;height:120px">
                        <div style="width:16px;background:#26d9a0;border-radius:4px 4px 0 0;height:${h.entradas / max * 100}%;min-height:${h.entradas ? 4 : 0}px"></div>
                        <div style="width:16px;background:#f05070;border-radius:4px 4px 0 0;height:${h.contas / max * 100}%;min-height:${h.contas ? 4 : 0}px"></div>
                    </div>
                    <div class="bar-label">${h.label}</div>
                </div>`).join('')}
            </div>
            <div style="display:flex;gap:16px;margin-top:12px">
                <div style="display:flex;align-items:center;gap:6px"><div style="width:12px;height:12px;border-radius:3px;background:#26d9a0"></div><span style="font-size:11px;color:#5a7090">Entrou</span></div>
                <div style="display:flex;align-items:center;gap:6px"><div style="width:12px;height:12px;border-radius:3px;background:#f05070"></div><span style="font-size:11px;color:#5a7090">Contas</span></div>
            </div>
        </div>
        <div class="chart-wrap">
            <div class="chart-title">De onde veio o dinheiro em ${MESES[selMes - 1]}</div>
            ${distrib}
        </div>
    `
}

// ── LOGOUT ──
async function logout() {
    if (confirm('Deseja sair da sua conta?')) {
        await supabase.auth.signOut()
        window.location.href = 'login.html'
    }
}

// ── EXPÕE FUNÇÕES ──
Object.assign(window, {
    logout, mudarMes,
    abrirFonte, salvarEntrada, deletarEntrada,
    abrirFormGasto, toggleParcelado, salvarGasto, editarGasto, deletarGasto, togglePagoGasto,
})

renderAba('home')
carregarDados()
