import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';

// Only the languages Study Hub's engineering lessons need are registered, so we
// never ship the full grammar set. Unknown languages fall through to a plain
// (unhighlighted) code block.
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('markup', markup);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);

const LANGUAGE_ALIAS = {
  js: 'javascript',
  ts: 'typescript',
  html: 'markup',
  xml: 'markup',
  sh: 'bash',
  shell: 'bash',
};
const SUPPORTED = new Set([
  'bash',
  'css',
  'javascript',
  'json',
  'jsx',
  'markup',
  'tsx',
  'typescript',
]);

// Allow only safe URL schemes. react-markdown already strips dangerous URLs, but
// we constrain further (http/https/mailto or same-document/relative) as defense
// in depth so a javascript:/data: link can never render as an href.
const safeUrl = (url) => {
  if (!url) return '';
  const value = String(url).trim();
  if (/^(https?:|mailto:)/i.test(value)) return value;
  // Relative / same-page links (no scheme) are fine.
  if (/^[./#?]/.test(value) || !/^[a-z][a-z0-9+.-]*:/i.test(value))
    return value;
  return ''; // any other scheme (javascript:, data:, vbscript:, …) is dropped
};

// react-markdown v9 renders INLINE code as a bare <code> (no <pre> wrapper) and
// FENCED/BLOCK code as <pre><code class="language-x">…</code></pre>. v9 dropped
// the old `inline` flag, so responsibilities are split by element:
//   • `code` → inline only: a styled <code> that stays inside its sentence.
//   • `pre`  → the sole block renderer: it reads the language + text from its
//     child <code> and emits one highlighted block. Because this is the only
//     place we emit a highlighted block, a <pre> can never nest inside a <p>
//     (which is invalid HTML and triggers a hydration error).
const InlineCode = ({ children }) => (
  <code className="rounded-chip bg-surface-code px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
    {children}
  </code>
);

const CodeBlock = ({ children }) => {
  const codeEl = Array.isArray(children) ? children[0] : children;
  const className = codeEl?.props?.className || '';
  const text = String(codeEl?.props?.children ?? '').replace(/\n$/, '');
  const raw = /language-(\w+)/.exec(className)?.[1]?.toLowerCase();
  const language = LANGUAGE_ALIAS[raw] || raw;
  const highlight = language && SUPPORTED.has(language);

  return (
    <div className="mt-4 overflow-x-auto rounded-card border border-line">
      <SyntaxHighlighter
        language={highlight ? language : undefined}
        style={oneLight}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.8125rem',
          lineHeight: 1.7,
          background: '#f5f4f1',
        }}
        codeTagProps={{ className: 'font-mono' }}
      >
        {text}
      </SyntaxHighlighter>
    </div>
  );
};

// Element renderers — plain semantic HTML with lesson typography. No raw HTML
// from the source is ever rendered (react-markdown ignores it by default; we do
// not enable rehype-raw), so lesson content cannot inject scripts or handlers.
// Headings use the interface face (Plex Sans); prose, lists and quotes use the
// reading face (Literata) at the lesson-prose size. Code stays monospace.
const COMPONENTS = {
  h1: (p) => (
    <h2 className="mt-8 font-sans text-section font-semibold text-ink" {...p} />
  ),
  h2: (p) => (
    <h2 className="mt-8 font-sans text-section font-semibold text-ink" {...p} />
  ),
  h3: (p) => (
    <h3 className="mt-6 font-sans text-card font-semibold text-ink" {...p} />
  ),
  p: (p) => <p className="mt-4 font-serif text-prose text-ink" {...p} />,
  ul: (p) => (
    <ul
      className="mt-4 list-disc space-y-1 pl-6 font-serif text-prose text-ink"
      {...p}
    />
  ),
  ol: (p) => (
    <ol
      className="mt-4 list-decimal space-y-1 pl-6 font-serif text-prose text-ink"
      {...p}
    />
  ),
  li: (p) => <li className="leading-[1.75]" {...p} />,
  blockquote: (p) => (
    <blockquote
      className="mt-4 border-l-4 border-primary bg-surface-sunken py-3 pl-4 pr-3 font-serif text-prose text-ink-secondary"
      {...p}
    />
  ),
  a: ({ href, ...rest }) => {
    const url = safeUrl(href);
    const external = /^https?:/i.test(url);
    return (
      <a
        href={url || undefined}
        className="font-medium text-primary underline hover:text-primary-hover"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      />
    );
  },
  pre: CodeBlock,
  code: InlineCode,
  table: (p) => (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-body" {...p} />
    </div>
  ),
  th: (p) => (
    <th
      className="border-b border-line-strong px-3 py-2 text-left font-semibold text-ink"
      {...p}
    />
  ),
  td: (p) => (
    <td className="border-b border-line px-3 py-2 text-ink-secondary" {...p} />
  ),
};

// Safe Markdown renderer for engineering lesson prose. Raw HTML is disabled and
// dangerous URLs are stripped, so content from imports or admin authoring can
// never execute script or inject markup.
export default function LessonContent({ markdown }) {
  return (
    // Constrain prose to a comfortable reading measure (~68ch) and drop the
    // leading top margin so the first heading sits flush with the card.
    <div className="lesson-content max-w-[68ch] [&>*:first-child]:mt-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={safeUrl}
        components={COMPONENTS}
      >
        {markdown ?? ''}
      </ReactMarkdown>
    </div>
  );
}
