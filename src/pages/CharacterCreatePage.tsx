import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { charactersApi } from "../api/characters";
import { disciplinesApi } from "../api/disciplines";
import { ApiError } from "../api/http";
import type { Discipline } from "../types/types";

const REQUIRED_DISCIPLINES = 5;

export default function CharacterCreatePage() {
	const navigate = useNavigate();

	const [catalogue, setCatalogue] = useState<Discipline[]>([]);
	const [loadingCatalogue, setLoadingCatalogue] = useState(true);

	const [name, setName] = useState("");
	const [selected, setSelected] = useState<number[]>([]);

	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		disciplinesApi
			.list()
			.then(setCatalogue)
			.catch((err) =>
				setError(
					err instanceof ApiError
						? err.message
						: "Impossible de charger les disciplines.",
				),
			)
			.finally(() => setLoadingCatalogue(false));
	}, []);

	function toggle(id: number) {
		setSelected((prev) => {
			if (prev.includes(id)) return prev.filter((x) => x !== id);
			if (prev.length >= REQUIRED_DISCIPLINES) return prev;
			return [...prev, id];
		});
	}

	const canSubmit =
		name.trim().length > 0 &&
		selected.length === REQUIRED_DISCIPLINES &&
		async function handleSubmit() {
			if (!canSubmit) return;
			setSubmitting(true);
			setError(null);
			try {
				const character = await charactersApi.create({
					name: name.trim(),
					disciplineIds: selected,
				});

				navigate(`/characters/${character.id}`);
			} catch (err) {
				setError(
					err instanceof ApiError ? err.message : "Création impossible.",
				);
				setSubmitting(false);
			}
		};

	async function handleSubmit() {
		if (!canSubmit) return;
		setSubmitting(true);
		setError(null);
		try {
			const character = await charactersApi.create({
				name: name.trim(),
				disciplineIds: selected,
			});
			navigate(`/characters/${character.id}`);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Création impossible.");
			setSubmitting(false);
		}
	}

	return (
		<div className="create-page">
			<Link to="/" className="btn-link">
				← Retour
			</Link>
			<h1 className="title">Nouveau Seigneur Kaï</h1>

			<label className="field">
				<span>Nom du héros</span>
				<input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Loup Solitaire"
					maxLength={60}
				/>
			</label>

			<div className="field">
				<span>
					Disciplines Kaï — {selected.length}/{REQUIRED_DISCIPLINES}
				</span>
				{loadingCatalogue ? (
					<p className="muted">Chargement des disciplines…</p>
				) : (
					<ul className="discipline-picker">
						{catalogue.map((d) => {
							const isSelected = selected.includes(d.id);
							const isDisabled =
								!isSelected && selected.length >= REQUIRED_DISCIPLINES;
							return (
								<li key={d.id}>
									<button
										type="button"
										className={`discipline-chip${isSelected ? " selected" : ""}`}
										onClick={() => toggle(d.id)}
										disabled={isDisabled}
										title={d.description}
									>
										{d.name}
									</button>
								</li>
							);
						})}
					</ul>
				)}
			</div>

			<p className="muted hint">
				Habileté, Endurance et Couronnes d'or seront tirées à la création.
			</p>

			{error && <p className="error">{error}</p>}

			<button
				type="submit"
				className="btn-primary"
				onClick={handleSubmit}
				disabled={!canSubmit || submitting}
			>
				{submitting ? "Création…" : "Créer le personnage"}
			</button>

			{selected.length !== REQUIRED_DISCIPLINES && !loadingCatalogue && (
				<p className="muted hint">
					Choisis exactement {REQUIRED_DISCIPLINES} disciplines pour continuer.
				</p>
			)}
		</div>
	);
}
