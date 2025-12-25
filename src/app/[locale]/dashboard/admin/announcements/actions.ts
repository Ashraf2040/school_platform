"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const FilterSchema = z.object({
  type: z.enum(["GENERAL", "TARGETED", "DRAW_ATTENTION"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.number().min(1).default(1),
});

const PAGE_SIZE = 10;

export async function getFilteredAnnouncements(raw: unknown) {
  const parsed = FilterSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error("Invalid filters");
  }

  const { type, from, to, page } = parsed.data;

  const where: any = {};

  if (type) where.type = type;

  if (from || to) {
    where.date = {};
    if (from) {
      const d = new Date(from);
      d.setHours(0, 0, 0, 0);
      where.date.gte = d;
    }
    if (to) {
      const d = new Date(to);
      d.setHours(23, 59, 59, 999);
      where.date.lte = d;
    }
  }

  const [items, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.announcement.count({ where }),
  ]);

  return {
    items,
    total,
    pages: Math.ceil(total / PAGE_SIZE),
  };
}
