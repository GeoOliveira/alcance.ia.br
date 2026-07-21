import "server-only";

import { getHomeContent } from "@/lib/settings/public-content";
import type { PageKey } from "@/lib/seo/types";

export type PageContentField = {
  key: string;
  label: string;
  defaultValue: string;
  control?: "input" | "textarea";
  maxLength?: number;
  rows?: number;
  help?: string;
};

export type PageContentDefinition = {
  section: string;
  fields: readonly PageContentField[];
};

const field = (key: string, label: string, defaultValue: string, options: Omit<PageContentField, "key" | "label" | "defaultValue"> = {}): PageContentField => ({ key, label, defaultValue, ...options });
const text = (key: string, label: string, defaultValue: string, rows = 3, maxLength = 2000, help?: string) => field(key, label, defaultValue, { control: "textarea", rows, maxLength, help });

const privacyBody = `## 1. Sobre esta política
Esta política descreve o tratamento de dados no site alcance.ia.br e nas experiências da Alcance IA. A identificação jurídica definitiva do controlador será preenchida antes da operação comercial: {{companyName}}, {{document}}.

## 2. Dados que podemos tratar
- dados informados voluntariamente, como nome, e-mail e mensagens de contato;
- identificador ou URL pública do perfil do Instagram;
- parâmetros de campanha, página de entrada, referência e preferências de cookies;
- dados públicos do perfil e dados autorizados pelo usuário, somente quando as integrações estiverem disponíveis;
- dados técnicos mínimos para segurança, prevenção de abuso e funcionamento do serviço.

Não solicitamos nem armazenamos a senha do Instagram.

## 3. Finalidades e bases legais
Os dados podem ser usados para atender solicitações, prestar e melhorar a experiência, responder contatos, cumprir obrigações legais, prevenir fraude e enviar comunicações opcionais. As bases legais podem incluir execução de procedimentos preliminares, legítimo interesse, cumprimento de obrigação e consentimento, conforme o contexto.

## 4. Cookies e analytics
Cookies essenciais podem operar sem consentimento quando necessários. Ferramentas analíticas só são carregadas após consentimento. Formulários são mascarados e eventos não incluem nome, e-mail, mensagem ou perfil informado.

## 5. Compartilhamento e operadores
Dados podem ser tratados por provedores essenciais, como Vercel e Supabase, e por serviços aprovados de e-mail, analytics e integrações. Alguns provedores podem realizar tratamento internacional, com salvaguardas adequadas.

## 6. Retenção e segurança
Mantemos dados pelo período necessário às finalidades, obrigações legais e defesa de direitos. Aplicamos controles de acesso, validação no servidor, registros mínimos e segregação de segredos, sem afirmar segurança absoluta.

## 7. Inteligência artificial e dados de terceiros
Recursos opcionais de IA interpretam métricas calculadas a partir de dados públicos. Antes do envio, limitamos e sanitizamos a amostra. Resultados podem conter imprecisões, não substituem fontes oficiais e não garantem desempenho.

Quando a criação de link curto do WhatsApp estiver habilitada, telefone e mensagem são transmitidos por HTTPS ao Encurta.io exclusivamente para criar e manter o redirecionamento solicitado.

## 8. Contas e Gerenciador de Links WhatsApp
Quando ativado, o gerenciador trata dados básicos de perfil e autenticação, consentimentos, telefone, mensagem opcional, metadados dos links, QR Codes, preferências e métricas agregadas. O gerenciador não solicita senha do WhatsApp nem acessa conversas.

## 9. Seus direitos
Você pode solicitar confirmação, acesso, correção, anonimização, portabilidade quando aplicável, informação sobre compartilhamento, revisão de consentimento e exclusão, observadas hipóteses legais de retenção.

## 10. Pesquisa de Conteúdo de Marca
Podemos registrar temporariamente dados operacionais sanitizados da pesquisa para limite de uso, segurança e diagnóstico. Não armazenamos tokens, mídia, resposta bruta nem URLs autenticadas.

## 11. Contato
Solicitações podem ser enviadas pela página de contato ou para {{contactEmail}}. Encarregado(a): {{privacyOfficer}}.`;

