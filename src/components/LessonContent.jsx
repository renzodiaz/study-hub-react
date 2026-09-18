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

const CodeBlock = ({ inline, className, children }) => {
  const text = String(children ?? '').replace(/\n$/, '');
  if (inline) {
    return (
      <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.85em] text-pink-700">
        {text}
      </code>
    );
  }
  const raw = /language-(\w+)/.exec(className || '')?.[1]?.toLowerCase();
  const language = LANGUAGE_ALIAS[raw] || raw;
  const highlight = language && SUPPORTED.has(language);

  return (
    <SyntaxHighlighter
      language={highlight ? language : undefined}
      style={oneLight}
      customStyle={{
        margin: 0,
        borderRadius: '0.5rem',
        fontSize: '0.85rem',
        background: '#f8fafc',
      }}
      codeTagProps={{ className: 'font-mono' }}
    >
      {text}
    </SyntaxHighlighter>
  );
};

// Element renderers — plain semantic HTML with lesson typography. No raw HTML
// from the source is ever rendered (react-markdown ignores it by default; we do
// not enable rehype-raw), so lesson content cannot inject scripts or handlers.
const COMPONENTS = {
  h1: (p) => <h2 className="mt-8 text-xl font-bold text-gray-900" {...p} />,
  h2: (p) => <h2 className="mt-8 text-lg font-bold text-gray-900" {...p} />,
  h3: (p) => (
    <h3 className="mt-6 text-base font-semibold text-gray-900" {...p} />
  ),
  p: (p) => <p className="mt-4 text-sm leading-7 text-gray-800" {...p} />,
  ul: (p) => (
    <ul
      className="mt-4 list-disc space-y-1 pl-6 text-sm text-gray-800"
      {...p}
    />
  ),
  ol: (p) => (
    <ol
      className="mt-4 list-decimal space-y-1 pl-6 text-sm text-gray-800"
      {...p}
    />
  ),
  li: (p) => <li className="leading-7" {...p} />,
  blockquote: (p) => (
    <blockquote
      className="mt-4 border-l-4 border-indigo-300 bg-indigo-50/50 py-2 pl-4 text-sm text-gray-700"
      {...p}
    />
  ),
  a: ({ href, ...rest }) => {
    const url = safeUrl(href);
    const external = /^https?:/i.test(url);
    return (
      <a
        href={url || undefined}
        className="font-medium text-indigo-600 underline hover:text-indigo-500"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      />
    );
  },
  pre: (p) => <div className="mt-4 overflow-x-auto" {...p} />,
  code: CodeBlock,
  table: (p) => (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...p} />
    </div>
  ),
  th: (p) => (
    <th
      className="border-b border-gray-300 px-3 py-2 text-left font-semibold"
      {...p}
    />
  ),
  td: (p) => <td className="border-b border-gray-100 px-3 py-2" {...p} />,
};

// Safe Markdown renderer for engineering lesson prose. Raw HTML is disabled and
// dangerous URLs are stripped, so content from imports or admin authoring can
// never execute script or inject markup.
export default function LessonContent({ markdown }) {
  return (
    <div className="lesson-content">
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
