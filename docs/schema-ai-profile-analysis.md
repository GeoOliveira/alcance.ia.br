# Schema da análise por IA

Versão: `ai-profile-analysis-v1`. Implementação: `src/lib/ai/schemas/profile-analysis-schema.ts`.

Campos principais: `summary`, `bioAnalysis`, `strengths` (máximo 3), `opportunities` (máximo 5), `contentIdeas` (máximo 5), `actionPlanExplanation` (máximo 5) e `limitations` (1 a 8). Objetos são estritos e strings possuem limites.

`evidenceMetricIds` só aceita IDs existentes em `availableEvidenceIds`. A validação de consistência rejeita IDs inventados. Quando a bio não existe, `available=false` e `currentBioSummary=null`. A saída é texto puro; tags HTML são removidas e componentes React fazem escape normal.
