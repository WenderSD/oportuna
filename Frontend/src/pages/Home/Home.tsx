import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { OpportunityCard } from "../../components/OpportunityCard/OpportunityCard";
import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";
import { ApiError } from "../../services/api";
import { sair } from "../../services/authService";
import { listarOportunidades } from "../../services/oportunidadeService";
import { modalidadeLabel, tipoLabel } from "../../types/oportunidade";
import type { Oportunidade } from "../../types/oportunidade";

import styles from "./Home.module.css";

const searchSuggestions = [
  "Desenvolvimento",
  "Estágio",
  "Jovem Aprendiz",
  "Suporte técnico",
];

export function Home() {
  const navigate = useNavigate();

  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  useEffect(() => {
    let ativo = true;

    listarOportunidades({ pagina: 1 })
      .then((lista) => {
        if (!ativo) return;
        setOportunidades(lista.oportunidades);
        setPagina(lista.paginacao.pagina);
        setTotalPaginas(lista.paginacao.totalPaginas);
      })
      .catch((e: unknown) => {
        if (!ativo) return;

        if (e instanceof ApiError && e.status === 401) {
          sair();
          navigate("/login", { replace: true });
          return;
        }

        setErro(
          e instanceof Error ? e.message : "Erro ao carregar as oportunidades.",
        );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [navigate]);

  async function handleCarregarMais() {
    setCarregandoMais(true);

    try {
      const lista = await listarOportunidades({ pagina: pagina + 1 });
      setOportunidades((atual) => [...atual, ...lista.oportunidades]);
      setPagina(lista.paginacao.pagina);
      setTotalPaginas(lista.paginacao.totalPaginas);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar mais vagas.");
    } finally {
      setCarregandoMais(false);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedSearch(searchTerm.trim());
  }

  function handleSuggestionClick(suggestion: string) {
    setSearchTerm(suggestion);
    setAppliedSearch(suggestion);
  }

  const termo = appliedSearch.toLowerCase();

  const filteredOpportunities = oportunidades.filter((opportunity) => {
    const searchableContent = [
      opportunity.titulo,
      opportunity.empresa,
      tipoLabel[opportunity.tipo],
      modalidadeLabel[opportunity.modalidade],
      opportunity.descricao,
      opportunity.localizacao ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return searchableContent.includes(termo);
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
          <form className={styles.searchSection} onSubmit={handleSearch}>
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
            <span className={styles.suggestionsLabel}>Sugestões:</span>

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

          {carregando && (
            <p className={styles.emptyMessage}>Carregando oportunidades...</p>
          )}

          {erro && <p className={styles.error}>{erro}</p>}

          {!carregando && !erro && (
            <div className={styles.opportunityList}>
              {filteredOpportunities.length > 0 ? (
                filteredOpportunities.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    titulo={opportunity.titulo}
                    empresa={opportunity.empresa}
                    tipo={tipoLabel[opportunity.tipo]}
                    modalidade={modalidadeLabel[opportunity.modalidade]}
                    descricao={opportunity.descricao}
                    onVerDetalhes={() =>
                      navigate(`/oportunidade/${opportunity.id}`)
                    }
                  />
                ))
              ) : (
                <p className={styles.emptyMessage}>
                  {appliedSearch
                    ? "Nenhuma oportunidade encontrada para essa pesquisa. Tente utilizar outras palavras-chave."
                    : "Ainda não há oportunidades publicadas."}
                </p>
              )}
            </div>
          )}

          {!carregando && pagina < totalPaginas && (
            <button
              type="button"
              className={styles.loadMore}
              onClick={handleCarregarMais}
              disabled={carregandoMais}
            >
              {carregandoMais ? "Carregando..." : "Carregar mais"}
            </button>
          )}
        </section>
      </div>
    </main>
  );
}