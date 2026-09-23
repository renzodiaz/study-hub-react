import { DESTINATIONS, activeDestinationKey } from './destinations';

describe('learner primary destinations', () => {
  it('is exactly the five approved destinations, in order', () => {
    expect(DESTINATIONS.map((d) => d.key)).toEqual([
      'home',
      'learning',
      'explore',
      'credentials',
      'account',
    ]);
    expect(DESTINATIONS.map((d) => d.label)).toEqual([
      'Home',
      'My Learning',
      'Explore',
      'Credentials',
      'Account',
    ]);
  });

  it('includes Account as a primary destination', () => {
    expect(DESTINATIONS.some((d) => d.key === 'account')).toBe(true);
  });

  it('does not include Billing, Pilots or legacy starter destinations', () => {
    const routes = DESTINATIONS.map((d) => d.to);
    const labels = DESTINATIONS.map((d) => d.label.toLowerCase());
    expect(routes).not.toContain('/billing');
    expect(routes).not.toContain('/pilots');
    expect(routes).not.toContain('/career-tracks');
    for (const banned of [
      'billing',
      'pilots',
      'calendar',
      'documents',
      'projects',
      'reports',
    ]) {
      expect(labels).not.toContain(banned);
    }
  });
});

describe('activeDestinationKey', () => {
  it('maps the dashboard root to Home (exact only)', () => {
    expect(activeDestinationKey('/')).toBe('home');
  });

  it('maps My Learning and its nested career/lesson routes to My Learning', () => {
    expect(activeDestinationKey('/my-learning')).toBe('learning');
    expect(activeDestinationKey('/my-learning/abc')).toBe('learning');
    expect(activeDestinationKey('/lessons/xyz')).toBe('learning');
  });

  it('maps Explore and nested career/course routes to Explore', () => {
    expect(activeDestinationKey('/learn')).toBe('explore');
    expect(activeDestinationKey('/learn/abc')).toBe('explore');
    expect(activeDestinationKey('/learn/abc/def')).toBe('explore');
    expect(activeDestinationKey('/learn/abc/def/assessment')).toBe('explore');
  });

  it('does not confuse /my-learning with /learn', () => {
    expect(activeDestinationKey('/my-learning')).toBe('learning');
    expect(activeDestinationKey('/learn')).toBe('explore');
  });

  it('maps credential routes to Credentials', () => {
    expect(activeDestinationKey('/achievements')).toBe('credentials');
    expect(activeDestinationKey('/credentials/abc')).toBe('credentials');
  });

  it('maps Account and Billing (which lives inside Account) to Account', () => {
    expect(activeDestinationKey('/settings')).toBe('account');
    expect(activeDestinationKey('/billing')).toBe('account');
  });

  it('returns null for routes outside the primary destinations', () => {
    expect(activeDestinationKey('/assessment-attempts/1')).toBeNull();
    expect(activeDestinationKey('/pilots')).toBeNull();
  });
});
