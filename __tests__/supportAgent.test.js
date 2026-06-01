/**
 * Support Agent — smart Q&A engine tests
 */

import { processSupportQuery, detectLang } from '@/lib/supportAgent';

describe('supportAgent', () => {
  test('detectLang returns hi for Devanagari', () => {
    expect(detectLang('प्रीमियम प्लान')).toBe('hi');
    expect(detectLang('hello premium')).toBe('en');
  });

  test('matches register intent from custom question', () => {
    const r = processSupportQuery('how do I create a new account on this website');
    expect(r.intent).toBe('register');
    expect(r.reply).toMatch(/Register/i);
    expect(r.actions.some((a) => a.href === '/register')).toBe(true);
  });

  test('matches kundali from custom search', () => {
    const r = processSupportQuery('kundali match kaise dekhe pdf download');
    expect(r.intent).toBe('kundali');
    expect(r.reply).toMatch(/Kundali|कुंडली/i);
  });

  test('matches premium without hardcoded old prices', () => {
    const r = processSupportQuery('what are premium plans and pricing');
    expect(r.intent).toBe('premium');
    expect(r.reply).not.toMatch(/\$749/);
    expect(r.reply).toMatch(/Premium/i);
  });

  test('agent handoff triggers transferToAgent', () => {
    const r = processSupportQuery('talk to human agent please');
    expect(r.transferToAgent).toBe(true);
    expect(r.intent).toBe('agent');
  });

  test('fallback suggests topics for unknown query', () => {
    const r = processSupportQuery('xyzabc random gibberish query');
    expect(r.intent).toBe('fallback');
    expect(r.followUps.length).toBeGreaterThan(0);
  });

  test('partial match returns search_results for ambiguous query', () => {
    const r = processSupportQuery('profile photo payment');
    expect(['search_results', 'profile', 'payment']).toContain(r.intent);
  });
});
