import { render, screen, within } from '@testing-library/react';

import LessonContent from './LessonContent';

const renderMd = (markdown) => render(<LessonContent markdown={markdown} />);

describe('LessonContent — formatting', () => {
  it('renders headings, paragraphs, and lists as semantic elements', () => {
    renderMd('# Title\n\nA paragraph.\n\n- one\n- two\n\n1. first\n2. second');
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByText('A paragraph.')).toBeInTheDocument();
    expect(screen.getAllByRole('list')).toHaveLength(2); // ul + ol
    expect(screen.getByText('one')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
  });

  it('renders inline code and fenced JavaScript/TypeScript code blocks', () => {
    const { container } = renderMd(
      'Use `const` here.\n\n```js\nconst x = 1;\n```\n\n```typescript\nconst y: number = 2;\n```',
    );
    // Inline code renders as a styled <code> containing exactly "const".
    const inline = Array.from(container.querySelectorAll('code')).find(
      (el) => el.textContent === 'const',
    );
    expect(inline).toBeTruthy();
    // Highlighted code splits into spans; assert the source text is present.
    expect(container.textContent).toContain('const x = 1;');
    expect(container.textContent).toContain('const y: number = 2;');
  });

  // Regression: react-markdown v9 dropped the `inline` flag, so inline code was
  // being rendered as a block <pre> INSIDE the paragraph — invalid HTML that broke
  // the reading flow and triggered React hydration errors.
  describe('inline vs block code (valid, non-nesting HTML)', () => {
    it('keeps a single inline-code fragment inline, not a <pre>', () => {
      const { container } = renderMd('This prints `first` in order.');
      const p = container.querySelector('p');
      expect(p).toBeTruthy();
      expect(p.querySelector('code')).toBeTruthy(); // inline <code> inside the <p>
      expect(p.querySelector('pre')).toBeNull(); // never a block <pre> inside the <p>
      expect(p.textContent).toContain('This prints');
      expect(p.textContent).toContain('in order');
    });

    it('keeps multiple inline-code fragments inline within one sentence', () => {
      const { container } = renderMd(
        'This prints `first`, `second`, `third` in that order.',
      );
      const p = container.querySelector('p');
      expect(p.querySelectorAll('code')).toHaveLength(3);
      expect(container.querySelectorAll('pre')).toHaveLength(0);
    });

    it('renders a fenced block as a real <pre> block (sibling of paragraphs)', () => {
      const { container } = renderMd(
        'Before.\n\n```\nstart\nresult is 10\n```\n\nAfter.',
      );
      expect(container.querySelectorAll('pre')).toHaveLength(1);
      expect(container.textContent).toContain('start');
      expect(container.textContent).toContain('result is 10');
    });

    it('NEVER nests a block (<pre>/<div>) inside a <p> — no hydration error', () => {
      const { container } = renderMd(
        'This prints `first`, `second`, `third`.\n\n```\nstart\nresult is 10\n```\n\n`start` logs first because `x` is not called.',
      );
      expect(container.querySelectorAll('p pre')).toHaveLength(0);
      expect(container.querySelectorAll('p div')).toHaveLength(0);
      // and the inline fragments are still inline <code> inside their paragraphs
      expect(container.querySelectorAll('p code').length).toBeGreaterThan(0);
    });
  });

  it('degrades an unknown language to a plain code block without crashing', () => {
    const { container } = renderMd('```klingon\nnuqneH\n```');
    expect(container.textContent).toContain('nuqneH');
  });

  it('renders external links with target=_blank and safe rel', () => {
    renderMd('[docs](https://example.com/x)');
    const link = screen.getByRole('link', { name: 'docs' });
    expect(link).toHaveAttribute('href', 'https://example.com/x');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});

describe('LessonContent — security', () => {
  it('does not render raw HTML (script/img/iframe) from lesson source', () => {
    const { container } = renderMd(
      'Before\n\n<script>window.__pwned = true</script>\n<img src=x onerror="window.__pwned = true">\n<iframe src="https://evil.example"></iframe>\n\nAfter',
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
    const img = container.querySelector('img');
    // No onerror handler survives even if an <img> element were produced.
    expect(img?.getAttribute('onerror') ?? null).toBeNull();
    expect(window.__pwned).toBeUndefined();
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });

  it('strips a javascript: URL from a link href', () => {
    const { container } = renderMd('[click](javascript:window.__pwned=true)');
    const anchor = container.querySelector('a'); // no href → not even a "link" role
    expect(anchor).not.toBeNull();
    expect(anchor.textContent).toBe('click');
    // href is dropped entirely (empty/undefined), never the javascript: scheme.
    expect(anchor.getAttribute('href') ?? '').not.toMatch(/javascript:/i);
    expect(window.__pwned).toBeUndefined();
  });

  it('does not create event-handler attributes from markdown', () => {
    const { container } = renderMd('A **bold** and a [x](https://e.com) link.');
    const withHandlers = within(container)
      .queryAllByRole('link')
      .filter((el) =>
        Array.from(el.attributes).some((a) => a.name.startsWith('on')),
      );
    expect(withHandlers).toHaveLength(0);
  });
});
