import { Prisma } from "@prisma/client";
import { Actor, unitScope } from "./auth";
export function processFilter(
  user: Actor,
  s: Record<string, string | undefined>,
): Prisma.ProcessWhereInput {
  const AND: Prisma.ProcessWhereInput[] = [unitScope(user)];
  if (s.unit) AND.push({ unitId: s.unit });
  if (s.status) AND.push({ status: s.status });
  if (s.priority === "true") AND.push({ priority: true });
  if (s.mine === "true")
    AND.push({ assignments: { some: { userId: user.id, endedAt: null } } });
  if (s.unassigned === "true")
    AND.push({ assignments: { none: { endedAt: null } } });
  if (s.group) AND.push({ groups: { some: { groupId: s.group } } });
  if (s.days && Number(s.days) > 0)
    AND.push({
      lastOperationalAt: {
        lte: new Date(Date.now() - Math.min(Number(s.days), 36500) * 86400000),
      },
    });
  AND.push({ closedAt: s.closed === "true" ? { not: null } : null });
  if (s.q?.trim()) {
    const contains = s.q.trim().slice(0, 200);
    AND.push({
      OR: [
        { number: { contains } },
        { protocol: { contains } },
        { subject: { contains } },
        {
          properties: {
            some: {
              OR: [{ identifier: { contains } }, { address: { contains } }],
            },
          },
        },
        { parties: { some: { name: { contains } } } },
      ],
    });
  }
  return { AND };
}
