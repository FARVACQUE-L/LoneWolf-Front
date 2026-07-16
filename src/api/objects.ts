import type { CatalogObject } from "../types/types";
import { http } from "./http";

interface ObjectsResponse {
	objects: CatalogObject[];
}

export const objectsApi = {
	list: () => http.get<ObjectsResponse>("/objects").then((r) => r.objects),
};
