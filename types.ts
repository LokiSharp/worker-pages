interface MonitorTarget {
    id: string;
    name: string;
    method: string;
    target: string;

    timeout?: number;
    headers?: Record<string, string | undefined>
    body?: BodyInit
}

interface MonitorState {
    lastUpdate: number;
    overallUp: number;
    overallDown: number;
    incident: Record<
        string,
        {
            start: number[]
            end: number | undefined // undefined if it's still open
            error: string[]
        }[]
    >

    latency: Record<
        string,
        {
            recent: {
                loc: string
                ping: number
                time: number
            }[] // recent 12 hour data, 2 min interval
            all: {
                loc: string
                ping: number
                time: number
            }[] // all data in 90 days, 1 hour interval
        }
    >
}

export type { MonitorTarget, MonitorState }
