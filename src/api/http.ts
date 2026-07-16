const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
	readonly status: number;
	readonly code?: string;

	constructor(status: number, message: string, code?: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.code = code;
	}
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`, {
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
		...options,
	});

	if (res.status === 204) {
		return undefined as T;
	}

	const data = await res.json().catch(() => null);

	if (!res.ok) {
		const message =
			data?.error?.message ??
			data?.message ??
			res.statusText ??
			"Erreur inconnue";
		const code = data?.error?.code ?? data?.code;
		throw new ApiError(res.status, message, code);
	}

	return data as T;
}

export const http = {
	get: <T>(path: string) => request<T>(path),
	post: <T>(path: string, body?: unknown) =>
		request<T>(path, {
			method: "POST",
			body: body === undefined ? undefined : JSON.stringify(body),
		}),
	patch: <T>(path: string, body?: unknown) =>
		request<T>(path, {
			method: "PATCH",
			body: body === undefined ? undefined : JSON.stringify(body),
		}),
	delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