const termsBody = `## 1. Aceitação e escopo
Ao utilizar o site, você declara ter capacidade para compreender estes termos. Recursos podem permanecer desativados até homologação.

## 2. Uso permitido
Use a plataforma de forma lícita, respeitando direitos de terceiros e políticas das plataformas. É proibido contornar segurança, inserir código malicioso, sobrecarregar serviços, coletar dados indevidamente ou distribuir conteúdo ilícito.

## 3. Contas e credenciais
A senha da conta Alcance IA é exclusiva desta plataforma. Não solicitamos senha do WhatsApp ou de redes sociais. O usuário deve proteger sua sessão e manter os dados corretos.

## 4. Links do WhatsApp
O usuário responde pelos números, mensagens, destinos e distribuição dos links. O Encurta.io processa o redirecionamento e pode aplicar bloqueios, expiração ou indisponibilidade.

## 5. Métricas e planos futuros
Métricas são agregadas, podem incluir bots e estimativas e não garantem resultado. Recursos e planos futuros podem mudar.

## 6. Inteligência artificial e recomendações
Saídas opcionais de IA podem conter imprecisões e não substituem julgamento profissional nem garantem crescimento.

## 7. Propriedade intelectual
A marca, interface, textos e código da Alcance IA são protegidos conforme a legislação.

## 8. Disponibilidade e responsabilidade
Podem ocorrer interrupções, falhas, bloqueios e alterações. Na extensão permitida por lei, não respondemos por decisões tomadas exclusivamente com base em demonstrações ou estimativas.

## 9. Suspensão e alterações
Podemos limitar uso abusivo e atualizar estes termos. Mudanças relevantes serão comunicadas de forma adequada.

## 10. Contato e informações jurídicas
Contato: {{contactEmail}}. Identificação e endereço: {{companyName}}, {{document}}, {{address}}.`;

const cookiesBody = `## 1. O que são cookies
Cookies e tecnologias semelhantes armazenam ou acessam pequenas informações no dispositivo para permitir funcionamento, lembrar preferências e, mediante consentimento, medir uso e campanhas.

## 2. Categorias
### Essenciais
Necessários para segurança, funcionamento, prevenção de abuso e registro das escolhas de consentimento.

### Funcionais
Lembram escolhas úteis e personalizam aspectos não essenciais da experiência.

### Analíticos
Ajudam a compreender uso e desempenho e só são carregados após consentimento analítico.

### Marketing
Podem medir campanhas em plataformas externas e não são carregados antes da autorização específica.

## 3. Como gerenciar
Use “Preferências de cookies” no rodapé para reabrir o painel. A revogação interrompe novos eventos e vale para usos futuros neste dispositivo.

## 4. Provedores
Ferramentas aprovadas de analytics e desempenho podem operar conforme as escolhas registradas. Identificadores ausentes ou categorias recusadas não ativam ferramentas.

## 5. Prazo e atualizações
A escolha versionada e seu timestamp são armazenados localmente e poderão ser solicitados novamente após mudanças relevantes.

## 6. Dúvidas
Envie sua pergunta pela página de contato, selecionando “Privacidade e dados”.`;

const deletionBody = `## 1. Como solicitar
Acesse a página de contato, selecione “Privacidade e dados” e descreva sua solicitação. Informe o e-mail usado no contato ou cadastro para permitir a verificação.

## 2. Verificação de identidade
Podemos solicitar informações adicionais estritamente necessárias para confirmar a identidade e evitar exclusão indevida de dados de terceiros.

## 3. Abrangência
A solicitação pode alcançar dados de contato, preferências, solicitações de análise e dados da conta, observadas obrigações legais, prevenção de fraude e defesa de direitos.

## 4. Prazo e retorno
Confirmaremos o recebimento e informaremos o andamento pelo canal fornecido. Situações complexas poderão exigir esclarecimentos adicionais.

## 5. Iniciar solicitação
Use o botão abaixo para abrir a página de contato e selecione o assunto relacionado a privacidade.`;

