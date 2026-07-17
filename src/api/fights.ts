import type { RoundResponse, StartFightResponse } from "../types/types";
import { http } from "./http";

export const fightsApi = {
	start: (
		characterId: number,
		enemy: {
			enemyName?: string;
			enemyCombatSkill: number;
			enemyEndurance: number;
		},
	) =>
		http.post<StartFightResponse>(`/characters/${characterId}/fights`, enemy),

	nextRound: (fightId: number, disciplineBonus?: number) =>
		http.post<RoundResponse>(
			`/fights/${fightId}/rounds`,
			disciplineBonus ? { disciplineBonus } : {},
		),
};
