import type { Discipline } from "../types/types";
import { http } from "./http";

interface DisciplinesResponse {
	disciplines: Discipline[];
}

export const disciplinesApi = {
	list: () =>
		http.get<DisciplinesResponse>("/disciplines").then((r) => r.disciplines),
};
