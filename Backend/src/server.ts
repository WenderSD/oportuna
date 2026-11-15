import { validarAmbiente } from "./lib/ambiente.js";

const { porta } = validarAmbiente();
const { app } = await import("./app.js");

app.listen(porta, () => {
  console.log(`OportUna API executando em http://localhost:${porta}`);
});
