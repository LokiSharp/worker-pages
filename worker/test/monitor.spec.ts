import { describe, it, expect, vi } from 'vitest';
import { getStatus } from '../src/monitor';
import { MonitorTarget } from '../../types';

describe('getStatus', () => {
    it('should fetch status successfully', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValueOnce(
            new Response(null, { status: 200 })
        );
        const monitor: MonitorTarget = {
            id: 'example',
            name: 'Example Monitor',
            method: 'GET',
            target: 'https://example.com',
        }
        const status = await getStatus(monitor);
        expect(status.up).toBe(true);
        expect(status.error).toBe('');
    });

    it('should handle timeout error', async () => {
        vi.spyOn(global, 'fetch').mockImplementation(
            () => Promise.reject(new Error('Timeout'))
        );
        const monitor: MonitorTarget = {
            id: 'example',
            name: 'Example Monitor',
            method: 'GET',
            target: 'https://example.com',
        }
        const status = await getStatus(monitor);
        expect(status.up).toBe(false);
        expect(status.error).toBe('Error: Timeout');
    });
});
