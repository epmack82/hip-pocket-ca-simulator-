import { CLASSROOM_THEMES, CLASSROOM_VERSION, generateClassroomOpord, classroomQuestions, classroomOpordHtml, printClassroomPacket } from './classroomOpord';

test('same seed, theme and version recreate the packet without runtime dependencies', () => {
  const options = { seed: 'unit-class-4', theme: 'transition', className: 'Staff practice' };
  expect(generateClassroomOpord(options)).toEqual(generateClassroomOpord(options));
  expect(generateClassroomOpord(options).version).toBe(CLASSROOM_VERSION);
  expect(generateClassroomOpord({ ...options, theme: 'services' }).id).not.toBe(generateClassroomOpord(options).id);
});

test.each(CLASSROOM_THEMES.map(t => [t.id]))('%s packets have coherent student facts and separate draft guidance', theme => {
  const packet = generateClassroomOpord({ seed: 'test-01', theme });
  const student = classroomOpordHtml(packet);
  const guide = classroomOpordHtml(packet, 'facilitator');
  expect(packet.phases).toHaveLength(4);
  expect(packet.reports).toHaveLength(4);
  expect(classroomQuestions(packet)).toHaveLength(6);
  expect(student).toContain('CAT 1, CAT 2 and CAT 3');
  expect(student).toContain('one CA company');
  expect(student).toContain(packet.firstReview);
  expect(student).toContain(packet.constraint);
  expect(student).toContain('No Annex K is supplied');
  expect(student).not.toContain(packet.inject);
  expect(student).not.toContain('Draft facilitator');
  expect(guide).toContain(packet.id);
  expect(guide).toContain(packet.seed);
  expect(guide).toContain('NOT AN APPROVED ANSWER KEY');
  expect(guide).toContain(packet.inject);
  expect(guide).toContain('do not penalize students retroactively');
});

test('seed changes can change planning windows, not merely packet identifiers', () => {
  const packets = Array.from({ length: 30 }, (_, i) => generateClassroomOpord({ seed: `sample-${i}` }));
  expect(new Set(packets.map(p => p.partnerWindow)).size).toBe(3);
  expect(new Set(packets.map(p => p.firstReview)).size).toBe(3);
});

test('print HTML escapes supplied labels and seeds and contains no scripts or remote resources', () => {
  const packet = generateClassroomOpord({ seed: '<script>alert(1)</script>', className: '<img src=x onerror=alert(1)> & class' });
  for (const audience of ['student', 'facilitator']) {
    const html = classroomOpordHtml(packet, audience);
    const dom = new DOMParser().parseFromString(html, 'text/html');
    expect(dom.querySelectorAll('script,img,iframe,link').length).toBe(0);
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;img');
    expect(html).toContain('@media print');
    expect(html).toContain('@page');
    expect(dom.querySelectorAll('.sheet').length).toBe(audience === 'student' ? 4 : 2);
  }
});

test('invalid options normalize and unsupported output modes cannot silently export the wrong packet', () => {
  expect(generateClassroomOpord({ theme: 'not-real', seed: '  ' }).theme).toBe('services');
  expect(generateClassroomOpord({ seed: 'x'.repeat(100) }).seed.length).toBe(60);
  expect(() => classroomOpordHtml(generateClassroomOpord(), 'key')).toThrow();
});

test('print requests use generated HTML and report popup blocking without pretending to print', () => {
  const win = { opener: window, document: { open: jest.fn(), write: jest.fn(), close: jest.fn() }, focus: jest.fn(), print: jest.fn(), close: jest.fn() };
  const open = jest.spyOn(window, 'open').mockReturnValue(win);
  const html = classroomOpordHtml(generateClassroomOpord());
  expect(printClassroomPacket(html)).toBe(true);
  expect(win.document.write).toHaveBeenCalledWith(html);
  expect(win.print).toHaveBeenCalledTimes(1);
  expect(win.opener).toBeNull();
  open.mockReturnValue(null);
  expect(printClassroomPacket(html)).toBe(false);
  open.mockRestore();
});
