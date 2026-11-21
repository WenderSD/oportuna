import { useEffect } from "react";
import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  confirmarLabel?: string;
  cancelarLabel?: string;
  perigo?: boolean;
  carregando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  confirmarLabel = "Confirmar",
  cancelarLabel = "Cancelar",
  perigo = false,
  carregando = false,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  // Esc fecha a janela.
  useEffect(() => {
    if (!aberto) return;

    function aoPressionar(event: KeyboardEvent) {
      if (event.key === "Escape" && !carregando) onCancelar();
    }

    document.addEventListener("keydown", aoPressionar);
    return () => document.removeEventListener("keydown", aoPressionar);
  }, [aberto, carregando, onCancelar]);

  if (!aberto) return null;

  return (
    <div
      className={styles.overlay}
      onClick={() => {
        if (!carregando) onCancelar();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-titulo"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-titulo" className={styles.titulo}>
          {titulo}
        </h2>

        <p className={styles.mensagem}>{mensagem}</p>

        <div className={styles.acoes}>
          <button
            type="button"
            className={styles.cancelar}
            onClick={onCancelar}
            disabled={carregando}
            autoFocus
          >
            {cancelarLabel}
          </button>

          <button
            type="button"
            className={`${styles.confirmar} ${perigo ? styles.perigo : ""}`}
            onClick={onConfirmar}
            disabled={carregando}
          >
            {carregando ? "Aguarde..." : confirmarLabel}
          </button>
        </div>
      </div>
    </div>
  );
}