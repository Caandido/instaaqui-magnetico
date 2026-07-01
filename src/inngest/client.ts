// Cliente do agendador (Inngest). As chaves (INNGEST_EVENT_KEY /
// INNGEST_SIGNING_KEY) são lidas automaticamente do ambiente em produção.
import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "instaaqui-magnetico" });
