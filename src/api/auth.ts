import type { AuthUser } from "../types/types";
import { http } from "./http";

interface AuthResponse {
	user: AuthUser;
}

export const authApi = {
	register: (email: string, password: string) =>
		http.post<AuthResponse>("/auth/register", { email, password }),

	login: (email: string, password: string) =>
		http.post<AuthResponse>("/auth/login", { email, password }),

	me: () => http.get<AuthResponse>("/auth/me"),

	logout: () => http.post<void>("/auth/logout"),
};
