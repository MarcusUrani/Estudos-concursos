-- CreateTable
CREATE TABLE "TemaRedacao" (
    "id" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "comando" TEXT NOT NULL,
    "banca" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concursoId" TEXT,
    "autorId" TEXT,

    CONSTRAINT "TemaRedacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextoApoio" (
    "id" TEXT NOT NULL,
    "trecho" TEXT NOT NULL,
    "veiculo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "conferido" BOOLEAN NOT NULL DEFAULT false,
    "temaId" TEXT NOT NULL,

    CONSTRAINT "TextoApoio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redacao" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "palavras" INTEGER NOT NULL DEFAULT 0,
    "enviadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "corrigidaEm" TIMESTAMP(3),
    "total" INTEGER,
    "resumo" TEXT,
    "pontosFortes" TEXT,
    "aMelhorar" TEXT,
    "userId" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,

    CONSTRAINT "Redacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetenciaNota" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "redacaoId" TEXT NOT NULL,

    CONSTRAINT "CompetenciaNota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemaRedacao_concursoId_idx" ON "TemaRedacao"("concursoId");

-- CreateIndex
CREATE INDEX "TextoApoio_temaId_idx" ON "TextoApoio"("temaId");

-- CreateIndex
CREATE INDEX "Redacao_userId_idx" ON "Redacao"("userId");

-- CreateIndex
CREATE INDEX "Redacao_temaId_idx" ON "Redacao"("temaId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetenciaNota_redacaoId_numero_key" ON "CompetenciaNota"("redacaoId", "numero");

-- AddForeignKey
ALTER TABLE "TemaRedacao" ADD CONSTRAINT "TemaRedacao_concursoId_fkey" FOREIGN KEY ("concursoId") REFERENCES "Concurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemaRedacao" ADD CONSTRAINT "TemaRedacao_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextoApoio" ADD CONSTRAINT "TextoApoio_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "TemaRedacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redacao" ADD CONSTRAINT "Redacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redacao" ADD CONSTRAINT "Redacao_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "TemaRedacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetenciaNota" ADD CONSTRAINT "CompetenciaNota_redacaoId_fkey" FOREIGN KEY ("redacaoId") REFERENCES "Redacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

