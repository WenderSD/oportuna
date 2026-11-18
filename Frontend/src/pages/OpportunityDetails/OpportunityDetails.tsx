import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, ExternalLink } from "lucide-react";

import logoDetails from "../../assets/images/logo-oportuna-details.png";
import styles from "./OpportunityDetails.module.css";

export function OpportunityDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Dados ilustrativos até a integração com a API.
  const candidaturaUrl = "";
  const contato = "";

  return (
    <main className={styles.details}>
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

        <div className={styles.contentGrid}>
          <section className={styles.mainCard}>
            <header className={styles.header}>
              <h1>Estágio em Desenvolvimento de Software</h1>

              <div className={styles.company}>
                <Building2 size={18} />
                <span>Empresa de tecnologia</span>
              </div>

              <div className={styles.tags}>
                <span className={styles.tag}>Estágio</span>
                <span className={styles.tag}>Híbrido</span>
              </div>
            </header>

            <section className={styles.section}>
              <h2>Sobre a oportunidade</h2>
              <p>
                Buscamos estudantes interessados em desenvolvimento de software
                para integrar o time e participar de projetos reais, colaborando
                com profissionais experientes.
              </p>
            </section>

            <section className={styles.section}>
              <h2>Requisitos</h2>

              <ul className={styles.requirements}>
                <li>Conhecimentos básicos em lógica de programação</li>
                <li>Noções de desenvolvimento web</li>
                <li>Disponibilidade para aprender e trabalhar em equipe</li>
              </ul>
            </section>
          </section>

          <aside className={styles.sidebar}>
            <section className={styles.sideCard}>
              <h2>Candidate-se</h2>

              <p>
                A candidatura é realizada fora da plataforma, no canal indicado
                pelo divulgador.
              </p>

              <a
                href={candidaturaUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.applyButton} ${
                  !candidaturaUrl ? styles.disabledButton : ""
                }`}
                aria-disabled={!candidaturaUrl}
                onClick={(event) => {
                  if (!candidaturaUrl) event.preventDefault();
                }}
              >
                Acessar página de candidatura
                <ExternalLink size={16} />
              </a>
            </section>

            <section className={styles.sideCard}>
              <h2>Dúvidas sobre a vaga?</h2>

              <p>
                Entre em contato com a empresa, se essa informação estiver
                disponível.
              </p>

              <button
                type="button"
                className={styles.contactButton}
                disabled={!contato}
                onClick={() => {
                  if (contato) {
                    window.location.href = `mailto:${contato}`;
                  }
                }}
              >
                Ver contato
              </button>
            </section>
          </aside>
        </div>

        <p className={styles.opportunityId}>Código da oportunidade: {id}</p>
      </div>
    </main>
  );
}
