import { describe, expect, it } from 'vitest';
import { renderEmailTemplate } from '../../src/lib/marketing/render-email';

describe('renderEmailTemplate', () => {
  it('substitutes every {{token}} in the shopper welcome template', async () => {
    const html = await renderEmailTemplate('welcome-regular.html', {
      town_name: 'Chichester',
      referral_link: 'https://regulars.app/chichester/shoppers?ref=AB12CD',
    });
    expect(html).toContain('Chichester');
    expect(html).toContain('https://regulars.app/chichester/shoppers?ref=AB12CD');
    expect(html).not.toMatch(/\{\{\s*\w+\s*\}\}/);
  });

  it('substitutes every {{token}} in the business welcome template', async () => {
    const html = await renderEmailTemplate('welcome-regular-business.html', {
      business_name: 'The Roastery',
      contact_name: 'Sam Roaster',
      town_name: 'Chichester',
      business_link: 'https://regulars.app/business',
    });
    expect(html).toContain('The Roastery');
    expect(html).toContain('Sam Roaster');
    expect(html).toContain('Chichester');
    expect(html).toContain('https://regulars.app/business');
    expect(html).not.toMatch(/\{\{\s*\w+\s*\}\}/);
  });

  it('leaves an unknown token untouched rather than silently dropping it', async () => {
    const html = await renderEmailTemplate('welcome-regular.html', { town_name: 'Chichester' });
    expect(html).toContain('{{referral_link}}');
  });
});
