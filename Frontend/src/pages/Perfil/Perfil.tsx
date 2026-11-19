import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Perfil.module.css";
import { ApiError } from "../../services/api";
import { buscarPerfil, sair } from "../../services/authService";
import type { Usuario } from "../../services/authService";
import {
  encerrarOportunidade,
  listarMinhasOportunidades,
} from "../../services/oportunidadeService";
import { estadoLabel } from "../../types/oportunidade";
import type {
  EstadoOportunidade,
  Oportunidade,
} from "../../types/oportunidade";

const estadoClass: Record<EstadoOportunidade, string> = {
  ATIVA: styles.statusAtiva,
  EXPIRADA: styles.statusAnalise, // amarelo
  ENCERRADA: styles.statusEncerrada,
};

export function Perfil() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    Promise.all([buscarPerfil(), listarMinhasOportunidades()])
      .then(([perfil, lista]) => {
        if (!ativo) return;
        setUsuario(perfil);
        setOportunidades(lista.oportunidades);
      })
      .catch((e: unknown) => {
        if (!ativo) return;

        if (e instanceof ApiError && e.status === 401) {
          sair();
          navigate("/login", { replace: true });
          return;
        }

        setErro(e instanceof Error ? e.message : "Erro ao carregar o perfil.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [navigate]);

  function handleEditar(id: string) {
    navigate(`/editar/${id}`);
  }

  async function handleEncerrar(id: string) {
    if (!window.confirm("Deseja encerrar esta oportunidade?")) return;

    try {
      const atualizada = await encerrarOportunidade(id);
      setOportunidades((atual) =>
        atual.map((item) => (item.id === id ? atualizada : item)),
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Não foi possível encerrar.");
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

        {usuario && (
          <section className={styles.profileCard}>
            <div className={styles.avatar} aria-hidden="true">
              {usuario.nome.charAt(0).toUpperCase()}
            </div>
            <div className={styles.profileInfo}>
              <h2>{usuario.nome}</h2>
              <span className={styles.email}>{usuario.email}</span>
              <span className={styles.badge}>
                {usuario.papel === "ADMINISTRADOR"
                  ? "Administrador"
                  : "Conta de estudante"}
              </span>
            </div>
          </section>
        )}

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
            {oportunidades.map((item) => (
              <li key={item.id} className={styles.opportunityItem}>
                <div className={styles.opportunityInfo}>
                  <strong>{item.titulo}</strong>
                  <span>{item.empresa}</span>
                </div>

                <span className={`${styles.status} ${estadoClass[item.estado]}`}>
                  {estadoLabel[item.estado]}
                </span>

                <div className={styles.actions}>
                  {item.estado !== "ENCERRADA" && (
                    <>
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
                        onClick={() => handleEncerrar(item.id)}
                      >
                        Encerrar
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}