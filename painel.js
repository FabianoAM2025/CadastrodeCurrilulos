const listStatus = document.getElementById("list-status");
const tblBody = document.getElementById("tbl-body");
const detailSection = document.getElementById("detail-section");
const detailContent = document.getElementById("detail-content");
const btnRefresh = document.getElementById("btn-refresh");
const btnCloseDetail = document.getElementById("btn-close-detail");

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

function safeHttpUrl(u) {
  if (!u || typeof u !== "string") return null;
  const t = u.trim();
  if (/^https:\/\//i.test(t) || /^http:\/\//i.test(t)) return t;
  return null;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

async function loadList() {
  listStatus.textContent = "A carregar…";
  tblBody.innerHTML = "";
  try {
    const res = await fetch("/api/curriculos");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    if (!rows.length) {
      listStatus.textContent = "Ainda não há candidatos. Abra o formulário na página inicial e grave um currículo.";
      return;
    }
    listStatus.textContent = `${rows.length} candidato(s).`;
    for (const r of rows) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${esc(r.id)}</td>
        <td>${esc(formatDate(r.cadastradoEm))}</td>
        <td>${esc(r.nome)}</td>
        <td><a href="mailto:${encodeURIComponent(r.email)}">${esc(r.email)}</a></td>
        <td>${esc(r.telefone)}</td>
        <td><button type="button" class="btn btn-ghost btn-sm btn-ver" data-id="${esc(r.id)}">Ver currículo</button></td>
      `;
      tblBody.appendChild(tr);
    }
    tblBody.querySelectorAll(".btn-ver").forEach((btn) => {
      btn.addEventListener("click", () => loadDetail(Number(btn.dataset.id)));
    });
  } catch {
    listStatus.textContent =
      "Não foi possível carregar a lista. Confirme que o servidor está a correr (npm start) e que abriu http://localhost:3000/painel.html";
  }
}

function renderDetail(data) {
  const p = data.payload;
  const dp = p.dadosPessoais || {};
  let html = `<div class="detail-block"><h3>Dados pessoais</h3><dl class="detail-dl">`;
  html += `<dt>Nome</dt><dd>${esc(dp.nome)}</dd>`;
  html += `<dt>E-mail</dt><dd><a href="mailto:${encodeURIComponent(dp.email)}">${esc(dp.email)}</a></dd>`;
  html += `<dt>Telefone</dt><dd>${esc(dp.telefone)}</dd>`;
  html += `<dt>Data nasc.</dt><dd>${esc(dp.dataNascimento || "—")}</dd>`;
  html += `<dt>Localidade</dt><dd>${esc(dp.localidade || "—")}</dd>`;
  const liUrl = safeHttpUrl(dp.linkedin);
  html += `<dt>LinkedIn / site</dt><dd>${
    liUrl ? `<a href="${esc(liUrl)}" target="_blank" rel="noopener">${esc(dp.linkedin)}</a>` : esc(dp.linkedin || "—")
  }</dd>`;
  html += `</dl></div>`;

  html += `<div class="detail-block"><h3>Objetivo / resumo</h3><p class="detail-text">${esc(p.objetivo || "—")}</p></div>`;

  html += `<div class="detail-block"><h3>Formação</h3>`;
  if (p.formacao && p.formacao.length) {
    html += "<ul class=\"detail-ul\">";
    for (const f of p.formacao) {
      html += `<li>${esc(f.curso)} — ${esc(f.instituicao)} (${esc(f.anoConclusao || "—")})</li>`;
    }
    html += "</ul>";
  } else html += "<p class=\"detail-muted\">Nenhum registo.</p>";
  html += "</div>";

  html += `<div class="detail-block"><h3>Experiência</h3>`;
  if (p.experiencia && p.experiencia.length) {
    for (const e of p.experiencia) {
      html += `<div class="detail-exp"><strong>${esc(e.cargo)}</strong> · ${esc(e.empresa)}<br><span class="detail-muted">${esc(e.inicio || "?")} — ${esc(e.fim || "atual")}</span>`;
      if (e.descricao) html += `<p class="detail-text">${esc(e.descricao)}</p>`;
      html += "</div>";
    }
  } else html += "<p class=\"detail-muted\">Nenhum registo.</p>";
  html += "</div>";

  html += `<div class="detail-block"><h3>Habilidades</h3><p>${p.habilidades && p.habilidades.length ? esc(p.habilidades.join(", ")) : "—"}</p></div>`;

  if (p.anexo && p.anexo.conteudoBase64) {
    const href = `data:${p.anexo.tipo || "application/pdf"};base64,${p.anexo.conteudoBase64}`;
    html += `<div class="detail-block"><h3>Anexo (PDF)</h3><p><a class="btn btn-secondary btn-sm" href="${href}" download="${esc(p.anexo.nome || "curriculo.pdf")}" target="_blank" rel="noopener">Descarregar PDF</a> <span class="detail-muted">(${esc(p.anexo.nome)})</span></p></div>`;
  } else {
    html += `<div class="detail-block"><h3>Anexo</h3><p class="detail-muted">Nenhum PDF enviado.</p></div>`;
  }

  detailContent.innerHTML = html;
  detailSection.hidden = false;
  detailSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function loadDetail(id) {
  detailContent.innerHTML = "<p>A carregar…</p>";
  detailSection.hidden = false;
  try {
    const res = await fetch(`/api/curriculos/${id}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    renderDetail(data);
  } catch {
    detailContent.innerHTML = "<p class=\"detail-error\">Não foi possível carregar este registo.</p>";
  }
}

btnRefresh.addEventListener("click", () => {
  detailSection.hidden = true;
  loadList();
});

btnCloseDetail.addEventListener("click", () => {
  detailSection.hidden = true;
});

if (window.location.protocol === "file:") {
  listStatus.textContent =
    "Abra esta página em http://localhost:3000/painel.html (com npm start) — não funciona como ficheiro local.";
} else {
  loadList();
}
