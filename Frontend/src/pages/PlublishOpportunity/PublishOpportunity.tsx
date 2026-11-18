import { useNavigate } from "react-router-dom";

import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";

import styles from "./PublishOpportunity.module.css";

export function PublishOpportunity() {
  const navigate = useNavigate();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // A publicação será conectada ao backend posteriormente.
  }

  function handleCancel() {
    navigate("/home");
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Publicar oportunidade</h1>

          <p>Compartilhe uma oportunidade com a comunidade acadêmica.</p>
        </header>

        <div className={styles.content}>
          <section className={styles.formCard}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <Input
                id="titulo"
                name="titulo"
                label="Título da vaga"
                placeholder="Ex.: Estágio em Desenvolvimento"
                required
              />

              <Input
                id="empresa"
                name="empresa"
                label="Empresa"
                placeholder="Nome da empresa ou organização"
                required
              />

              <div className={styles.field}>
                <label htmlFor="tipo">Tipo de oportunidade</label>

                <select
                  id="tipo"
                  name="tipo"
                  className={styles.select}
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    Selecione o tipo de oportunidade
                  </option>
                  <option value="ESTAGIO">Estágio</option>
                  <option value="JOVEM_APRENDIZ">Jovem Aprendiz</option>
                  <option value="EMPREGO">Emprego</option>
                  <option value="TRAINEE">Trainee</option>
                  <option value="FREELANCER">Freelancer</option>
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="descricao">Descrição</label>

                <textarea
                  id="descricao"
                  name="descricao"
                  className={styles.textarea}
                  placeholder="Descreva atividades, requisitos e informações importantes"
                  required
                />
              </div>

              <div className={styles.actions}>
                <Button type="submit" className={styles.submitButton}>
                  Publicar oportunidade
                </Button>

                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCancel}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>

          <aside className={styles.tipCard}>
            <h2>Uma boa publicação</h2>

            <p>
              Use um título claro e descreva os requisitos de forma objetiva
              para ajudar os estudantes.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
