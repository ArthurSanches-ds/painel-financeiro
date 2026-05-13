const fmt = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2});

let dados = JSON.parse(localStorage.getItem('financas')) || {
    salario: 0,
    gastos: [],
    freelances: [],
    uber: [],
    objetivos: []
};

function salvar() {
    localStorage.setItem('financas', JSON.stringify(dados));
}
function salvarGasto() {
    const desc = document.getElementById('gastoDesc').value;
    const valor = parseFloat(document.getElementById('gastoValor').value);
    const tipo = document.getElementById('gastoTipo').value;
    if (!desc || !valor) return alert('Preencha descrição e valor!');
    dados.gastos.push({ descricao: desc, valor, tipo });
    salvar();
    renderAba('gastos');
}

function deletarGasto(i) {
    if (confirm('Tem certeza que deseja deletar este gasto?')) {
        dados.gastos.splice(i, 1);
        salvar();
        renderAba('gastos');
    }
}
function salvarFreelance() {
    const servico = document.getElementById('freeServico').value;
    const valor = parseFloat(document.getElementById('freeValor').value);
    const plataforma = document.getElementById('freePlataforma').value;
    const status = document.getElementById('freeStatus').value;
    if (!servico || !valor) return alert('Preencha serviço e valor!');
    dados.freelances.push({ servico, valor, plataforma, status });
    salvar();
    renderAba('freelance');
}

function deletarFreelance(i) {
    if (confirm('Tem certeza que deseja deletar este serviço?')) {
        dados.freelances.splice(i, 1);
        salvar();
        renderAba('freelance');
    }
}

// ── NAVEGAÇÃO ENTRE ABAS ──
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderAba(this.dataset.tab);
    });
});

function renderAba(aba) {
    const conteudo = document.getElementById('conteudo');
    if (aba === 'home') conteudo.innerHTML = paginaHome();
    if (aba === 'gastos') conteudo.innerHTML = paginaGastos();
    if (aba === 'freelance') conteudo.innerHTML = paginaFreelance();
    if (aba === 'uber') conteudo.innerHTML = paginaUber();
    if (aba === 'dashboard') conteudo.innerHTML = paginaDashboard();
    if (aba === 'objetivos') conteudo.innerHTML = paginaObjetivos();
    if (aba === 'finbot') conteudo.innerHTML = paginaFinbot();
}

// Carrega a aba home ao abrir
renderAba('home');

