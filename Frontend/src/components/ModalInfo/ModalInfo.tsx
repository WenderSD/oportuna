import { useEffect } from "react";
import type { ReactNode } from "react";

import styles from "./ModalInfo.module.css";

interface ModalInfoProps {
  aberto: boolean;
  titulo: string;
  children: ReactNode;
  botaoLabel: string;
  centralizado?: boolean;
  onFechar: () => void;
  // Ação do botão. Se não for informada, o botão apenas fecha o modal.
  onBotao?: () => void;
}

export function ModalInfo({
  aberto,
  titulo,
  children,
  botaoLabel,
  centralizado = false,
  onFechar,
  onBotao,
}: ModalInfoProps) {
  // Fecha com a tecla Esc.
  useEffect(() => {
    if (!aberto) return;

    function handleTecla(event: KeyboardEvent) {
      if (event.key === "Escape") onFechar();
    }

    window.addEventListener("keydown", handleTecla);
    return () => window.removeEventListener("keydown", handleTecla);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div
        className={`${styles.modal} ${centralizado ? styles.centralizado : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-info-titulo"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="modal-info-titulo">{titulo}</h2>

        <div className={styles.conteudo}>{children}</div>

        <button
          type="button"
          className={styles.botao}
          onClick={onBotao ?? onFechar}
        >
          {botaoLabel}
        </button>
      </div>
    </div>
  );
}