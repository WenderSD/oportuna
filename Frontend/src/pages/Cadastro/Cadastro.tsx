import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";
import { cadastrar } from "../../services/authService";

import logoLogin from "../../assets/images/logo-oportuna-login.png";
import backgroundLogin from "../../assets/images/background-login.png";

import styles from "../Login/Login.module.css";

export function Cadastro() {
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const valor = (nome: string) =>
      (form.elements.namedItem(nome) as HTMLInputElement).value;

    const nome = valor("nome").trim();
    const email = valor("email").trim();
    const senha = valor("password");
    const confirmar = valor("confirmPassword");

    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    setErro(null);
    setEnviando(true);

    try {
      await cadastrar({ nome, email, senha });
      navigate("/login");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível cadastrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className={styles.login}>
      <section className={styles.presentation}>
        <img src={backgroundLogin} alt="" className={styles.background} />

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
            <h2>Crie sua conta</h2>
            <p>Cadastre-se para publicar e acompanhar oportunidades.</p>
          </header>

          <form className={styles.form} onSubmit={handleSubmit}>
            <Input
              id="nome"
              label="Nome"
              type="text"
              placeholder="Seu nome completo"
              autoComplete="name"
              required
            />

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
              placeholder="Crie uma senha"
              autoComplete="new-password"
              required
            />

            <Input
              id="confirmPassword"
              label="Confirmar senha"
              type="password"
              placeholder="Repita a senha"
              autoComplete="new-password"
              required
            />

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
              {enviando ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <div className={styles.register}>
            <span>Já tem uma conta?</span>
            <Link to="/login">Entrar</Link>
          </div>
        </div>
      </section>
    </main>
  );
}