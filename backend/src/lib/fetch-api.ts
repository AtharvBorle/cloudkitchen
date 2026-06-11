export async function fetchApi(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const res = await fetch(input, init);
    const contentType = res.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
        const clonedRes = res.clone();
        try {
            const json = await clonedRes.json();
            if (json && typeof json === 'object' && 'success' in json) {
                return new Proxy(res, {
                    get(target, prop) {
                        if (prop === 'json') {
                            return async () => {
                                if (json.success) {
                                    return json.data !== undefined ? json.data : json;
                                } else {
                                    return { ...json, message: json.error || json.message };
                                }
                            };
                        }
                        if (prop === 'ok') {
                            return target.ok && json.success !== false;
                        }
                        const value = (target as any)[prop];
                        return typeof value === 'function' ? value.bind(target) : value;
                    }
                });
            }
        } catch (e) {
            // Ignore JSON parsing errors, fallback to normal response
        }
    }

    return res;
}
