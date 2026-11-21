import { TipoOportunidade } from "../../generated/prisma/enums.js";
import { AppError } from "./AppError.js";

export function extrairRendaFormatada(texto: string): string | null {
  if (/^a\s+combinar$/i.test(texto.trim())) return "A combinar";

  const correspondencia = texto.match(/\d[\d.,]*/);
  if (!correspondencia) return null;

  const numero = correspondencia[0];
  const ultimaVirgula = numero.lastIndexOf(",");
  const ultimoPonto = numero.lastIndexOf(".");
  const ultimoSeparador = Math.max(ultimaVirgula, ultimoPonto);
  let indiceDecimal = -1;

  if (ultimaVirgula >= 0 && ultimoPonto >= 0) {
    indiceDecimal = ultimoSeparador;
  } else if (ultimoSeparador >= 0) {
    const casasDepoisDoSeparador = numero.length - ultimoSeparador - 1;
    if (casasDepoisDoSeparador === 1 || casasDepoisDoSeparador === 2) {
      indiceDecimal = ultimoSeparador;
    }
  }

  const parteInteira = (indiceDecimal >= 0 ? numero.slice(0, indiceDecimal) : numero)
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "");
  const parteDecimal = indiceDecimal >= 0 ? numero.slice(indiceDecimal + 1).replace(/\D/g, "") : "";
  const centavosIniciais = parteDecimal.padEnd(2, "0").slice(0, 2);
  let centavos = Number(centavosIniciais || "0");
  let inteiro = BigInt(parteInteira || "0");

  if (parteDecimal.length > 2 && Number(parteDecimal[2]) >= 5) {
    centavos += 1;
    if (centavos === 100) {
      inteiro += 1n;
      centavos = 0;
    }
  }

  const inteiroFormatado = inteiro.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$${inteiroFormatado},${String(centavos).padStart(2, "0")}`;
}

export function rendaParaTipo(texto: string, tipo: TipoOportunidade): string {
  const rendaFormatada = extrairRendaFormatada(texto);
  if (!rendaFormatada) {
    throw new AppError("Informe um valor de renda válido.", 400);
  }

  return tipo === TipoOportunidade.ESTAGIO || tipo === TipoOportunidade.PESQUISA
    ? `Bolsa-auxílio de ${rendaFormatada}`
    : rendaFormatada;
}
