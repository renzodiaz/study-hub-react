import { getEnrollments, completeLesson } from '@api/learn';
import { getMe } from '@api/auth';

// The access token expires after 15 min. These regressions prove the learner API
// clients (and the auth gate) transparently refresh the session on a 401 and
// retry once, instead of failing the request / bouncing the learner to /login.
const res = (status, body = {}) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => body,
});

describe('session refresh on 401', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('learn GET retries after refreshing on 401', async () => {
    global.fetch
      .mockResolvedValueOnce(res(401)) // GET /enrollments → expired
      .mockResolvedValueOnce(res(200)) // POST /auth/refresh → ok
      .mockResolvedValueOnce(res(200, { data: [] })); // retry GET → ok

    await expect(getEnrollments()).resolves.toEqual([]);
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch.mock.calls[1][0]).toContain('/api/v1/auth/refresh');
  });

  it('learn POST (completeLesson) retries after refreshing on 401', async () => {
    global.fetch
      .mockResolvedValueOnce(res(401)) // POST /lesson_progresses → expired
      .mockResolvedValueOnce(res(200)) // refresh → ok
      .mockResolvedValueOnce(
        res(201, {
          data: { id: 'p1', type: 'lesson_progress', attributes: {} },
        }),
      ); // retry → created

    await expect(completeLesson('L1')).resolves.toBeTruthy();
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('does not refresh when the first request succeeds', async () => {
    global.fetch.mockResolvedValueOnce(res(200, { data: [] }));
    await expect(getEnrollments()).resolves.toEqual([]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('surfaces the error when the refresh itself fails (still 401)', async () => {
    global.fetch
      .mockResolvedValueOnce(res(401)) // GET → expired
      .mockResolvedValueOnce(res(401)); // refresh → fails (no retry)
    await expect(getEnrollments()).rejects.toThrow();
  });

  it('getMe refreshes on 401 and returns the user on retry', async () => {
    global.fetch
      .mockResolvedValueOnce(res(401)) // GET /me → expired
      .mockResolvedValueOnce(res(200)) // refresh → ok
      .mockResolvedValueOnce(
        res(200, { data: { id: 'u1', type: 'user', attributes: {} } }),
      );
    await expect(getMe()).resolves.toBeTruthy();
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('getMe returns null when refresh fails (learner is really logged out)', async () => {
    global.fetch
      .mockResolvedValueOnce(res(401)) // GET /me
      .mockResolvedValueOnce(res(401)); // refresh fails
    await expect(getMe()).resolves.toBeNull();
  });
});
