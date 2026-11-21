import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";
import { login } from "../../services/authService";

import logoLogin from "../../assets/images/logo-oportuna-login.png";
import backgroundLogin from "../../assets/images/background-login.png";

import styles from "./Login.module.css";

export function Login() {
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const senha = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    setErro(null);
    setEnviando(true);

    try {
      await login(email, senha);
      navigate("/home");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
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

            {erro && (
              <p className={styles.error} role="alert">
                {erro}
              </p>
            )}

            <Button
              type="submit"
              className={styles.submitButton}
              disabled={enviando}
            >
              {enviando ? "Entrando..." : "Entrar"}
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