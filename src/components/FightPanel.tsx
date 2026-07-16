import { useState } from "react";
import { charactersApi } from "../api/characters";
import { ApiError } from "../api/http";
import type { Character } from "../types/types";

interface Props {
	character: Character;
	onUpdated: () => void;
}

export default function FightPanel({ character, onUpdated }: Props) {
	const [amount, setAmount] = useState(1);
	const [newFight, setNewFight] = useState(true);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function run(action: () => Promise<unknown>) {
		setBusy(true);
		setError(null);
		try {
			await action();
			onUpdated();
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Action impossible.");
		} finally {
			setBusy(false);
		}
	}

	if (character.status === "DEAD") {
		return (
			<div className="fight-panel dead">
				<p className="fight-state">☠ Ce Seigneur Kaï est mort.</p>
				<p className="muted">Sa quête s'achève ici. Aucune reprise possible.</p>
			</div>
		);
	}

	if (character.status === "DEFEATED") {
		return (
			<div className="fight-panel defeated">
				<p className="fight-state">⚔ Vaincu — Endurance à 0.</p>
				<p className="muted">
					Reprends depuis la sauvegarde d'avant-combat, ou abandonne
					définitivement.
				</p>
				{error && <p className="error">{error}</p>}
				<div className="fight-actions">
					<button
						type="button"
						className="btn-primary"
						disabled={busy}
						onClick={() => run(() => charactersApi.replay(character.id))}
					>
						Reprendre le fight
					</button>
					<button
						type="button"
						className="btn-danger"
						disabled={busy}
						onClick={() => {
							if (confirm("Abandonner ? La mort est définitive.")) {
								run(() => charactersApi.abandon(character.id));
							}
						}}
					>
						Abandonner (mort définitive)
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="fight-panel alive">
			<div className="fight-row">
				<label className="field inline">
					<span>Dégâts subis</span>
					<input
						type="number"
						min={1}
						max={999}
						value={amount}
						onChange={(e) => setAmount(Number(e.target.value))}
					/>
				</label>

				<label className="checkbox">
					<input
						type="checkbox"
						checked={newFight}
						onChange={(e) => setNewFight(e.target.checked)}
					/>
					<span>Nouveau fight (crée une sauvegarde)</span>
				</label>
			</div>

			{error && <p className="error">{error}</p>}

			<button
				type="button"
				className="btn-primary"
				disabled={busy || amount < 1}
				onClick={() =>
					run(() => charactersApi.damage(character.id, amount, newFight))
				}
			>
				{busy ? "…" : "Infliger les dégâts"}
			</button>
			<p className="muted hint">
				Coche « Nouveau fight » au premier assaut pour figer l'état avant combat
				; décoche-la pour les assauts suivants du même fight.
			</p>
		</div>
	);
}
