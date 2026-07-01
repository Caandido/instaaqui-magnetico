// Endpoint que expõe as funções agendadas para o Inngest chamar.
import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  runScheduledAnalysis,
  dailyReports,
  weeklyReports,
} from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runScheduledAnalysis, dailyReports, weeklyReports],
});
