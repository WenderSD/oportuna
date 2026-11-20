import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";
import { ModalInfo } from "../../components/ModalInfo/ModalInfo";
import { ApiError } from "../../services/api";
import { sair } from "../../services/authService";
import {
  buscarOportunidade,
  criarOportunidade,
  editarOportunidade,
} from "../../services/oportunidadeService";
import type {
  DadosOportunidade,
  Modalidade,
  Oportunidade,
  TipoOportunidade,
} from "../../types/oportunidade";

import styles from "./PublishOpportunity.module.css";

type CampoDeFormulario =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

function valor(form: HTMLFormElement, nome: string) {
  return (form.elements.namedItem(nome) as CampoDeFormulario).value.trim();
}

function sessaoExpirou(e: unknown) {
  return e instanceof ApiError && e.status === 401;
}

function mensagemDeErro(e: unknown, padrao: string) {
  return e instanceof Error ? e.message : padrao;
}

// Converte a data do banco (ISO) para o formato do <input type="date">.
function paraData(iso: string | null) {
  if (!iso) return "";
  const data = new Date(iso);
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

export function PublishOpportunity() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editando = Boolean(id);

  const [inicial, setInicial] = useState<Oportunidade | null>(null);
  const [carregando, setCarregando] = useState(editando);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [publicada, setPublicada] = useState(false);

  // Modo edição: carrega a vaga para preencher o formulário.
  useEffect(() => {
    if (!id) return;
    let ativo = true;

    buscarOportunidade(id)
      .then((oportunidade) => {
        if (ativo) setInicial(oportunidade);
      })
      .catch((e: unknown) => {
        if (!ativo) return;

        if (sessaoExpirou(e)) {
          sair();
          navigate("/login", { replace: true });
          return;
        }

        setErro(mensagemDeErro(e, "Não foi possível carregar a vaga."));
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [id, navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const prazo = valor(form, "expiraEm");
    const rendaTexto = valor(form, "renda");

    const dados: DadosOportunidade = {
      titulo: valor(form, "titulo"),
      empresa: valor(form, "empresa"),
      tipo: valor(form, "tipo") as TipoOportunidade,
      modalidade: valor(form, "modalidade") as Modalidade,
      descricao: valor(form, "descricao"),
      localizacao: valor(form, "localizacao"),
      requisitos: valor(form, "requisitos")
        .split("\n")
        .map((linha) => linha.trim())
        .filter(Boolean),
      linkCandidatura: valor(form, "linkCandidatura"),
      emailContato: valor(form, "emailContato"),
      renda: rendaTexto ? Number(rendaTexto) : undefined,
      expiraEm: prazo
        ? new Date(`${prazo}T23:59:59`).toISOString()
        : undefined,
    };

    setErro(null);
    setEnviando(true);

    try {
      if (id) {
        await editarOportunidade(id, dados);
        navigate("/perfil", {
          state: { aviso: "Oportunidade atualizada com sucesso." },
        });
      } else {
        await criarOportunidade(dados);
        setPublicada(true);
      }
    } catch (e) {
      if (sessaoExpirou(e)) {
        sair();
        navigate("/login", { replace: true });
        return;
      }

      setErro(mensagemDeErro(e, "Não foi possível salvar a oportunidade."));
    } finally {
      setEnviando(false);
    }
  }

  function handleCancel() {
    navigate(editando ? "/perfil" : "/home");
  }

  return (
    <div className={styles.page}>
      <ModalInfo
        aberto={publicada}
        titulo="Oportunidade publicada!"
        botaoLabel="Voltar ao início"
        centralizado
        onFechar={() => navigate("/home")}
      >
        <p>
          Sua oportunidade foi cadastrada com sucesso na plataforma OportUna.
        </p>
      </ModalInfo>

      <div className={styles.container}>
        <header className={styles.header}>
          <h1>{editando ? "Editar oportunidade" : "Publicar oportunidade"}</h1>

          <p>
            {editando
              ? "Atualize as informações da sua oportunidade."
              : "Compartilhe uma oportunidade com a comunidade acadêmica."}
          </p>
        </header>

        <div className={styles.content}>
          <section className={styles.formCard}>
            {carregando ? (
              <p className={styles.hint}>Carregando...</p>
            ) : (
              <form
                key={inicial?.id ?? "nova"}
                className={styles.form}
                onSubmit={handleSubmit}
              >
                <Input
                  id="titulo"
                  name="titulo"
                  label="Título da vaga"
                  placeholder="Ex.: Estágio em Desenvolvimento"
                  defaultValue={inicial?.titulo ?? ""}
                  required
                />

                <Input
                  id="empresa"
                  name="empresa"
                  label="Empresa"
                  placeholder="Nome da empresa ou organização"
                  defaultValue={inicial?.empresa ?? ""}
                  required
                />

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label htmlFor="tipo">Tipo de oportunidade</label>

                    <select
                      id="tipo"
                      name="tipo"
                      className={styles.select}
                      defaultValue={inicial?.tipo ?? ""}
                      required
                    >
                      <option value="" disabled>
                        Selecione o tipo
                      </option>
                      <option value="ESTAGIO">Estágio</option>
                      <option value="EMPREGO">Emprego</option>
                      <option value="PESQUISA">Pesquisa</option>
                      <option value="OUTRO">Outro</option>
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="modalidade">Modalidade</label>

                    <select
                      id="modalidade"
                      name="modalidade"
                      className={styles.select}
                      defaultValue={inicial?.modalidade ?? ""}
                      required
                    >
                      <option value="" disabled>
                        Selecione a modalidade
                      </option>
                      <option value="PRESENCIAL">Presencial</option>
                      <option value="HIBRIDO">Híbrido</option>
                      <option value="REMOTO">Remoto</option>
                    </select>
                  </div>
                </div>

                <div className={styles.row}>
                  <Input
                    id="localizacao"
                    name="localizacao"
                    label="Localização (opcional)"
                    placeholder="Ex.: Barretos - SP"
                    defaultValue={inicial?.localizacao ?? ""}
                  />

                  <Input
                    id="renda"
                    name="renda"
                    label="Renda mensal em R$ (opcional)"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex.: 1500"
                    defaultValue={inicial?.renda ?? ""}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="descricao">Descrição</label>

                  <textarea
                    id="descricao"
                    name="descricao"
                    className={styles.textarea}
                    placeholder="Descreva atividades e informações importantes"
                    defaultValue={inicial?.descricao ?? ""}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="requisitos">Requisitos (opcional)</label>

                  <textarea
                    id="requisitos"
                    name="requisitos"
                    className={styles.textarea}
                    placeholder="Escreva um requisito por linha"
                    defaultValue={inicial?.requisitos.join("\n") ?? ""}
                  />
                </div>

                <div className={styles.row}>
                  <Input
                    id="linkCandidatura"
                    name="linkCandidatura"
                    label="Link de candidatura (opcional)"
                    type="url"
                    placeholder="https://..."
                    defaultValue={inicial?.linkCandidatura ?? ""}
                  />

                  <Input
                    id="emailContato"
                    name="emailContato"
                    label="E-mail de contato (opcional)"
                    type="email"
                    placeholder="contato@empresa.com"
                    defaultValue={inicial?.emailContato ?? ""}
                  />
                </div>

                {/* Mesma largura do campo de link acima */}
                <div className={styles.halfField}>
                  <Input
                    id="expiraEm"
                    name="expiraEm"
                    label="Prazo para candidaturas (opcional)"
                    type="date"
                    defaultValue={paraData(inicial?.expiraEm ?? null)}
                  />
                </div>

                {erro && (
                  <p className={styles.error} role="alert">
                    {erro}
                  </p>
                )}

                <div className={styles.actions}>
                  <Button
                    type="submit"
                    className={styles.submitButton}
                    disabled={enviando}
                  >
                    {enviando
                      ? "Salvando..."
                      : editando
                        ? "Salvar alterações"
                        : "Publicar oportunidade"}
                  </Button>

                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={handleCancel}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {/* Erro ao carregar a vaga (modo edição) */}
            {!carregando && editando && !inicial && erro && (
              <p className={styles.error} role="alert">
                {erro}
              </p>
            )}
          </section>

          <aside className={styles.tipCard}>
            <h2>Uma boa publicação</h2>

            <p>
              Use um título claro e descreva os requisitos de forma objetiva
              para ajudar os estudantes.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}