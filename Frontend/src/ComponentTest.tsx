//Componente para testar os componentes reutilizáveis que criarmos

import { Button } from "./components/Button/Button";
import { Input } from "./components/Input/Input";

function ComponentTest() {
  return (
    <main style={{ padding: "40px", maxWidth: "400px" }}>
      <h1>Componentes OportUna</h1>

      <Input id="nome" label="Nome" placeholder="Digite seu nome" />

      <br />

      <Button onClick={() => alert("Funcionou!")}>Testar botão</Button>

      <br />

      <Button variant="secondary">Cancelar</Button>
    </main>
  );
}

export default ComponentTest;
