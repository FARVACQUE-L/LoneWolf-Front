import type { Character, UseEffect } from "../types/types";
import { http } from "./http";

interface CharacterResponse {
	character: Character;
}

interface CharactersResponse {
	characters: Character[];
}

export interface CreateCharacterInput {
	name: string;
	disciplineIds: number[];
}

export interface UpdateCharacterInput {
	name?: string;
	gold?: number;
}

export const charactersApi = {
	list: () =>
		http.get<CharactersResponse>("/characters").then((r) => r.characters),

	get: (id: number) =>
		http.get<CharacterResponse>(`/characters/${id}`).then((r) => r.character),

	create: (input: CreateCharacterInput) =>
		http.post<CharacterResponse>("/characters", input).then((r) => r.character),

	update: (id: number, input: UpdateCharacterInput) =>
		http
			.patch<CharacterResponse>(`/characters/${id}`, input)
			.then((r) => r.character),

	remove: (id: number) => http.delete<void>(`/characters/${id}`),

	damage: (id: number, amount: number, newFight: boolean) =>
		http
			.post<CharacterResponse>(`/characters/${id}/damage`, {
				amount,
				newFight,
			})
			.then((r) => r.character),

	replay: (id: number) =>
		http
			.post<CharacterResponse>(`/characters/${id}/replay`)
			.then((r) => r.character),

	abandon: (id: number) =>
		http
			.post<CharacterResponse>(`/characters/${id}/abandon`)
			.then((r) => r.character),

	heal: (id: number) =>
		http
			.post<CharacterResponse>(`/characters/${id}/heal`)
			.then((r) => r.character),

	meal: (id: number) =>
		http
			.post<CharacterResponse>(`/characters/${id}/meal`)
			.then((r) => r.character),

	addObject: (id: number, objectId: number, quantity = 1) =>
		http
			.post<CharacterResponse>(`/characters/${id}/objects`, {
				objectId,
				quantity,
			})
			.then((r) => r.character),

	addCustomObject: (id: number, name: string, bonusSkill: number) =>
		http
			.post<CharacterResponse>(`/characters/${id}/objects/custom`, {
				name,
				bonusSkill,
			})
			.then((r) => r.character),

	removeLine: (id: number, lineId: number) =>
		http
			.delete<CharacterResponse>(`/characters/${id}/lines/${lineId}`)
			.then((r) => r.character),

	equipLine: (id: number, lineId: number, equipped: boolean) =>
		http
			.patch<CharacterResponse>(`/characters/${id}/lines/${lineId}/equip`, {
				equipped,
			})
			.then((r) => r.character),

	setMastery: (id: number, lineId: number, mastered: boolean) =>
		http
			.patch<CharacterResponse>(`/characters/${id}/lines/${lineId}/mastery`, {
				mastered,
			})
			.then((r) => r.character),

	consumeLine: (id: number, lineId: number) =>
		http.post<{ character: Character; effect: UseEffect }>(
			`/characters/${id}/lines/${lineId}/use`,
		),

	dropOne: (id: number, lineId: number) =>
		http
			.patch<CharacterResponse>(`/characters/${id}/lines/${lineId}/drop`)
			.then((r) => r.character),

	adjustGold: (id: number, delta: number) =>
		http
			.post<CharacterResponse>(`/characters/${id}/gold`, { delta })
			.then((r) => r.character),

	psychicAttack: (id: number, amount: number) =>
		http.post<{
			character: Character;
			effect: { name: string; enduranceDelta: number; blocked: boolean };
		}>(`/characters/${id}/psychic`, { amount }),
};
