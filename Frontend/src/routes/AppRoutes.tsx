import { Navigate, Route, Routes } from "react-router-dom";
import { PublishOpportunity } from "../pages/PlublishOpportunity/PublishOpportunity";
import { MainLayout } from "../layouts/MainLayout/MainLayout";
import { Login } from "../pages/Login/Login";
import { Home } from "../pages/Home/Home";
import { OpportunityDetails } from "../pages/OpportunityDetails/OpportunityDetails";

function TestPage({ title }: { title: string }) {
  return (
    <main style={{ padding: "40px 64px" }}>
      <h1>{title}</h1>
      <p>Teste de navegação do OportUna.</p>
    </main>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Autenticação: sem Navbar */}
      <Route path="/login" element={<Login />} />

      {/* Área principal: com Navbar */}
      <Route element={<MainLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/publicar" element={<PublishOpportunity />} />
        <Route path="/perfil" element={<TestPage title="Meu perfil" />} />
      </Route>

      {/* Detalhes: sem Navbar */}
      <Route path="/oportunidade/:id" element={<OpportunityDetails />} />

      {/* Redirecionamentos */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
