interface MonitorTarget {
    id: string;
    name: string;
    method: string;
    target: string;

    timeout?: number;
    headers?: Record<string, string | undefined>
    body?: BodyInit
}

export type { MonitorTarget }
