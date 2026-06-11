export async function fetchApi(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let target = input;
    if (typeof target === "string" && target.startsWith("/api/")) {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
        target = `${apiBase.replace(/\/$/, "")}${target}`;
    }
    const res = await fetch(target, {
        credentials: "include",
        ...init
    });
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
