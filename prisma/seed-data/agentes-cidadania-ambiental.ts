import type { QSeed } from "./tipos";

const A = "Agentes de Cidadania Ambiental";

const questoes: QSeed[] = [
  {
    assunto: A,
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "O programa Agentes de Cidadania Ambiental tem como foco:",
    alternativas: [
      { texto: "a educação ambiental e a mobilização comunitária para a sustentabilidade.", correta: true },
      { texto: "a fiscalização de crimes ambientais com poder de polícia.", correta: false },
      { texto: "a construção de usinas de reciclagem industriais.", correta: false },
      { texto: "a exploração econômica de recursos naturais.", correta: false },
      { texto: "a regulamentação do licenciamento ambiental de grandes obras.", correta: false },
    ],
    explicacao:
      "O Agentes de Cidadania Ambiental é um programa voluntário de educação ambiental que mobiliza a comunidade para práticas sustentáveis e proteção do meio ambiente.",
    fonteLegal: "Programa DF Social; Decreto nº 42.872/2021",
    palavrasChave: ["educação ambiental", "sustentabilidade", "mobilização"],
  },
  {
    assunto: A,
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "Os Agentes de Cidadania Ambiental atuam como:",
    alternativas: [
      { texto: "voluntários na promoção de práticas sustentáveis em suas comunidades.", correta: true },
      { texto: "fiscais ambientais com poder de multar infratores.", correta: false },
      { texto: "policiais ambientais integrantes da segurança pública.", correta: false },
      { texto: "consultores técnicos contratados pelo GDF.", correta: false },
      { texto: "gestores públicos de unidades de conservação.", correta: false },
    ],
    explicacao:
      "Os Agentes de Cidadania Ambiental são voluntários que promovem ações de educação ambiental e sustentabilidade em suas comunidades, sem poder de polícia ou vínculo empregatício.",
    fonteLegal: "Decreto nº 42.872/2021",
    palavrasChave: ["voluntários", "sustentabilidade", "comunidade"],
  },
  {
    assunto: A,
    nivel: "Medio",
    dificuldade: 3,
    enunciado: "São ações típicas dos Agentes de Cidadania Ambiental:",
    alternativas: [
      { texto: "oficinas de reciclagem, mutirões de limpeza e plantio de árvores.", correta: true },
      { texto: "aplicação de multas ambientais.", correta: false },
      { texto: "concessão de licenças para desmatamento.", correta: false },
      { texto: "elaboração de relatórios de impacto ambiental para empresas.", correta: false },
      { texto: "patrulhamento armado de áreas de preservação.", correta: false },
    ],
    explicacao:
      "Os Agentes de Cidadania Ambiental realizam ações educativas e práticas como oficinas de reciclagem, mutirões de limpeza urbana, plantio de árvores e campanhas de conscientização.",
    fonteLegal: "Decreto nº 42.872/2021",
    palavrasChave: ["reciclagem", "mutirão", "plantio", "conscientização"],
  },
  {
    assunto: A,
    nivel: "Medio",
    dificuldade: 3,
    enunciado: "O programa Agentes de Cidadania Ambiental está inserido no:",
    alternativas: [
      { texto: "Programa DF Social, promovendo a intersetorialidade entre meio ambiente e assistência social.", correta: true },
      { texto: "Sistema Único de Saúde (SUS).", correta: false },
      { texto: "Sistema Nacional de Trânsito.", correta: false },
      { texto: "Sistema Tributário Nacional.", correta: false },
      { texto: "Sistema de Segurança Pública.", correta: false },
    ],
    explicacao:
      "O Agentes de Cidadania Ambiental integra o Programa DF Social, demonstrando a intersetorialidade entre a política de assistência social e a política ambiental.",
    fonteLegal: "Lei nº 7.008/2021; Decreto nº 42.872/2021",
    palavrasChave: ["Programa DF Social", "intersetorialidade", "meio ambiente"],
  },
  {
    assunto: A,
    nivel: "Dificil",
    dificuldade: 4,
    enunciado: "A atuação dos Agentes de Cidadania Ambiental se diferencia da dos agentes públicos ambientais porque:",
    alternativas: [
      { texto: "não exerce poder de polícia e atua exclusivamente na conscientização e educação.", correta: true },
      { texto: "possui autoridade para embargar obras irregulares.", correta: false },
      { texto: "substitui os órgãos ambientais do DF.", correta: false },
      { texto: "atua na elaboração de normas ambientais.", correta: false },
      { texto: "tem vínculo estatutário com o GDF.", correta: false },
    ],
    explicacao:
      "Diferentemente dos agentes públicos ambientais, os Agentes de Cidadania Ambiental são voluntários que atuam exclusivamente na educação e conscientização, sem poder de polícia ou poder de fiscalização sancionatória.",
    fonteLegal: "Decreto nº 42.872/2021",
    palavrasChave: ["poder de polícia", "conscientização", "educação"],
  },
  {
    assunto: A,
    nivel: "Medio",
    dificuldade: 3,
    enunciado: "O programa Agentes de Cidadania Ambiental é gerido pela:",
    alternativas: [
      { texto: "Secretaria de Estado de Desenvolvimento Social do DF (SEDES).", correta: true },
      { texto: "Secretaria de Meio Ambiente.", correta: false },
      { texto: "Instituto Brasília Ambiental (IBRAM).", correta: false },
      { texto: "Secretaria de Agricultura.", correta: false },
      { texto: "Agência Reguladora de Águas e Saneamento (ADASA).", correta: false },
    ],
    explicacao:
      "Embora o tema seja ambiental, o programa está sob a gestão da SEDES por integrar o Programa DF Social, em articulação com órgãos ambientais.",
    fonteLegal: "Lei nº 7.008/2021, art. 4º",
    palavrasChave: ["SEDES", "gestão", "articulação"],
  },
];

export default questoes;
