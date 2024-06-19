import { MonitorTarget } from "./../../types";
import { fetchTimeout } from "./util";

interface Status {
    ping: number;
    up: boolean;
    error: string;
}

export async function getStatus(monitor: MonitorTarget): Promise<Status> {
    let status: Status = {
        ping: 0,
        up: false,
        error: 'Unknown',
    }
    const startTime = Date.now()
    try {
        const response = await fetchTimeout(monitor.target, monitor.timeout || 10000, {
            method: monitor.method,
            headers: monitor.headers as any,
            body: monitor.body,
            cf: {
                cacheTtlByStatus: {
                    '100-599': -1
                }
            }
        });

        console.log(`${monitor.name} responded with ${response.status}`)
        status.ping = Date.now() - startTime

        status.up = true
        status.error = ''
    } catch (e: any) {
        console.error(`Error fetching ${monitor.name}: ${e}`)
        status.error = e.name + ': ' + e.message
    }
    return status;
}
