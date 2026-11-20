import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, ExternalLink } from "lucide-react";

import logoDetails from "../../assets/images/logo-oportuna-details.png";
import { ModalInfo } from "../../components/ModalInfo/ModalInfo";
import { ApiError } from "../../services/api";
import { sair } from "../../services/authService";
import { buscarOportunidade } from "../../services/oportunidadeService";
import {
  estadoLabel,
  formatarRenda,
  modalidadeLabel,
  tipoLabel,
} from "../../types/oportunidade";
import type { Oportunidade } from "../../types/oportunidade";

import styles from "./OpportunityDetails.module.css";

type ModalAberto = "contato" | "candidatura" | null;

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function OpportunityDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [oportunidade, setOportunidade] = useState<Oportunidade | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalAberto>(null);

  const fecharModal = useCallback(() => setModal(null), []);

  useEffect(() => {
    if (!id) return;
    let ativo = true;

    buscarOportunidade(id)
      .then((dados) => {
        if (ativo) setOportunidade(dados);
      })
      .catch((e: unknown) => {
        if (!ativo) return;

        if (e instanceof ApiError && e.status === 401) {
          sair();
          navigate("/login", { replace: true });
          return;
        }

        setErro(
          e instanceof Error ? e.message : "Não foi possível carregar a vaga.",
        );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [id, navigate]);

  // Só dá para se candidatar a vagas ativas que tenham link.
  const aberta = oportunidade?.estado === "ATIVA";
  const candidaturaUrl = aberta ? (oportunidade?.linkCandidatura ?? "") : "";
  const contato = oportunidade?.emailContato ?? "";

  // Abre o link da empresa em uma nova aba.
  function acessarLink() {
    window.open(candidaturaUrl, "_blank", "noopener,noreferrer");
    setModal(null);
  }

  return (
    <main className={styles.details}>
      <ModalInfo
        aberto={modal === "contato"}
        titulo="Contato da empresa"
        botaoLabel="Fechar"
        onFechar={fecharModal}
      >
        <p>{oportunidade?.empresa}</p>
        {contato ? (
          <p>
            <a href={`mailto:${contato}`}>{contato}</a>
          </p>
        ) : (
          <p>Contato não informado pelo divulgador.</p>
        )}
      </ModalInfo>

      <ModalInfo
        aberto={modal === "candidatura"}
        titulo="Candidatura externa"
        botaoLabel="Acessar link"
        onFechar={fecharModal}
        onBotao={acessarLink}
      >
        <p>
          A candidatura para esta oportunidade acontece fora da plataforma
          OportUna.
        </p>
        <p>Você será direcionado ao processo de inscrição da empresa.</p>
      </ModalInfo>

      <div className={styles.container}>
        <div className={styles.topBar}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate("/home")}
          >
            <ArrowLeft size={18} />
            Voltar para início
          </button>

          <img src={logoDetails} alt="OportUna" className={styles.logo} />
        </div>

        {carregando && <p className={styles.stateMessage}>Carregando...</p>}

        {erro && (
          <p className={`${styles.stateMessage} ${styles.error}`} role="alert">
            {erro}
          </p>
        )}

        {oportunidade && (
          <>
            <div className={styles.contentGrid}>
              <section className={styles.mainCard}>
                <header className={styles.header}>
                  <h1>{oportunidade.titulo}</h1>

                  <div className={styles.company}>
                    <Building2 size={18} />
                    <span>{oportunidade.empresa}</span>
                  </div>

                  <div className={styles.tags}>
                    <span className={styles.tag}>
                      {tipoLabel[oportunidade.tipo]}
                    </span>
                    <span className={styles.tag}>
                      {modalidadeLabel[oportunidade.modalidade]}
                    </span>
                    {oportunidade.localizacao && (
                      <span className={styles.tag}>
                        {oportunidade.localizacao}
                      </span>
                    )}
                    {!aberta && (
                      <span className={`${styles.tag} ${styles.tagClosed}`}>
                        {estadoLabel[oportunidade.estado]}
                      </span>
                    )}
                  </div>
                </header>

                <section className={styles.section}>
                  <h2>Renda</h2>
                  <p className={styles.salary}>
                    {formatarRenda(oportunidade.renda)}
                    {oportunidade.renda !== null &&
                      oportunidade.renda !== undefined && <span> / mês</span>}
                  </p>
                </section>

                <section className={styles.section}>
                  <h2>Sobre a oportunidade</h2>
                  <p className={styles.description}>
                    {oportunidade.descricao}
                  </p>
                </section>

                {oportunidade.requisitos.length > 0 && (
                  <section className={styles.section}>
                    <h2>Requisitos</h2>

                    <ul className={styles.requirements}>
                      {oportunidade.requisitos.map((requisito) => (
                        <li key={requisito}>{requisito}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {oportunidade.expiraEm && (
                  <section className={styles.section}>
                    <h2>Prazo</h2>
                    <p>
                      Candidaturas até {formatarData(oportunidade.expiraEm)}.
                    </p>
                  </section>
                )}
              </section>

              <aside className={styles.sidebar}>
                {/* Só aparece quando a vaga tem link de candidatura */}
                {candidaturaUrl && (
                  <section className={styles.sideCard}>
                    <h2>Candidate-se</h2>

                    <p>
                      A candidatura é realizada fora da plataforma, no canal
                      indicado pelo divulgador.
                    </p>

                    <button
                      type="button"
                      className={styles.applyButton}
                      onClick={() => setModal("candidatura")}
                    >
                      Acessar página de candidatura
                      <ExternalLink size={16} />
                    </button>
                  </section>
                )}

                <section className={styles.sideCard}>
                  <h2>Dúvidas sobre a vaga?</h2>

                  <p>
                    Entre em contato com a empresa, se essa informação estiver
                    disponível.
                  </p>

                  <button
                    type="button"
                    className={styles.contactButton}
                    onClick={() => setModal("contato")}
                  >
                    Ver contato
                  </button>
                </section>
              </aside>
            </div>

            <p className={styles.opportunityId}>
              Código da oportunidade: {oportunidade.id}
            </p>
          </>
        )}
      </div>
    </main>
  );
}