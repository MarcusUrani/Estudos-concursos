import type { QSeed } from "./tipos";

const A = "DF Alfabetização";

const questoes: QSeed[] = [
  {
    assunto: A,
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "O DF Alfabetização é um programa voltado a:",
    alternativas: [
      { texto: "alfabetização de jovens, adultos e idosos que não tiveram acesso à educação na idade própria.", correta: true },
      { texto: "alfabetização exclusiva de crianças do ensino fundamental.", correta: false },
      { texto: "cursos de pós-graduação para servidores públicos.", correta: false },
      { texto: "formação de professores da rede privada.", correta: false },
      { texto: "intercâmbio internacional de estudantes.", correta: false },
    ],
    explicacao:
      "O DF Alfabetização é um programa de alfabetização voltado a jovens, adultos e idosos em situação de vulnerabilidade social que não concluíram a alfabetização na idade adequada.",
    fonteLegal: "Programa DF Social; Decreto nº 42.872/2021",
    palavrasChave: ["alfabetização", "jovens e adultos", "EJA"],
  },
  {
    assunto: A,
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "O DF Alfabetização integra qual programa maior do GDF?",
    alternativas: [
      { texto: "Programa DF Social.", correta: true },
      { texto: "Cartão Prato Cheio.", correta: false },
      { texto: "Incentiva DF.", correta: false },
      { texto: "Agentes da Cidadania.", correta: false },
      { texto: "SOS Mulher.", correta: false },
    ],
    explicacao:
      "O DF Alfabetização é um dos programas integrantes do Programa DF Social, política guarda-chuva de proteção e desenvolvimento social do Distrito Federal.",
    fonteLegal: "Lei nº 7.008/2021; Decreto nº 42.872/2021",
    palavrasChave: ["Programa DF Social", "integração"],
  },
  {
    assunto: A,
    nivel: "Medio",
    dificuldade: 3,
    enunciado: "O DF Alfabetização contribui para a proteção social ao:",
    alternativas: [
      { texto: "promover a inclusão educacional e ampliar as oportunidades de exercício da cidadania.", correta: true },
      { texto: "substituir o ensino regular fundamental.", correta: false },
      { texto: "fornecer alimentação exclusiva aos alfabetizandos.", correta: false },
      { texto: "conceder bolsas de estudo para o ensino superior.", correta: false },
      { texto: "realizar exames médicos nos participantes.", correta: false },
    ],
    explicacao:
      "O DF Alfabetização promove a inclusão educacional de jovens e adultos, ampliando suas oportunidades de cidadania, autonomia e acesso a direitos.",
    fonteLegal: "Decreto nº 42.872/2021",
    palavrasChave: ["inclusão educacional", "cidadania", "autonomia"],
  },
  {
    assunto: A,
    nivel: "Medio",
    dificuldade: 3,
    enunciado: "As turmas do DF Alfabetização são organizadas preferencialmente em:",
    alternativas: [
      { texto: "equipamentos públicos da rede socioassistencial e comunitária.", correta: true },
      { texto: "hospitais e unidades de saúde.", correta: false },
      { texto: "delegacias de polícia.", correta: false },
      { texto: "órgãos da administração tributária.", correta: false },
      { texto: "quartéis militares.", correta: false },
    ],
    explicacao:
      "As aulas do DF Alfabetização ocorrem preferencialmente em CRAS, centros de convivência, associações comunitárias e outros equipamentos públicos de fácil acesso à população vulnerável.",
    fonteLegal: "Decreto nº 42.872/2021",
    palavrasChave: ["CRAS", "equipamentos públicos", "comunidade"],
  },
  {
    assunto: A,
    nivel: "Dificil",
    dificuldade: 4,
    enunciado: "A relação do DF Alfabetização com o Programa DF Social evidencia que:",
    alternativas: [
      { texto: "a educação é tratada como instrumento de emancipação e superação da pobreza.", correta: true },
      { texto: "a alfabetização não é prioridade na política de assistência social.", correta: false },
      { texto: "os programas educacionais substituem integralmente os benefícios assistenciais.", correta: false },
      { texto: "a educação é responsabilidade exclusiva da Secretaria de Educação.", correta: false },
      { texto: "o programa atende apenas crianças em idade escolar.", correta: false },
    ],
    explicacao:
      "O DF Alfabetização demonstra a abordagem intersetorial do Programa DF Social, que trata a educação como instrumento de emancipação e superação da pobreza.",
    fonteLegal: "Lei nº 7.008/2021; Decreto nº 42.872/2021",
    palavrasChave: ["emancipação", "educação", "superação da pobreza"],
  },
  {
    assunto: A,
    nivel: "Medio",
    dificuldade: 3,
    enunciado: "O DF Alfabetização é coordenado pela:",
    alternativas: [
      { texto: "Secretaria de Estado de Desenvolvimento Social do DF (SEDES).", correta: true },
      { texto: "Secretaria de Educação.", correta: false },
      { texto: "Secretaria de Ciência e Tecnologia.", correta: false },
      { texto: "Fundação de Ensino Superior do DF.", correta: false },
      { texto: "Universidade do Distrito Federal.", correta: false },
    ],
    explicacao:
      "Embora seja um programa de alfabetização, sua gestão cabe à SEDES por integrar o Programa DF Social, em articulação com a Secretaria de Educação.",
    fonteLegal: "Lei nº 7.008/2021, art. 4º",
    palavrasChave: ["SEDES", "coordenação", "articulação"],
  },
  {
    assunto: A,
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "O público-alvo do DF Alfabetização inclui:",
    alternativas: [
      { texto: "pessoas com 15 anos ou mais que não foram alfabetizadas na idade regular.", correta: true },
      { texto: "crianças de 6 a 10 anos matriculadas no ensino fundamental.", correta: false },
      { texto: "apenas idosos acima de 60 anos.", correta: false },
      { texto: "servidores públicos com ensino superior completo.", correta: false },
      { texto: "estrangeiros sem documentação.", correta: false },
    ],
    explicacao:
      "O DF Alfabetização atende jovens a partir de 15 anos, adultos e idosos que não tiveram acesso à alfabetização na idade regular, prioritariamente em situação de vulnerabilidade.",
    fonteLegal: "Decreto nº 42.872/2021",
    palavrasChave: ["15 anos", "jovens", "adultos", "idosos"],
  },
];

export default questoes;