function paginaHome() {
    const totalEntradas = dados.salario + 
        dados.freelances.reduce((s, f) => s + f.valor, 0) +
        dados.uber.reduce((s, u) => s + u.corridas, 0);
    
    const totalGastos = dados.gastos.reduce((s, g) => s + g.valor, 0) +
        dados.uber.reduce((s, u) => s + (u.combustivel || 0) + (u.manutencao || 0), 0);
    
    const saldo = totalEntradas - totalGastos;
    return `
        <div class="saldo-card">
            <div class="saldo-label">Saldo Disponível</div>
            <div class="saldo-valor ${saldo < 0 ? 'negativo' : ''}">${fmt(saldo)}</div>
            <div class="saldo-meta">
                <div class="saldo-meta-item">
                    <span class="lbl">Entradas</span>
                    <span class="val verde">${fmt(totalEntradas)}</span>
                </div>
                <div class="saldo-meta-item">
                    <span class="lbl">Gastos</span>
                    <span class="val vermelho">${fmt(totalGastos)}</span>
                </div>
                <div class="saldo-meta-item">
                    <span class="lbl">% Economizado</span>
                    <span class="val azul">${totalEntradas > 0 ? ((saldo / totalEntradas) * 100).toFixed(1) + '%' : '0%'}</span>
                </div>
            </div>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card" style="--cor: #26d9a0">
                <div class="kpi-icone">💼</div>
                <div class="kpi-label">Salário</div>
                <div class="kpi-valor">${fmt(dados.salario)}</div>
            </div>
            <div class="kpi-card" style="--cor: #4a9eff">
                <div class="kpi-icone">💻</div>
                <div class="kpi-label">Freelance</div>
                <div class="kpi-valor">${fmt(dados.freelances.reduce((s, f) => s + f.valor, 0))}</div>
            </div>
            <div class="kpi-card" style="--cor: #9b7fe8">
                <div class="kpi-icone">🚗</div>
                <div class="kpi-label">Uber Bruto</div>
                <div class="kpi-valor">${fmt(dados.uber.reduce((s, u) => s + u.corridas, 0))}</div>
            </div>
            <div class="kpi-card" style="--cor: #f05070">
                <div class="kpi-icone">💸</div>
                <div class="kpi-label">Total Gastos</div>
                <div class="kpi-valor">${fmt(totalGastos)}</div>
            </div>
        </div>

        <div class="acoes-rapidas">
            <button class="btn-acao vermelho" onclick="document.querySelector('[data-tab=gastos]').click()">+ Gasto</button>
            <button class="btn-acao azul" onclick="document.querySelector('[data-tab=freelance]').click()">+ Freelance</button>
            <button class="btn-acao roxo" onclick="document.querySelector('[data-tab=uber]').click()">+ Uber</button>
        </div>
    `;
}
function paginaGastos() {
    const totalFixo = dados.gastos.filter(g => g.tipo === 'Fixo').reduce((s, g) => s + g.valor, 0);
    const totalVariavel = dados.gastos.filter(g => g.tipo === 'Variável').reduce((s, g) => s + g.valor, 0);

    return `
        <div class="section-title">💸 Controle de Gastos</div>

        <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr)">
            <div class="kpi-card" style="--cor: #f05070">
                <div class="kpi-label">📋 Fixos</div>
                <div class="kpi-valor">${fmt(totalFixo)}</div>
            </div>
            <div class="kpi-card" style="--cor: #e8a820">
                <div class="kpi-label">💥 Variáveis</div>
                <div class="kpi-valor">${fmt(totalVariavel)}</div>
            </div>
            <div class="kpi-card" style="--cor: #f0ece4">
                <div class="kpi-label">💰 Total</div>
                <div class="kpi-valor">${fmt(totalFixo + totalVariavel)}</div>
            </div>
        </div>

        <div class="card-form">
            <div class="form-title">+ Novo Gasto</div>
            <div class="form-row">
                <div class="field">
                    <label>Descrição</label>
                    <input type="text" id="gastoDesc" placeholder="Ex: Aluguel..."/>
                </div>
                <div class="field">
                    <label>Valor (R$)</label>
                    <input type="number" id="gastoValor" placeholder="0,00"/>
                </div>
                <div class="field">
                    <label>Tipo</label>
                    <select id="gastoTipo">
                        <option value="Fixo">Fixo</option>
                        <option value="Variável">Variável</option>
                    </select>
                </div>
            </div>
            <button class="btn-salvar" onclick="salvarGasto()">Salvar Gasto</button>
        </div>

        <div class="tabela-wrap">
            <table class="tabela">
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Valor</th>
                        <th>Tipo</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${dados.gastos.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:#5a7090;padding:24px">Nenhum gasto ainda</td></tr>' :
                    [...dados.gastos].reverse().map((g, i) => `
                        <tr>
                            <td>${g.descricao}</td>
                            <td style="color:#f05070;font-weight:700">${fmt(g.valor)}</td>
                            <td><span class="badge ${g.tipo === 'Fixo' ? 'badge-red' : 'badge-gold'}">${g.tipo}</span></td>
                            <td><button class="btn-del" onclick="deletarGasto(${dados.gastos.length - 1 - i})">✕</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}
