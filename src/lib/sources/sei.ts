import { createClientAsync } from "soap";
import { z } from "zod";

// SEI-WebServices-v4.1.pdf: pp. 8, 18–21, 28 e 35.
const id = z
  .union([z.string().min(1), z.number().int().safe()])
  .transform(String);
const unit = z.object({ IdUnidade: id, Sigla: z.string().min(1) });
const event = z.object({
  IdAndamento: id,
  Descricao: z.string(),
  DataHora: z.string(),
  Unidade: unit,
  Usuario: z
    .object({ Nome: z.string().optional(), Sigla: z.string().optional() })
    .nullish(),
});

export function seiArray(value: unknown): unknown[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "object" && "item" in value) return seiArray(value.item);
  // SOAP pode representar o conjunto vazio como objeto vazio.
  if (typeof value === "object" && Object.keys(value).length === 0) return [];
  return [value];
}

export function seiDate(value: string, offset: string): string {
  if (!/^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(offset))
    throw new Error("SEI_UTC_OFFSET inválido.");
  const explicit = z.iso.datetime({ offset: true }).safeParse(value);
  if (explicit.success) return new Date(value).toISOString();
  const br = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2}:\d{2})$/.exec(value);
  const local = br
    ? `${br[3]}-${br[2]}-${br[1]}T${br[4]}`
    : value.replace(" ", "T");
  const parsed = z.iso
    .datetime({ offset: true })
    .safeParse(`${local}${offset}`);
  if (!parsed.success)
    throw new Error("Data de andamento SEI fora do formato esperado.");
  return new Date(parsed.data).toISOString();
}

function unwrap(value: unknown) {
  if (typeof value !== "object" || value === null || !("parametros" in value))
    throw new Error(
      "Resposta SOAP sem parametros. Confira o WSDL da instalação.",
    );
  return value.parametros;
}

export function normalizeSei(
  number: string,
  raw: unknown,
  extra: unknown[],
  offset: string,
) {
  const record = z
    .object({
      ProcedimentoFormatado: z.string().min(1),
      UnidadesProcedimentoAberto: z.unknown(),
      AndamentoGeracao: z.unknown().optional(),
      AndamentoConclusao: z.unknown().optional(),
      UltimoAndamento: z.unknown().optional(),
    })
    .parse(raw);
  if (
    record.ProcedimentoFormatado.replace(/\D/g, "") !==
    number.replace(/\D/g, "")
  )
    throw new Error("O SEI retornou outro número de processo.");
  if (!Object.hasOwn(record, "UnidadesProcedimentoAberto"))
    throw new Error(
      "SEI não retornou o conjunto de unidades abertas solicitado.",
    );
  const units = seiArray(record.UnidadesProcedimentoAberto).map(
    (v) => z.object({ Unidade: unit }).parse(v).Unidade,
  );
  const status = units.length
    ? `Aberto em: ${[...new Set(units.map((u) => u.Sigla))].sort().join(", ")}`
    : record.AndamentoConclusao
      ? "Sem unidades abertas retornadas; há andamento de conclusão"
      : "Sem unidades abertas retornadas";
  const events = new Map<
    string,
    { id: string; description: string; occurredAt: string; author: string }
  >();
  for (const rawEvent of [
    record.AndamentoGeracao,
    record.AndamentoConclusao,
    record.UltimoAndamento,
    ...extra,
  ]) {
    if (rawEvent == null) continue;
    const e = event.parse(rawEvent);
    const normalized = {
      id: e.IdAndamento,
      description: e.Descricao,
      occurredAt: seiDate(e.DataHora, offset),
      author: `${e.Usuario?.Nome || e.Usuario?.Sigla || "Usuário não informado"} · ${e.Unidade.Sigla}`,
    };
    const prior = events.get(e.IdAndamento);
    if (prior && JSON.stringify(prior) !== JSON.stringify(normalized))
      throw new Error("SEI retornou versões divergentes do mesmo andamento.");
    events.set(e.IdAndamento, normalized);
  }
  return { number, status, events: [...events.values()] };
}

