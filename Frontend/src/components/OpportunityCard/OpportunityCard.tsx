import { Button } from "../Button/Button";

import styles from "./OpportunityCard.module.css";

interface OpportunityCardProps {
  titulo: string;
  empresa: string;
  tipo: string;
  modalidade: string;
  descricao: string;
  renda?: string;
  criadoEm?: string;
  onVerDetalhes: () => void;
}

// Mostra há quanto tempo a vaga foi publicada.
function tempoPublicacao(iso?: string) {
  if (!iso) return "Publicada recentemente";

  const dias = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dias <= 0) return "Publicada hoje";
  if (dias === 1) return "Publicada ontem";
  if (dias < 7) return `Publicada há ${dias} dias`;
  return `Publicada em ${new Date(iso).toLocaleDateString("pt-BR")}`;
}

export function OpportunityCard({
  titulo,
  empresa,
  tipo,
  modalidade,
  descricao,
  renda,
  criadoEm,
  onVerDetalhes,
}: OpportunityCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.info}>
        <h3 className={styles.title}>{titulo}</h3>

        <p className={styles.meta}>
          {empresa} • {tempoPublicacao(criadoEm)}
        </p>

        <div className={styles.tags}>
          <span className={styles.tag}>{tipo}</span>
          <span className={styles.tag}>{modalidade}</span>
          {renda && <span className={styles.tag}>{renda}</span>}
        </div>

        <p className={styles.description}>{descricao}</p>
      </div>

      <Button
        type="button"
        variant="primary"
        className={styles.detailsButton}
        onClick={onVerDetalhes}
      >
        Ver detalhes
      </Button>
    </article>
  );
}