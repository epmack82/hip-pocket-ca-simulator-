import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MarketDeparture, { marketHandover } from './MarketDeparture';

test('departure records stated intentions without converting them to completed work', () => {
  const site = { conversationEvents: [
    { id: 'one', kind: 'inquiry', participant: 'produce vendor' },
    { id: 'two', kind: 'reply', participant: 'produce vendor', subject: 'I need other accounts before recommending anything.' }
  ], completedProducts: [], followUpRequests: [{ id: 'request', status: 'Requested — not confirmed' }] };
  const original = JSON.stringify(site);
  const handover = marketHandover(site);
  expect(handover.voices).toEqual(['Dao']);
  expect(handover.products).toEqual([]);
  expect(handover.requests).toHaveLength(1);
  expect(JSON.stringify(site)).toBe(original);
  const html = renderToStaticMarkup(<MarketDeparture site={site} />);
  expect(html).toContain('not proof that you followed through');
  expect(html).toContain('Stay &amp; Continue Conversation');
  expect(html).toContain('Leave Market &amp; Continue Mission');
});

test('empty visit does not invent voices or promises', () => {
  expect(marketHandover().voices).toEqual([]);
  expect(marketHandover().replies).toEqual([]);
});
