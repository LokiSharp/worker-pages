import { workerConfig } from '../../../../../config';
import { MonitorState } from '../../../../../types';
import type { NextRequest } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
    const STATE_KV = getRequestContext().env.STATE_KV
    const state = await STATE_KV.get('state') as unknown as MonitorState

    const monitors = workerConfig.monitors.map((monitor) => {
        return {
          id: monitor.id,
          name: monitor.name,
        }
      })

    return Response.json({ state, monitors })
}
