import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { charactersApi } from "../api/characters";
import { ApiError } from "../api/http";
import { useAuth } from "../auth/AuthContext";
import type { Character } from "../types/types";

export default function CharacterListPage() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	const [characters, setCharacters] = useState<Character[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			setCharacters(await charactersApi.list());
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Erreur de chargement.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	async function handleDelete(id: number) {
		if (!confirm("Supprimer ce personnage ?")) return;
		try {
			await charactersApi.remove(id);
			setCharacters((prev) => prev.filter((c) => c.id !== id));
		} catch (err) {
			setError(
				err instanceof ApiError ? err.message : "Suppression impossible.",
			);
		}
	}

	return (
		<div className="list-page">
			<header className="topbar">
				<h1 className="title">THE LONE WOLF</h1>
				<div className="topbar-right">
					<span className="muted">{user?.email}</span>
					<button type="button" className="btn-link" onClick={() => logout()}>
						Déconnexion
					</button>
				</div>
			</header>

			<section className="create-row">
				<button
					type="button"
					className="btn-primary"
					onClick={() => navigate("/characters/new")}
				>
					+ Nouveau personnage
				</button>
			</section>

			{error && <p className="error">{error}</p>}

			{loading ? (
				<p className="muted">Chargement…</p>
			) : characters.length === 0 ? (
				<p className="muted">Aucun personnage pour l'instant.</p>
			) : (
				<ul className="card-grid">
					{characters.map((c) => (
						<li key={c.id} className="char-card">
							<Link to={`/characters/${c.id}`} className="char-card-link">
								<h2>{c.name}</h2>
								<p className="stats">
									Habileté {c.fightSkill} · Endurance {c.endurance}/
									{c.enduranceMax}
								</p>
								<span className={`badge badge-${c.status.toLowerCase()}`}>
									{c.status}
								</span>
							</Link>
							<button
								type="button"
								className="btn-danger"
								onClick={() => handleDelete(c.id)}
							>
								Supprimer
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
