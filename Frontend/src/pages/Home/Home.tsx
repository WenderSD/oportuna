import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import { OpportunityCard } from "../../components/OpportunityCard/OpportunityCard";
import { ApiError } from "../../services/api";
import { sair } from "../../services/authService";
import { listarOportunidades } from "../../services/oportunidadeService";
import {
  formatarRenda,
  modalidadeLabel,
  tipoLabel,
} from "../../types/oportunidade";
import type {
  Modalidade,
  Oportunidade,
  TipoOportunidade,
} from "../../types/oportunidade";

import styles from "./Home.module.css";

const searchSuggestions = [
  "Desenvolvimento",
  "Estágio",
  "Jovem Aprendiz",
  "Suporte técnico",
];

const tipos = Object.keys(tipoLabel) as TipoOportunidade[];
const modalidades = Object.keys(modalidadeLabel) as Modalidade[];

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

  const [tipo, setTipo] = useState<TipoOportunidade | "">("");
  const [modalidade, setModalidade] = useState<Modalidade | "">("");

  const temFiltro = tipo !== "" || modalidade !== "";

  // Busca no backend sempre que um filtro muda.
  useEffect(() => {
    let ativo = true;

    listarOportunidades({
      pagina: 1,
      tipo: tipo || undefined,
      modalidade: modalidade || undefined,
    })
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
  }, [tipo, modalidade, navigate]);

  function iniciarCarga() {
    setCarregando(true);
    setErro(null);
  }

  function handleTipo(event: ChangeEvent<HTMLSelectElement>) {
    iniciarCarga();
    setTipo(event.target.value as TipoOportunidade | "");
  }

  function handleModalidade(event: ChangeEvent<HTMLSelectElement>) {
    iniciarCarga();
    setModalidade(event.target.value as Modalidade | "");
  }

  function limparFiltros() {
    iniciarCarga();
    setTipo("");
    setModalidade("");
  }

  async function handleCarregarMais() {
    setCarregandoMais(true);

    try {
      const lista = await listarOportunidades({
        pagina: pagina + 1,
        tipo: tipo || undefined,
        modalidade: modalidade || undefined,
      });

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

  // Clicar na sugestão já marcada desmarca e limpa a busca.
  function handleSuggestionClick(suggestion: string) {
    if (appliedSearch === suggestion) {
      setSearchTerm("");
      setAppliedSearch("");
      return;
    }

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
          <form className={styles.searchBar} onSubmit={handleSearch}>
            <Search
              size={18}
              strokeWidth={2.5}
              className={styles.searchIcon}
              aria-hidden="true"
            />

            <input
              id="search"
              type="text"
              className={styles.searchField}
              placeholder="Pesquise por palavra-chave"
              aria-label="Pesquisar oportunidades"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <button
              type="submit"
              className={styles.searchButton}
              aria-label="Pesquisar"
            >
              <Search size={22} strokeWidth={3} />
            </button>
          </form>

          {/* Título e sugestões na mesma linha */}
          <div className={styles.inlineRow}>
            <h2 className={styles.blockTitle}>Categorias de busca</h2>

            <div className={styles.suggestionList}>
              {searchSuggestions.map((suggestion) => {
                const ativa = appliedSearch === suggestion;

                return (
                  <button
                    key={suggestion}
                    type="button"
                    className={`${styles.suggestion} ${
                      ativa ? styles.suggestionActive : ""
                    }`}
                    aria-pressed={ativa}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtros com o título ao lado do campo */}
          <div className={styles.filters}>
            <div className={styles.inlineRow}>
              <label htmlFor="filtro-tipo" className={styles.blockTitle}>
                Tipo
              </label>

              <select
                id="filtro-tipo"
                className={styles.select}
                value={tipo}
                onChange={handleTipo}
              >
                <option value="">Todos os tipos</option>
                {tipos.map((valor) => (
                  <option key={valor} value={valor}>
                    {tipoLabel[valor]}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inlineRow}>
              <label htmlFor="filtro-modalidade" className={styles.blockTitle}>
                Modalidade
              </label>

              <select
                id="filtro-modalidade"
                className={styles.select}
                value={modalidade}
                onChange={handleModalidade}
              >
                <option value="">Todas as modalidades</option>
                {modalidades.map((valor) => (
                  <option key={valor} value={valor}>
                    {modalidadeLabel[valor]}
                  </option>
                ))}
              </select>
            </div>

            {temFiltro && (
              <button
                type="button"
                className={styles.clearFilters}
                onClick={limparFiltros}
              >
                Limpar filtros
              </button>
            )}
          </div>
        </section>

        <section className={styles.opportunities}>
          <div className={styles.sectionHeader}>
            <h2>
              {appliedSearch
                ? `Resultados para "${appliedSearch}"`
                : "Oportunidades"}
            </h2>
            <p>Confira as publicações da comunidade.</p>
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
                    renda={
                      opportunity.renda !== null &&
                      opportunity.renda !== undefined
                        ? formatarRenda(opportunity.renda)
                        : undefined
                    }
                    criadoEm={opportunity.criadoEm}
                    onVerDetalhes={() =>
                      navigate(`/oportunidade/${opportunity.id}`)
                    }
                  />
                ))
              ) : (
                <p className={styles.emptyMessage}>
                  {appliedSearch || temFiltro
                    ? "Nenhuma oportunidade encontrada. Tente outras palavras-chave ou remova os filtros."
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