export type SeiConfig = {
  wsdl: string;
  system: string;
  identification: string;
  unitId: string;
  offset: string;
  tasks: string[];
  moduleTasks: string[];
};
export function readSeiConfig(): SeiConfig {
  const names = [
    "SEI_WSDL_URL",
    "SEI_SIGLA_SISTEMA",
    "SEI_IDENTIFICACAO_SERVICO",
    "SEI_ID_UNIDADE",
  ] as const;
  for (const name of names)
    if (!process.env[name]?.trim())
      throw new Error(`Configure ${name} no servidor.`);
  const wsdl = process.env.SEI_WSDL_URL!;
  const url = new URL(wsdl);
  if (
    url.protocol !== "https:" &&
    !(
      process.env.NODE_ENV !== "production" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("Configure um WSDL SEI HTTPS.");
  const ids = (name: string) =>
    (process.env[name] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  const tasks = ids("SEI_TAREFAS");
  const moduleTasks = ids("SEI_TAREFAS_MODULOS");
  if (
    ![process.env.SEI_ID_UNIDADE!, ...tasks, ...moduleTasks].every((s) =>
      /^\d+$/.test(s),
    )
  )
    throw new Error("IDs de unidade/tarefas SEI devem ser numéricos.");
  return {
    wsdl,
    system: process.env.SEI_SIGLA_SISTEMA!,
    identification: process.env.SEI_IDENTIFICACAO_SERVICO!,
    unitId: process.env.SEI_ID_UNIDADE!,
    offset: process.env.SEI_UTC_OFFSET || "-03:00",
    tasks,
    moduleTasks,
  };
}

export type SeiCall = (
  method: "consultarProcedimento" | "listarAndamentos",
  args: Record<string, unknown>,
) => Promise<unknown>;
export async function collectSei(
  numbers: string[],
  config: SeiConfig,
  call: SeiCall,
) {
  const processes = [];
  for (const number of numbers) {
    const base = {
      SiglaSistema: config.system,
      IdentificacaoServico: config.identification,
      IdUnidade: config.unitId,
      ProtocoloProcedimento: number,
    };
    const procedure = unwrap(
      await call("consultarProcedimento", {
        ...base,
        SinRetornarAssuntos: "N",
        SinRetornarInteressados: "N",
        SinRetornarObservacoes: "N",
        SinRetornarAndamentoGeracao: "S",
        SinRetornarAndamentoConclusao: "S",
        SinRetornarUltimoAndamento: "S",
        SinRetornarUnidadesProcedimentoAberto: "S",
        SinRetornarProcedimentosRelacionados: "N",
        SinRetornarProcedimentosAnexados: "N",
      }),
    );
    let extra: unknown[] = [];
    if (config.tasks.length || config.moduleTasks.length) {
      extra = seiArray(
        unwrap(
          await call("listarAndamentos", {
            ...base,
            SinRetornarAtributos: "N",
            ...(config.tasks.length ? { Tarefas: { item: config.tasks } } : {}),
            ...(config.moduleTasks.length
              ? { TarefasModulos: { item: config.moduleTasks } }
              : {}),
          }),
        ),
      );
    }
    processes.push(normalizeSei(number, procedure, extra, config.offset));
  }
  return { processes };
}

export async function fetchSei(numbers: string[]) {
  const config = readSeiConfig();
  // Nunca registrar fault/body/lastRequest: podem conter a chave de acesso.
  try {
    const client = await createClientAsync(config.wsdl, {
      disableCache: true,
      wsdl_options: { timeout: 30000, maxRedirects: 0 },
    });
    const override = process.env.SEI_ENDPOINT_URL;
    const endpoints = override
      ? [override]
      : Object.values(client.wsdl.definitions.services).flatMap((service) =>
          Object.values(service.ports).map((port) => port.location),
        );
    if (
      !endpoints.length ||
      endpoints.some(
        (endpoint) => new URL(endpoint).origin !== new URL(config.wsdl).origin,
      )
    )
      throw new Error("Endpoint SEI deve ter a mesma origem do WSDL.");
    if (override) client.setEndpoint(override);
    return await collectSei(numbers, config, async (method, args) => {
      const invoke = client[`${method}Async`];
      if (typeof invoke !== "function")
        throw new Error("Operação não encontrada no WSDL.");
      const [result] = await invoke.call(client, args, {
        timeout: 30000,
        maxRedirects: 0,
      });
      return result;
    });
  } catch {
    throw new Error(
      "Falha na consulta SOAP SEI. Confira WSDL, identificação do serviço, permissões, tarefas e formato das respostas. Nenhum dado deste lote foi aplicado.",
    );
  }
}