export const pageContentDefinitions: Record<PageKey, PageContentDefinition> = {
  home: { section: "page_home", fields: [
    field("status", "Selo da primeira tela", "Primeira versão em desenvolvimento"), field("hero_title", "Título principal", "Entenda seu perfil. Amplie suas possibilidades."),
    text("hero_description", "Descrição principal", "Analise seu perfil do Instagram e descubra oportunidades para melhorar sua bio, seu conteúdo e seu engajamento."),
    field("trust_items", "Itens de confiança", "Sem senha | Sem compromisso | Privacidade desde o início", { help: "Separe os itens com |." }),
    field("report_eyebrow", "Chamada do relatório", "O RELATÓRIO"), field("report_title", "Título do relatório", "Informação organizada. Decisão mais simples."), text("report_description", "Descrição do relatório", "A proposta é reunir observações sobre seu perfil em uma experiência clara, visual e acionável — sempre distinguindo fatos, estimativas e recomendações."),
    field("benefits_title", "Título dos benefícios", "Menos ruído. Mais direção."), text("benefits_description", "Descrição dos benefícios", "Uma forma mais leve de compreender sua presença digital."),
    text("benefit_items", "Benefícios", "Clareza antes da ação | Organize sinais do seu perfil em uma leitura simples, sem promessas vagas.\nDecisões mais conscientes | Enxergue pontos de atenção para priorizar o que realmente merece esforço.\nIA como apoio | Receba orientação assistiva, mantendo contexto, autoria e decisão com você.", 6, 4000, "Uma linha por item no formato Título | Descrição."),
    field("how_title", "Título de como funciona", "Do perfil à próxima ideia, em um fluxo simples."), text("how_description", "Descrição de como funciona", "Nesta primeira fase, você experimenta o início da jornada com total transparência sobre o que já está disponível."),
    text("how_steps", "Etapas", "Informe seu perfil | Digite apenas o nome de usuário ou a URL pública do Instagram.\nAcompanhe a preparação | Organizamos sua solicitação para mostrar como será a experiência.\nExplore a demonstração | Veja a estrutura prevista do relatório com conteúdo claramente ilustrativo.", 6, 4000, "Uma linha por etapa no formato Título | Descrição."),
    field("resources_title", "Título dos recursos", "Uma visão que conecta os pontos."), text("resources_description", "Descrição dos recursos", "A Alcance IA está sendo preparada para apoiar diferentes dimensões da sua presença no Instagram."), field("resource_items", "Lista de recursos", "Leitura da bio | Consistência editorial | Interpretação de métricas | Oportunidades de conteúdo | Recomendações práticas | Ideias para publicações", { help: "Separe os itens com |." }),
    field("audience_title", "Título do público", "Para quem quer crescer com mais consciência."), text("audience_description", "Descrição do público", "Criadores, profissionais autônomos e pequenos negócios que buscam interpretar melhor sua comunicação digital."), field("audience_items", "Públicos", "Criadores de conteúdo | Negócios locais | Profissionais autônomos | Marcas em construção", { help: "Separe os itens com |." }),
    field("privacy_title", "Título de privacidade", "Seus dados merecem contexto, cuidado e controle."), text("privacy_description", "Descrição de privacidade", "Coletamos somente o necessário para cada etapa. Não pedimos credenciais de redes sociais e preparamos a plataforma com princípios da LGPD."),
    field("final_title", "Título da chamada final", "Seu próximo passo pode começar com uma leitura melhor."), text("final_description", "Descrição da chamada final", "Informe seu perfil e conheça a experiência inicial da Alcance IA."), field("final_button", "Texto do botão final", "Analisar meu perfil"),
  ] },
  about: { section: "page_about", fields: [field("eyebrow", "Chamada", "UM PROJETO BRASILEIRO"), field("title", "Título", "Tecnologia para enxergar além dos números."), text("description", "Descrição", "A Alcance IA nasce para simplificar a interpretação de métricas e tornar decisões digitais mais conscientes."), field("direction_title", "Título da direção", "Nossa direção"), text("direction_text_1", "Direção — primeiro texto", "Somos um projeto brasileiro de tecnologia em desenvolvimento contínuo. Queremos ajudar criadores, profissionais e negócios a compreender melhor sua presença digital, reunindo sinais dispersos em uma leitura mais clara."), text("direction_text_2", "Direção — segundo texto", "A inteligência artificial será usada de forma assistiva: para apoiar interpretação, organização e criatividade — não para substituir contexto, autoria ou decisão humana."), field("principles", "Princípios", "Privacidade desde a concepção | Transparência sobre limites e estimativas | Recomendações compreensíveis | Respeito às políticas das plataformas", { help: "Separe os itens com |." }), field("notice_title", "Título do aviso", "Sem promessas de crescimento"), text("notice_text", "Texto do aviso", "A Alcance IA não garante aumento de seguidores, alcance, engajamento, vendas ou qualquer resultado específico. A plataforma pretende oferecer insumos que ajudem você a pensar e agir com mais clareza.")] },
  how_it_works: { section: "page_how_it_works", fields: [field("eyebrow", "Chamada", "UMA JORNADA TRANSPARENTE"), field("title", "Título", "Simples na entrada. Clara em cada etapa."), text("description", "Descrição", "A primeira versão demonstra como a Alcance IA pretende transformar informações públicas e autorizadas em orientação útil — sem fingir integrações que ainda não existem."), text("steps", "Etapas", "Informe o perfil | Use somente o nome de usuário ou a URL pública. Não pedimos senha, e-mail ou cadastro nesta etapa.\nPreparamos a solicitação | Validamos o formato informado e registramos a solicitação com segurança.\nVeja a demonstração | Apresentamos a estrutura ilustrativa do relatório, sem atribuir dados inventados ao perfil real.\nAcompanhe a evolução | Você pode registrar interesse para ser avisado quando a análise completa estiver disponível.", 8, 5000, "Uma linha por etapa no formato Título | Descrição."), field("current_title", "Título do estado atual", "O que acontece hoje"), text("current_text", "Descrição do estado atual", "A plataforma valida o identificador do perfil, cria uma solicitação anônima e conduz você por uma demonstração honesta. A consulta real ao Instagram, o cálculo de métricas e as recomendações personalizadas fazem parte de fases futuras."), field("button", "Texto do botão", "Experimentar a primeira etapa")] },
  resources: { section: "page_resources", fields: [field("eyebrow", "Chamada", "RECURSOS"), field("title", "Título", "Uma leitura conectada da sua presença digital."), text("description", "Descrição", "Veja o que já funciona com dados públicos armazenados e o que permanece em beta ou planejamento controlado."), field("notice_title", "Título do aviso", "Controle de disponibilidade"), text("notice_text", "Texto do aviso", "Recursos premium e de descoberta não são ativados automaticamente. A disponibilidade depende do catálogo, dos limites operacionais e de fontes previamente aprovadas."), field("final_title", "Título final", "Conheça a análise inicial."), text("final_text", "Descrição final", "Os recursos determinísticos aparecem primeiro e não aguardam a interpretação por IA."), field("final_button", "Texto do botão", "Analisar meu perfil")] },
  contact: { section: "page_contact", fields: [field("eyebrow", "Chamada", "FALE COM A GENTE"), field("title", "Título", "Vamos conversar?"), text("description", "Descrição", "Envie dúvidas, solicitações sobre privacidade ou propostas. Sua mensagem será registrada com segurança."), field("section_title", "Título da seção", "Escolha o assunto. Nós organizamos o próximo passo."), text("section_text", "Texto da seção", "Use o formulário para que sua mensagem chegue com o contexto certo. Não envie senhas, documentos ou dados sensíveis."), field("contact_items", "Informações de contato", "E-mail: {{contactEmail}} | Privacidade e dados: selecione o assunto correspondente | Resposta pelo e-mail informado", { help: "Separe os itens com |. A variável {{contactEmail}} é preenchida automaticamente." })] },
  privacy_policy: { section: "page_privacy_policy", fields: [field("title", "Título", "Política de Privacidade"), text("intro", "Introdução", "Entenda quais dados podem ser tratados, para quais finalidades e como exercer seus direitos conforme a LGPD."), text("body", "Documento", privacyBody, 28, 20000, "Use ## para títulos, ### para subtítulos e - para itens de lista. HTML não é aceito.")] },
  terms: { section: "page_terms", fields: [field("title", "Título", "Termos de Uso"), text("intro", "Introdução", "Condições iniciais para utilizar o site e a experiência em desenvolvimento da Alcance IA."), text("body", "Documento", termsBody, 28, 20000, "Use ## para títulos e - para listas. HTML não é aceito.")] },
  cookies_policy: { section: "page_cookies_policy", fields: [field("title", "Título", "Política de Cookies"), text("intro", "Introdução", "Você escolhe quais tecnologias não essenciais podem operar neste dispositivo."), text("body", "Documento", cookiesBody, 28, 20000, "Use ## para títulos, ### para subtítulos e - para listas. HTML não é aceito.")] },
  data_deletion: { section: "page_data_deletion", fields: [field("title", "Título", "Exclusão de Dados"), text("intro", "Introdução", "Um caminho direto para exercer seus direitos sobre dados pessoais."), text("body", "Documento", deletionBody, 22, 16000, "Use ## para títulos e - para listas. HTML não é aceito."), field("button", "Texto do botão", "Solicitar exclusão de dados")] },
  hashtags: { section: "page_hashtags", fields: [field("eyebrow", "Chamada", "DESCOBERTA DE HASHTAGS"), field("title", "Título", "Encontre hashtags com sinais reais de relevância."), text("description", "Descrição", "Explore recorrência, tendência e popularidade por categoria. Os resultados vêm de snapshots válidos e abrir esta página nunca inicia uma nova coleta."), field("pills", "Destaques", "Sem login | Dados em cache | Filtros por categoria", { help: "Separe os itens com |." }), field("recurring_title", "Título da amostra", "Hashtags mais recorrentes"), text("recurring_text", "Descrição da amostra", "As ocorrências são calculadas nos posts públicos encontrados pelas categorias monitoradas, com remoção de duplicatas dentro de cada amostra."), field("method_title", "Título da metodologia", "Como os resultados são preparados"), text("method_text", "Texto da metodologia", "A Alcance IA consulta amostras de posts públicos a partir das hashtags-semente de cada categoria, elimina posts repetidos dentro da amostra e publica somente dados agregados. Frequência e tendência não garantem alcance nem atribuem causalidade à hashtag.")] },
  trending_reels: { section: "page_trending_reels", fields: [field("eyebrow", "Chamada", "RADAR DE CONTEÚDO"), field("title", "Título", "Reels em destaque, antes que a conversa passe."), text("description", "Descrição", "Explore uma amostra pública, periodicamente atualizada, de conteúdos que apresentam sinais de tendência. Métricas públicas podem mudar após a coleta."), field("pills", "Destaques", "Amostra pública | Dados em cache | Filtros avançados", { help: "Separe os itens com |." }), field("method_title", "Título da metodologia", "Sobre esta amostra pública"), text("method_text", "Texto da metodologia", "Os resultados são uma amostra pública formada por snapshots válidos e não representam a totalidade do Instagram. Categoria, idioma e país podem ser estimados; desempenho proporcional só aparece quando existe base pública suficiente para o cálculo.")] },
  category_reels: { section: "page_category_reels", fields: [field("eyebrow", "Chamada", "BIBLIOTECA DE INSPIRAÇÃO"), field("title", "Título", "Encontre referências na categoria certa."), text("description", "Descrição", "Pesquise e compare uma amostra pública de Reels organizada em categorias administradas pela Alcance IA."), field("pills", "Destaques", "Amostra pública | Categorias curadas | Métricas comparáveis", { help: "Separe os itens com |." }), field("method_title", "Título da metodologia", "Sobre os resultados"), text("method_text", "Texto da metodologia", "Resultados baseados em uma amostra pública de conteúdos encontrados. Eles não representam todos os conteúdos do Instagram. Métricas podem mudar depois da coleta; categoria, formato, idioma e país podem ser estimados.")] },
  branded_content: { section: "page_branded_content", fields: [field("eyebrow", "Chamada", "PESQUISA DE CONTEÚDO DE MARCA"), field("title", "Título", "Descubra parcerias entre marcas e criadores."), text("description", "Descrição", "Pesquise conteúdos de marca declarados no Instagram e Facebook e veja quais criadores e empresas participaram."), field("pills", "Destaques", "Instagram e Facebook | Dados declarados | Resultados em cache", { help: "Separe os itens com |." }), field("about_title", "Título — o que é", "O que é conteúdo de marca?"), text("about_text", "Texto — o que é", "É uma publicação em que uma relação comercial ou outra troca de valor foi declarada."), field("finds_title", "Título — o que encontra", "O que a ferramenta encontra?"), text("finds_text", "Texto — o que encontra", "Tipos, datas, criadores, parceiros e links presentes nas respostas normalizadas. Os campos variam conforme a fonte."), field("limits_title", "Título — limitações", "O que ela não encontra?"), text("limits_text", "Texto — limitações", "Conteúdos privados, posts removidos, todas as publicações de uma conta, alcance, vendas ou ROI.")] },
  whatsapp_link_generator: { section: "whatsapp_generator", fields: [field("hero_title", "Título principal", "Crie seu link do WhatsApp em poucos segundos"), text("hero_description", "Descrição principal", "Informe seu número, adicione uma mensagem personalizada e gere um link direto para iniciar conversas no WhatsApp."), text("hero_notice", "Aviso de privacidade", "Seu número é utilizado somente para montar o link e não precisa ser armazenado."), field("how_it_works_title", "Título de como funciona", "Como criar seu link direto"), field("benefits_title", "Título dos benefícios", "Um caminho mais simples para iniciar conversas"), field("use_cases_title", "Título dos casos de uso", "Use seu link onde seus clientes já estão"), field("privacy_title", "Título de privacidade", "Seu número permanece sob seu controle"), text("privacy_description", "Descrição de privacidade", "A ferramenta apenas monta o endereço oficial que abre uma conversa. Ela não solicita senha, acessa mensagens ou envia conteúdo automaticamente."), field("final_cta_title", "Título da chamada final", "Crie agora seu link do WhatsApp"), text("final_cta_description", "Descrição da chamada final", "Facilite o contato com seus clientes usando um link direto e uma mensagem personalizada."), field("final_cta_button", "Texto do botão final", "Gerar meu link")] },
  whatsapp_link_manager: { section: "page_whatsapp_link_manager", fields: [field("eyebrow", "Chamada", "Links do WhatsApp organizados em um só lugar"), field("title", "Título", "Gerencie seus links do WhatsApp com mais controle"), text("description", "Descrição", "Crie links curtos, gere QR Codes e acompanhe os cliques dos seus canais de atendimento em um painel simples e organizado."), field("checks", "Benefícios principais", "Links curtos com Encurta.io | QR Code pronto para compartilhar | Métricas de cliques | Edição e controle conforme a API | Organização em um único painel", { help: "Separe os itens com |." }), field("primary_button", "Botão de cadastro", "Criar conta grátis"), field("secondary_button", "Botão de acesso", "Entrar no painel"), text("notice", "Aviso de segurança", "Não solicitamos sua senha do WhatsApp e não acessamos suas conversas."), field("features_title", "Título dos recursos", "Tudo que você precisa para gerenciar seus links"), field("steps_title", "Título das etapas", "Do cadastro ao acompanhamento em quatro passos"), field("uses_title", "Título dos casos de uso", "Um link para cada ponto de contato"), field("metrics_title", "Título das métricas", "Entenda como seus links são acessados"), text("metrics_text", "Descrição das métricas", "Conforme a disponibilidade da API real, visualize cliques totais e por período, último acesso, dispositivos, origens, evolução diária e links mais acessados."), field("security_title", "Título de segurança", "Seus links sob seu controle"), field("faq_title", "Título das dúvidas", "Antes de criar seu primeiro link"), field("final_title", "Título da chamada final", "Comece a organizar seus links do WhatsApp"), text("final_text", "Descrição da chamada final", "Crie sua conta, gere seu primeiro link curto e acompanhe os acessos em um painel simples.")] },
};

export function getPageContentDefinition(key: PageKey) { return pageContentDefinitions[key]; }

export async function getPageContent(key: PageKey): Promise<Record<string, string>> {
  const stored = await getHomeContent();
  const definition = getPageContentDefinition(key);
  return Object.fromEntries(definition.fields.map((item) => [item.key, stored[`${definition.section}.${item.key}`] || item.defaultValue]));
}

export function splitItems(value: string) { return value.split("|").map((item) => item.trim()).filter(Boolean); }
export function splitRows(value: string) { return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).map((item) => item.split("|").map((part) => part.trim())); }
