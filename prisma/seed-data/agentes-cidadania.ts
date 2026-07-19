import type { QSeed } from "./tipos";

const A = "Agentes da Cidadania (Portaria nº 42/2023)";

const questoes: QSeed[] = [
  {
    assunto: A,
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "O programa Agentes da Cidadania é uma iniciativa de:",
    alternativas: [
      { texto: "voluntariado comunitário, visando fortalecer a participação cidadã.", correta: true },
      { texto: "regularização fundiária urbana.", correta: false },
      { texto: "fiscalização tributária de empresas.", correta: false },
      { texto: "patrulhamento ostensivo da polícia militar.", correta: false },
      { texto: "distribuição de medicamentos em farmácias populares.", correta: false },
    ],
    explicacao:
      "O Agentes da Cidadania é um programa de voluntariado que capacita cidadãos para atuarem em suas comunidades, promovendo a participação social e o acesso a direitos.",
    fonteLegal: "Portaria nº 42/2023; Programa DF Social",
    palavrasChave: ["voluntariado", "participação cidadã", "comunidade"],
  },
  {
    assunto: A,
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "A Portaria nº 42/2023 regulamenta qual programa?",
    alternativas: [
      { texto: "Agentes da Cidadania.", correta: true },
      { texto: "Incentiva DF.", correta: false },
      { texto: "DF Brincar.", correta: false },
      { texto: "SOS Mulher.", correta: false },
      { texto: "DF Alfabetização.", correta: false },
    ],
    explicacao:
      "A Portaria nº 42/2023 é o ato normativo que regulamenta o programa Agentes da Cidadania no âmbito do Programa DF Social.",
    fonteLegal: "Portaria nº 42/2023",
    palavrasChave: ["Portaria nº 42/2023", "regulamentação"],
  },
  {
    assunto: A,
    nivel: "Medio",
    dificuldade: 3,
    enunciado: "São atribuições dos Agentes da Cidadania:",
    alternativas: [
      { texto: "identificar famílias em situação de vulnerabilidade e orientá-las sobre programas sociais.", correta: true },
      { texto: "realizar prisões em flagrante.", correta: false },
      { texto: "aplicar multas de trânsito.", correta: false },
      { texto: "prescrever medicamentos controlados.", correta: false },
      { texto: "fiscalizar obras particulares.", correta: false },
    ],
    explicacao:
      "Os Agentes da Cidadania atuam na identificação de famílias vulneráveis, orientação sobre programas sociais e articulação com a rede de proteção social do DF.",
    fonteLegal: "Portaria nº 42/2023, art. 3º",
    palavrasChave: ["atribuições", "identificação", "orientação"],
  },
  {
    assunto: A,
    nivel: "Medio",
    dificuldade: 3,
    enunciado: "Os Agentes da Cidadania exercem suas atividades com base no princípio da:",
    alternativas: [
      { texto: "voluntariedade e da gratuidade do serviço prestado.", correta: true },
      { texto: "remuneração por produtividade.", correta: false },
      { texto: "vínculo empregatício com a administração pública.", correta: false },
      { texto: "exclusividade e dedicação integral.", correta: false },
      { texto: "hierarquia e disciplina militar.", correta: false },
    ],
    explicacao:
      "O programa baseia-se no voluntariado: os agentes atuam de forma gratuita e voluntária, sem vínculo empregatício com o Estado.",
    fonteLegal: "Portaria nº 42/2023, art. 2º",
    palavrasChave: ["voluntariedade", "gratuidade", "sem vínculo"],
  },
  {
    assunto: A,
    nivel: "Dificil",
    dificuldade: 4,
    enunciado: "A atuação dos Agentes da Cidadania contribui para o Programa DF Social ao:",
    alternativas: [
      { texto: "ampliar a capilaridade da rede de proteção social nas comunidades.", correta: true },
      { texto: "substituir os serviços dos CRAS e CREAS.", correta: false },
      { texto: "reduzir o orçamento da assistência social.", correta: false },
      { texto: "eliminar a necessidade do Cadastro Único.", correta: false },
      { texto: "centralizar todas as informações na SEDES.", correta: false },
    ],
    explicacao:
      "Os Agentes da Cidadania ampliam o alcance da rede de proteção social ao atuarem diretamente nas comunidades, identificando demandas e facilitando o acesso aos serviços públicos.",
    fonteLegal: "Portaria nº 42/2023; Programa DF Social",
    palavrasChave: ["capilaridade", "rede de proteção", "comunidades"],
  },
  {
    assunto: A,
    nivel: "Medio",
    dificuldade: 3,
    enunciado: "O programa Agentes da Cidadania é coordenado por:",
    alternativas: [
      { texto: "Secretaria de Estado de Desenvolvimento Social do DF (SEDES).", correta: true },
      { texto: "Secretaria de Governo.", correta: false },
      { texto: "Casa Militar do GDF.", correta: false },
      { texto: "Secretaria de Transparência.", correta: false },
      { texto: "Controladoria-Geral do DF.", correta: false },
    ],
    explicacao:
      "A coordenação do Agentes da Cidadania cabe à SEDES, responsável pela gestão do Programa DF Social como um todo.",
    fonteLegal: "Portaria nº 42/2023, art. 5º",
    palavrasChave: ["SEDES", "coordenação"],
  },
];

export default questoes;
