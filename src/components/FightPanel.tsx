// src/components/FightPanel.tsx
import { useState } from "react";
import { charactersApi } from "../api/characters";
import { fightsApi } from "../api/fights";
import { ApiError } from "../api/http";
import type { Character, FightOutcome, RoundLog } from "../types/types";

interface Props {
	character: Character;
	onUpdated: () => void; // la page re-fetch le perso après chaque action
}

export default function FightPanel({ character, onUpdated }: Props) {
	// Formulaire adversaire
	const [enemyName, setEnemyName] = useState("");
	const [enemySkill, setEnemySkill] = useState(15);
	const [enemyEndurance, setEnemyEndurance] = useState(25);

	// État du combat en cours (local : le back ne renvoie pas le fight dans la fiche)
	const [fightId, setFightId] = useState<number | null>(null);
	const [enemy, setEnemy] = useState<{
		name: string;
		endurance: number;
	} | null>(null);
	const [rounds, setRounds] = useState<RoundLog[]>([]);
	const [outcome, setOutcome] = useState<FightOutcome | null>(null);
	const [disciplineBonus, setDisciplineBonus] = useState(0);

	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function resetFight() {
		setFightId(null);
		setEnemy(null);
		setRounds([]);
		setOutcome(null);
		setDisciplineBonus(0);
	}

	async function run(action: () => Promise<unknown>, afterReset = false) {
		setBusy(true);
		setError(null);
		try {
			await action();
			if (afterReset) resetFight();
			onUpdated();
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Action impossible.");
		} finally {
			setBusy(false);
		}
	}

	async function handleStart() {
		setBusy(true);
		setError(null);
		try {
			const res = await fightsApi.start(character.id, {
				enemyName: enemyName.trim() || undefined,
				enemyCombatSkill: enemySkill,
				enemyEndurance,
			});
			setFightId(res.fightId);
			setEnemy({ name: res.enemy.name, endurance: res.enemy.endurance });
			setRounds([]);
			setOutcome("IN_PROGRESS");
			onUpdated(); // le snapshot a été pris : re-fetch pour cohérence
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Combat impossible.");
		} finally {
			setBusy(false);
		}
	}

	async function handleRound() {
		if (fightId === null) return;
		setBusy(true);
		setError(null);
		try {
			const res = await fightsApi.nextRound(
				fightId,
				disciplineBonus || undefined,
			);
			setEnemy({ name: res.enemy.name, endurance: res.enemy.endurance });
			setRounds((prev) => [...prev, res.round]);
			setOutcome(res.fightStatus);
			onUpdated(); // met à jour l'Endurance / le statut du perso dans la feuille
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Round impossible.");
		} finally {
			setBusy(false);
		}
	}

	const roundLog =
		rounds.length > 0 ? (
			<table className="round-log">
				<thead>
					<tr>
						<th>#</th>
						<th>Quotient</th>
						<th>Tirage</th>
						<th>Ennemi −</th>
						<th>Toi −</th>
					</tr>
				</thead>
				<tbody>
					{rounds.map((r) => (
						<tr key={r.number}>
							<td>{r.number}</td>
							<td>
								{r.combatRatio >= 0 ? `+${r.combatRatio}` : r.combatRatio}
							</td>
							<td>{r.draw}</td>
							<td>{r.enemyLoss}</td>
							<td>{r.playerLoss}</td>
						</tr>
					))}
				</tbody>
			</table>
		) : null;

	// ─── Personnage mort : lecture seule ───────────────────────────────────────
	if (character.status === "DEAD") {
		return (
			<section className="fight-panel">
				<h3>Combat</h3>
				<p className="muted">
					Ce Seigneur Kaï est mort. Sa fiche est en lecture seule.
				</p>
			</section>
		);
	}

	// ─── Vaincu : choix reprise / abandon ──────────────────────────────────────
	if (character.status === "DEFEATED") {
		return (
			<section className="fight-panel">
				<h3>Combat perdu</h3>
				<p className="muted">
					Ton Endurance est tombée à zéro. Reprends depuis la sauvegarde prise
					avant le combat, ou abandonne l'aventure.
				</p>
				{error && <p className="error">{error}</p>}
				<div className="fight-actions">
					<button
						type="button"
						disabled={busy}
						onClick={() => run(() => charactersApi.replay(character.id), true)}
					>
						Reprendre le combat
					</button>
					<button
						type="button"
						className="danger"
						disabled={busy}
						onClick={() => run(() => charactersApi.abandon(character.id), true)}
					>
						Abandonner l'aventure
					</button>
				</div>
				{roundLog}
			</section>
		);
	}

	// ─── Victoire ──────────────────────────────────────────────────────────────
	if (outcome === "WON") {
		return (
			<section className="fight-panel">
				<h3>Victoire !</h3>
				<p className="muted">
					{enemy?.name ?? "L'adversaire"} est vaincu. Endurance restante :{" "}
					{character.endurance}.
				</p>
				<button type="button" onClick={resetFight}>
					Nouveau combat
				</button>
				{roundLog}
			</section>
		);
	}

	// ─── Combat en cours ───────────────────────────────────────────────────────
	if (outcome === "IN_PROGRESS" && fightId !== null && enemy) {
		return (
			<section className="fight-panel">
				<h3>Combat en cours</h3>
				<div className="fight-scores">
					<span>
						{enemy.name} — Endurance <strong>{enemy.endurance}</strong>
					</span>
					<span>
						Toi — Endurance <strong>{character.endurance}</strong>
					</span>
				</div>

				<div className="fight-bonus">
					<label htmlFor="discipline-bonus">Bonus discipline (Habileté)</label>
					<input
						id="discipline-bonus"
						type="number"
						min={0}
						max={10}
						value={disciplineBonus}
						onChange={(e) => setDisciplineBonus(Number(e.target.value) || 0)}
					/>
				</div>

				{error && <p className="error">{error}</p>}

				<button type="button" disabled={busy} onClick={handleRound}>
					{busy ? "…" : "Round suivant"}
				</button>
				{roundLog}
			</section>
		);
	}

	// ─── Aucun combat : formulaire adversaire ──────────────────────────────────
	return (
		<section className="fight-panel">
			<h3>Nouveau combat</h3>
			<div className="fight-setup">
				<div className="field">
					<label htmlFor="enemy-name">Adversaire</label>
					<input
						id="enemy-name"
						type="text"
						placeholder="Adversaire"
						value={enemyName}
						onChange={(e) => setEnemyName(e.target.value)}
					/>
				</div>
				<div className="field">
					<label htmlFor="enemy-skill">Habileté</label>
					<input
						id="enemy-skill"
						type="number"
						min={1}
						max={99}
						value={enemySkill}
						onChange={(e) => setEnemySkill(Number(e.target.value) || 0)}
					/>
				</div>
				<div className="field">
					<label htmlFor="enemy-endurance">Endurance</label>
					<input
						id="enemy-endurance"
						type="number"
						min={1}
						max={99}
						value={enemyEndurance}
						onChange={(e) => setEnemyEndurance(Number(e.target.value) || 0)}
					/>
				</div>
			</div>

			{error && <p className="error">{error}</p>}

			<button type="button" disabled={busy} onClick={handleStart}>
				{busy ? "…" : "Commencer le combat"}
			</button>
		</section>
	);
}
