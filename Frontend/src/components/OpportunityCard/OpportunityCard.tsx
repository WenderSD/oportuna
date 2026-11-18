import { BriefcaseBusiness, Building2, MapPin } from "lucide-react";

import { Button } from "../Button/Button";
import styles from "./OpportunityCard.module.css";

interface OpportunityCardProps {
  titulo: string;
  empresa: string;
  tipo: string;
  modalidade?: string;
  descricao?: string;
  onVerDetalhes: () => void;
}

export function OpportunityCard({
  titulo,
  empresa,
  tipo,
  modalidade,
  descricao,
  onVerDetalhes,
}: OpportunityCardProps) {
  return (
    <article className={styles.card}>
      {/* Identificação da oportunidade */}
      <div className={styles.header}>
        <div className={styles.iconContainer}>
          <BriefcaseBusiness size={26} />
        </div>

        <div className={styles.titleContainer}>
          <h2 className={styles.title}>{titulo}</h2>

          <div className={styles.company}>
            <Building2 size={17} />
            <span>{empresa}</span>
          </div>
        </div>
      </div>

      {/* Descrição */}
      <p className={styles.description}>
        {descricao || "Descrição não informada."}
      </p>

      {/* Tipo e modalidade */}
      <div className={styles.tags}>
        <span className={styles.tag}>{tipo}</span>

        {modalidade && (
          <span className={styles.tag}>
            <MapPin size={14} />
            {modalidade}
          </span>
        )}
      </div>

      {/* Ação */}
      <div className={styles.footer}>
        <Button
          variant="primary"
          className={styles.detailsButton}
          onClick={onVerDetalhes}
        >
          Ver detalhes
        </Button>
      </div>
    </article>
  );
}