function paginaFreelance() {
    const total99 = dados.freelances.filter(f => f.plataforma === '99Freelas').reduce((s, f) => s + f.valor, 0);
    const totalWorkana = dados.freelances.filter(f => f.plataforma === 'Workana').reduce((s, f) => s + f.valor, 0);
    const totalFiverr = dados.freelances.filter(f => f.plataforma === 'Fiverr').reduce((s, f) => s + f.valor, 0);

    return `
        <div class="section-title">💻 Controle Freelance</div>

        <div class="kpi-grid">
            <div class="kpi-card" style="--cor: #4a9eff">
                <div class="kpi-label">99Freelas</div>
                <div class="kpi-valor">${fmt(total99)}</div>
                <div class="kpi-sub">${dados.freelances.filter(f => f.plataforma === '99Freelas').length} projetos</div>
            </div>
            <div class="kpi-card" style="--cor: #9b7fe8">
                <div class="kpi-label">Workana</div>
                <div class="kpi-valor">${fmt(totalWorkana)}</div>
                <div class="kpi-sub">${dados.freelances.filter(f => f.plataforma === 'Workana').length} projetos</div>
            </div>
            <div class="kpi-card" style="--cor: #26d9a0">
                <div class="kpi-label">Fiverr</div>
                <div class="kpi-valor">${fmt(totalFiverr)}</div>
                <div class="kpi-sub">${dados.freelances.filter(f => f.plataforma === 'Fiverr').length} projetos</div>
            </div>
            <div class="kpi-card" style="--cor: #e8a820">
                <div class="kpi-label">💰 Total</div>
                <div class="kpi-valor">${fmt(total99 + totalWorkana + totalFiverr)}</div>
                <div class="kpi-sub">${dados.freelances.length} projetos</div>
            </div>
        </div>

        <div class="filter-bar">
            <button class="filter-chip active" onclick="filtrarFreelance('all', this)">Todas</button>
            <button class="filter-chip" onclick="filtrarFreelance('99Freelas', this)">99Freelas</button>
            <button class="filter-chip" onclick="filtrarFreelance('Workana', this)">Workana</button>
            <button class="filter-chip" onclick="filtrarFreelance('Fiverr', this)">Fiverr</button>
            <button class="filter-chip" onclick="filtrarFreelance('pago', this)">✅ Pago</button>
            <button class="filter-chip" onclick="filtrarFreelance('aguardando', this)">⏳ Aguardando</button>
        </div>

        <div class="card-form">
            <div class="form-title">+ Novo Serviço</div>
            <div class="form-row">
                <div class="field">
                    <label>Serviço</label>
                    <input type="text" id="freeServico" placeholder="Ex: Bot WhatsApp..."/>
                </div>
                <div class="field">
                    <label>Valor (R$)</label>
                    <input type="number" id="freeValor" placeholder="0,00"/>
                </div>
            </div>
            <div class="form-row">
                <div class="field">
                    <label>Plataforma</label>
                   <select id="freePlataforma" onchange="toggleOutraPlataforma()">
                        <option value="99Freelas">99Freelas</option>
                        <option value="Workana">Workana</option>
                        <option value="Fiverr">Fiverr</option>
                        <option value="outro">➕ Outra plataforma</option>
                        </select>
                        <input type="text" id="freeOutraPlataforma" placeholder="Digite o nome..." style="display:none; margin-top:8px"/>
                </div>
                <div class="field">
                    <label>Status</label>
                    <select id="freeStatus">
                        <option value="aguardando">⏳ Aguardando</option>
                        <option value="pago">✅ Pago</option>
                        <option value="cancelado">❌ Cancelado</option>
                    </select>
                </div>
            </div>
            <button class="btn-salvar" onclick="salvarFreelance()">Salvar Serviço</button>
        </div>

        <div class="tabela-wrap" id="tabelaFreelance">
            ${tabelaFreelance(dados.freelances)}
        </div>
    `;
}

