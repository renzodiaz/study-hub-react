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
