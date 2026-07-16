import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { authApi } from "../api/auth";
import type { AuthUser } from "../types/types";

interface AuthContextValue {
	user: AuthUser | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		authApi
			.me()
			.then(({ user }) => setUser(user))
			.catch(() => setUser(null))
			.finally(() => setLoading(false));
	}, []);

	async function login(email: string, password: string) {
		const { user } = await authApi.login(email, password);
		setUser(user);
	}

	async function register(email: string, password: string) {
		const { user } = await authApi.register(email, password);
		setUser(user);
	}

	async function logout() {
		await authApi.logout().catch(() => {});
		setUser(null);
	}

	return (
		<AuthContext.Provider value={{ user, loading, login, register, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error(
			"useAuth doit être utilisé à l'intérieur de <AuthProvider>",
		);
	}
	return ctx;
}
