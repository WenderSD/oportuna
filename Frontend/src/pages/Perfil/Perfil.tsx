import { useEffect, useState } from "react";
import styles from "./Perfil.module.css";
import type {
  Oportunidade,
  StatusOportunidade,
} from "../../types/oportunidade";
import {
  excluirOportunidade,
  listarMinhasOportunidades,
} from "../../services/oportunidadeService";

const estudante = {
  nome: "Nome do estudante",
  email: "estudante@exemplo.com",
  tipoConta: "Conta de estudante",
};

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
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    listarMinhasOportunidades()
      .then((dados) => {
        if (ativo) setOportunidades(dados);
      })
      .catch((e: Error) => {
        if (ativo) setErro(e.message);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  function handleEditar(id: string) {
    alert(`Editar oportunidade ${id}`);
  }

  async function handleExcluir(id: string) {
    if (!window.confirm("Deseja excluir esta oportunidade?")) return;

    try {
      await excluirOportunidade(id);
      setOportunidades((atual) => atual.filter((item) => item.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Não foi possível excluir.");
    }
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

          {carregando && <p className={styles.empty}>Carregando...</p>}

          {erro && <p className={styles.error}>{erro}</p>}

          {!carregando && !erro && oportunidades.length === 0 && (
            <p className={styles.empty}>
              Você ainda não publicou oportunidades.
            </p>
          )}

          <ul className={styles.opportunityList}>
            {oportunidades.map((item) => {
              // Enquanto o banco não tiver status, consideramos "ativa".
              const status = item.status ?? "ativa";

              return (
                <li key={item.id} className={styles.opportunityItem}>
                  <div className={styles.opportunityInfo}>
                    <strong>{item.titulo}</strong>
                    <span>{item.empresa}</span>
                  </div>

                  <span className={`${styles.status} ${statusClass[status]}`}>
                    {statusLabel[status]}
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
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}