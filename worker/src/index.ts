import { workerConfig } from '../../config';
import { getStatus } from './monitor';

export default {
	async fetch(request, env, ctx): Promise<Response> {
        const workerLocation = request.cf?.colo
		console.log(`Handling request event at ${workerLocation}...`)

        if (request.method !== 'POST') {
			return new Response('Remote worker is working...', { status: 405 })
		}

        const targetId = (await request.json<{ target: string }>())['target']
        const target = workerConfig.monitors.find((m) => m.id === targetId)

        if (target === undefined) {
			return new Response('Target Not Found', { status: 404 })
		}

		const status = await getStatus(target)

		return new Response(
			JSON.stringify({
				location: workerLocation,
				status: status,
			}),
			{
				headers: {
					'content-type': 'application/json',
				},
			}
		)
	},
} satisfies ExportedHandler<Env>;
