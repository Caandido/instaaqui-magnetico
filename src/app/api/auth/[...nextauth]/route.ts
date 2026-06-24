// Rota de autenticação gerenciada pelo Auth.js (NextAuth).
import { handlers } from "@/lib/auth";

export const runtime = "nodejs";
export const { GET, POST } = handlers;
