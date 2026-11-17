import { useState } from "react";
import styles from "./Perfil.module.css";

type StatusOportunidade = "ativa" | "analise" | "encerrada";

interface Oportunidade {
  id: number;
  titulo: string;
  empresa: string;
  status: StatusOportunidade;
}

const estudante = {
  nome: "Nome do estudante",
  email: "estudante@exemplo.com",
  tipoConta: "Conta de estudante",
};

// Dados de exemplo. Depois é só trocar por dados vindos do Backend.
const oportunidadesIniciais: Oportunidade[] = [
  {
    id: 1,
    titulo: "Estágio em Desenvolvimento de Software",
    empresa: "Empresa de tecnologia",
    status: "ativa",
  },
  {
    id: 2,
    titulo: "Jovem Aprendiz Administrativo",
    empresa: "Organização parceira",
    status: "analise",
  },
  {
    id: 3,
    titulo: "Suporte Técnico — Estágio",
    empresa: "Empresa de serviços",
    status: "encerrada",
  },
];

const statusLabel: Record<StatusOportunidade, string> = {
  ativa: "Ativa",
  analise: "Em análise",
  encerrada: "Encerrada",
};

const statusClass: Record<StatusOportunidade, string> = {
  ativa: styles.statusAtiva,
  analise: styles.statusAnalise,
  encerrada: styles.statusEncerrada,
};

export function Perfil() {
  const [oportunidades, setOportunidades] = useState(oportunidadesIniciais);

  function handleEditar(id: number) {
    alert(`Editar oportunidade ${id}`);
  }

  function handleExcluir(id: number) {
    setOportunidades((atual) => atual.filter((item) => item.id !== id));
  }

  return (
    <div className={styles.perfil}>
      <div className={styles.container}>
        <section className={styles.header}>
          <h1>
            <span className={styles.titleUnderline}>Meu perfil</span>
          </h1>
          <p>Consulte seus dados e gerencie as oportunidades que publicou.</p>
        </section>

        <section className={styles.profileCard}>
          <div className={styles.avatar} aria-hidden="true">
            ?
          </div>
          <div className={styles.profileInfo}>
            <h2>{estudante.nome}</h2>
            <span className={styles.email}>{estudante.email}</span>
            <span className={styles.badge}>{estudante.tipoConta}</span>
          </div>
        </section>

        <section className={styles.opportunities}>
          <div className={styles.sectionHeader}>
            <h2>Minhas oportunidades</h2>
            <p>Publicações realizadas por você.</p>
          </div>

          <ul className={styles.opportunityList}>
            {oportunidades.map((item) => (
              <li key={item.id} className={styles.opportunityItem}>
                <div className={styles.opportunityInfo}>
                  <strong>{item.titulo}</strong>
                  <span>{item.empresa}</span>
                </div>

                <span className={`${styles.status} ${statusClass[item.status]}`}>
                  {statusLabel[item.status]}
                </span>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.editButton}
                    onClick={() => handleEditar(item.id)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => handleExcluir(item.id)}
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {oportunidades.length === 0 && (
            <p className={styles.empty}>Você ainda não publicou oportunidades.</p>
          )}
        </section>
      </div>
    </div>
  );
}