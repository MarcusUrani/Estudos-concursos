import type { QSeed } from "./tipos";

const A = "DF Brincar";

const questoes: QSeed[] = [
  {
    assunto: A,
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "O DF Brincar é um programa voltado a:",
    alternativas: [
      { texto: "garantir o direito ao lazer e ao desenvolvimento infantil por meio do brincar.", correta: true },
      { texto: "regular o comércio de brinquedos no DF.", correta: false },
      { texto: "fiscalizar parques e áreas de lazer privadas.", correta: false },
      { texto: "promover competições esportivas entre escolas.", correta: false },
      { texto: "organizar o transporte escolar.", correta: false },
    ],
    explicacao:
      "O DF Brincar é um programa que promove o direito ao lazer, à convivência e ao desenvolvimento infantil por meio de atividades lúdicas e recreativas.",
    fonteLegal: "Programa DF Social; Decreto nº 42.872/2021",
    palavrasChave: ["lazer", "desenvolvimento infantil", "brincar"],
  },
  {
    assunto: A,
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "O público-alvo do programa DF Brincar é composto principalmente por:",
    alternativas: [
      { texto: "crianças e adolescentes em situação de vulnerabilidade social.", correta: true },
      { texto: "idosos acima de 60 anos.", correta: false },
      { texto: "servidores públicos da SEDES.", correta: false },
      { texto: "empresários do setor de entretenimento.", correta: false },
      { texto: "jovens universitários.", correta: false },
    ],
    explicacao:
      "O DF Brincar tem como foco crianças e adolescentes em situação de vulnerabilidade social, promovendo inclusão por meio de atividades lúdicas e recreativas.",
    fonteLegal: "Decreto nº 42.872/2021",
    palavrasChave: ["crianças", "adolescentes", "vulnerabilidade"],
  },
  {
    assunto: A,
    nivel: "Medio",
    dificuldade: 3,
    enunciado: "As atividades oferecidas pelo DF Brincar incluem:",
    alternativas: [
      { texto: "oficinas de arte, recreação, esportes e brincadeiras dirigidas.", correta: true },
      { texto: "cursos de formação técnica em informática.", correta: false },
      { texto: "atendimento médico especializado.", correta: false },
      { texto: "orientação jurídica gratuita.", correta: false },
      { texto: "distribuição de medicamentos.", correta: false },
    ],
    explicacao:
      "O DF Brincar oferece atividades lúdicas como oficinas de arte, recreação, esportes e brincadeiras dirigidas, sempre com foco no desenvolvimento infantil e na inclusão social.",
    fonteLegal: "Decreto nº 42.872/2021",
    palavrasChave: ["oficinas", "recreação", "esportes"],
  },
  {
    assunto: A,
    nivel: "Medio",
    dificuldade: 3,
    enunciado: "O DF Brincar está inserido no âmbito de qual programa maior?",
    alternativas: [
      { texto: "Programa DF Social.", correta: true },
      { texto: "Programa Cartão Prato Cheio.", correta: false },
      { texto: "Programa Cartão Gás.", correta: false },
      { texto: "Agentes da Cidadania.", correta: false },
      { texto: "SOS Mulher.", correta: false },
    ],
    explicacao:
      "O DF Brincar é um dos programas que integram o Programa DF Social, política guarda-chuva de proteção e desenvolvimento social do Distrito Federal.",
    fonteLegal: "Lei nº 7.008/2021; Decreto nº 42.872/2021",
    palavrasChave: ["Programa DF Social", "integração"],
  },
  {
    assunto: A,
    nivel: "Dificil",
    dificuldade: 4,
    enunciado: "O DF Brincar contribui para a proteção social ao:",
    alternativas: [
      { texto: "promover a convivência familiar e comunitária e o desenvolvimento de habilidades socioemocionais.", correta: true },
      { texto: "substituir a frequência escolar obrigatória.", correta: false },
      { texto: "fornecer alimentação exclusiva durante as atividades.", correta: false },
      { texto: "realizar procedimentos médicos nas crianças.", correta: false },
      { texto: "vincular as famílias a empregos formais.", correta: false },
    ],
    explicacao:
      "O DF Brincar atua na proteção social ao fortalecer vínculos familiares e comunitários e desenvolver habilidades socioemocionais por meio de atividades lúdicas.",
    fonteLegal: "Decreto nº 42.872/2021; PNAS/2004",
    palavrasChave: ["convivência", "vínculos", "socioemocionais"],
  },
  {
    assunto: A,
    nivel: "Medio",
    dificuldade: 3,
    enunciado: "As ações do DF Brincar são executadas preferencialmente em:",
    alternativas: [
      { texto: "espaços comunitários, parques e equipamentos públicos da rede socioassistencial.", correta: true },
      { texto: "hospitais e unidades de pronto atendimento.", correta: false },
      { texto: "delegacias de polícia.", correta: false },
      { texto: "órgãos da administração tributária.", correta: false },
      { texto: "empresas privadas com fins lucrativos.", correta: false },
    ],
    explicacao:
      "O DF Brincar utiliza espaços comunitários, parques e equipamentos públicos como CRAS e centros de convivência para realizar suas atividades lúdicas e recreativas.",
    fonteLegal: "Decreto nº 42.872/2021",
    palavrasChave: ["espaços comunitários", "CRAS", "equipamentos públicos"],
  },
  {
    assunto: A,
    nivel: "Facil",
    dificuldade: 2,
    enunciado: "O DF Brincar é coordenado por qual órgão?",
    alternativas: [
      { texto: "Secretaria de Estado de Desenvolvimento Social do DF (SEDES).", correta: true },
      { texto: "Secretaria de Educação.", correta: false },
      { texto: "Secretaria de Cultura.", correta: false },
      { texto: "Secretaria de Esporte.", correta: false },
      { texto: "Secretaria de Saúde.", correta: false },
    ],
    explicacao:
      "Assim como os demais programas do Programa DF Social, o DF Brincar é coordenado pela SEDES, órgão gestor da política de desenvolvimento social do DF.",
    fonteLegal: "Lei nº 7.008/2021, art. 4º",
    palavrasChave: ["SEDES", "coordenação"],
  },
];

export default questoes;
