import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it, vi } from 'vitest';
import { findBlogArticle, getBlogArticles, readBlogArticle } from '../lib/blog';
import demos from '../data/demos.json';

it('renders both Ball Thrust articles with real source, images and a buildable demo route', () => {
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
      for (const image of Array.from(content.matchAll(/!\[[^\]]*\]\((\/images\/[^)]+)\)/g))) {
        expect(existsSync(resolve(webRoot, 'public', image[1].slice(1)))).toBe(true);
      }
      expect(existsSync(resolve(webRoot, 'public', article.image.slice(1)))).toBe(true);
    }
    expect(titles.size).toBe(2);
    const demo = demos.find((entry) => entry.slug === article.environment);
    expect(demo?.pkg).toBe('demo-ball-thrust');
    expect(demo?.algos).toContain('No training');
    expect(existsSync(resolve(webRoot, '../..', demo!.dir, 'package.json'))).toBe(true);
  } finally {
    cwd.mockRestore();
  }
});
