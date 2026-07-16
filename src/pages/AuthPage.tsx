import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/http";
import { useAuth } from "../auth/AuthContext";

type Mode = "login" | "register";

export default function AuthPage() {
	const { login, register } = useAuth();
	const navigate = useNavigate();

	const [mode, setMode] = useState<Mode>("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit() {
		setError(null);
		setSubmitting(true);
		try {
			if (mode === "login") {
				await login(email, password);
			} else {
				await register(email, password);
			}
			navigate("/");
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message);
			} else {
				setError("Impossible de contacter le serveur.");
			}
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="auth-page">
			<div className="auth-card">
				<h1 className="title">THE LONE WOLF</h1>
				<p className="subtitle">
					{mode === "login" ? "Connexion" : "Créer un compte"}
				</p>

				<label className="field">
					<span>Email</span>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						autoComplete="email"
					/>
				</label>

				<label className="field">
					<span>Mot de passe</span>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete={
							mode === "login" ? "current-password" : "new-password"
						}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSubmit();
						}}
					/>
				</label>

				{error && <p className="error">{error}</p>}

				<button
					type="submit"
					className="btn-primary"
					onClick={handleSubmit}
					disabled={submitting || !email || !password}
				>
					{submitting ? "…" : mode === "login" ? "Se connecter" : "S'inscrire"}
				</button>

				<button
					type="button"
					className="btn-link"
					onClick={() => {
						setError(null);
						setMode(mode === "login" ? "register" : "login");
					}}
				>
					{mode === "login"
						? "Pas encore de compte ? S'inscrire"
						: "Déjà un compte ? Se connecter"}
				</button>
			</div>
		</div>
	);
}
