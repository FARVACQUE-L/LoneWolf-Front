import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { charactersApi } from "../api/characters";
import { ApiError } from "../api/http";
import { objectsApi } from "../api/objects";
import { randomTableApi } from "../api/randomTable";
import FightPanel from "../components/FightPanel";
import type {
	CatalogObject,
	Character,
	InventoryItem,
	ObjectType,
} from "../types/types";

const MAX_WEAPONS = 2;
const MAX_BACKPACK = 8;
const MAX_GOLD = 50;
const WEAPONSKILL = "Maîtrise";

function groupInventory(inventory: InventoryItem[]) {
	const backpack = inventory.filter((o) => o.type === "BACKPACK");
	return {
		weapons: inventory.filter((o) => o.type === "WEAPON"),
		backpack,
		special: inventory.filter((o) => o.type === "SPECIAL"),
		meals: backpack
			.filter((o) => /repas/i.test(o.name))
			.reduce((sum, o) => sum + o.quantity, 0),
	};
}
function AddPicker({
	options,
	disabled,
	onAdd,
}: {
	options: CatalogObject[];
	disabled?: boolean;
	onAdd: (objectId: number) => void;
}) {
	const [selected, setSelected] = useState<number | "">("");
	return (
		<div className="add-picker">
			<select
				value={selected}
				disabled={disabled}
				onChange={(e) =>
					setSelected(e.target.value ? Number(e.target.value) : "")
				}
			>
				<option value="">— choisir —</option>
				{options.map((o) => (
					<option key={o.id} value={o.id}>
						{o.name}
					</option>
				))}
			</select>
			<button
				type="button"
				className="btn"
				disabled={disabled || selected === ""}
				onClick={() => {
					if (selected !== "") {
						onAdd(selected);
						setSelected("");
					}
				}}
			>
				Ajouter
			</button>
		</div>
	);
}

function SpecialModal({
	busy,
	onClose,
	onCreate,
}: {
	busy: boolean;
	onClose: () => void;
	onCreate: (name: string, bonusSkill: number) => void;
}) {
	const [name, setName] = useState("");
	const [bonus, setBonus] = useState(0);

	return (
		<div className="modal-overlay">
			<button
				type="button"
				className="modal-backdrop"
				aria-label="Fermer"
				onClick={onClose}
			/>
			<div
				className="modal"
				role="dialog"
				aria-modal="true"
				aria-label="Nouvel objet spécial"
			>
				<h3>Nouvel objet spécial</h3>
				<label className="modal-field">
					Nom
					<input
						type="text"
						maxLength={80}
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="ex. Bouclier Kaï"
					/>
				</label>
				<label className="modal-field">
					Bonus d'Habileté
					<input
						type="number"
						min={0}
						max={8}
						value={bonus}
						onChange={(e) =>
							setBonus(Math.max(0, Math.min(8, Number(e.target.value) || 0)))
						}
					/>
				</label>
				<div className="modal-actions">
					<button type="button" className="btn-link" onClick={onClose}>
						Annuler
					</button>
					<button
						type="button"
						className="btn"
						disabled={busy || name.trim() === ""}
						onClick={() => onCreate(name.trim(), bonus)}
					>
						Créer
					</button>
				</div>
			</div>
		</div>
	);
}

