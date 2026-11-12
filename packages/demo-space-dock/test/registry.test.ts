import { existsSync, readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import Demos from '../../web/components/demos';
import { blogArticles } from '../../web/lib/blog';
import { demos as messages } from '../../web/messages/en/demos';
it('renders the registered route with the Dock tutorial; preserves existing article links', () => {
  const registry = JSON.parse(readFileSync(new URL('../../web/data/demos.json', import.meta.url), 'utf8')) as {slug: string; pkg: string; dir: string; algos: string}[];
  const demo = registry.find(demo => demo.slug === 'space-dock');
  expect(demo?.dir).toBe('packages/demo-space-dock'); expect(demo?.pkg).toBe('demo-space-dock');
  expect(demo?.algos).toContain('non entraîné');
  expect(existsSync(new URL('../../web/blog/space-dock-physique-pd.fr.mdx', import.meta.url))).toBe(true);
  expect(existsSync(new URL('../src/space-dock-env.ts', import.meta.url))).toBe(true);
  expect(existsSync(new URL('../../web/public/images/blog/space-dock/preview-v2.png', import.meta.url))).toBe(true);
  const html = renderToStaticMarkup(createElement(Demos, { t: messages }));
  expect(html).toContain('href="/demos/space-dock/"');
  expect(html).toContain('href="/blog/space-dock-physique-pd"');
  const article = html.split('<article').find(part => part.includes('/demos/space-dock/'));
  expect(article).toBeDefined();
  const dockCard = article?.split('</article>')[0];
  expect(dockCard).toContain('href="/blog/space-dock-physique-pd"');
  expect(dockCard).toContain(messages.readTutorial);
  for (const entry of registry.filter(entry => entry.slug !== 'space-dock')) {
    expect(html).toContain(`href="/demos/${entry.slug}/"`);
    const existing = blogArticles.find(article => article.environment === entry.slug);
    if (existing) expect(html).toContain(`href="/blog/${existing.slug}"`);
  }
});
