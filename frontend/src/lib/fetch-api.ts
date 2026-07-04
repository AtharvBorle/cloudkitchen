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

export function uploadWithProgress(
    url: string,
    formData: FormData,
    onProgress: (percent: number) => void
): Promise<{ ok: boolean; status: number; json: () => Promise<any> }> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let target = url;
        if (target.startsWith("/api/")) {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
            target = `${apiBase.replace(/\/$/, "")}${target}`;
        }
        
        xhr.open("POST", target);
        xhr.withCredentials = true;

        xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                onProgress(percent);
            }
        });

        xhr.addEventListener("load", () => {
            const responseText = xhr.responseText;
            const ok = xhr.status >= 200 && xhr.status < 300;
            
            resolve({
                ok,
                status: xhr.status,
                json: async () => {
                    try {
                        const parsed = JSON.parse(responseText);
                        if (parsed && typeof parsed === 'object') {
                            if ('success' in parsed) {
                                if (parsed.success) {
                                    return parsed.data !== undefined ? parsed.data : parsed;
                                } else {
                                    return { ...parsed, message: parsed.error || parsed.message };
                                }
                            }
                        }
                        return parsed;
                    } catch (e) {
                        return { message: "Failed to parse response" };
                    }
                }
            });
        });

        xhr.addEventListener("error", () => {
            reject(new Error("Network upload error"));
        });

        xhr.send(formData);
    });
}
