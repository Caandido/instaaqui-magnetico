// Cadastro: cria User + Organization + Membership (dono) numa transação.
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const runtime = "nodejs";

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "org"}-${suffix}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = (body?.name ?? "").toString().trim();
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const password = (body?.password ?? "").toString();
    const orgName = (body?.orgName ?? "").toString().trim() || `${name || "Minha"} Org`;

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Informe e-mail válido e senha com pelo menos 8 caracteres." },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma conta com este e-mail." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: name || null, email, passwordHash },
      });
      const org = await tx.organization.create({
        data: { name: orgName, slug: slugify(orgName) },
      });
      await tx.membership.create({
        data: { userId: user.id, organizationId: org.id, role: "OWNER" },
      });
      await tx.subscription.create({
        data: { organizationId: org.id, plan: "FREE", status: "ACTIVE" },
      });
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[signup] erro:", err);
    return NextResponse.json(
      { error: "Não foi possível concluir o cadastro." },
      { status: 500 }
    );
  }
}
