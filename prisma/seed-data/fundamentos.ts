import type { QSeed } from "./tipos";

const A = "Fundamentos";

const questoes: QSeed[] = [
  {
    assunto: A,
    subassunto: "História da assistência",
    nivel: "Medio",
    dificuldade: 3,
    enunciado:
      "A Constituição Federal de 1988 representou um marco para a assistência social no Brasil ao:",
    alternativas: [
      { texto: "mantê-la como atividade exclusivamente filantrópica e religiosa.", correta: false },
      { texto: "integrá-la à seguridade social, ao lado da saúde e da previdência social.", correta: true },
      { texto: "condicioná-la ao pagamento de contribuições pelos beneficiários.", correta: false },
      { texto: "transferi-la integralmente para a iniciativa privada.", correta: false },
      { texto: "restringi-la apenas aos trabalhadores com carteira assinada.", correta: false },
    ],
    explicacao:
      "A CF/1988, no art. 194, organiza a seguridade social como conjunto integrado de ações nas áreas de saúde, previdência e assistência social. A assistência passou a ser dever do Estado e direito do cidadão, prestada a quem dela necessitar, independentemente de contribuição (art. 203).",
    fonteLegal: "CF/1988, arts. 194, 203 e 204",
    palavrasChave: ["seguridade social", "CF 1988", "direito"],
  },
  {
    assunto: A,
    subassunto: "História da assistência",
    nivel: "Facil",
    dificuldade: 2,
    enunciado:
      "Segundo a Constituição Federal, a assistência social será prestada:",
    alternativas: [
      { texto: "somente a quem contribuiu previamente para o sistema.", correta: false },
      { texto: "a quem dela necessitar, independentemente de contribuição à seguridade social.", correta: true },
      { texto: "exclusivamente a idosos maiores de 70 anos.", correta: false },
      { texto: "apenas mediante decisão judicial.", correta: false },
      { texto: "somente em situações de calamidade pública.", correta: false },
    ],
    explicacao:
      "O art. 203 da CF/1988 estabelece que a assistência social será prestada a quem dela necessitar, independentemente de contribuição à seguridade social, caracterizando seu aspecto não contributivo.",
    fonteLegal: "CF/1988, art. 203",
    palavrasChave: ["não contributiva", "assistência social"],
  },
  {
    assunto: A,
    subassunto: "LOAS",
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "A sigla LOAS refere-se a qual norma?",
    alternativas: [
      { texto: "Lei Orgânica da Assistência Social (Lei 8.742/1993).", correta: true },
      { texto: "Lei Orgânica da Saúde (Lei 8.080/1990).", correta: false },
      { texto: "Lei de Organização da Administração Social.", correta: false },
      { texto: "Lei Operacional de Assistência ao Servidor.", correta: false },
      { texto: "Lei Ordinária de Auxílio Social.", correta: false },
    ],
    explicacao:
      "A LOAS é a Lei Orgânica da Assistência Social (Lei 8.742, de 7 de dezembro de 1993), que dispõe sobre a organização da assistência social e regulamenta os arts. 203 e 204 da CF/1988.",
    fonteLegal: "Lei 8.742/1993",
    palavrasChave: ["LOAS", "8.742"],
  },
  {
    assunto: A,
    subassunto: "LOAS",
    nivel: "Medio",
    dificuldade: 3,
    enunciado:
      "De acordo com a LOAS, são objetivos da assistência social, EXCETO:",
    alternativas: [
      { texto: "a proteção à família, à maternidade, à infância, à adolescência e à velhice.", correta: false },
      { texto: "o amparo às crianças e adolescentes carentes.", correta: false },
      { texto: "a promoção da integração ao mercado de trabalho.", correta: false },
      { texto: "a habilitação e reabilitação das pessoas com deficiência.", correta: false },
      { texto: "a concessão de aposentadoria por tempo de contribuição.", correta: true },
    ],
    explicacao:
      "O art. 2º da LOAS lista os objetivos da assistência social (proteção à família, amparo a crianças e adolescentes, integração ao mercado de trabalho, habilitação/reabilitação de PcD etc.). Aposentadoria por tempo de contribuição é benefício previdenciário, não assistencial.",
    fonteLegal: "Lei 8.742/1993, art. 2º",
    palavrasChave: ["objetivos", "LOAS", "previdência"],
  },
  {
    assunto: A,
    subassunto: "LOAS",
    nivel: "Medio",
    dificuldade: 3,
    enunciado:
      "Conforme a LOAS, a assistência social rege-se, entre outros, pelo princípio da:",
    alternativas: [
      { texto: "supremacia do atendimento às necessidades sociais sobre as exigências de rentabilidade econômica.", correta: true },
      { texto: "obrigatoriedade de contraprestação financeira pelo usuário.", correta: false },
      { texto: "centralização das ações exclusivamente na União.", correta: false },
      { texto: "seletividade baseada na capacidade contributiva.", correta: false },
      { texto: "vedação à participação da sociedade civil.", correta: false },
    ],
    explicacao:
      "O art. 4º da LOAS traz como princípio a supremacia do atendimento às necessidades sociais sobre as exigências de rentabilidade econômica, além da universalização dos direitos sociais e do respeito à dignidade do cidadão.",
    fonteLegal: "Lei 8.742/1993, art. 4º",
    palavrasChave: ["princípios", "LOAS", "necessidades sociais"],
  },
  {
    assunto: A,
    subassunto: "LOAS",
    nivel: "Dificil",
    dificuldade: 4,
    enunciado:
      "São diretrizes da organização da assistência social previstas na LOAS:",
    alternativas: [
      { texto: "descentralização político-administrativa e participação da população.", correta: true },
      { texto: "centralização federal e gestão privada dos recursos.", correta: false },
      { texto: "contributividade e proporcionalidade atuarial.", correta: false },
      { texto: "sigilo das deliberações e ausência de controle social.", correta: false },
      { texto: "exclusividade do Poder Judiciário na execução das ações.", correta: false },
    ],
    explicacao:
      "O art. 5º da LOAS estabelece como diretrizes a descentralização político-administrativa, a participação da população por meio de organizações representativas e a primazia da responsabilidade do Estado na condução da política.",
    fonteLegal: "Lei 8.742/1993, art. 5º",
    palavrasChave: ["diretrizes", "descentralização", "participação"],
  },
  {
    assunto: A,
    subassunto: "SUAS",
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "O SUAS é caracterizado como um sistema:",
    alternativas: [
      { texto: "público, não contributivo, descentralizado e participativo.", correta: true },
      { texto: "privado e contributivo, gerido por entidades religiosas.", correta: false },
      { texto: "centralizado na União, sem participação dos municípios.", correta: false },
      { texto: "exclusivo para trabalhadores formais.", correta: false },
      { texto: "voltado apenas à concessão de aposentadorias.", correta: false },
    ],
    explicacao:
      "O SUAS (Sistema Único de Assistência Social) é um sistema público não contributivo, descentralizado e participativo, que organiza a oferta de serviços, programas, projetos e benefícios socioassistenciais.",
    fonteLegal: "Lei 8.742/1993 (LOAS), art. 6º; PNAS/2004",
    palavrasChave: ["SUAS", "descentralizado", "não contributivo"],
  },
  {
    assunto: A,
    subassunto: "SUAS",
    nivel: "Medio",
    dificuldade: 3,
    enunciado:
      "A gestão das ações na área de assistência social, no SUAS, é organizada sob a forma de:",
    alternativas: [
      { texto: "sistema único, com comando único em cada esfera de governo.", correta: true },
      { texto: "sistemas paralelos e independentes por município.", correta: false },
      { texto: "comando compartilhado entre Estado e entidades privadas.", correta: false },
      { texto: "gestão exclusiva do Ministério Público.", correta: false },
      { texto: "administração direta apenas pela União.", correta: false },
    ],
    explicacao:
      "A LOAS prevê o comando único das ações em cada esfera de governo, princípio que estrutura o SUAS e garante a coordenação federativa da política de assistência social.",
    fonteLegal: "Lei 8.742/1993, art. 5º, II; NOB-SUAS",
    palavrasChave: ["comando único", "gestão", "SUAS"],
  },
  {
    assunto: A,
    subassunto: "SUAS",
    nivel: "Medio",
    dificuldade: 3,
    enunciado:
      "No âmbito do SUAS, as seguranças afiançadas pela política de assistência social incluem:",
    alternativas: [
      { texto: "segurança de acolhida, de renda, de convívio, de desenvolvimento da autonomia e de apoio em situações de calamidade.", correta: true },
      { texto: "segurança patrimonial e segurança pública.", correta: false },
      { texto: "segurança jurídica e segurança nacional.", correta: false },
      { texto: "segurança previdenciária e seguro-desemprego.", correta: false },
      { texto: "segurança do trabalho e medicina ocupacional.", correta: false },
    ],
    explicacao:
      "A política de assistência social deve afiançar seguranças como acolhida, renda, convívio ou vivência familiar/comunitária, desenvolvimento de autonomia e apoio/auxílio em situações de calamidade e emergência.",
    fonteLegal: "PNAS/2004; Tipificação Nacional de Serviços Socioassistenciais",
    palavrasChave: ["seguranças", "acolhida", "convívio"],
  },
  {
    assunto: A,
    subassunto: "SUAS",
    nivel: "Facil",
    dificuldade: 2,
    enunciado:
      "Os serviços socioassistenciais no SUAS estão organizados por níveis de complexidade em:",
    alternativas: [
      { texto: "proteção social básica e proteção social especial (de média e alta complexidade).", correta: true },
      { texto: "atenção primária, secundária e terciária à saúde.", correta: false },
      { texto: "ensino fundamental, médio e superior.", correta: false },
      { texto: "benefícios contributivos e não contributivos.", correta: false },
      { texto: "serviços urbanos e rurais.", correta: false },
    ],
    explicacao:
      "O SUAS organiza-se em Proteção Social Básica (prevenção) e Proteção Social Especial, esta subdividida em média complexidade (vínculos preservados) e alta complexidade (vínculos rompidos, com acolhimento).",
    fonteLegal: "PNAS/2004; Tipificação Nacional",
    palavrasChave: ["complexidade", "PSB", "PSE"],
  },
  {
    assunto: A,
    subassunto: "PNAS",
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "A PNAS, aprovada em 2004, tem como ano de referência e objetivo principal:",
    alternativas: [
      { texto: "materializar as diretrizes da LOAS, organizando a assistência social no território nacional.", correta: true },
      { texto: "substituir a LOAS, revogando a Lei 8.742/1993.", correta: false },
      { texto: "criar o regime geral de previdência social.", correta: false },
      { texto: "regular exclusivamente o Bolsa Família.", correta: false },
      { texto: "transferir a assistência social para a área da saúde.", correta: false },
    ],
    explicacao:
      "A Política Nacional de Assistência Social (PNAS/2004) operacionaliza as diretrizes da LOAS, estabelecendo as bases para a implantação do SUAS e a organização territorial dos serviços.",
    fonteLegal: "PNAS/2004",
    palavrasChave: ["PNAS", "2004", "LOAS"],
  },
  {
    assunto: A,
    subassunto: "PNAS",
    nivel: "Medio",
    dificuldade: 3,
    enunciado:
      "A noção de 'mínimos sociais' e de 'necessidades básicas', presente na concepção da assistência social, relaciona-se à ideia de:",
    alternativas: [
      { texto: "garantir patamares de proteção e padrões básicos de vida e cidadania.", correta: true },
      { texto: "limitar o atendimento ao estritamente necessário à sobrevivência biológica.", correta: false },
      { texto: "vincular o acesso a benefícios à contribuição prévia.", correta: false },
      { texto: "restringir direitos a determinados grupos profissionais.", correta: false },
      { texto: "eliminar a responsabilidade do Estado.", correta: false },
    ],
    explicacao:
      "A LOAS e a PNAS adotam a perspectiva de garantia de mínimos sociais e atendimento às necessidades básicas, voltada à proteção social e à promoção da cidadania, em uma leitura ampliada (não apenas de subsistência).",
    fonteLegal: "Lei 8.742/1993, art. 1º; PNAS/2004",
    palavrasChave: ["mínimos sociais", "necessidades básicas"],
  },
  {
    assunto: A,
    subassunto: "SUAS",
    nivel: "Medio",
    dificuldade: 3,
    enunciado:
      "O Benefício de Prestação Continuada (BPC) e os benefícios eventuais classificam-se, no SUAS, como:",
    alternativas: [
      { texto: "benefícios da assistência social.", correta: false },
      { texto: "serviços de convivência.", correta: false },
      { texto: "programas de transferência condicionada.", correta: false },
      { texto: "benefícios, distintos dos serviços, programas e projetos socioassistenciais.", correta: true },
      { texto: "ações exclusivamente previdenciárias.", correta: false },
    ],
    explicacao:
      "A LOAS estrutura a oferta em serviços, programas, projetos e benefícios. O BPC e os benefícios eventuais são benefícios da assistência social, categoria distinta dos serviços e programas.",
    fonteLegal: "Lei 8.742/1993, arts. 20 a 25",
    palavrasChave: ["BPC", "benefícios", "serviços"],
  },
  {
    assunto: A,
    subassunto: "História da assistência",
    nivel: "Dificil",
    dificuldade: 4,
    enunciado:
      "A criação da LBA (Legião Brasileira de Assistência), na década de 1940, é historicamente associada a uma assistência social marcada por:",
    alternativas: [
      { texto: "caráter assistencialista, clientelista e de primeiro-damismo.", correta: true },
      { texto: "garantia de direitos sociais universais e não contributivos.", correta: false },
      { texto: "gestão descentralizada e participativa via conselhos.", correta: false },
      { texto: "vinculação ao SUAS e à PNAS.", correta: false },
      { texto: "controle social exercido pela sociedade civil organizada.", correta: false },
    ],
    explicacao:
      "Antes da CF/1988 e da LOAS, a assistência social no Brasil era marcada por práticas assistencialistas e clientelistas, exemplificadas pela LBA e pelo 'primeiro-damismo', em contraste com a atual lógica de direito.",
    fonteLegal: "Histórico da política de assistência social no Brasil",
    palavrasChave: ["LBA", "assistencialismo", "histórico"],
  },
  {
    assunto: A,
    subassunto: "LOAS",
    nivel: "Medio",
    dificuldade: 3,
    enunciado:
      "Compete, conforme a LOAS, à instância de deliberação e controle social da política de assistência social, em cada esfera:",
    alternativas: [
      { texto: "aos conselhos de assistência social, de caráter permanente e composição paritária.", correta: true },
      { texto: "exclusivamente ao Poder Executivo, sem participação social.", correta: false },
      { texto: "às entidades privadas com fins lucrativos.", correta: false },
      { texto: "ao Ministério Público, com função executiva.", correta: false },
      { texto: "aos tribunais de contas, em caráter deliberativo.", correta: false },
    ],
    explicacao:
      "Os Conselhos de Assistência Social (nacional, estaduais, distrital e municipais) são órgãos permanentes e deliberativos, de composição paritária entre governo e sociedade civil, responsáveis pelo controle social da política.",
    fonteLegal: "Lei 8.742/1993, arts. 16 e 17",
    palavrasChave: ["conselhos", "controle social", "paritário"],
  },
  {
    assunto: A,
    subassunto: "SUAS",
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "O CRAS e o CREAS são, respectivamente, unidades de referência da:",
    alternativas: [
      { texto: "proteção social básica e da proteção social especial.", correta: true },
      { texto: "proteção social especial e da proteção social básica.", correta: false },
      { texto: "saúde básica e da saúde especializada.", correta: false },
      { texto: "previdência urbana e da previdência rural.", correta: false },
      { texto: "educação infantil e do ensino médio.", correta: false },
    ],
    explicacao:
      "O CRAS é a unidade da Proteção Social Básica; o CREAS é a unidade da Proteção Social Especial de média complexidade. São referências territoriais para a oferta de serviços socioassistenciais.",
    fonteLegal: "PNAS/2004; NOB-SUAS",
    palavrasChave: ["CRAS", "CREAS", "referência"],
  },
  {
    assunto: A,
    subassunto: "PNAS",
    nivel: "Medio",
    dificuldade: 3,
    enunciado:
      "A perspectiva da assistência social como política de proteção social pressupõe atuação articulada com:",
    alternativas: [
      { texto: "as demais políticas sociais, em especial saúde, educação e previdência, na lógica da intersetorialidade.", correta: true },
      { texto: "apenas o sistema de justiça criminal.", correta: false },
      { texto: "exclusivamente a iniciativa privada.", correta: false },
      { texto: "somente organismos internacionais.", correta: false },
      { texto: "nenhuma outra política, atuando de forma isolada.", correta: false },
    ],
    explicacao:
      "A proteção social demanda intersetorialidade: a assistência social articula-se com saúde, educação, trabalho, previdência e outras políticas para enfrentar de forma integral as vulnerabilidades.",
    fonteLegal: "PNAS/2004",
    palavrasChave: ["intersetorialidade", "proteção social"],
  },
  {
    assunto: A,
    subassunto: "LOAS",
    nivel: "Dificil",
    dificuldade: 4,
    enunciado:
      "A Lei 12.435/2011 é relevante para a assistência social porque:",
    alternativas: [
      { texto: "alterou a LOAS e consolidou legalmente o SUAS.", correta: true },
      { texto: "revogou integralmente a LOAS.", correta: false },
      { texto: "criou o regime próprio de previdência dos servidores.", correta: false },
      { texto: "instituiu o Sistema Único de Saúde.", correta: false },
      { texto: "extinguiu os conselhos de assistência social.", correta: false },
    ],
    explicacao:
      "A Lei 12.435/2011 alterou a LOAS (Lei 8.742/1993) e consolidou, no plano legal, o Sistema Único de Assistência Social (SUAS), antes previsto sobretudo em normas infralegais.",
    fonteLegal: "Lei 12.435/2011",
    palavrasChave: ["12.435", "SUAS", "LOAS"],
  },
  {
    assunto: A,
    subassunto: "SUAS",
    nivel: "Medio",
    dificuldade: 3,
    enunciado:
      "A 'matricialidade sociofamiliar' e a 'territorialização' são, na organização do SUAS:",
    alternativas: [
      { texto: "eixos estruturantes da gestão e da oferta dos serviços.", correta: true },
      { texto: "modalidades de benefícios eventuais.", correta: false },
      { texto: "tipos de entidades privadas.", correta: false },
      { texto: "etapas do processo de aposentadoria.", correta: false },
      { texto: "instrumentos de arrecadação tributária.", correta: false },
    ],
    explicacao:
      "Matricialidade sociofamiliar (família no centro) e territorialização (organização da oferta a partir do território e suas vulnerabilidades) são eixos estruturantes do SUAS.",
    fonteLegal: "PNAS/2004; NOB-SUAS",
    palavrasChave: ["matricialidade", "territorialização", "eixos"],
  },
  {
    assunto: A,
    subassunto: "PNAS",
    nivel: "Facil",
    dificuldade: 2,
    enunciado:
      "São públicos prioritários da política de assistência social, dada sua condição de vulnerabilidade:",
    alternativas: [
      { texto: "famílias e indivíduos em situação de risco social e pessoal.", correta: true },
      { texto: "apenas servidores públicos do Distrito Federal.", correta: false },
      { texto: "exclusivamente grandes empresários.", correta: false },
      { texto: "somente pessoas com vínculo formal de emprego.", correta: false },
      { texto: "apenas estrangeiros em trânsito.", correta: false },
    ],
    explicacao:
      "A assistência social destina-se a famílias e indivíduos em situação de vulnerabilidade e risco social e pessoal, com foco em quem dela necessitar, independentemente de contribuição.",
    fonteLegal: "PNAS/2004; LOAS",
    palavrasChave: ["público", "vulnerabilidade", "risco"],
  },
  {
    assunto: A,
    subassunto: "SUAS",
    nivel: "Dificil",
    dificuldade: 4,
    enunciado:
      "No SUAS, o serviço ofertado de forma prioritária e essencial pelo CRAS é o:",
    alternativas: [
      { texto: "Serviço de Proteção e Atendimento Integral à Família (PAIF).", correta: true },
      { texto: "Serviço de Proteção e Atendimento Especializado a Famílias e Indivíduos (PAEFI).", correta: false },
      { texto: "Serviço de Acolhimento Institucional.", correta: false },
      { texto: "Serviço de abordagem de rua de alta complexidade.", correta: false },
      { texto: "Serviço hospitalar de urgência.", correta: false },
    ],
    explicacao:
      "O PAIF é o serviço de caráter continuado e obrigatório ofertado exclusivamente pelo CRAS, no âmbito da Proteção Social Básica. Já o PAEFI é do CREAS (Proteção Especial).",
    fonteLegal: "Tipificação Nacional de Serviços Socioassistenciais",
    palavrasChave: ["PAIF", "CRAS", "PSB"],
  },
  {
    assunto: A,
    subassunto: "História da assistência",
    nivel: "Medio",
    dificuldade: 3,
    enunciado:
      "A I Conferência Nacional de Assistência Social e a criação do antigo CNAS marcam a:",
    alternativas: [
      { texto: "institucionalização do controle social e da participação após a LOAS.", correta: true },
      { texto: "extinção da assistência social como política pública.", correta: false },
      { texto: "privatização total dos serviços socioassistenciais.", correta: false },
      { texto: "criação do regime militar de assistência.", correta: false },
      { texto: "transferência da política para a área tributária.", correta: false },
    ],
    explicacao:
      "Após a LOAS (1993), instalaram-se os mecanismos de participação e controle social, como as Conferências e o Conselho Nacional de Assistência Social (CNAS), consolidando a assistência como política pública de direito.",
    fonteLegal: "Lei 8.742/1993; histórico do SUAS",
    palavrasChave: ["conferência", "CNAS", "controle social"],
  },
  {
    assunto: A,
    subassunto: "LOAS",
    nivel: "Medio",
    dificuldade: 3,
    enunciado:
      "A vigilância socioassistencial foi incorporada à LOAS como:",
    alternativas: [
      { texto: "uma das funções da política de assistência social, ao lado da proteção social e da defesa de direitos.", correta: true },
      { texto: "um benefício eventual de caráter financeiro.", correta: false },
      { texto: "um tributo destinado a custear o SUAS.", correta: false },
      { texto: "um serviço de saúde de média complexidade.", correta: false },
      { texto: "uma entidade privada de fiscalização.", correta: false },
    ],
    explicacao:
      "A LOAS (art. 6º-A, incluído pela Lei 12.435/2011) prevê como funções da assistência social a proteção social, a vigilância socioassistencial e a defesa de direitos.",
    fonteLegal: "Lei 8.742/1993, art. 6º-A",
    palavrasChave: ["funções", "vigilância", "defesa de direitos"],
  },
  {
    assunto: A,
    subassunto: "SUAS",
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "O órgão gestor federal da política de assistência social é responsável por:",
    alternativas: [
      { texto: "coordenar e normatizar o SUAS em âmbito nacional, cofinanciando a política.", correta: true },
      { texto: "executar diretamente todos os serviços em cada município.", correta: false },
      { texto: "substituir os conselhos de assistência social.", correta: false },
      { texto: "arrecadar contribuições previdenciárias.", correta: false },
      { texto: "julgar ações judiciais sobre benefícios.", correta: false },
    ],
    explicacao:
      "No pacto federativo do SUAS, a União coordena e normatiza nacionalmente a política e participa do cofinanciamento; a execução dos serviços ocorre de forma descentralizada, sobretudo pelos municípios e DF.",
    fonteLegal: "LOAS; NOB-SUAS",
    palavrasChave: ["gestão federal", "cofinanciamento", "SUAS"],
  },
];

export default questoes;
