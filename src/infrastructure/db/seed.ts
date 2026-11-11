import { getDb } from "@/infrastructure/db/client";
import { articleRepository } from "@/infrastructure/repositories/article-repository";
import { categoryRepository } from "@/infrastructure/repositories/category-repository";

let hasCheckedSeed = false;

export function ensureSeeded(): void {
  if (hasCheckedSeed && !process.env.PORTAL_DB_PATH) {
    return;
  }

  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) AS total FROM categories")
    .get() as { total: number };

  if (Number(row.total) > 0) {
    hasCheckedSeed = true;
    return;
  }

  const seedCategories = [
    {
      name: "Agricultura",
      slug: "agricultura",
      description: "Safra baiana, agronegócio, exportações e inovações no campo.",
      color: "#15803D",
      displayOrder: 1,
      showInMenu: true,
    },
    {
      name: "Animais",
      slug: "animais",
      description: "Bem-estar animal, fauna silvestre e campanhas de adoção na Bahia.",
      color: "#0F766E",
      displayOrder: 2,
      showInMenu: true,
    },
    {
      name: "Bahia",
      slug: "bahia",
      description: "Notícias de Salvador, Região Metropolitana e interior do estado.",
      color: "#05226B",
      displayOrder: 3,
      showInMenu: true,
    },
    {
      name: "Brasil",
      slug: "brasil",
      description: "Política nacional, programas sociais e decisões de Brasília.",
      color: "#1D4ED8",
      displayOrder: 4,
      showInMenu: true,
    },
    {
      name: "Cultura",
      slug: "cultura",
      description: "Agenda cultural, patrimônio histórico, música e artes da Bahia.",
      color: "#7E22CE",
      displayOrder: 5,
      showInMenu: true,
    },
    {
      name: "Economia",
      slug: "economia",
      description: "Mercado, indústria, portos, comércio e finanças pessoais.",
      color: "#B45309",
      displayOrder: 6,
      showInMenu: true,
    },
    {
      name: "Entretenimento",
      slug: "entretenimento",
      description: "Cinema, streaming, festivais e programação de lazer.",
      color: "#BE185D",
      displayOrder: 7,
      showInMenu: true,
    },
    {
      name: "Esportes",
      slug: "esportes",
      description: "Futebol baiano, Brasileirão, Seleção e modalidades olímpicas.",
      color: "#C80A14",
      displayOrder: 8,
      showInMenu: true,
    },
    {
      name: "Famosos",
      slug: "famosos",
      description: "Bastidores da TV, celebridades e eventos pelo Brasil.",
      color: "#DB2777",
      displayOrder: 9,
      showInMenu: true,
    },
    {
      name: "Hotelaria",
      slug: "hotelaria",
      description: "Turismo, rede hoteleira, resorts e ocupação no litoral baiano.",
      color: "#0369A1",
      displayOrder: 10,
      showInMenu: true,
    },
    {
      name: "Meio Ambiente",
      slug: "meio-ambiente",
      description: "Sustentabilidade, preservação costeira e energias limpas.",
      color: "#166534",
      displayOrder: 11,
      showInMenu: true,
    },
    {
      name: "Mundo",
      slug: "mundo",
      description: "Geopolítica, tecnologia global e principais fatos internacionais.",
      color: "#334155",
      displayOrder: 12,
      showInMenu: true,
    },
    {
      name: "Polícia",
      slug: "policia",
      description: "Segurança pública, operações integradas e trânsito nas rodovias.",
      color: "#991B1B",
      displayOrder: 13,
      showInMenu: true,
    },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of seedCategories) {
    const created = categoryRepository.create(cat);
    categoryMap.set(created.slug, created.id);
  }

  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

  const seedArticles = [
    {
      title:
        "Galvão Bueno critica mudanças na comissão técnica e cobra planejamento para a Seleção Brasileira",
      subtitle:
        "Narrador analisou o momento do futebol nacional durante transmissão ao vivo e defendeu continuidade nos projetos de base antes das eliminatórias.",
      content: `Durante participação em programa esportivo nesta noite, o narrador Galvão Bueno voltou a comentar os rumos da Seleção Brasileira e as recentes demissões no comando técnico do futebol nacional.\n\nSegundo o comunicador, a constante troca de treinadores compromete a construção de uma identidade tática sólida. "Não se constrói uma seleção competitiva trocando de comando a cada seis meses. É preciso respaldo, método e observação real dos campeonatos regionais e do Brasileirão", afirmou.\n\nA declaração repercutiu rapidamente entre dirigentes, ex-jogadores e torcedores nas redes sociais. Analistas destacam que os próximos compromissos da equipe exigirão convocação equilibrada entre atletas que atuam na Europa e destaques do futebol brasileiro, incluindo nomes que brilham nos clubes nordestinos.\n\nA Confederação deve anunciar o calendário de preparação até o fim da semana, com jogos amistosos previstos para o próximo trimestre.`,
      coverImage: "/images/news/hero-esportes.jpg",
      coverAlt:
        "Comentarista esportivo brasileiro em estúdio de televisão com painéis de estádio ao fundo",
      imageCaption: "Transmissão ao vivo analisou os bastidores da Seleção. Foto: Divulgação",
      categoryId: categoryMap.get("esportes")!,
      authorName: "Rafael Santana",
      authorRole: "Editor de Esportes",
      status: "published" as const,
      isHero: true,
      isBreaking: false,
      isFeatured: false,
      tags: ["Futebol", "Seleção Brasileira", "Esportes", "Bastidores"],
      publishedAt: hoursAgo(1),
    },
    {
      title:
        "Gás do Povo é prorrogado até 2031; veja quem terá direito ao benefício e como consultar",
      subtitle:
        "Medida garante subsídio integral do botijão de 13 kg para famílias inscritas no CadÚnico e amplia rede de revendas credenciadas na Bahia.",
      content: `O governo federal confirmou a prorrogação do programa Gás do Povo até dezembro de 2031, assegurando previsibilidade orçamentária para milhões de famílias em situação de vulnerabilidade social em todo o país.\n\nNa Bahia, mais de 1,4 milhão de lares já utilizam o benefício diretamente nas distribuidoras credenciadas por meio de aplicativo oficial ou cartão vinculado ao Cadastro Único (CadÚnico).\n\nPara manter o auxílio ativo, os beneficiários devem manter a inscrição atualizada nos Centros de Referência de Assistência Social (CRAS) do município, especialmente em casos de mudança de endereço ou alteração na composição familiar.\n\nA nova portaria também simplifica o credenciamento de pequenas revendedoras nos municípios do interior baiano, reduzindo o deslocamento dos moradores das zonas rurais.`,
      coverImage: "/images/news/brasil-gas.jpg",
      coverAlt:
        "Fileiras de botijões de gás residenciais azuis e prateados organizados em distribuidora autorizada",
      imageCaption: "Programa atende mais de 1,4 milhão de famílias na Bahia. Foto: Agência Brasil",
      categoryId: categoryMap.get("brasil")!,
      authorName: "Mariana Oliveira",
      authorRole: "Correspondente Nacional",
      status: "published" as const,
      isHero: false,
      isBreaking: true,
      isFeatured: true,
      tags: ["Brasil", "Gás do Povo", "Economia Popular", "CadÚnico"],
      publishedAt: hoursAgo(2),
    },
    {
      title:
        "Sistema Ferry-Boat amplia horários e registra fluxo intenso na travessia Salvador–Itaparica",
      subtitle:
        "Operação especial conta com seis embarcações simultâneas na Baía de Todos-os-Santos e monitoramento digital de filas nos terminais.",
      content: `A travessia marítima entre Salvador e a Ilha de Itaparica opera com esquema reforçado a partir desta semana para atender ao aumento de passageiros entre a capital baiana e o Recôncavo.\n\nDe acordo com a concessionária responsável pelos terminais de São Joaquim e Bom Despacho, seis embarcações estão em operação contínua com saídas a cada 30 minutos nos horários de pico.\n\nOs passageiros também passaram a contar com painel atualizado em tempo real para acompanhar o tempo estimado de espera antes mesmo de chegar ao embarque. A recomendação para motoristas é priorizar a compra antecipada com hora marcada.\n\nEquipes da agência reguladora acompanham a operação e reforçaram a sinalização nos acessos rodoviários da BA-001.`,
      coverImage: "/images/news/bahia-ferry.jpg",
      coverAlt:
        "Ferry-boat de passageiros navegando pelas águas azuis da Baía de Todos-os-Santos em Salvador",
      imageCaption: "Embarcações operam com saídas a cada 30 minutos nos picos. Foto: Redação BA Infoco",
      categoryId: categoryMap.get("bahia")!,
      authorName: "Lucas Ferreira",
      authorRole: "Repórter Salvador",
      status: "published" as const,
      isHero: false,
      isBreaking: false,
      isFeatured: true,
      tags: ["Bahia", "Salvador", "Ferry-Boat", "Mobilidade"],
      publishedAt: hoursAgo(3),
    },
    {
      title:
        "Jornalistas que cobrem tecnologia e redes sociais têm contas suspensas após polêmica global",
      subtitle:
        "Entidades internacionais de imprensa cobram transparência nos critérios de moderação e impacto sobre a cobertura jornalística independente.",
      content: `Uma onda de suspensões temporárias envolvendo perfis de repórteres especializados em tecnologia reacendeu o debate internacional sobre moderação algorítmica e liberdade de imprensa nas plataformas digitais.\n\nDe acordo com associações de jornalistas nos Estados Unidos e na Europa, ao menos doze profissionais tiveram suas contas restringidas sem aviso prévio detalhado após publicarem reportagens investigativas sobre infraestrutura de dados.\n\nEspecialistas em direito digital apontam que a dependência de canais proprietários reforça a importância de portais jornalísticos independentes, newsletters diretas e padrões abertos de distribuição de conteúdo.\n\nApós repercussão mundial, parte dos perfis começou a ser restabelecida sob revisão manual.`,
      coverImage: "/images/news/mundo-cameras.jpg",
      coverAlt:
        "Dois smartphones modernos lado a lado exibindo módulos triplos de câmeras em estúdio",
      imageCaption: "Debate sobre transparência digital ganha força global. Foto: Arquivo Tech",
      categoryId: categoryMap.get("mundo")!,
      authorName: "Camila Mendes",
      authorRole: "Editora Internacional",
      status: "published" as const,
      isHero: false,
      isBreaking: true,
      isFeatured: false,
      tags: ["Mundo", "Tecnologia", "Imprensa", "Redes Sociais"],
      publishedAt: hoursAgo(4),
    },
    {
      title:
        "Supercâmeras em 2026: comparativo testa sensores noturnos e zoom óptico nos novos flagships",
      subtitle:
        "Testes práticos em ambientes de baixa luminosidade revelam avanços expressivos em processamento computacional e fidelidade de cores.",
      content: `A nova geração de smartphones topo de linha trouxe saltos significativos em fotografia móvel, especialmente na captura noturna e na estabilização óptica para gravações em 4K a 60 quadros por segundo.\n\nEm testes comparativos realizados em Salvador durante o pôr do sol e em ruas históricas com iluminação mista, os sensores de 1 polegada reduziram o ruído digital em até 40% em comparação aos modelos do ano anterior.\n\nOutro destaque ficou por conta das lentes periscópicas com zoom óptico de 5x, capazes de preservar nitidez mesmo em retratos à distância sem perda perceptível de detalhes.\n\nEspecialistas lembram, porém, que o pós-processamento equilibrado — evitando saturação excessiva — segue sendo o principal divisor entre câmeras profissionais e registros automatizados.`,
      coverImage: "/images/news/mundo-cameras.jpg",
      coverAlt:
        "Comparativo de sistemas avançados de câmeras em smartphones flagship sobre bancada de estúdio",
      imageCaption: "Sensores maiores ampliam alcance dinâmico em fotos noturnas. Foto: TechLab",
      categoryId: categoryMap.get("mundo")!,
      authorName: "Thiago Nogueira",
      authorRole: "Colunista de Tecnologia",
      status: "published" as const,
      isHero: false,
      isBreaking: true,
      isFeatured: false,
      tags: ["Supercâmeras", "Smartphones", "Tecnologia", "Review"],
      publishedAt: hoursAgo(5),
    },
    {
      title:
        "Oeste da Bahia projeta safra recorde de grãos com avanço de agricultura de precisão",
      subtitle:
        "Municípios como Luís Eduardo Magalhães e Barreiras lideram investimentos em telemetria de colheitadeiras e irrigação sustentável.",
      content: `Produtores do Oeste baiano projetam um crescimento superior a 7% no volume total de grãos colhidos nesta temporada, impulsionados por condições climáticas regulares e pela adoção acelerada de ferramentas de agricultura de precisão.\n\nEm propriedades de Luís Eduardo Magalhães e Barreiras, sensores instalados nas colheitadeiras mapeiam em tempo real a produtividade por metro quadrado, permitindo ajuste fino na aplicação de fertilizantes e economia de insumos.\n\nSegundo levantamento das associações rurais do estado, o escoamento pela Ferrovia de Integração Oeste-Leste e pelos corredores rodoviários rumo ao Porto de Salvador deve bater recorde histórico neste semestre.\n\nO setor também amplia parcerias técnicas para preservação de nascentes do cerrado baiano.`,
      coverImage: "/images/news/agro-bahia.jpg",
      coverAlt:
        "Colheitadeira moderna realizando colheita em plantação dourada de soja no Oeste da Bahia",
      imageCaption: "Tecnologia no campo eleva produtividade no Oeste baiano. Foto: AgroBA",
      categoryId: categoryMap.get("agricultura")!,
      authorName: "Eduardo Carvalho",
      authorRole: "Editor de Agronegócio",
      status: "published" as const,
      isHero: false,
      isBreaking: false,
      isFeatured: false,
      tags: ["Agricultura", "Oeste Baiano", "Soja", "Safra"],
      publishedAt: hoursAgo(6),
    },
    {
      title:
        "Festival de Cultura e Economia Criativa leva programação gratuita ao Pelourinho neste fim de semana",
      subtitle:
        "Largo Tereza Batista e praças do Centro Histórico recebem apresentações musicais, feiras de artesanato e oficinas de gastronomia baiana.",
      content: `O Centro Histórico de Salvador será palco, entre sexta-feira e domingo, de mais uma edição do Festival de Cultura e Economia Criativa do Pelourinho, reunindo artistas independentes, mestres da percussão e coletivos de gastronomia regional.\n\nA programação inclui cortejos culturais a partir das 16h, exposições fotográficas em casarões restaurados e feira de economia solidária com mais de 60 empreendedores locais.\n\nDe acordo com a organização, a expectativa é atrair cerca de 35 mil visitantes ao longo dos três dias, fortalecendo a rede hoteleira, bares e restaurantes do Centro Antigo.\n\nO transporte público terá reforço de linhas noturnas saindo da Estação da Lapa e do Terminal da Barroquinha.`,
      coverImage: "/images/news/cultura-salvador.jpg",
      coverAlt:
        "Casarões coloniais coloridos do Pelourinho em Salvador com bandeirolas festivas sob luz dourada",
      imageCaption: "Centro Histórico recebe programação aberta ao público. Foto: Secult Divulgação",
      categoryId: categoryMap.get("cultura")!,
      authorName: "Ana Paula Lima",
      authorRole: "Repórter de Cultura",
      status: "published" as const,
      isHero: false,
      isBreaking: false,
      isFeatured: false,
      tags: ["Cultura", "Pelourinho", "Salvador", "Agenda Cultural"],
      publishedAt: hoursAgo(8),
    },
    {
      title:
        "Porto de Salvador registra alta de 14% na movimentação de contêineres e impulsiona exportações",
      subtitle:
        "Crescimento nos embarques de frutas, celulose e manufaturados consolida terminal baiano como hub estratégico do Nordeste.",
      content: `O Terminal de Contêineres do Porto de Salvador encerrou o trimestre com crescimento de 14% na movimentação de cargas em comparação ao mesmo período do ano passado, puxado pelas exportações do agronegócio e da indústria petroquímica.\n\nOs novos guindastes de grande porte e a ampliação da profundidade do canal de acesso permitiram a atracação simultânea de navios de maior capacidade, reduzindo o tempo médio de espera das embarcações.\n\nEconomistas avaliam que a eficiência portuária tem efeito multiplicador sobre a geração de empregos na logística, transporte rodoviário e serviços especializados na Região Metropolitana de Salvador.`,
      coverImage: "/images/news/economia-porto.jpg",
      coverAlt:
        "Terminal de contêineres do Porto de Salvador com navios cargueiros e guindastes ao entardecer",
      imageCaption: "Movimentação portuária impulsiona cadeias produtivas da Bahia. Foto: PortoBA",
      categoryId: categoryMap.get("economia")!,
      authorName: "Henrique Vasconcelos",
      authorRole: "Editor de Economia",
      status: "published" as const,
      isHero: false,
      isBreaking: false,
      isFeatured: false,
      tags: ["Economia", "Porto de Salvador", "Exportações", "Logística"],
      publishedAt: hoursAgo(10),
    },
    {
      title:
        "Operação integrada reforça policiamento preventivo e fiscalização nas rodovias baianas",
      subtitle:
        "Ação reúne efetivos especializados em pontos estratégicos da BR-324, BR-116 e vias litorâneas durante o fim de semana.",
      content: `As forças de segurança da Bahia iniciaram uma nova etapa da operação integrada de policiamento ostensivo e fiscalização viária nos principais corredores de acesso à capital e ao interior do estado.\n\nCom apoio de videomonitoramento e leitura automática de placas, as equipes atuam de forma coordenada na BR-324, na BR-116 e na Estrada do Coco para coibir roubos de carga, transporte irregular e infrações graves de trânsito.\n\nSegundo balanço preliminar divulgado pela coordenação da operação, os primeiros dois dias já registraram redução significativa nos índices de ocorrências na Região Metropolitana.\n\nMotoristas podem acionar os canais de emergência pelos telefones 190 e 191 em qualquer trecho monitorado.`,
      coverImage: "/images/news/policia-bahia.jpg",
      coverAlt:
        "Viatura policial estadual em patrulhamento preventivo em avenida costeira da Bahia ao anoitecer",
      imageCaption: "Efetivo atua com apoio de câmeras inteligentes nas rodovias. Foto: SSP-BA",
      categoryId: categoryMap.get("policia")!,
      authorName: "Marcos Vinicius",
      authorRole: "Setorista de Segurança",
      status: "published" as const,
      isHero: false,
      isBreaking: false,
      isFeatured: false,
      tags: ["Polícia", "Segurança", "BR-324", "Bahia"],
      publishedAt: hoursAgo(12),
    },
    {
      title:
        "Ocupação hoteleira em Salvador e Litoral Norte supera 82% com calendário de eventos e turismo",
      subtitle:
        "Fluxo de visitantes nacionais e voos internacionais aquecem diárias e geram novas vagas temporárias no setor de serviços.",
      content: `Levantamento da associação do setor hoteleiro aponta que a taxa média de ocupação em Salvador e nos resorts do Litoral Norte ultrapassou 82% neste mês, superando as projeções iniciais da temporada.\n\nO desempenho positivo é atribuído à ampliação da malha aérea no Aeroporto Internacional de Salvador e à agenda contínua de congressos corporativos, feiras e atrações culturais.\n\nEmpresários do ramo destacam que o turismo de negócios passou a preencher períodos tradicionalmente de menor demanda, garantindo maior estabilidade para trabalhadores do setor.`,
      coverImage: "/images/news/bahia-ferry.jpg",
      coverAlt:
        "Paisagem costeira de Salvador e Baía de Todos-os-Santos em tarde ensolarada",
      imageCaption: "Turismo corporativo e de lazer sustentam alta ocupação. Foto: Setur",
      categoryId: categoryMap.get("hotelaria")!,
      authorName: "Juliana Costa",
      authorRole: "Redação BA Infoco",
      status: "published" as const,
      isHero: false,
      isBreaking: false,
      isFeatured: false,
      tags: ["Hotelaria", "Turismo", "Salvador", "Litoral Norte"],
      publishedAt: hoursAgo(14),
    },
    {
      title:
        "Projeto de restauração da Mata Atlântica recupera mais de 400 hectares no Sul da Bahia",
      subtitle:
        "Iniciativa une produtores de cacau cabruca, pesquisadores universitários e corredores ecológicos para proteção da fauna nativa.",
      content: `Um consórcio ambiental formado por produtores rurais e institutos de pesquisa concluiu o plantio de 320 mil mudas nativas no Sul da Bahia, ampliando corredores ecológicos entre reservas de Mata Atlântica.\n\nO modelo combina conservação florestal com o cultivo tradicional de cacau no sistema cabruca, que mantém árvores de grande porte para sombreamento e preserva o habitat de espécies ameaçadas.\n\nAlém do ganho ambiental, o projeto certifica propriedades familiares para acesso a mercados internacionais com prêmio de sustentabilidade.`,
      coverImage: "/images/news/agro-bahia.jpg",
      coverAlt:
        "Paisagem agrícola sustentável no interior da Bahia sob céu azul",
      imageCaption: "Sistema cabruca concilia renda rural e preservação ambiental. Foto: Inema",
      categoryId: categoryMap.get("meio-ambiente")!,
      authorName: "Eduardo Carvalho",
      authorRole: "Editor de Sustentabilidade",
      status: "published" as const,
      isHero: false,
      isBreaking: false,
      isFeatured: false,
      tags: ["Meio Ambiente", "Mata Atlântica", "Sul da Bahia", "Cacau"],
      publishedAt: hoursAgo(18),
    },
    {
      title:
        "Campanha municipal de adoção responsável e vacinação animal abre novos postos em Salvador",
      subtitle:
        "Atendimento gratuito inclui microchipagem, avaliação veterinária e feira de adoção de cães e gatos neste sábado.",
      content: `Tutores de cães e gatos contarão com seis novos pontos itinerantes de vacinação antirrábica e cadastro gratuito para castração a partir deste fim de semana na capital baiana.\n\nA iniciativa também promove feiras de adoção responsável em parques públicos, com animais já vacinados, vermifugados e avaliados por médicos veterinários.\n\nPara adotar, o interessado deve apresentar documento de identidade com foto, comprovante de residência e passar por breve entrevista de orientação sobre guarda responsável.`,
      coverImage: "/images/news/cultura-salvador.jpg",
      coverAlt:
        "Espaço público arborizado em Salvador durante programação comunitária",
      imageCaption: "Feiras de adoção ocorrem em praças e parques da capital. Foto: Divulgação",
      categoryId: categoryMap.get("animais")!,
      authorName: "Mariana Oliveira",
      authorRole: "Redação BA Infoco",
      status: "published" as const,
      isHero: false,
      isBreaking: false,
      isFeatured: false,
      tags: ["Animais", "Adoção", "Salvador", "Bem-Estar"],
      publishedAt: hoursAgo(22),
    },
  ];

  // Semear artigos com visualizações iniciais realistas para popular "Mais Lidas"
  const initialViews = [18420, 14950, 11380, 9840, 8710, 7420, 6890, 6150, 5430, 4120, 3680, 2940];

  seedArticles.forEach((article, idx) => {
    const created = articleRepository.create(article);
    const views = initialViews[idx] ?? 1200;
    db.prepare("UPDATE articles SET views = ? WHERE id = ?").run(views, created.id);
  });

  hasCheckedSeed = true;
}

