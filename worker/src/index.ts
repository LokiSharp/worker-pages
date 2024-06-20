import { workerConfig } from '../../config';
import { MonitorState } from '../../types';
import { getStatus } from './monitor';
import { getWorkerLocation } from './util';

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
    async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
        const workerLocation = (await getWorkerLocation()) || 'ERROR'
		console.log(`Running scheduled event on ${workerLocation}...`)

        let state = ((await env.STATE_KV.get('state', {
			type: 'json',
		})) as MonitorState) || ({
			lastUpdate: 0,
			overallUp: 0,
			overallDown: 0,
			incident: {},
			latency: {},
		} as MonitorState)
		state.overallDown = 0
		state.overallUp = 0

		let statusChanged = false
		const currentTimeSecond = Math.round(Date.now() / 1000)

		for (const monitor of workerConfig.monitors) {
			console.log(`[${workerLocation}] Checking ${monitor.name}...`)

			let monitorStatusChanged = false
			let checkLocation = workerLocation
			let status = await getStatus(monitor)
			const currentTimeSecond = Math.round(Date.now() / 1000)

			status.up ? state.overallUp++ : state.overallDown++

			state.incident[monitor.id] = state.incident[monitor.id] || [
				{
					start: [currentTimeSecond],
					end: currentTimeSecond,
					error: ['dummy'],
				},
			]

			let lastIncident = state.incident[monitor.id].slice(-1)[0]

			if (status.up) {
				if (lastIncident.end === undefined) {
					lastIncident.end = currentTimeSecond
					monitorStatusChanged = true
				}
			} else {
				if (lastIncident.end !== undefined) {
					state.incident[monitor.id].push({
						start: [currentTimeSecond],
						end: undefined,
						error: [status.error],
					})
					monitorStatusChanged = true
				} else if (
					lastIncident.end === undefined &&
					lastIncident.error.slice(-1)[0] !== status.error
				) {
					lastIncident.start.push(currentTimeSecond)
					lastIncident.error.push(status.error)
					monitorStatusChanged = true
				}
			}


			let latencyLists = state.latency[monitor.id] || {
				recent: [],
				all: [],
			}

			const record = {
				loc: checkLocation,
				ping: status.ping,
				time: currentTimeSecond,
			}
			latencyLists.recent.push(record)

			if (latencyLists.all.length === 0 || currentTimeSecond - latencyLists.all.slice(-1)[0].time > 60 * 60) {
				latencyLists.all.push(record)
			}

			while (latencyLists.recent[0]?.time < currentTimeSecond - 12 * 60 * 60) {
				latencyLists.recent.shift()
			}
			while (latencyLists.all[0]?.time < currentTimeSecond - 90 * 24 * 60 * 60) {
				latencyLists.all.shift()
			}
			state.latency[monitor.id] = latencyLists

			statusChanged ||= monitorStatusChanged
		}

		console.log(`statusChanged: ${statusChanged}, lastUpdate: ${state.lastUpdate}, currentTime: ${currentTimeSecond}`)
		if (
			statusChanged ||
			state.lastUpdate + 60 * 5 < currentTimeSecond
		) {
			console.log("Updating state...")
			state.lastUpdate = currentTimeSecond
			await env.STATE_KV.put('state', JSON.stringify(state))
		} else {
			console.log("Skipping state update due to cooldown period.")
		}
    }
} satisfies ExportedHandler<Env>;
