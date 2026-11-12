import * as React from "react";
import { createHighlighterCore } from "shiki/core";
import type { GrammarState, HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

// Add the languages you need. Each one loads the first time it is used.
const languages = {
  bash: async () => await import("shiki/langs/shellscript.mjs"),
  css: async () => await import("shiki/langs/css.mjs"),
  diff: async () => await import("shiki/langs/diff.mjs"),
  html: async () => await import("shiki/langs/html.mjs"),
  javascript: async () => await import("shiki/langs/javascript.mjs"),
  json: async () => await import("shiki/langs/json.mjs"),
  jsx: async () => await import("shiki/langs/jsx.mjs"),
  markdown: async () => await import("shiki/langs/markdown.mjs"),
  python: async () => await import("shiki/langs/python.mjs"),
  sql: async () => await import("shiki/langs/sql.mjs"),
  tsx: async () => await import("shiki/langs/tsx.mjs"),
  typescript: async () => await import("shiki/langs/typescript.mjs"),
  yaml: async () => await import("shiki/langs/yaml.mjs"),
};

const aliases: Record<string, keyof typeof languages> = {
  js: "javascript",
  md: "markdown",
  py: "python",
  sh: "bash",
  shell: "bash",
  shellscript: "bash",
  ts: "typescript",
  yml: "yaml",
  zsh: "bash",
};

let highlighterPromise: Promise<HighlighterCore> | undefined;

async function getHighlighter() {
  highlighterPromise ??= createHighlighterCore({
    engine: createJavaScriptRegexEngine({ forgiving: true }),
    langs: [],
    themes: [
      import("shiki/themes/github-light.mjs"),
      import("shiki/themes/github-dark.mjs"),
    ],
  });

  return await highlighterPromise;
}

function isLanguage(name: string): name is keyof typeof languages {
  return name in languages;
}

function getLanguage(language: string) {
  const name = language.toLowerCase();

  if (name === "ansi") {
    return name;
  }

  if (isLanguage(name)) {
    return name;
  }

  return aliases[name] ?? null;
}

// Loads a language and returns a highlighter for it, or null for a language
// that is not listed.
export async function loadHighlighter(language: string) {
  const lang = getLanguage(language);

  if (!lang) {
    return null;
  }

  const shiki = await getHighlighter();

  if (lang !== "ansi" && !shiki.getLoadedLanguages().includes(lang)) {
    await shiki.loadLanguage(languages[lang]);
  }

  return {
    // Returns one React node per line, and the grammar state after the last
    // line. Pass that state back to continue where the code left off.
    highlight(code: string, state?: GrammarState) {
      const tokenize = (text: string) =>
        shiki.codeToTokens(text, {
          defaultColor: false,
          grammarState: state,
          lang,
          themes: { dark: "github-dark", light: "github-light" },
        }).tokens;

      // ANSI has no grammar state, so each line is tokenized on its own and
      // gets the same colors whether it arrives in one piece or streams.
      const tokens =
        lang === "ansi"
          ? code.split("\n").flatMap((line) => tokenize(line))
          : tokenize(code);

      return {
        lines: tokens.map((line) =>
          line.map((token, index) => (
            <span
              key={index}
              style={{ ...token.htmlStyle }}
              className="text-(--shiki-light) dark:text-(--shiki-dark)"
            >
              {token.content}
            </span>
          ))
        ),
        state: shiki.getLastGrammarState(tokens),
      };
    },
  };
}

// Returns one React node per line, or null for a language that is not listed.
export async function highlightCode(code: string, language: string) {
  const highlighter = await loadHighlighter(language);

  return highlighter ? highlighter.highlight(code).lines : null;
}
