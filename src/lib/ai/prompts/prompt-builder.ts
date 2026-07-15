import type { AIProfileAnalysisInput } from "../contracts/ai-analysis-input";
import { PROFILE_ANALYSIS_INSTRUCTIONS } from "./profile-analysis-prompt";

export function buildProfileAnalysisPrompt(input: AIProfileAnalysisInput) {
  return { instructions: PROFILE_ANALYSIS_INSTRUCTIONS, input: `DADOS_NÃO_CONFIÁVEIS_INÍCIO\n${JSON.stringify(input)}\nDADOS_NÃO_CONFIÁVEIS_FIM` };
}
