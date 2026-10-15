import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlogContent } from '../components/blog-content';
import { findBlogArticle, getBlogArticles, readBlogArticle } from '../lib/blog';
import demos from '../data/demos.json';

it('loads both Ball Thrust articles with real source, images and a buildable demo route', () => {
  const webRoot = resolve(import.meta.dirname, '..');
  const cwd = vi.spyOn(process, 'cwd').mockReturnValue(webRoot);
  try {
    const article = findBlogArticle('ball-thrust-physique-rapier');
    expect(article).toBeDefined();
    if (!article) throw new Error('Missing Ball Thrust article');
    const source = readFileSync(resolve(webRoot, '..', article.example), 'utf8');
    const titles = new Set<string>();
    for (const locale of ['fr', 'en']) {
      expect(existsSync(resolve(webRoot, 'blog', `${article.slug}.${locale}.mdx`))).toBe(true);
      const localized = getBlogArticles(locale).find((entry) => entry.slug === article.slug);
      expect(localized).toBeDefined();
      titles.add(localized!.title);
      const content = readBlogArticle(article, locale);
      expect(content).toContain(source);
      expect(content).not.toContain('<!-- FIRST_AGENT_CODE -->');
      expect(content).toContain('](/demos/ball-thrust/)');
      expect(content).toContain('await session.runSteps(4096, \'training\')');
      expect(content).toContain('await session.start(\'inference\')');
      expect(content).toContain('terminated');
      expect(content).toContain('truncated');
      for (const image of Array.from(content.matchAll(/!\[[^\]]*\]\((\/images\/[^)]+)\)/g))) {
        expect(existsSync(resolve(webRoot, 'public', image[1].slice(1)))).toBe(true);
      }
      expect(existsSync(resolve(webRoot, 'public', article.image.slice(1)))).toBe(true);
    }
    expect(titles.size).toBe(2);
    const demo = demos.find((entry) => entry.slug === article.environment);
    expect(demo?.pkg).toBe('demo-ball-thrust');
    expect(demo?.algos).toContain('DQN');
    expect(demo?.algos).toContain('Inference');
    expect(existsSync(resolve(webRoot, '../..', demo!.dir, 'package.json'))).toBe(true);
  } finally {
    cwd.mockRestore();
  }
});

it('compiles the six controls into a semantic table in French and English', async () => {
  const cwd = vi.spyOn(process, 'cwd').mockReturnValue(resolve(import.meta.dirname, '..'));
  try {
    const article = findBlogArticle('ball-thrust-physique-rapier');
    if (!article) throw new Error('Missing Ball Thrust article');
    for (const locale of ['fr', 'en']) {
      const html = renderToStaticMarkup(await BlogContent({ source: readBlogArticle(article, locale) }));
      expect(html.match(/<table(?:\s|>)/g) ?? []).toHaveLength(1);
      expect(html.match(/<th(?:\s|>)/g) ?? []).toHaveLength(2);
      expect(html.match(/<td(?:\s|>)/g) ?? []).toHaveLength(12);
      expect(html).toContain(`<th>${locale === 'fr' ? 'Commande' : 'Control'}</th>`);
      expect(html).toContain('data-rehype-pretty-code-figure');
    }
  } finally {
    cwd.mockRestore();
  }
});
