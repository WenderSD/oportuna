import { useEffect, useRef } from "react";
import styles from "./Aviso.module.css";

export interface AvisoDados {
  tipo: "sucesso" | "erro";
  mensagem: string;
}

interface AvisoProps {
  aviso: AvisoDados | null;
  onFechar: () => void;
  duracao?: number;
}

export function Aviso({ aviso, onFechar, duracao = 5000 }: AvisoProps) {
  const fecharRef = useRef(onFechar);

  useEffect(() => {
    fecharRef.current = onFechar;
  });

  // Fecha sozinho depois de alguns segundos.
  useEffect(() => {
    if (!aviso) return;

    const timer = window.setTimeout(() => fecharRef.current(), duracao);
    return () => window.clearTimeout(timer);
  }, [aviso, duracao]);

  if (!aviso) return null;

  return (
    <div
      className={`${styles.aviso} ${
        aviso.tipo === "erro" ? styles.erro : styles.sucesso
      }`}
      role={aviso.tipo === "erro" ? "alert" : "status"}
    >
      <span>{aviso.mensagem}</span>

      <button
        type="button"
        className={styles.fechar}
        onClick={onFechar}
        aria-label="Fechar aviso"
      >
        ×
      </button>
    </div>
  );
}