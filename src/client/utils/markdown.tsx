import React, { useState, useMemo } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language: string;
  code: string;
}

// Supported languages for targeted, low-overhead syntax highlighting
type SupportedLang =
  | "javascript"
  | "typescript"
  | "python"
  | "html"
  | "css"
  | "json"
  | "sql"
  | "bash"
  | "rust"
  | "go"
  | "cpp";

const LANGUAGE_ALIASES: Record<string, SupportedLang> = {
  javascript: "javascript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  typescript: "typescript",
  ts: "typescript",
  tsx: "typescript",
  python: "python",
  py: "python",
  html: "html",
  htm: "html",
  xml: "html",
  svg: "html",
  css: "css",
  scss: "css",
  sass: "css",
  less: "css",
  json: "json",
  sql: "sql",
  bash: "bash",
  sh: "bash",
  zsh: "bash",
  shell: "bash",
  rust: "rust",
  rs: "rust",
  go: "go",
  golang: "go",
  c: "cpp",
  cpp: "cpp",
  "c++": "cpp",
  h: "cpp",
  hpp: "cpp",
};

// Pre-compiled fast regexes per language family for minimal GC and high low-end device performance
const JS_TOKEN_REGEX =
  /(\/\/.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:const|let|var|function|return|if|else|for|while|import|from|export|default|class|interface|type|async|await|new|try|catch|finally|throw|yield|switch|case|break|continue|typeof|instanceof|void|extends|implements)\b)|(\b(?:true|false|null|undefined|NaN)\b)|(\b\d+(?:\.\d+)?\b)|([{}()[\],;.:?+\-*/%!=<>|&^~])/g;