export default function CharacterSheetPage() {
	const { id } = useParams<{ id: string }>();
	const characterId = Number(id);

	const [character, setCharacter] = useState<Character | null>(null);
	const [catalog, setCatalog] = useState<CatalogObject[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [goldAmount, setGoldAmount] = useState(1);
	const [randomDraw, setRandomDraw] = useState<number | null>(null);

	const load = useCallback(async () => {
		if (!id) return;
		try {
			const [char, cat] = await Promise.all([
				charactersApi.get(characterId),
				objectsApi.list(),
			]);
			setCharacter(char);
			setCatalog(cat);
			setError(null);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Erreur de chargement.");
		} finally {
			setLoading(false);
		}
	}, [id, characterId]);

	useEffect(() => {
		load();
	}, [load]);

	async function run(action: () => Promise<Character>) {
		setBusy(true);
		setError(null);
		setNotice(null);
		try {
			setCharacter(await action());
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Action impossible.");
		} finally {
			setBusy(false);
		}
	}

	async function handleUse(lineId: number) {
		setBusy(true);
		setError(null);
		setNotice(null);
		try {
			const { character: updated, effect } = await charactersApi.consumeLine(
				characterId,
				lineId,
			);
			setCharacter(updated);
			setNotice(
				effect.enduranceDelta > 0
					? `${effect.name} : +${effect.enduranceDelta} Endurance`
					: `${effect.name} utilisé.`,
			);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Action impossible.");
		} finally {
			setBusy(false);
		}
	}

	async function runEndurance(action: () => Promise<Character>, label: string) {
		setBusy(true);
		setError(null);
		setNotice(null);
		const before = character?.endurance ?? 0;
		try {
			const updated = await action();
			setCharacter(updated);
			const delta = updated.endurance - before;
			const sign = delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`;
			setNotice(
				updated.status === "DEAD"
					? `${label} : Endurance à 0, le Seigneur Kaï succombe.`
					: `${label} : ${sign} Endurance.`,
			);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Action impossible.");
		} finally {
			setBusy(false);
		}
	}

	async function handleGold(delta: number) {
		setBusy(true);
		setError(null);
		setNotice(null);
		const before = character?.gold ?? 0;
		try {
			const updated = await charactersApi.adjustGold(characterId, delta);
			setCharacter(updated);
			const applied = updated.gold - before;
			const sign = applied >= 0 ? `+${applied}` : `−${Math.abs(applied)}`;
			setNotice(`${sign} PO — Bourse : ${updated.gold}.`);
		} catch (err) {
			if (err instanceof ApiError && err.code === "INSUFFICIENT_GOLD") {
				setError("Fonds insuffisants dans la Bourse.");
			} else {
				setError(err instanceof ApiError ? err.message : "Action impossible.");
			}
		} finally {
			setBusy(false);
		}
	}

	async function handleRandomTable() {
		setBusy(true);
		setError(null);
		try {
			setRandomDraw(await randomTableApi.draw());
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Tirage impossible.");
		} finally {
			setBusy(false);
		}
	}

	if (loading) return <p className="muted center">Chargement…</p>;
	if (!character) {
		return error ? <p className="error center">{error}</p> : null;
	}

	const { weapons, backpack, special, meals } = groupInventory(
		character.inventory,
	);
	const weaponsCount = weapons.reduce((s, o) => s + o.quantity, 0);
	const backpackCount = backpack.reduce((s, o) => s + o.quantity, 0);
	const hasWeaponskill = character.disciplines.some(
		(d) => d.name === WEAPONSKILL,
	);
	const alive = character.status === "ALIVE";
	const bonus = character.effectiveFightSkill - character.fightSkill;

	const catalogOf = (type: ObjectType) =>
		catalog.filter((o) => o.type === type);
	const endurancePct = Math.max(
		0,
		Math.round((character.endurance / character.enduranceMax) * 100),
	);

	return (
		<div className="sheet">
			<div className="sheet-topbar">
				<Link to="/" className="btn-link">
					← Retour
				</Link>
				<span className={`badge badge-${character.status.toLowerCase()}`}>
					{character.status}
				</span>
			</div>

			<header className="sheet-header">
				<p className="sheet-kicker">Feuille d'aventure</p>
				<h1 className="sheet-name">{character.name}</h1>
			</header>

			{error && <p className="error">{error}</p>}
			{notice && <p className="notice">{notice}</p>}
			{!alive && (
				<p className="muted">
					Personnage {character.status} — inventaire en lecture seule.
				</p>
			)}

			<section className="stat-grid">
				<div className="stat-box">
					<span className="stat-label">Habileté</span>
					<span className="stat-value">
						{character.effectiveFightSkill}
						{bonus > 0 && (
							<small>
								{" "}
								(base {character.fightSkill} +{bonus})
							</small>
						)}
					</span>
				</div>
				<div className="stat-box">
					<span className="stat-label">Endurance</span>
					<span className="stat-value">
						{character.endurance}
						<small> / {character.enduranceMax}</small>
					</span>
					<div className="endurance-bar">
						<div
							className="endurance-fill"
							style={{ width: `${endurancePct}%` }}
						/>
					</div>
				</div>
				<div className="stat-box">
					<span className="stat-label">Bourse (max {MAX_GOLD})</span>
					<span className="stat-value">{character.gold}</span>
					<div className="gold-controls">
						<input
							type="number"
							min={1}
							max={MAX_GOLD}
							value={goldAmount}
							disabled={busy || !alive}
							onChange={(e) =>
								setGoldAmount(
									Math.max(1, Math.min(MAX_GOLD, Number(e.target.value) || 1)),
								)
							}
							aria-label="Montant en PO"
						/>
						<button
							type="button"
							className="btn"
							disabled={busy || !alive || character.gold >= MAX_GOLD}
							onClick={() => handleGold(goldAmount)}
						>
							+
						</button>
						<button
							type="button"
							className="btn danger"
							disabled={busy || !alive || character.gold === 0}
							onClick={() => handleGold(-goldAmount)}
						>
							−
						</button>
					</div>
				</div>
				<div className="stat-box">
					<span className="stat-label">Repas</span>
					<span className="stat-value">{meals}</span>
				</div>
			</section>

			<section className="sheet-section">
				<h2 className="section-title">Disciplines Kaï</h2>
				<ul className="discipline-list">
					{character.disciplines.map((d) => (
						<li key={d.id} className="discipline-item" title={d.description}>
							{d.name}
						</li>
					))}
				</ul>
			</section>

			<section className="sheet-section">
				<h2 className="section-title">
					Armes{" "}
					<span className="count">
						{weaponsCount}/{MAX_WEAPONS}
					</span>
				</h2>

				{weapons.length === 0 ? (
					<p className="muted">Aucune arme.</p>
				) : (
					<ul className="inv-list">
						{weapons.map((item) => (
							<li key={item.id} className="inv-item">
								<span className="inv-name">
									{item.name}
									{item.quantity > 1 && ` ×${item.quantity}`}
								</span>
								{item.equipped && (
									<span className="badge badge-equipped">équipée</span>
								)}
								{item.bonusSkill > 0 && (
									<span className="bonus">+{item.bonusSkill} Hab.</span>
								)}
								<div className="inv-actions">
									<button
										type="button"
										disabled={busy || !alive}
										onClick={() =>
											run(() =>
												charactersApi.equipLine(
													characterId,
													item.id,
													!item.equipped,
												),
											)
										}
									>
										{item.equipped ? "Déséquiper" : "Équiper"}
									</button>
									{hasWeaponskill && (
										<button
											type="button"
											disabled={busy || !alive}
											onClick={() =>
												run(() =>
													charactersApi.setMastery(
														characterId,
														item.id,
														item.bonusSkill === 0,
													),
												)
											}
										>
											{item.bonusSkill > 0 ? "Retirer maîtrise" : "Maîtrise +2"}
										</button>
									)}
									<button
										type="button"
										className="danger"
										disabled={busy || !alive}
										onClick={() =>
											run(() => charactersApi.removeLine(characterId, item.id))
										}
									>
										Retirer
									</button>
								</div>
							</li>
						))}
					</ul>
				)}

				<AddPicker
					options={catalogOf("WEAPON")}
					disabled={busy || !alive || weaponsCount >= MAX_WEAPONS}
					onAdd={(objectId) =>
						run(() => charactersApi.addObject(characterId, objectId))
					}
				/>
			</section>

			<section className="sheet-section">
				<h2 className="section-title">
					Sac à dos{" "}
					<span className="count">
						{backpackCount}/{MAX_BACKPACK}
					</span>
				</h2>

				{backpack.length === 0 ? (
					<p className="muted">Sac vide.</p>
				) : (
					<ul className="inv-list">
						{backpack.map((item) => (
							<li key={item.id} className="inv-item">
								<span className="inv-name">
									{item.name}
									{item.quantity > 1 && ` ×${item.quantity}`}
								</span>
								<div className="inv-actions">
									<button
										type="button"
										disabled={busy || !alive}
										onClick={() => handleUse(item.id)}
									>
										Utiliser
									</button>
									{item.quantity > 1 && (
										<button
											type="button"
											disabled={busy || !alive}
											onClick={() =>
												run(() => charactersApi.dropOne(characterId, item.id))
											}
										>
											−1
										</button>
									)}
									<button
										type="button"
										className="danger"
										disabled={busy || !alive}
										onClick={() =>
											run(() => charactersApi.removeLine(characterId, item.id))
										}
									>
										Retirer{item.quantity > 1 ? " tout" : ""}
									</button>
								</div>
							</li>
						))}
					</ul>
				)}

				<AddPicker
					options={catalogOf("BACKPACK")}
					disabled={busy || !alive || backpackCount >= MAX_BACKPACK}
					onAdd={(objectId) =>
						run(() => charactersApi.addObject(characterId, objectId))
					}
				/>
			</section>

			<section className="sheet-section">
				<h2 className="section-title">
					Objets spéciaux
					<button
						type="button"
						className="btn-add"
						disabled={busy || !alive}
						onClick={() => setModalOpen(true)}
						aria-label="Ajouter un objet spécial"
					>
						+
					</button>
				</h2>

				{special.length === 0 ? (
					<p className="muted">Aucun objet spécial.</p>
				) : (
					<ul className="inv-list">
						{special.map((item) => (
							<li key={item.id} className="inv-item">
								<span className="inv-name">{item.name}</span>
								{item.equipped && (
									<span className="badge badge-equipped">équipé</span>
								)}
								{item.bonusSkill > 0 && (
									<span className="bonus">+{item.bonusSkill} Hab.</span>
								)}
								<div className="inv-actions">
									<button
										type="button"
										disabled={busy || !alive}
										onClick={() =>
											run(() =>
												charactersApi.equipLine(
													characterId,
													item.id,
													!item.equipped,
												),
											)
										}
									>
										{item.equipped ? "Déséquiper" : "Équiper"}
									</button>
									<button
										type="button"
										className="danger"
										disabled={busy || !alive}
										onClick={() =>
											run(() => charactersApi.removeLine(characterId, item.id))
										}
									>
										Retirer
									</button>
								</div>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="sheet-section">
				<h2 className="section-title">Endurance</h2>
				<div className="endurance-actions">
					<button
						type="button"
						className="btn"
						disabled={
							busy || !alive || character.endurance >= character.enduranceMax
						}
						onClick={() =>
							runEndurance(() => charactersApi.heal(characterId), "Guérison")
						}
					>
						Guérison +1
					</button>
					<button
						type="button"
						className="btn danger"
						disabled={busy || !alive}
						onClick={() =>
							runEndurance(
								() => charactersApi.meal(characterId),
								"Repas manqué",
							)
						}
					>
						Repas manqué −3
					</button>
				</div>
			</section>

			<section className="sheet-section">
				<h2 className="section-title">Fight</h2>
				<FightPanel character={character} onUpdated={load} />
			</section>

			<section className="sheet-section random-table">
				<h2 className="section-title">Table de hasard</h2>
				<div className="random-controls">
					<button
						type="button"
						className="btn"
						disabled={busy}
						onClick={handleRandomTable}
					>
						Tirer
					</button>
					{randomDraw !== null && (
						<span className="random-result" aria-live="polite">
							{randomDraw}
						</span>
					)}
				</div>
			</section>

			{modalOpen && (
				<SpecialModal
					busy={busy}
					onClose={() => setModalOpen(false)}
					onCreate={(name, bonusSkill) => {
						setModalOpen(false);
						run(() =>
							charactersApi.addCustomObject(characterId, name, bonusSkill),
						);
					}}
				/>
			)}
		</div>
	);
}
