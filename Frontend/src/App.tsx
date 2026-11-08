import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar/Navbar";
import { OpportunityCard } from "./components/OpportunityCard/OpportunityCard";
import { Home } from "./pages/Home/Home";

function TestPage({ title }: { title: string }) {
  return (
    <>
      <Navbar />

      <main style={{ padding: "40px 64px" }}>
        <h1>{title}</h1>
        <p>Teste de navegação do OportUna.</p>

        <div
          style={{
            marginTop: "24px",
          }}
        >
          <OpportunityCard
            titulo="Estágio em Desenvolvimento de Software"
            empresa="Empresa Exemplo"
            tipo="Estágio"
            modalidade="Híbrido"
            descricao="Oportunidade para estudantes de tecnologia interessados em desenvolvimento de aplicações web."
            onVerDetalhes={() => alert("Abrir detalhes da oportunidade")}
          />
        </div>
      </main>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<Home />} />

        <Route
          path="/publicar"
          element={<TestPage title="Publicar oportunidade" />}
        />

        <Route path="/perfil" element={<TestPage title="Meu perfil" />} />
      </Routes>
    </BrowserRouter>
  );
}
/*

function App() {
  return (
    <main>
      <h1>OportUna</h1>
      <p>Conectando estudantes a oportunidades profissionais.</p>
    </main>
  )
}

export default App

*/
export default App;
