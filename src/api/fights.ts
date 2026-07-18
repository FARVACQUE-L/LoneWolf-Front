import type { RoundResponse, StartFightResponse } from "../types/types";
import { http } from "./http";

export const fightsApi = {
	start: (
		characterId: number,
		enemy: {
			enemyName?: string;
			enemyCombatSkill: number;
			enemyEndurance: number;
			enemyPsychicAttack?: boolean;
		},
	) =>
		http.post<StartFightResponse>(`/characters/${characterId}/fights`, enemy),

	nextRound: (
		fightId: number,
		options: { disciplineBonus?: number; mindblastEnabled?: boolean } = {},
	) => {
		const body: Record<string, unknown> = {};
		if (options.disciplineBonus) body.disciplineBonus = options.disciplineBonus;
		if (options.mindblastEnabled !== undefined) {
			body.mindblastEnabled = options.mindblastEnabled;
		}
		return http.post<RoundResponse>(`/fights/${fightId}/rounds`, body);
	},
};
