import { SELF } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';

describe('handleFetchRequest', () => {
    it('should return a 405 response for non-POST requests', async () => {
        const response = await SELF.fetch('https://example.com');
        expect(response.status).toBe(405);
        expect(await response.text()).toMatchInlineSnapshot(`"Remote worker is working..."`);
    });

    it('should return a 404 response if the target is not found', async () => {
        const response = await SELF.fetch('https://example.com', { method: 'POST', body: JSON.stringify({ target: 'unknown-id' }) });
        expect(response.status).toBe(404);
        expect(await response.text()).toMatchInlineSnapshot(`"Target Not Found"`);
    });

    it('should return a JSON response with the worker location and status', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValueOnce(
            new Response(null, { status: 200, })
        );
        const response = await SELF.fetch('https://example.com', { method: 'POST', body: JSON.stringify({ target: 'Example' }) });
        expect(response.status).toBe(200);
        expect(await response.json()).toBeTruthy()
    });
});