const CPP_TOKEN_REGEX =
  /(#\s*\w+.*$|\/\/.*$|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b(?:int|float|double|char|void|bool|auto|long|short|unsigned|signed|size_t|uint32_t|int32_t|uint64_t|int64_t|std|string|vector|map|cout|cin|cerr|endl)\b)|(\b(?:if|else|for|while|do|switch|case|default|break|continue|return|goto|try|catch|throw|new|delete|sizeof|typedef|struct|class|union|enum|namespace|using|template|typename|public|private|protected|virtual|override|final|constexpr|const|static|inline|explicit|friend|operator)\b)|(\b(?:true|false|nullptr|NULL)\b)|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[fFulL]*\b)|([{}()[\],;.:?+\-*/%!=<>|&^~#])/g;

const RUST_TOKEN_REGEX =
  /(\/\/.*$|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b(?:fn|let|mut|struct|enum|impl|trait|pub|use|mod|crate|return|if|else|match|loop|while|for|in|break|continue|type|const|static|async|await|unsafe|as|where)\b)|(\b(?:i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize|f32|f64|bool|char|str|String|Vec|Option|Result|Some|None|Ok|Err)\b)|(\b(?:true|false)\b)|(\b\d+(?:\.\d+)?\b)|([{}()[\],;.:?+\-*/%!=<>|&^~#])/g;

const PY_TOKEN_REGEX =
  /(#.*$)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b(?:def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|lambda|yield|pass|break|continue|in|is|not|and|or|global|nonlocal|async|await)\b)|(\b(?:True|False|None)\b)|(\b\d+(?:\.\d+)?\b)|([{}()[\],;.:?+\-*/%!=<>|&^~])/g;

const SQL_TOKEN_REGEX =
  (/(--.*$)|('(?:''|[^'])*')|(\b(?:SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|ADD|JOIN|INNER|LEFT|RIGHT|OUTER|ON|AND|OR|NOT|NULL|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|AS|IN|EXISTS|BETWEEN|LIKE|UNION|ALL|PRIMARY|KEY|DEFAULT|INDEX|VIEW)\b)|(\b(?:TRUE|FALSE|NULL)\b)|(\b\d+(?:\.\d+)?\b)|([(),;.*=<>!+-])/gi);

const HTML_TOKEN_REGEX =
  /(<!--[\s\S]*?-->)|(<!DOCTYPE[^>]*>)|(<\/?[a-zA-Z0-9_-]+)|(\s+[a-zA-Z0-9_:-]+(?==))|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\/?>)|([=])/g;

const CSS_TOKEN_REGEX =
  /(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|([.#]?[a-zA-Z0-9_-]+(?=\s*\{))|([a-zA-Z0-9_-]+(?=\s*:))|(:root|@media|@keyframes|@import)|(#[a-fA-F0-9]{3,8}|\b\d+(?:px|em|rem|%|vh|vw|s|ms|deg)?\b)|([{}();:,])/g;

const JSON_TOKEN_REGEX =
  /("(?:\\.|[^"\\])*"(?=\s*:))|("(?:\\.|[^"\\])*")|(\b(?:true|false|null)\b)|(\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|([{}[\],:])/g;

const BASH_TOKEN_REGEX =
  /(#.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\$[a-zA-Z0-9_]+|\$\{[^}]+\})|(\b(?:echo|cd|ls|cat|grep|mkdir|rm|chmod|chown|curl|wget|npm|npx|pnpm|git|docker|node|bun|python|cargo|go)\b)|(\b\d+\b)|([|&;<>()`])/g;

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const rawLang = (language || "").trim().toLowerCase();
  const normalizedLang = LANGUAGE_ALIASES[rawLang];

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = code;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Memoized tokenization: fast fallback to plain monospace if language is unknown
  const renderedLines = useMemo(() => {
    const lines = code.split("\n");

    // Fall back to plain monospace when language is unknown or unsupported
    if (!normalizedLang) {
      return lines.map((line, lineIdx) => (
        <div key={lineIdx} className="code-line">
          <span className="code-line-number">{lineIdx + 1}</span>
          <span className="code-line-content">{line || " "}</span>
        </div>
      ));
    }

    // Language-specific fast token regex
    let activeRegex: RegExp;
    switch (normalizedLang) {
      case "javascript":
      case "typescript":
      case "go":
        activeRegex = JS_TOKEN_REGEX;
        break;
      case "cpp":
        activeRegex = CPP_TOKEN_REGEX;
        break;
      case "rust":
        activeRegex = RUST_TOKEN_REGEX;
        break;
      case "python":
        activeRegex = PY_TOKEN_REGEX;
        break;
      case "sql":
        activeRegex = SQL_TOKEN_REGEX;
        break;
      case "html":
        activeRegex = HTML_TOKEN_REGEX;
        break;
      case "css":
        activeRegex = CSS_TOKEN_REGEX;
        break;
      case "json":
        activeRegex = JSON_TOKEN_REGEX;
        break;
      case "bash":
        activeRegex = BASH_TOKEN_REGEX;
        break;
      default:
        activeRegex = JS_TOKEN_REGEX;
    }

    return lines.map((line, lineIdx) => {
      activeRegex.lastIndex = 0;
      const elements: React.ReactNode[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = activeRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          elements.push(line.slice(lastIndex, match.index));
        }

        let tokenClass = "";
        const m = match;

        if (normalizedLang === "cpp") {
          const [, comment, str, type, kw, bool, num, punct] = m;
          if (comment) tokenClass = "tok-comment";
          else if (str) tokenClass = "tok-string";
          else if (type) tokenClass = "tok-type";
          else if (kw) tokenClass = "tok-keyword";
          else if (bool) tokenClass = "tok-boolean";
          else if (num) tokenClass = "tok-number";
          else if (punct) tokenClass = "tok-punct";
        } else if (normalizedLang === "rust") {
          const [, comment, str, kw, type, bool, num, punct] = m;
          if (comment) tokenClass = "tok-comment";
          else if (str) tokenClass = "tok-string";
          else if (kw) tokenClass = "tok-keyword";
          else if (type) tokenClass = "tok-type";
          else if (bool) tokenClass = "tok-boolean";
          else if (num) tokenClass = "tok-number";
          else if (punct) tokenClass = "tok-punct";
        } else if (normalizedLang === "html") {
          const [, comment, doctype, tag, attr, str, close, punct] = m;
          if (comment) tokenClass = "tok-comment";
          else if (doctype) tokenClass = "tok-keyword";
          else if (tag || close) tokenClass = "tok-tag";
          else if (attr) tokenClass = "tok-attr";
          else if (str) tokenClass = "tok-string";
          else if (punct) tokenClass = "tok-punct";
        } else if (normalizedLang === "css") {
          const [, comment, str, sel, prop, atRule, val, punct] = m;
          if (comment) tokenClass = "tok-comment";
          else if (str) tokenClass = "tok-string";
          else if (sel || atRule) tokenClass = "tok-keyword";
          else if (prop) tokenClass = "tok-type";
          else if (val) tokenClass = "tok-number";
          else if (punct) tokenClass = "tok-punct";
        } else if (normalizedLang === "json") {
          const [, key, str, bool, num, punct] = m;
          if (key) tokenClass = "tok-type";
          else if (str) tokenClass = "tok-string";
          else if (bool) tokenClass = "tok-boolean";
          else if (num) tokenClass = "tok-number";
          else if (punct) tokenClass = "tok-punct";
        } else if (normalizedLang === "bash") {
          const [, comment, str, variable, cmd, num, punct] = m;
          if (comment) tokenClass = "tok-comment";
          else if (str) tokenClass = "tok-string";
          else if (variable) tokenClass = "tok-type";
          else if (cmd) tokenClass = "tok-keyword";
          else if (num) tokenClass = "tok-number";
          else if (punct) tokenClass = "tok-punct";
        } else {
          // Default: JS, TS, Python, SQL, Go
          const [, comment, str, kw, bool, num, punct] = m;
          if (comment) tokenClass = "tok-comment";
          else if (str) tokenClass = "tok-string";
          else if (kw) tokenClass = "tok-keyword";
          else if (bool) tokenClass = "tok-boolean";
          else if (num) tokenClass = "tok-number";
          else if (punct) tokenClass = "tok-punct";
        }

        if (tokenClass) {
          elements.push(
            <span key={match.index} className={tokenClass}>
              {match[0]}
            </span>
          );
        } else {
          elements.push(match[0]);
        }

        lastIndex = activeRegex.lastIndex;
      }

      if (lastIndex < line.length) {
        elements.push(line.slice(lastIndex));
      }

      return (
        <div key={lineIdx} className="code-line">
          <span className="code-line-number">{lineIdx + 1}</span>
          <span className="code-line-content">{elements.length > 0 ? elements : " "}</span>
        </div>
      );
    });
  }, [code, normalizedLang]);

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-block-lang">{rawLang || "code"}</span>
        <button
          type="button"
          className="code-copy-btn"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-block-pre">
        <code>{renderedLines}</code>
      </pre>
    </div>
  );
};

// Safe link protocol verification for strict XSS prevention
function isSafeUrl(url: string): boolean {
  try {
    const trimmed = url.trim();
    if (!trimmed) return false;
    // Allow relative paths or http/https protocols only
    if (/^https?:\/\//i.test(trimmed)) {
      const parsed = new URL(trimmed);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Parses inline markdown:
 * `code`, **bold**, *italic*, ~~strikethrough~~, [label](url), bare URLs
 */
function formatUrlDisplay(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return `${parsed.hostname}…`;
  } catch {
    return rawUrl.length > 28 ? `${rawUrl.slice(0, 26)}…` : rawUrl;
  }
}

export function renderInlineMarkdown(text: string): React.ReactNode {
  const inlineRegex =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(~~[^~]+~~)|(\[(?:[^\]]+)\]\((?:https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s]+)/g;

  const elements: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let elemKey = 0;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > last) {
      elements.push(text.slice(last, match.index));
    }

    const [, inlineCode, bold, italic, strike, markdownLink, bareUrl] = match;

    if (inlineCode) {
      elements.push(
        <code key={elemKey++} className="inline-code">
          {inlineCode.slice(1, -1)}
        </code>
      );
    } else if (bold) {
      elements.push(
        <strong key={elemKey++} className="md-bold">
          {bold.slice(2, -2)}
        </strong>
      );
    } else if (italic) {
      elements.push(
        <em key={elemKey++} className="md-italic">
          {italic.slice(1, -1)}
        </em>
      );
    } else if (strike) {
      elements.push(
        <del key={elemKey++} className="md-strike">
          {strike.slice(2, -2)}
        </del>
      );
    } else if (markdownLink) {
      const linkMatch = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(markdownLink);
      if (linkMatch && isSafeUrl(linkMatch[2])) {
        elements.push(
          <a
            key={elemKey++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="md-link"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        elements.push(markdownLink);
      }
    } else if (bareUrl) {
      if (isSafeUrl(bareUrl)) {
        elements.push(
          <a
            key={elemKey++}
            href={bareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="md-link"
            title={bareUrl}
          >
            {formatUrlDisplay(bareUrl)}
          </a>
        );
      } else {
        elements.push(bareUrl);
      }
    }

    last = inlineRegex.lastIndex;
  }

  if (last < text.length) {
    elements.push(text.slice(last));
  }

  return elements.length > 0 ? elements : text;
}

/**
 * Line-by-line block markdown renderer:
 * - Headings: # H1, ## H2, ### H3
 * - Discord-style subtext: -# subtext
 * - Blockquotes: > quote
 * - Lists: - item, * item, 1. item
 */
function renderBlockMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const renderedBlocks: React.ReactNode[] = [];
  let blockKey = 0;

  let currentListType: "ul" | "ol" | null = null;
  let currentListItems: React.ReactNode[] = [];

  const flushList = () => {
    if (currentListType && currentListItems.length > 0) {
      if (currentListType === "ul") {
        renderedBlocks.push(
          <ul key={`list-${blockKey++}`} className="md-ul">
            {currentListItems}
          </ul>
        );
      } else {
        renderedBlocks.push(
          <ol key={`list-${blockKey++}`} className="md-ol">
            {currentListItems}
          </ol>
        );
      }
      currentListType = null;
      currentListItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Headings (# H1, ## H2, ### H3)
    const h1Match = /^#\s+(.+)$/.exec(line);
    const h2Match = /^##\s+(.+)$/.exec(line);
    const h3Match = /^###\s+(.+)$/.exec(line);

    if (h1Match) {
      flushList();
      renderedBlocks.push(
        <h1 key={`h1-${blockKey++}`} className="md-h1">
          {renderInlineMarkdown(h1Match[1])}
        </h1>
      );
      continue;
    }

    if (h2Match) {
      flushList();
      renderedBlocks.push(
        <h2 key={`h2-${blockKey++}`} className="md-h2">
          {renderInlineMarkdown(h2Match[1])}
        </h2>
      );
      continue;
    }

    if (h3Match) {
      flushList();
      renderedBlocks.push(
        <h3 key={`h3-${blockKey++}`} className="md-h3">
          {renderInlineMarkdown(h3Match[1])}
        </h3>
      );
      continue;
    }

    // 2. Discord-style subtext (-# text)
    const subtextMatch = /^-#\s+(.+)$/.exec(line);
    if (subtextMatch) {
      flushList();
      renderedBlocks.push(
        <div key={`subtext-${blockKey++}`} className="md-subtext">
          {renderInlineMarkdown(subtextMatch[1])}
        </div>
      );
      continue;
    }

    // 3. Blockquote (> text)
    const quoteMatch = /^>\s+(.+)$/.exec(line);
    if (quoteMatch) {
      flushList();
      renderedBlocks.push(
        <blockquote key={`quote-${blockKey++}`} className="md-blockquote">
          {renderInlineMarkdown(quoteMatch[1])}
        </blockquote>
      );
      continue;
    }

    // 4. Unordered List (- item or * item)
    const ulMatch = /^[-*]\s+(.+)$/.exec(line);
    if (ulMatch) {
      if (currentListType !== "ul") {
        flushList();
        currentListType = "ul";
      }
      currentListItems.push(
        <li key={`li-${currentListItems.length}`} className="md-li">
          {renderInlineMarkdown(ulMatch[1])}
        </li>
      );
      continue;
    }

    // 5. Ordered List (1. item)
    const olMatch = /^\d+\.\s+(.+)$/.exec(line);
    if (olMatch) {
      if (currentListType !== "ol") {
        flushList();
        currentListType = "ol";
      }
      currentListItems.push(
        <li key={`li-${currentListItems.length}`} className="md-li">
          {renderInlineMarkdown(olMatch[1])}
        </li>
      );
      continue;
    }

    // Normal line
    flushList();

    if (line.trim() === "") {
      renderedBlocks.push(<div key={`empty-${blockKey++}`} className="md-line-break" />);
    } else {
      renderedBlocks.push(
        <div key={`line-${blockKey++}`} className="md-paragraph">
          {renderInlineMarkdown(line)}
        </div>
      );
    }
  }

  flushList();
  return renderedBlocks;
}

export const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  // Split by code blocks: ```lang\ncode\n```
  // Tolerates spaces after language tag and handles CRLF or LF
  const codeBlockRegex = /```([a-zA-Z0-9_#+.-]*)[^\S\r\n]*(?:\r?\n)([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let blockId = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = content.slice(lastIndex, match.index);
      parts.push(<div key={`text-${blockId++}`} className="md-block-wrapper">{renderBlockMarkdown(textChunk)}</div>);
    }

    const lang = match[1]?.trim() || "code";
    const code = match[2]?.replace(/\r?\n$/, "") || "";
    parts.push(<CodeBlock key={`cb-${blockId++}`} language={lang} code={code} />);

    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    const textChunk = content.slice(lastIndex);
    parts.push(<div key={`text-${blockId++}`} className="md-block-wrapper">{renderBlockMarkdown(textChunk)}</div>);
  }

  return <div className="markdown-content">{parts}</div>;
};
