
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { OpportunityCard } from "../../components/OpportunityCard/OpportunityCard";
import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";

import styles from "./Home.module.css";

const searchSuggestions = [
  "Desenvolvimento",
  "Estágio",
  "Jovem Aprendiz",
  "Suporte técnico",
];

const opportunities = [
  {
    id: 1,
    titulo: "Estágio em Desenvolvimento de Software",
    empresa: "Empresa Exemplo",
    tipo: "Estágio",
    modalidade: "Híbrido",
    descricao:
      "Oportunidade para estudantes de tecnologia interessados em desenvolvimento de aplicações web.",
  },
];

export function Home() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedSearch(searchTerm.trim());
  }

  function handleSuggestionClick(suggestion: string) {
    setSearchTerm(suggestion);
    setAppliedSearch(suggestion);
  }

  const filteredOpportunities = opportunities.filter((opportunity) => {
    const searchableContent = [
      opportunity.titulo,
      opportunity.empresa,
      opportunity.tipo,
      opportunity.modalidade,
      opportunity.descricao,
    ]
      .join(" ")
      .toLowerCase();

    return searchableContent.includes(appliedSearch.toLowerCase());
  });

  return (
    <main className={styles.home}>
      <div className={styles.container}>
        <section className={styles.welcome}>
          <h1>Olá! Que oportunidade você procura?</h1>
          <p>
            Explore vagas e oportunidades compartilhadas pela comunidade
            acadêmica.
          </p>
        </section>

        <section className={styles.searchContainer}>
          <form
            className={styles.searchSection}
            onSubmit={handleSearch}
          >
            <Input
              id="search"
              label="Pesquisar oportunidades"
              placeholder="Digite palavras-chave"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={styles.searchInput}
            />

            <Button
              type="submit"
              variant="primary"
              className={styles.searchButton}
            >
              Pesquisar
            </Button>
          </form>

          <div className={styles.suggestions}>
            <span className={styles.suggestionsLabel}>
              Sugestões:
            </span>

            <div className={styles.suggestionList}>
              {searchSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className={`${styles.suggestion} ${
                    appliedSearch === suggestion ? styles.suggestionActive : ""
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.opportunities}>
          <div className={styles.sectionHeader}>
            <h2>
              {appliedSearch
                ? `Resultados para "${appliedSearch}"`
                : "Oportunidades em destaque"}
            </h2>
          </div>

          <div className={styles.opportunityList}>
            {filteredOpportunities.length > 0 ? (
              filteredOpportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  titulo={opportunity.titulo}
                  empresa={opportunity.empresa}
                  tipo={opportunity.tipo}
                  modalidade={opportunity.modalidade}
                  descricao={opportunity.descricao}
                  onVerDetalhes={() =>
                    navigate(`/oportunidade/${opportunity.id}`)
                  }
                />
              ))
            ) : (
              <p className={styles.emptyMessage}>
                Nenhuma oportunidade encontrada para essa pesquisa.
                Tente utilizar outras palavras-chave.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
