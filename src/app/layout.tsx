import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

// Titulo: grotesca contemporanea, com desenho proprio nos terminais.
const headline = Bricolage_Grotesque({
  variable: "--font-headline",
  subsets: ["latin"],
  display: "swap",
});

// Corpo: humanista de traco tecnico. A Atkinson resolvia legibilidade mas o
// desenho dela — muito aberto, terminais retos, altura-x enorme — nao encosta
// na Bricolage: em texto corrido o paragrafo ficava frouxo e infantil.
//
// A Plex Sans mantem o motivo funcional que levou a Atkinson (o `l` tem cauda,
// o `1` tem base e bandeira, o `0` e estreito — "Art. 10, I" e "Lei 8.742/1993"
// continuam sem ambiguidade) e ganha o que faltava: cor de paragrafo firme em
// 15-16px, que e o tamanho em que o enunciado vive. E foi desenhada para texto
// institucional denso, que e exatamente o material aqui.
const body = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Dado: cronometro, porcentagem, numero de questao e de artigo.
// Mono da mesma superfamilia do corpo: o numero dentro da frase troca de
// familia sem trocar de voz. A JetBrains destoava — desenho de editor de
// codigo numa interface que quer parecer documento.
const monoData = IBM_Plex_Mono({
  variable: "--font-mono-data",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gabarix",
  description: "Plataforma de estudos para concursos — treino, simulados, flashcards e revisão espaçada.",
};

// Aplica o tema salvo ANTES da pintura para evitar flash (FOUC). Padrao: papel.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t='light';}document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(t);}catch(e){document.documentElement.classList.add('light');}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${headline.variable} ${body.variable} ${monoData.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
