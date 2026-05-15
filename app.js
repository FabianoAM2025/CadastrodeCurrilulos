const MAX_FILE_BYTES = 5 * 1024 * 1024;

const form = document.getElementById("cv-form");
const statusEl = document.getElementById("status");
const fileInput = form.querySelector('input[name="arquivo"]');
const fileHint = document.getElementById("file-hint");
const formacaoList = document.getElementById("formacao-list");
const experienciaList = document.getElementById("experiencia-list");
const tplFormacao = document.getElementById("tpl-formacao");
const tplExperiencia = document.getElementById("tpl-experiencia");

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle("is-error", isError);
}

function cloneBlock(template) {
  return template.content.firstElementChild.cloneNode(true);
}

function bindRemove(root) {
  root.querySelector(".btn-remove").addEventListener("click", () => {
    root.remove();
    if (!formacaoList.children.length) addFormacao();
    if (!experienciaList.children.length) addExperiencia();
  });
}

function addFormacao() {
  const el = cloneBlock(tplFormacao);
  bindRemove(el);
  formacaoList.appendChild(el);
}

function addExperiencia() {
  const el = cloneBlock(tplExperiencia);
  bindRemove(el);
  experienciaList.appendChild(el);
}

function collectFormacao() {
  return [...formacaoList.querySelectorAll("[data-block=formacao]")].map((row) => ({
    curso: row.querySelector(".f-curso").value.trim(),
    instituicao: row.querySelector(".f-instituicao").value.trim(),
    anoConclusao: row.querySelector(".f-ano").value.trim(),
  }));
}

function collectExperiencia() {
  return [...experienciaList.querySelectorAll("[data-block=experiencia]")].map((row) => ({
    empresa: row.querySelector(".e-empresa").value.trim(),
    cargo: row.querySelector(".e-cargo").value.trim(),
    inicio: row.querySelector(".e-inicio").value,
    fim: row.querySelector(".e-fim").value,
    descricao: row.querySelector(".e-desc").value.trim(),
  }));
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const res = r.result;
      if (typeof res === "string") {
        const base64 = res.split(",")[1] || "";
        resolve(base64);
      } else resolve("");
    };
    r.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    r.readAsDataURL(file);
  });
}

fileInput.addEventListener("change", () => {
  const f = fileInput.files[0];
  if (!f) {
    fileHint.textContent = "Nenhum arquivo selecionado.";
    return;
  }
  if (f.size > MAX_FILE_BYTES) {
    fileHint.textContent = "Arquivo acima de 5 MB. Escolha outro PDF.";
    fileInput.value = "";
    return;
  }
  fileHint.textContent = `${f.name} (${(f.size / 1024).toFixed(0)} KB)`;
});

document.getElementById("add-formacao").addEventListener("click", addFormacao);
document.getElementById("add-experiencia").addEventListener("click", addExperiencia);

document.getElementById("btn-reset").addEventListener("click", () => {
  if (!confirm("Limpar todos os campos?")) return;
  form.reset();
  formacaoList.innerHTML = "";
  experienciaList.innerHTML = "";
  addFormacao();
  addExperiencia();
  fileHint.textContent = "Nenhum arquivo selecionado.";
  setStatus("");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("");

  if (!form.reportValidity()) {
    setStatus("Corrija os campos obrigatórios.", true);
    return;
  }

  const file = fileInput.files[0];
  if (file && file.size > MAX_FILE_BYTES) {
    setStatus("O PDF deve ter no máximo 5 MB.", true);
    return;
  }

  const payload = {
    cadastradoEm: new Date().toISOString(),
    dadosPessoais: {
      nome: form.nome.value.trim(),
      dataNascimento: form.dataNascimento.value,
      email: form.email.value.trim(),
      telefone: form.telefone.value.trim(),
      localidade: form.localidade.value.trim(),
      linkedin: form.linkedin.value.trim(),
    },
    objetivo: form.objetivo.value.trim(),
    formacao: collectFormacao().filter((x) => x.curso || x.instituicao || x.anoConclusao),
    experiencia: collectExperiencia().filter((x) => x.empresa || x.cargo || x.descricao),
    habilidades: form.habilidades.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    anexo: null,
  };

  if (file) {
    try {
      const base64 = await readFileAsBase64(file);
      payload.anexo = {
        nome: file.name,
        tipo: file.type,
        tamanhoBytes: file.size,
        conteudoBase64: base64,
      };
    } catch {
      setStatus("Não foi possível ler o PDF. Tente outro arquivo.", true);
      return;
    }
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  const safeName = payload.dadosPessoais.nome.replace(/\s+/g, "_").slice(0, 40);
  a.href = URL.createObjectURL(blob);
  a.download = `curriculo_${safeName}_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);

  setStatus("Arquivo JSON gerado. Guarde-o com segurança — pode conter dados pessoais e o PDF em Base64.");
});

addFormacao();
addExperiencia();
