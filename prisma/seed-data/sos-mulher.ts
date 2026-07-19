import type { QSeed } from "./tipos";

const A = "SOS Mulher";

const questoes: QSeed[] = [
  {
    assunto: A,
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "O SOS Mulher é um programa voltado a:",
    alternativas: [
      { texto: "proteger mulheres em situação de violência doméstica e familiar.", correta: true },
      { texto: "oferecer cursos de beleza e estética.", correta: false },
      { texto: "promover eventos esportivos femininos.", correta: false },
      { texto: "conceder linhas de crédito para empresárias.", correta: false },
      { texto: "organizar desfiles e concursos de beleza.", correta: false },
    ],
    explicacao:
      "O SOS Mulher é um programa de proteção à mulher em situação de violência doméstica e familiar, integrando ações de acolhimento, orientação e encaminhamento à rede de proteção.",
    fonteLegal: "Programa DF Social; Decreto nº 42.872/2021",
    palavrasChave: ["proteção", "violência doméstica", "acolhimento"],
  },
  {
    assunto: A,
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "O SOS Mulher atende mulheres:",
    alternativas: [
      { texto: "em situação de violência doméstica e familiar no Distrito Federal.", correta: true },
      { texto: "exclusivamente servidoras públicas do DF.", correta: false },
      { texto: "apenas turistas estrangeiras.", correta: false },
      { texto: "somente mulheres com ensino superior.", correta: false },
      { texto: "apresidentes de associações comerciais.", correta: false },
    ],
    explicacao:
      "O SOS Mulher atende todas as mulheres em situação de violência doméstica e familiar no DF, independentemente de renda, profissão ou escolaridade.",
    fonteLegal: "Decreto nº 42.872/2021",
    palavrasChave: ["violência doméstica", "acolhimento", "DF"],
  },
  {
    assunto: A,
    nivel: "Medio",
    dificuldade: 3,
    enunciado: "São serviços oferecidos pelo SOS Mulher:",
    alternativas: [
      { texto: "acolhimento psicossocial, orientação jurídica e encaminhamento à rede de proteção.", correta: true },
      { texto: "cirurgias plásticas e estéticas.", correta: false },
      { texto: "empréstimos bancários com juros subsidiados.", correta: false },
      { texto: "cursos de pilotagem e mecânica automotiva.", correta: false },
      { texto: "passagens aéreas para viagens interestaduais.", correta: false },
    ],
    explicacao:
      "O SOS Mulher oferece acolhimento psicossocial, orientação jurídica, informações sobre direitos e encaminhamento para a rede de serviços de proteção à mulher.",
    fonteLegal: "Decreto nº 42.872/2021",
    palavrasChave: ["acolhimento", "jurídico", "psicossocial", "encaminhamento"],
  },
  {
    assunto: A,
    nivel: "Medio",
    dificuldade: 3,
    enunciado: "O SOS Mulher está inserido no:",
    alternativas: [
      { texto: "Programa DF Social, articulando proteção social e enfrentamento à violência de gênero.", correta: true },
      { texto: "Sistema Único de Saúde (SUS), exclusivamente.", correta: false },
      { texto: "Sistema de Segurança Pública do DF.", correta: false },
      { texto: "Programa Cartão Prato Cheio.", correta: false },
      { texto: "Agentes da Cidadania.", correta: false },
    ],
    explicacao:
      "O SOS Mulher integra o Programa DF Social, articulando ações de proteção social com o enfrentamento à violência contra a mulher, em parceria com a rede de políticas para mulheres.",
    fonteLegal: "Lei nº 7.008/2021; Decreto nº 42.872/2021",
    palavrasChave: ["Programa DF Social", "violência de gênero"],
  },
  {
    assunto: A,
    nivel: "Dificil",
    dificuldade: 4,
    enunciado: "O SOS Mulher se articula com as seguintes políticas para garantir a proteção integral da mulher:",
    alternativas: [
      { texto: "assistência social, saúde, segurança pública e justiça.", correta: true },
      { texto: "apenas com a política de assistência social.", correta: false },
      { texto: "exclusivamente com a segurança pública.", correta: false },
      { texto: "somente com a política de educação.", correta: false },
      { texto: "apenas com o sistema prisional.", correta: false },
    ],
    explicacao:
      "O SOS Mulher atua de forma intersetorial, articulando-se com a assistência social, saúde, segurança pública, justiça e demais políticas para garantir proteção integral à mulher.",
    fonteLegal: "Decreto nº 42.872/2021",
    palavrasChave: ["intersetorialidade", "proteção integral", "articulação"],
  },
  {
    assunto: A,
    nivel: "Medio",
    dificuldade: 3,
    enunciado: "O órgão responsável pela gestão do SOS Mulher é:",
    alternativas: [
      { texto: "a Secretaria de Estado de Desenvolvimento Social do DF (SEDES).", correta: true },
      { texto: "a Secretaria de Segurança Pública.", correta: false },
      { texto: "a Delegacia Especializada de Atendimento à Mulher (DEAM).", correta: false },
      { texto: "o Tribunal de Justiça do DF.", correta: false },
      { texto: "a Defensoria Pública do DF.", correta: false },
    ],
    explicacao:
      "O SOS Mulher é gerido pela SEDES por integrar o Programa DF Social, em articulação com a rede de proteção à mulher (DEAM, Casa da Mulher Brasileira, etc.).",
    fonteLegal: "Lei nº 7.008/2021, art. 4º",
    palavrasChave: ["SEDES", "gestão"],
  },
  {
    assunto: A,
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "O SOS Mulher está alinhado à seguinte política nacional:",
    alternativas: [
      { texto: "Lei Maria da Penha (Lei nº 11.340/2006).", correta: true },
      { texto: "Lei Orgânica da Assistência Social (LOAS).", correta: false },
      { texto: "Lei de Diretrizes e Bases da Educação (LDB).", correta: false },
      { texto: "Código de Trânsito Brasileiro.", correta: false },
      { texto: "Lei de Licitações (Lei nº 14.133/2021).", correta: false },
    ],
    explicacao:
      "O SOS Mulher está alinhado à Lei Maria da Penha e às políticas de enfrentamento à violência contra a mulher, promovendo acolhimento e encaminhamento adequado.",
    fonteLegal: "Lei nº 11.340/2006; Decreto nº 42.872/2021",
    palavrasChave: ["Lei Maria da Penha", "alinhamento"],
  },
];

export default questoes;
