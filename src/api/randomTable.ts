import { http } from "./http";

interface RandomTableResponse {
	draw: number;
}

export const randomTableApi = {
	draw: () =>
		http.get<RandomTableResponse>("/random-table").then((r) => r.draw),
};
