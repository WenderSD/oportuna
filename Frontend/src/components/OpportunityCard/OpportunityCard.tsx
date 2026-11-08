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
      <div className={styles.header}>
        <div className={styles.iconContainer}>
          <BriefcaseBusiness size={22} />
        </div>

        <div className={styles.titleContainer}>
          <h2 className={styles.title}>{titulo}</h2>
          <div className={styles.company}>
            <Building2 size={15} />
            <span>{empresa}</span>
          </div>
        </div>
      </div>

      <div className={styles.tags}>
        <span className={styles.tag}>{tipo}</span>

        {modalidade && (
          <span className={styles.tag}>
            <MapPin size={13} />
            {modalidade}
          </span>
        )}
      </div>

      {descricao && <p className={styles.description}>{descricao}</p>}

      <div className={styles.footer}>
        <Button variant="primary" onClick={onVerDetalhes}>
          Ver detalhes
        </Button>
      </div>
    </article>
  );
}