function tabelaFreelance(lista) {
    if (lista.length === 0) return '<p style="text-align:center;color:#5a7090;padding:24px">Nenhum serviço ainda</p>';
    return `
        <table class="tabela">
            <thead>
                <tr>
                    <th>Serviço</th>
                    <th>Valor</th>
                    <th>Plataforma</th>
                    <th>Status</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${[...lista].reverse().map((f, i) => `
                    <tr>
                        <td>${f.servico}</td>
                        <td style="color:#26d9a0;font-weight:700">${fmt(f.valor)}</td>
                        <td><span class="badge badge-blue">${f.plataforma}</span></td>
                        <td><span class="badge ${f.status === 'pago' ? 'badge-green' : f.status === 'cancelado' ? 'badge-red' : 'badge-gold'}">${f.status === 'pago' ? '✅ Pago' : f.status === 'cancelado' ? '❌ Cancelado' : '⏳ Aguardando'}</span></td>
                        <td><button class="btn-del" onclick="deletarFreelance(${dados.freelances.length - 1 - i})">✕</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function filtrarFreelance(filtro, btn) {
    document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    let lista = dados.freelances;
    if (filtro !== 'all') lista = dados.freelances.filter(f => f.plataforma === filtro || f.status === filtro);
    document.getElementById('tabelaFreelance').innerHTML = tabelaFreelance(lista);
}
function toggleOutraPlataforma() {
    const select = document.getElementById('freePlataforma');
    const input = document.getElementById('freeOutraPlataforma');
    input.style.display = select.value === 'outro' ? 'block' : 'none';
}

function salvarFreelance() {
    const servico = document.getElementById('freeServico').value;
    const valor = parseFloat(document.getElementById('freeValor').value);
    const plataforma = document.getElementById('freePlataforma').value === 'outro'
        ? document.getElementById('freeOutraPlataforma').value
        : document.getElementById('freePlataforma').value;
    const status = document.getElementById('freeStatus').value;
    if (!servico || !valor) return alert('Preencha serviço e valor!');
    dados.freelances.push({ servico, valor, plataforma, status });
    salvar();
    renderAba('freelance');
}

function deletarFreelance(i) {
    if (confirm('Tem certeza que deseja deletar este serviço?')) {
        dados.freelances.splice(i, 1);
        salvar();
        renderAba('freelance');
    }
}
function paginaUber() {
    const mes = new Date().getMonth();
    const ano = new Date().getFullYear();
    const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

    const diasMes = uberDiasFiltrados();
    const totalCorridas = diasMes.reduce((s, d) => s + (d.corridas || 0), 0);
    const totalCombust = diasMes.reduce((s, d) => s + (d.combustivel || 0), 0);
    const totalManut = diasMes.reduce((s, d) => s + (d.manutencao || 0), 0);
    const totalLiq = totalCorridas - totalCombust - totalManut;

    const mesSel = dados.uberMes !== undefined ? dados.uberMes : mes;
    const anoSel = dados.uberAno !== undefined ? dados.uberAno : ano;

    return `
        <div class="section-title">🚗 Controle Uber</div>

        <div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:16px">
            <select class="month-select" onchange="mudarMesUber(this.value)">
                ${MESES.map((m, i) => `<option value="${i}" ${i == mesSel ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
            <select class="month-select" onchange="mudarAnoUber(this.value)">
                ${[2024,2025,2026].map(a => `<option value="${a}" ${a == anoSel ? 'selected' : ''}>${a}</option>`).join('')}
            </select>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card" style="--cor: #9b7fe8">
                <div class="kpi-label">🚗 Corridas</div>
                <div class="kpi-valor">${fmt(totalCorridas)}</div>
            </div>
            <div class="kpi-card" style="--cor: #f05070">
                <div class="kpi-label">⛽ Combustível</div>
                <div class="kpi-valor">${fmt(totalCombust)}</div>
            </div>
            <div class="kpi-card" style="--cor: #4a9eff">
                <div class="kpi-label">🔧 Manutenção</div>
                <div class="kpi-valor">${fmt(totalManut)}</div>
            </div>
            <div class="kpi-card" style="--cor: #e8a820">
                <div class="kpi-label">💰 Líquido</div>
                <div class="kpi-valor">${fmt(totalLiq)}</div>
            </div>
        </div>

        <div class="card-form">
            <div class="form-title">+ Registrar Dia</div>
            <div class="form-row">
                <div class="field">
                    <label>Data</label>
                    <input type="date" id="uberData"/>
                </div>
                <div class="field">
                    <label>Corridas (R$)</label>
                    <input type="number" id="uberCorridas" placeholder="0,00"/>
                </div>
            </div>
            <div class="form-row">
                <div class="field">
                    <label>⛽ Combustível (R$)</label>
                    <input type="number" id="uberCombust" placeholder="0,00"/>
                </div>
                <div class="field">
                    <label>🔧 Manutenção (R$)</label>
                    <input type="number" id="uberManut" placeholder="0,00"/>
                </div>
            </div>
            <button class="btn-salvar" onclick="salvarUber()">Salvar Dia</button>
        </div>

        <div class="tabela-wrap">
            <table class="tabela">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Corridas</th>
                        <th>Combustível</th>
                        <th>Manutenção</th>
                        <th>Líquido</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${diasMes.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:#5a7090;padding:24px">Nenhum dia registrado</td></tr>' :
                    [...diasMes].reverse().map((d, i) => `
                        <tr>
                            <td>${d.data}</td>
                            <td style="color:#9b7fe8;font-weight:700">${fmt(d.corridas)}</td>
                            <td style="color:#f05070">${fmt(d.combustivel || 0)}</td>
                            <td style="color:#4a9eff">${fmt(d.manutencao || 0)}</td>
                            <td style="color:#e8a820;font-weight:700">${fmt((d.corridas||0)-(d.combustivel||0)-(d.manutencao||0))}</td>
                            <td><button class="btn-del" onclick="deletarUber(${diasMes.length - 1 - i})">✕</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function uberDiasFiltrados() {
    const mes = dados.uberMes !== undefined ? dados.uberMes : new Date().getMonth();
    const ano = dados.uberAno !== undefined ? dados.uberAno : new Date().getFullYear();
    return dados.uber.filter(d => {
        const dt = new Date(d.data + 'T12:00:00');
        return dt.getMonth() === mes && dt.getFullYear() === ano;
    });
}

function mudarMesUber(val) { dados.uberMes = parseInt(val); salvar(); renderAba('uber'); }
function mudarAnoUber(val) { dados.uberAno = parseInt(val); salvar(); renderAba('uber'); }

function salvarUber() {
    const data = document.getElementById('uberData').value;
    const corridas = parseFloat(document.getElementById('uberCorridas').value || 0);
    const combustivel = parseFloat(document.getElementById('uberCombust').value || 0);
    const manutencao = parseFloat(document.getElementById('uberManut').value || 0);
    if (!data || !corridas) return alert('Preencha a data e o valor das corridas!');
    dados.uber.push({ data, corridas, combustivel, manutencao });
    salvar();
    renderAba('uber');
}

function deletarUber(i) {
    const diasMes = uberDiasFiltrados();
    const itemReal = diasMes[diasMes.length - 1 - i];
    const idx = dados.uber.indexOf(itemReal);
    if (confirm('Tem certeza que deseja deletar este dia?')) {
        dados.uber.splice(idx, 1);
        salvar();
        renderAba('uber');
    }
}
function paginaDashboard() {
    const totalEntradas = dados.salario + 
        dados.freelances.reduce((s, f) => s + f.valor, 0) +
        dados.uber.reduce((s, u) => s + u.corridas, 0);
    const totalGastos = dados.gastos.reduce((s, g) => s + g.valor, 0) +
        dados.uber.reduce((s, u) => s + (u.combustivel||0) + (u.manutencao||0), 0);
    const saldo = totalEntradas - totalGastos;
    const totalFreelance = dados.freelances.reduce((s, f) => s + f.valor, 0);
    const totalUberLiq = dados.uber.reduce((s, u) => s + (u.corridas||0) - (u.combustivel||0) - (u.manutencao||0), 0);

    const last7 = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const ds = d.toISOString().split('T')[0];
        const ent = dados.freelances.filter(f => f.data === ds).reduce((s, f) => s + f.valor, 0) +
            (dados.uber.find(u => u.data === ds)?.corridas || 0);
        const gas = dados.gastos.filter(g => g.data === ds).reduce((s, g) => s + g.valor, 0);
        const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
        return { dia: dias[d.getDay()], ent, gas };
    });
    const maxBar = Math.max(...last7.map(d => Math.max(d.ent, d.gas)), 1);

    return `
        <div class="section-title">📈 Dashboard Financeiro</div>

        <div class="saldo-card" style="margin-bottom:20px">
            <div class="saldo-label">Saldo Disponível</div>
            <div class="saldo-valor ${saldo < 0 ? 'negativo' : ''}">${fmt(saldo)}</div>
            <div class="saldo-meta">
                <div class="saldo-meta-item">
                    <span class="lbl">Entradas</span>
                    <span class="val verde">${fmt(totalEntradas)}</span>
                </div>
                <div class="saldo-meta-item">
                    <span class="lbl">Gastos</span>
                    <span class="val vermelho">${fmt(totalGastos)}</span>
                </div>
                <div class="saldo-meta-item">
                    <span class="lbl">Freelance</span>
                    <span class="val azul">${fmt(totalFreelance)}</span>
                </div>
                <div class="saldo-meta-item">
                    <span class="lbl">Uber Líquido</span>
                    <span class="val" style="color:#9b7fe8">${fmt(totalUberLiq)}</span>
                </div>
            </div>
        </div>

        <div class="chart-wrap">
            <div class="chart-title">Últimos 7 Dias</div>
            <div class="bar-chart">
                ${last7.map(d => `
                    <div class="bar-col">
                        <div style="display:flex;gap:3px;align-items:flex-end;height:100px">
                            <div style="width:14px;background:#26d9a0;border-radius:4px 4px 0 0;height:${d.ent/maxBar*100}%;min-height:${d.ent?4:0}px"></div>
                            <div style="width:14px;background:#f05070;border-radius:4px 4px 0 0;height:${d.gas/maxBar*100}%;min-height:${d.gas?4:0}px"></div>
                        </div>
                        <div class="bar-label">${d.dia}</div>
                    </div>
                `).join('')}
            </div>
            <div style="display:flex;gap:16px;margin-top:12px">
                <div style="display:flex;align-items:center;gap:6px"><div style="width:12px;height:12px;border-radius:3px;background:#26d9a0"></div><span style="font-size:11px;color:#5a7090">Entradas</span></div>
                <div style="display:flex;align-items:center;gap:6px"><div style="width:12px;height:12px;border-radius:3px;background:#f05070"></div><span style="font-size:11px;color:#5a7090">Gastos</span></div>
            </div>
        </div>

        <div class="chart-wrap">
            <div class="chart-title">Distribuição de Renda</div>
            ${[
                {label:'💼 Salário', value:dados.salario, total:totalEntradas, color:'#26d9a0'},
                {label:'💻 Freelance', value:totalFreelance, total:totalEntradas, color:'#4a9eff'},
                {label:'🚗 Uber', value:dados.uber.reduce((s,u)=>s+u.corridas,0), total:totalEntradas, color:'#9b7fe8'},
            ].map(r => {
                const pct = r.total > 0 ? (r.value/r.total*100).toFixed(1) : 0;
                return `
                    <div class="progress-row">
                        <div class="progress-meta">
                            <span class="progress-label">${r.label}</span>
                            <span class="progress-val" style="color:${r.color}">${fmt(r.value)} (${pct}%)</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width:${pct}%;background:${r.color}"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}
function paginaObjetivos() {
    return `
        <div class="section-title">🎯 Objetivos</div>

        <div class="card-form">
            <div class="form-title">+ Novo Objetivo</div>
            <div class="form-row">
                <div class="field">
                    <label>Objetivo</label>
                    <input type="text" id="objNome" placeholder="Ex: Viagem para SP..."/>
                </div>
                <div class="field">
                    <label>Valor Total (R$)</label>
              <input type="number" id="objValor" placeholder="0,00" oninput="calcularParcela()"/>
                </div>
            </div>
            <div class="form-row">
                <div class="field">
                    <label>Parcelamento</label>
                   <select id="objParcelas" onchange="calcularParcela()">
                        <option value="1">À vista</option>
                        <option value="2">2x</option>
                        <option value="3">3x</option>
                        <option value="4">4x</option>
                        <option value="5">5x</option>
                        <option value="6">6x</option>
                        <option value="7">7x</option>
                        <option value="8">8x</option>
                        <option value="9">9x</option>
                        <option value="10">10x</option>
                        <option value="11">11x</option>
                        <option value="12">12x</option>
                        <option value="18">18x</option>
                    </select>
                </div>
                <div class="field">
                    <label>Valor da Parcela</label>
                    <div id="objParcela" style="padding:12px 14px;background:#111827;border:1px solid #1e2d45;border-radius:10px;color:#e8a820;font-weight:700;font-size:14px">R$ 0,00</div>
                </div>
            </div>
            <button class="btn-salvar" onclick="salvarObjetivo()">Salvar Objetivo</button>
        </div>

        <div class="tabela-wrap">
            ${dados.objetivos.length === 0 ? '<p style="text-align:center;color:#5a7090;padding:24px">Nenhum objetivo ainda</p>' : `
            <table class="tabela">
                <thead>
                    <tr>
                        <th>Objetivo</th>
                        <th>Valor Total</th>
                        <th>Parcelas</th>
                        <th>Valor/Parcela</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${[...dados.objetivos].reverse().map((o, i) => `
                        <tr>
                            <td>${o.nome}</td>
                            <td style="color:#e8a820;font-weight:700">${fmt(o.valor)}</td>
                            <td><span class="badge badge-blue">${o.parcelas === 1 ? 'À vista' : o.parcelas + 'x'}</span></td>
                            <td style="color:#26d9a0;font-weight:700">${fmt(o.valor / o.parcelas)}</td>
                            <td><button class="btn-del" onclick="deletarObjetivo(${dados.objetivos.length - 1 - i})">✕</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`}
        </div>
    `;
}
function calcularParcela() {
    const valor = parseFloat(document.getElementById('objValor').value || 0);
    const parcelas = parseInt(document.getElementById('objParcelas').value);
    document.getElementById('objParcela').textContent = fmt(valor / parcelas);
}

function salvarObjetivo() {
    const nome = document.getElementById('objNome').value;
    const valor = parseFloat(document.getElementById('objValor').value);
    const parcelas = parseInt(document.getElementById('objParcelas').value);
    if (!nome || !valor) return alert('Preencha o objetivo e o valor!');
    dados.objetivos.push({ nome, valor, parcelas });
    salvar();
    renderAba('objetivos');
}

function deletarObjetivo(i) {
    if (confirm('Tem certeza que deseja deletar este objetivo?')) {
        dados.objetivos.splice(i, 1);
        salvar();
        renderAba('objetivos');
    }
}
function paginaFinbot() {
    const totalEntradas = dados.salario + dados.freelances.reduce((s,f)=>s+f.valor,0) + dados.uber.reduce((s,u)=>s+u.corridas,0);
    const totalGastos = dados.gastos.reduce((s,g)=>s+g.valor,0) + dados.uber.reduce((s,u)=>s+(u.combustivel||0)+(u.manutencao||0),0);
    const saldo = totalEntradas - totalGastos;

    return `
        <div class="section-title">🤖 FinBot — Agente Financeiro</div>

        <div class="finbot-wrap">
            <div class="finbot-header">
                <div class="finbot-avatar">🤖</div>
                <div>
                    <div class="finbot-name">FinBot</div>
                    <div class="finbot-status">Online · Analisando seus dados</div>
                </div>
            </div>

            <div class="quick-chips">
                <div class="quick-chip" onclick="enviarFinbot('Como está meu saldo?')">Como está meu saldo?</div>
                <div class="quick-chip" onclick="enviarFinbot('Onde posso economizar?')">Onde economizar?</div>
                <div class="quick-chip" onclick="enviarFinbot('Analise meu freelance')">Analise meu freelance</div>
                <div class="quick-chip" onclick="enviarFinbot('Devo investir?')">Devo investir?</div>
            </div>

            <div class="msgs" id="finbotMsgs">
                <div class="msg bot">
                    <div class="msg-bubble">👋 Olá! Sou o FinBot, seu agente financeiro. Tenho acesso aos seus dados e posso te ajudar com análises e dicas. Como posso ajudar?</div>
                </div>
            </div>

            <div class="chat-input-row">
                <input class="chat-input" id="finbotInput" placeholder="Pergunte ao FinBot..." onkeydown="if(event.key==='Enter') enviarFinbot()"/>
                <button class="chat-send" id="finbotBtn" onclick="enviarFinbot()">➤</button>
            </div>
        </div>
    `;
}

async function enviarFinbot(mensagem) {
    const input = document.getElementById('finbotInput');
    const msgs = document.getElementById('finbotMsgs');
    const btn = document.getElementById('finbotBtn');
    const msg = mensagem || input.value.trim();
    if (!msg) return;
    input.value = '';

    msgs.innerHTML += `<div class="msg user"><div class="msg-bubble">${msg}</div></div>`;
    msgs.innerHTML += `<div class="msg bot" id="typing"><div class="typing"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>`;
    msgs.scrollTop = msgs.scrollHeight;
    btn.textContent = '⏳';
    btn.disabled = true;

    const totalEntradas = dados.salario + dados.freelances.reduce((s,f)=>s+f.valor,0) + dados.uber.reduce((s,u)=>s+u.corridas,0);
    const totalGastos = dados.gastos.reduce((s,g)=>s+g.valor,0) + dados.uber.reduce((s,u)=>s+(u.combustivel||0)+(u.manutencao||0),0);
    const saldo = totalEntradas - totalGastos;

    const system = `Você é o FinBot, agente financeiro pessoal. Responda em português BR, seja direto e prático. Máx 150 palavras.

DADOS:
- Salário: ${fmt(dados.salario)}
- Freelance: ${fmt(dados.freelances.reduce((s,f)=>s+f.valor,0))}
- Uber líquido: ${fmt(dados.uber.reduce((s,u)=>s+(u.corridas||0)-(u.combustivel||0)-(u.manutencao||0),0))}
- Total entradas: ${fmt(totalEntradas)}
- Total gastos: ${fmt(totalGastos)}
- Saldo: ${fmt(saldo)}
- Objetivos: ${JSON.stringify(dados.objetivos)}`;

    try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1000,
                system,
                messages: [{ role: 'user', content: msg }]
            })
        });
        const data = await res.json();
        document.getElementById('typing').remove();
        msgs.innerHTML += `<div class="msg bot"><div class="msg-bubble">${data.content[0].text}</div></div>`;
    } catch {
        document.getElementById('typing').remove();
        msgs.innerHTML += `<div class="msg bot"><div class="msg-bubble">Erro de conexão. Tente novamente.</div></div>`;
    }
    btn.textContent = '➤';
    btn.disabled = false;
    msgs.scrollTop = msgs.scrollHeight;
}