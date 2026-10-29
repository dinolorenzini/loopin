import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Fast client-side syntax tokenization
  const highlightCode = (rawCode: string) => {
    const lines = rawCode.split("\n");
    return lines.map((line, lineIdx) => {
      // Tokenize line with regex
      const tokenRegex = /(\/\/.*$|#.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:const|let|var|function|return|if|else|for|while|import|from|export|default|class|interface|type|async|await|new|try|catch|throw|def|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|JOIN|AND|OR)\b)|(\b(?:true|false|null|undefined|nil)\b)|(\b\d+(?:\.\d+)?\b)|([{}()[\],;.])/g;

      const elements: React.ReactNode[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = tokenRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          elements.push(line.slice(lastIndex, match.index));
        }

        const [full, comment, str, keyword, bool, num, punct] = match;

        if (comment) {
          elements.push(<span key={match.index} className="tok-comment">{comment}</span>);
        } else if (str) {
          elements.push(<span key={match.index} className="tok-string">{str}</span>);
        } else if (keyword) {
          elements.push(<span key={match.index} className="tok-keyword">{keyword}</span>);
        } else if (bool) {
          elements.push(<span key={match.index} className="tok-boolean">{bool}</span>);
        } else if (num) {
          elements.push(<span key={match.index} className="tok-number">{num}</span>);
        } else if (punct) {
          elements.push(<span key={match.index} className="tok-punct">{punct}</span>);
        }

        lastIndex = tokenRegex.lastIndex;
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
  };

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-block-lang">{language || "code"}</span>
        <button
          type="button"
          className="code-copy-btn"
          onClick={handleCopy}
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
        <code>{highlightCode(code)}</code>
      </pre>
    </div>
  );
};

export const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  // Split by code blocks first: ```lang\ncode\n```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  let blockId = 0;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = content.slice(lastIndex, match.index);
      parts.push(<span key={`text-${blockId++}`}>{renderInlineMarkdown(textChunk)}</span>);
    }

    const lang = match[1]?.trim() || "code";
    const code = match[2]?.replace(/\n$/, "") || "";
    parts.push(<CodeBlock key={`cb-${blockId++}`} language={lang} code={code} />);

    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={`text-${blockId++}`}>{renderInlineMarkdown(content.slice(lastIndex))}</span>);
  }

  return <div className="markdown-content">{parts}</div>;
};

function renderInlineMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");

  return lines.map((line, lineIdx) => {
    // Check blockquote
    const isQuote = line.startsWith("> ");
    const lineText = isQuote ? line.slice(2) : line;

    // Tokenize inline markdown: `code`, **bold**, *italic*, ~~strike~~, [title](url), bare URLs
    const inlineRegex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(~~[^~]+~~)|(\[(?:[^\]]+)\]\((?:https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s]+)/g;

    const lineElements: React.ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;

    let elemKey = 0;
    while ((m = inlineRegex.exec(lineText)) !== null) {
      if (m.index > last) {
        lineElements.push(lineText.slice(last, m.index));
      }

      const [full, inlineCode, bold, italic, strike, link, url] = m;

      if (inlineCode) {
        lineElements.push(
          <code key={elemKey++} className="inline-code">
            {inlineCode.slice(1, -1)}
          </code>
        );
      } else if (bold) {
        lineElements.push(
          <strong key={elemKey++} className="md-bold">
            {bold.slice(2, -2)}
          </strong>
        );
      } else if (italic) {
        lineElements.push(
          <em key={elemKey++} className="md-italic">
            {italic.slice(1, -1)}
          </em>
        );
      } else if (strike) {
        lineElements.push(
          <del key={elemKey++} className="md-strike">
            {strike.slice(2, -2)}
          </del>
        );
      } else if (link) {
        const linkMatch = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(link);
        if (linkMatch) {
          lineElements.push(
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
        }
      } else if (url) {
        lineElements.push(
          <a
            key={elemKey++}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="md-link"
          >
            {url}
          </a>
        );
      }

      last = inlineRegex.lastIndex;
    }

    if (last < lineText.length) {
      lineElements.push(lineText.slice(last));
    }

    if (isQuote) {
      return (
        <blockquote key={lineIdx} className="md-blockquote">
          {lineElements}
        </blockquote>
      );
    }

    return (
      <React.Fragment key={lineIdx}>
        {lineElements}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}
