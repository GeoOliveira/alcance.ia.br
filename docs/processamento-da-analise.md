# Processamento da análise

O processamento público ocorre no servidor e usa cache de resultado antes de chamar o fornecedor. Após normalizar perfil e publicações, calcula as métricas básicas e, isoladamente, o pacote avançado habilitado. Uma falha nas métricas avançadas não apaga os dados normalizados nem transforma a coleta inteira em falha; o status e um código sanitizado são persistidos.

Fluxo:

1. validar solicitação e sessão anônima;
2. reutilizar resultado normalizado ainda válido quando disponível;
3. coletar perfil e conteúdo somente quando necessário e autorizado;
4. persistir contratos normalizados;
5. calcular métricas básicas;
6. ler settings e flags avançadas no servidor;
7. calcular e persistir `calculated_metrics` com `metrics_version`;
8. montar o view model sem resposta bruta;
9. renderizar somente módulos presentes.

O recálculo administrativo começa no passo 5 e, portanto, não usa a API nem consome créditos. Para análises legadas sem JSON avançado, a leitura pode calcular em memória usando os dados já persistidos. O tempo do pacote é medido; analytics recebe somente eventos agregados e IDs técnicos permitidos.

Falhas de configuração usam flags desligadas. Campos nulos permanecem nulos, módulos sem amostra retornam explicação estável e nenhuma rotina pública oferece recálculo manual nesta versão.
