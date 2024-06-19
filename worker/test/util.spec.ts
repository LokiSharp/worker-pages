import { describe, it, expect, assert, vi } from 'vitest';
import { fetchTimeout, getWorkerLocation, withTimeout } from '../src/util';

describe('getWorkerLocation', () => {
    it('result not null', async () => {
        const result = await getWorkerLocation()
        assert(result !== null)
    });
});

describe('fetchTimeout', () => {
    it('hould fetch data successfully', async () => {
        const mockResponse = { data: 'test' };
        vi.spyOn(global, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify(mockResponse))
        );

        const response = await fetchTimeout("https://example.com", 1000);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual(mockResponse);
    });

    it('should throw error on timeout', async () => {
        const mockDelay = 2000;
        vi.spyOn(global, 'fetch').mockImplementation(() => new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), mockDelay);
        }));

        await expect(fetchTimeout('http://example.com', 1000)).rejects.toThrowError('Timeout');
    });

    it('should abort fetch on external signal', async () => {
        const controller = new AbortController();
        const signal = controller.signal;

        const mockDelay = 5000;
        vi.spyOn(global, 'fetch').mockImplementation(() => new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), mockDelay);
        }));

        setTimeout(() => controller.abort(), 1000);

        await expect(fetchTimeout('http://example.com', 100000, { signal })).rejects.toThrowError('Timeout');
    });
});

describe('withTimeout', () => {
    it('should resolve promise within the timeout', async () => {
        const testPromise = new Promise<string>((resolve) => {
            setTimeout(() => resolve('Success'), 1000);
        });

        const result = await withTimeout(2000, testPromise);
        expect(result).toBe('Success');
    });

    it('should reject promise on timeout', async () => {
        const testPromise = new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 2000);
        });

        await expect(withTimeout(1000, testPromise)).rejects.toThrow('Promise timed out after 1000ms');
    });

    it('should resolve promise quickly', async () => {
        const testPromise = new Promise<string>((resolve) => {
            resolve('Success');
        });

        const result = await withTimeout(2000, testPromise);
        expect(result).toBe('Success');
    });
});
