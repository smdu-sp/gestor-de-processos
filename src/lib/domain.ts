export const statuses = [
  "Aguardando distribuição",
  "Em análise",
  "Comunique-se",
  "Aguardando documentos",
  "Em decisão",
];
export function validateInterval(start: Date, end?: Date | null) {
  if (
    !Number.isFinite(start.getTime()) ||
    (end && (!Number.isFinite(end.getTime()) || end < start))
  )
    throw new Error("O término deve ser igual ou posterior ao início.");
  if (start > new Date() || (end && end > new Date()))
    throw new Error("Não registre atividades em datas futuras.");
}
export const formatDate = (d: Date | string | null | undefined) =>
  d
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(d))
    : "Não informado";
export const csvCell = (value: unknown) =>
  '"' +
  String(value ?? "")
    .replace(/^[=+@\-\t\r]/, "'$&")
    .replaceAll('"', '""') +
  '"';
