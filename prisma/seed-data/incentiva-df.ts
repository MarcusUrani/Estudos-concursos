import type { QSeed } from "./tipos";

const A = "Incentiva DF";

const questoes: QSeed[] = [
  {
    assunto: A,
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "O Incentiva DF é um programa voltado a:",
    alternativas: [
      { texto: "promover a qualificação profissional e a inclusão produtiva das famílias.", correta: true },
      { texto: "distribuir cestas básicas para famílias carentes.", correta: false },
      { texto: "realizar mutirões de limpeza urbana.", correta: false },
      { texto: "fiscalizar o comércio ambulante.", correta: false },
      { texto: "gerenciar o sistema de transporte público.", correta: false },
    ],
    explicacao:
      "O Incentiva DF é um programa de qualificação profissional e inclusão produtiva que visa promover a autonomia das famílias por meio do acesso ao trabalho e renda.",
    fonteLegal: "Programa DF Social; Decreto nº 42.872/2021",
    palavrasChave: ["qualificação", "inclusão produtiva", "autonomia"],
  },
  {
    assunto: A,
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "O público-alvo do Incentiva DF são:",
    alternativas: [
      { texto: "famílias em situação de vulnerabilidade social cadastradas no Cadastro Único.", correta: true },
      { texto: "apenas servidores públicos do DF.", correta: false },
      { texto: "grandes empresários do setor industrial.", correta: false },
      { texto: "turistas estrangeiros.", correta: false },
      { texto: "apenas jovens com ensino superior completo.", correta: false },
    ],
    explicacao:
      "O Incentiva DF atende famílias em situação de vulnerabilidade social, prioritariamente aquelas cadastradas no Cadastro Único, oferecendo oportunidades de qualificação e trabalho.",
    fonteLegal: "Decreto nº 42.872/2021",
    palavrasChave: ["Cadastro Único", "vulnerabilidade", "trabalho"],
  },
  {
    assunto: A,
    nivel: "Medio",
    dificuldade: 3,
    enunciado: "São exemplos de ações oferecidas pelo Incentiva DF:",
    alternativas: [
      { texto: "cursos de capacitação profissional e apoio ao empreendedorismo.", correta: true },
      { texto: "cirurgias eletivas e atendimento médico.", correta: false },
      { texto: "patrulhamento policial e segurança pública.", correta: false },
      { texto: "construção de moradias populares.", correta: false },
      { texto: "distribuição de medicamentos controlados.", correta: false },
    ],
    explicacao:
      "O Incentiva DF oferece cursos de capacitação profissional, oficinas de empreendedorismo e ações de intermediação de mão de obra para facilitar a inserção no mercado de trabalho.",
    fonteLegal: "Decreto nº 42.872/2021",
    palavrasChave: ["capacitação", "empreendedorismo", "mercado de trabalho"],
  },
  {
    assunto: A,
    nivel: "Medio",
    dificuldade: 3,
    enunciado: "O Incentiva DF busca, primordialmente, a:",
    alternativas: [
      { texto: "emancipação das famílias por meio da geração de trabalho e renda.", correta: true },
      { texto: "manutenção das famílias em programas assistenciais por tempo indeterminado.", correta: false },
      { texto: "substituição do acompanhamento familiar por benefícios financeiros.", correta: false },
      { texto: "redução do orçamento da assistência social.", correta: false },
      { texto: "centralização dos recursos em programas de transferência de renda.", correta: false },
    ],
    explicacao:
      "O Incentiva DF tem como objetivo central a emancipação das famílias, promovendo autonomia por meio da qualificação profissional e da inclusão no mercado de trabalho.",
    fonteLegal: "Decreto nº 42.872/2021, art. 2º",
    palavrasChave: ["emancipação", "autonomia", "trabalho e renda"],
  },
  {
    assunto: A,
    nivel: "Dificil",
    dificuldade: 4,
    enunciado: "O Incentiva DF se diferencia dos programas de transferência de renda porque:",
    alternativas: [
      { texto: "foca na inclusão produtiva e na capacitação, e não no repasse financeiro direto.", correta: true },
      { texto: "substitui integralmente o Bolsa Família.", correta: false },
      { texto: "concede benefícios sem qualquer contrapartida.", correta: false },
      { texto: "atende exclusivamente servidores públicos.", correta: false },
      { texto: "distribui alimentos em vez de renda.", correta: false },
    ],
    explicacao:
      "Diferentemente dos programas de transferência de renda, o Incentiva DF atua na inclusão produtiva, oferecendo capacitação profissional e apoio ao empreendedorismo para promover a autonomia das famílias.",
    fonteLegal: "Decreto nº 42.872/2021",
    palavrasChave: ["inclusão produtiva", "transferência de renda", "diferencial"],
  },
  {
    assunto: A,
    nivel: "Medio",
    dificuldade: 3,
    enunciado: "O Incentiva DF está vinculado a qual programa maior do GDF?",
    alternativas: [
      { texto: "Programa DF Social.", correta: true },
      { texto: "Programa Cartão Gás.", correta: false },
      { texto: "Agentes da Cidadania.", correta: false },
      { texto: "DF Alfabetização.", correta: false },
      { texto: "Restaurante Comunitário.", correta: false },
    ],
    explicacao:
      "O Incentiva DF integra o Programa DF Social, política guarda-chuva que articula diversos programas de proteção e desenvolvimento social no Distrito Federal.",
    fonteLegal: "Lei nº 7.008/2021; Decreto nº 42.872/2021",
    palavrasChave: ["Programa DF Social", "vinculação"],
  },
  {
    assunto: A,
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "O órgão responsável pela gestão do Incentiva DF é:",
    alternativas: [
      { texto: "a Secretaria de Estado de Desenvolvimento Social do DF (SEDES).", correta: true },
      { texto: "a Secretaria de Educação.", correta: false },
      { texto: "a Secretaria de Trabalho.", correta: false },
      { texto: "a Secretaria de Economia.", correta: false },
      { texto: "a Secretaria de Agricultura.", correta: false },
    ],
    explicacao:
      "O Incentiva DF é gerido pela SEDES, órgão responsável pela coordenação do Programa DF Social e seus programas integrantes.",
    fonteLegal: "Lei nº 7.008/2021, art. 4º",
    palavrasChave: ["SEDES", "gestão"],
  },
];

export default questoes;
