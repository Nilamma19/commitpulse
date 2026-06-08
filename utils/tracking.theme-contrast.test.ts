import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trackUser } from './tracking';

/**
 * Issue #4541 — test(tracking-theme-contrast): verify Dark and Light
 * Prefers-Color-Scheme Visual Cohesion (Variation 3)
 *
 * The tracking utility is invoked from UI surfaces that render under both
 * `prefers-color-scheme: dark` and `prefers-color-scheme: light` presets.
 * Even though `trackUser` itself does not emit visual markup, it must remain
 * fully behavior-stable across both theme contexts — analytics cannot silently
 * drop, double-fire, or mutate its payload based on the active color scheme.
 *
 * This file isolates that guarantee by emulating both presets via a mocked
 * `window.matchMedia` (the standard browser hook the design system uses to
 * derive the active theme) and asserting the same network contract in each.
 */

const originalSendBeacon = navigator.sendBeacon;
const originalMatchMedia = window.matchMedia;

/**
 * Build a `matchMedia` mock that reports the supplied theme preset as the
 * active one. Tailwind and the CommitPulse theme switch both read theme state
 * through `window.matchMedia('(prefers-color-scheme: dark)')`, so emulating
 * that single query is enough to flip the "active theme" the UI sees.
 */
function mockPrefersColorScheme(preset: 'dark' | 'light'): void {
  const isDark = preset === 'dark';
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark') ? isDark : !isDark,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('trackUser — dark and light prefers-color-scheme visual cohesion', () => {
  beforeEach(() => {
    // Reset any per-test stubs before the next preset is applied so that one
    // theme's mocks never leak into the next assertion.
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();

    Object.defineProperty(navigator, 'sendBeacon', {
      value: originalSendBeacon,
      configurable: true,
    });
    Object.defineProperty(window, 'matchMedia', {
      value: originalMatchMedia,
      configurable: true,
      writable: true,
    });
  });

  it('queues the same beacon payload under the dark color scheme preset', async () => {
    mockPrefersColorScheme('dark');

    const sendBeaconMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeaconMock,
      configurable: true,
    });

    trackUser('octocat');

    // The dark preset must not alter the network contract — endpoint, blob
    // type, and JSON shape stay identical to the light-mode baseline below.
    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    const [endpoint, blob] = sendBeaconMock.mock.calls[0];
    expect(endpoint).toBe('/api/track-user');
    expect(blob).toBeInstanceOf(Blob);
    expect((blob as Blob).type).toBe('application/json');
    expect(JSON.parse(await (blob as Blob).text())).toEqual({ username: 'octocat' });
  });

  it('queues the same beacon payload under the light color scheme preset', async () => {
    mockPrefersColorScheme('light');

    const sendBeaconMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeaconMock,
      configurable: true,
    });

    trackUser('octocat');

    // Mirror assertions of the dark-mode test — any drift between the two
    // branches would mean the analytics contract is theme-dependent.
    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    const [endpoint, blob] = sendBeaconMock.mock.calls[0];
    expect(endpoint).toBe('/api/track-user');
    expect(blob).toBeInstanceOf(Blob);
    expect((blob as Blob).type).toBe('application/json');
    expect(JSON.parse(await (blob as Blob).text())).toEqual({ username: 'octocat' });
  });

  it('falls back to fetch identically in both dark and light presets when sendBeacon is unavailable', () => {
    // Verifying the fallback path is theme-stable matters because the Beacon
    // API support is independent of the active color scheme — the absence of
    // sendBeacon must always route to the same `fetch` request shape.
    const fetchCalls: Array<[string, RequestInit | undefined]> = [];

    (['dark', 'light'] as const).forEach((preset) => {
      mockPrefersColorScheme(preset);

      Object.defineProperty(navigator, 'sendBeacon', {
        value: undefined,
        configurable: true,
      });

      const fetchMock = vi.fn().mockResolvedValue({});
      vi.stubGlobal('fetch', fetchMock);

      trackUser('octocat');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      fetchCalls.push(fetchMock.mock.calls[0] as [string, RequestInit | undefined]);

      vi.unstubAllGlobals();
    });

    // Both fallback invocations must be byte-for-byte identical — same URL,
    // method, headers, body, and keepalive flag — regardless of theme.
    expect(fetchCalls[0]).toEqual(fetchCalls[1]);
    expect(fetchCalls[0][0]).toBe('/api/track-user');
    expect(fetchCalls[0][1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'octocat' }),
      keepalive: true,
    });
  });

  it('remains a no-op for an empty username under both color scheme presets', () => {
    // Empty usernames should never produce a network call — a theme switch
    // must not accidentally re-enable tracking for falsy inputs.
    (['dark', 'light'] as const).forEach((preset) => {
      mockPrefersColorScheme(preset);

      const sendBeaconMock = vi.fn().mockReturnValue(true);
      const fetchMock = vi.fn();

      Object.defineProperty(navigator, 'sendBeacon', {
        value: sendBeaconMock,
        configurable: true,
      });
      vi.stubGlobal('fetch', fetchMock);

      trackUser('');

      expect(sendBeaconMock).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();

      vi.unstubAllGlobals();
    });
  });

  it('produces an identical serialized payload across both color scheme presets', async () => {
    // Cohesion check: the JSON body must be byte-identical between presets so
    // downstream analytics never receives theme-tagged or theme-mutated data.
    const payloads: string[] = [];

    for (const preset of ['dark', 'light'] as const) {
      mockPrefersColorScheme(preset);

      const sendBeaconMock = vi.fn().mockReturnValue(true);
      Object.defineProperty(navigator, 'sendBeacon', {
        value: sendBeaconMock,
        configurable: true,
      });

      trackUser('octocat');

      const blob = sendBeaconMock.mock.calls[0][1] as Blob;
      payloads.push(await blob.text());
    }

    expect(payloads[0]).toBe(payloads[1]);
    expect(JSON.parse(payloads[0])).toEqual({ username: 'octocat' });
  });
});
