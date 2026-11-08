import { Navbar } from "../../components/Navbar/Navbar";
import { OpportunityCard } from "../../components/OpportunityCard/OpportunityCard";
import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";
import styles from "./Home.module.css";

export function Home() {
  return (
    <main className={styles.home}>
      <Navbar />
      <div className={styles.container}>
        <section className={styles.welcome}>
          <h1>Olá! Que oportunidade você procura?</h1>
          <p>
            Explore vagas e oportunidades compartilhadas pela comunidade
            acadêmica.
          </p>
        </section>

        <section className={styles.searchSection}>
          <Input
            id="search"
            label="Pesquisar oportunidades"
            placeholder="Digite palavras-chave"
          />
          <Button variant="primary">Pesquisar</Button>
        </section>

        <section className={styles.opportunities}>
          <div className={styles.sectionHeader}>
            <h2>Oportunidades em destaque</h2>
          </div>
          <div className={styles.opportunityList}>
            <OpportunityCard
              titulo="Estágio em Desenvolvimento de Software"
              empresa="Empresa Exemplo"
              tipo="Estágio"
              modalidade="Híbrido"
              descricao="Oportunidade para estudantes de tecnologia interessados em desenvolvimento de aplicações web."
              onVerDetalhes={() => alert("Abrir detalhes da oportunidade")}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
