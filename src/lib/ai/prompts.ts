// Identidade compartilhada pelos agentes (entra no início do system prompt,
// que é cacheado). Reflete o CLAUDE.md: inteligência competitiva, não plágio.

export const BASE_IDENTITY = `Você é um sistema de Inteligência Competitiva para Instagram.
Analisa concorrentes para descobrir o que funciona, o que está saturado e o que
está começando a crescer — e transforma isso em VANTAGEM COMPETITIVA.

Regras invioláveis:
- NUNCA copie conteúdo ou roteiros literalmente.
- SEMPRE transforme os padrões observados em ideias NOVAS e diferenciadas.
- Busque oportunidades antes dos concorrentes.
- Responda SEMPRE em português (pt-BR), com linguagem prática e direta.`;

// Monta o contexto do projeto (nicho, perfil, objetivo) para os prompts.
export function projectContext(p: {
  name: string;
  niche?: string | null;
  handle?: string | null;
  objective?: string | null;
}): string {
  return [
    `Projeto: ${p.name}`,
    p.niche ? `Nicho: ${p.niche}` : null,
    p.handle ? `Perfil próprio: ${p.handle}` : null,
    p.objective ? `Objetivo: ${p.objective}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
