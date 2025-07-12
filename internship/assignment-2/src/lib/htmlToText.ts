import { JSDOM } from 'jsdom';

export function htmlToText(html: string): string {
  const dom = new JSDOM(html);
  const { document } = dom.window;

  const removals = [
    'script', 'style', 'iframe', 'noscript',
    'nav', 'footer', 'form', 'button'
  ];
  
  removals.forEach(tag => {
    document.querySelectorAll(tag).forEach(el => el.remove());
  });

  const paragraphs = Array.from(document.querySelectorAll('p, h1, h2, h3, li'))
    .map(el => {
      let text = el.textContent || '';
      return text
        .replace(/\s+/g, ' ')
        .trim();
    })
    .filter(text => text.length > 0);

  return paragraphs.join('\n\n');
}