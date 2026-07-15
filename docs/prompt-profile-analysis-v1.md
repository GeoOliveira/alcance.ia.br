# Prompt `profile-analysis-v1`

Prompt imutável da primeira versão. O código-fonte está em `src/lib/ai/prompts/profile-analysis-prompt.ts`.

Objetivos: português do Brasil; somente dados fornecidos; métricas não podem ser recalculadas ou contraditas; evidências obrigatórias; limitações declaradas; recomendações proporcionais; nenhuma promessa, causalidade, benchmark externo, fraude, seguidores falsos ou acesso ao Instagram Insights.

Bio e legendas são declaradas como dados não confiáveis e chegam em JSON delimitado, separado das instruções. O modelo gera apenas recursos presentes em `analysisContext.requestedFeatures`; seções desativadas devem ficar neutras/vazias.

Alterações comportamentais exigem nova constante e novo arquivo, por exemplo `profile-analysis-v2`. Execuções anteriores mantêm sua versão para auditoria. O painel não edita prompts livres.
