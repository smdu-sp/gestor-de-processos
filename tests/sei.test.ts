import { test } from "node:test";
import assert from "node:assert/strict";
import {
  collectSei,
  normalizeSei,
  seiDate,
  SeiConfig,
} from "../src/lib/sources/sei";
const number = "6068.2026/0000001-0";
const andamento = {
  IdAndamento: "12345678901234567",
  Descricao: "Processo recebido",
  DataHora: "21/10/2026 10:15:00",
  Unidade: { IdUnidade: "10", Sigla: "SERVIN" },
  Usuario: { Nome: "Servidor" },
};
const procedure = {
  ProcedimentoFormatado: number,
  UnidadesProcedimentoAberto: {
    item: [{ Unidade: { IdUnidade: "10", Sigla: "SERVIN" } }],
  },
  AndamentoGeracao: andamento,
  UltimoAndamento: andamento,
  AndamentoConclusao: null,
};
const config: SeiConfig = {
  wsdl: "https://sei.exemplo/servico",
  system: "GESTAO",
  identification: "somente-teste",
  unitId: "10",
  offset: "-03:00",
  tasks: [],
  moduleTasks: [],
};
test("normaliza SOAP, IDs longos, data brasileira e unidades abertas sem duplicar marcos", () => {
  const p = normalizeSei(number, procedure, [], "-03:00");
  assert.equal(p.events.length, 1);
  assert.equal(p.events[0].id, andamento.IdAndamento);
  assert.equal(p.events[0].occurredAt, "2026-10-21T13:15:00.000Z");
  assert.equal(p.status, "Aberto em: SERVIN");
  assert.throws(() => seiDate("31/02/2026 10:15:00", "-03:00"));
  assert.throws(
    () => normalizeSei("999", procedure, [], "-03:00"),
    /outro número/,
  );
  assert.throws(() =>
    normalizeSei(number, { ProcedimentoFormatado: number }, [], "-03:00"),
  );
});
test("não lista histórico sem filtro; apenas operações de leitura e flags necessárias", async () => {
  const calls: string[] = [];
  const payload = await collectSei([number], config, async (method, args) => {
    calls.push(method);
    assert.equal(args.SinRetornarInteressados, "N");
    assert.equal(args.SinRetornarUnidadesProcedimentoAberto, "S");
    assert.equal(args.IdentificacaoServico, "somente-teste");
    return { parametros: procedure };
  });
  assert.deepEqual(calls, ["consultarProcedimento"]);
  assert.equal(payload.processes.length, 1);
});
test("tarefas explícitas habilitam listarAndamentos e preservam eventos históricos", async () => {
  const calls: string[] = [];
  const payload = await collectSei(
    [number],
    { ...config, tasks: ["1", "2"] },
    async (method, args) => {
      calls.push(method);
      if (method === "consultarProcedimento") return { parametros: procedure };
      assert.deepEqual(args.Tarefas, { item: ["1", "2"] });
      assert.equal(args.SinRetornarAtributos, "N");
      return {
        parametros: {
          item: [
            { ...andamento, IdAndamento: "456", Descricao: "Outro andamento" },
          ],
        },
      };
    },
  );
  assert.deepEqual(calls, ["consultarProcedimento", "listarAndamentos"]);
  assert.equal(payload.processes[0].events.length, 2);
});
test("unidades vazias não são convertidas em encerramento global", () => {
  const result = normalizeSei(
    number,
    { ...procedure, UnidadesProcedimentoAberto: null },
    [],
    "-03:00",
  );
  assert.equal(result.status, "Sem unidades abertas retornadas");
});
