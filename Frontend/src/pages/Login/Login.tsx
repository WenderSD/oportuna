
import { Link } from "react-router-dom";

import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";

import logoLogin from "../../assets/images/logo-oportuna-login.png";
import backgroundLogin from "../../assets/images/background-login.png";

import styles from "./Login.module.css";

export function Login() {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // A autenticação será conectada ao backend posteriormente.
  }

  return (
    <main className={styles.login}>
      <section className={styles.presentation}>
        <img
          src={backgroundLogin}
          alt=""
          className={styles.background}
        />

        <div className={styles.brand}>
          <img
            src={logoLogin}
            alt="Símbolo OportUna"
            className={styles.logo}
          />

          <h1 className={styles.brandName}>
            Oport<span>Una</span>
          </h1>

          <p className={styles.slogan}>
            Conectando você
            <br />
            às oportunidades
          </p>
        </div>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formContent}>
          <header className={styles.header}>
            <h2>Acesse sua conta</h2>

            <p>
              Entre para acompanhar oportunidades da comunidade acadêmica.
            </p>
          </header>

          <form
            className={styles.form}
            onSubmit={handleSubmit}
          >
            <Input
              id="email"
              label="E-mail"
              type="email"
              placeholder="seuemail@exemplo.com"
              autoComplete="email"
              required
            />

            <Input
              id="password"
              label="Senha"
              type="password"
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
            />

            <div className={styles.forgotPassword}>
              <button type="button">
                Esqueceu a senha?
              </button>
            </div>

            <Button
              type="submit"
              className={styles.submitButton}
            >
              Entrar
            </Button>
          </form>

          <div className={styles.register}>
            <span>Ainda não tem uma conta?</span>
            <Link to="/cadastro">Criar conta</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
