export type CharacterStatus = "ALIVE" | "DEFEATED" | "DEAD";

export type ObjectType = "WEAPON" | "BACKPACK" | "SPECIAL";

export interface Discipline {
	id: number;
	name: string;
	description: string;
}

export interface InventoryItem {
	id: number;
	objectId: number | null;
	name: string;
	type: ObjectType;
	quantity: number;
	equipped: boolean;
	bonusSkill: number;
}

export interface Character {
	id: number;
	name: string;
	fightSkill: number;
	effectiveFightSkill: number;
	endurance: number;
	enduranceMax: number;
	gold: number;
	status: CharacterStatus;
	createdAt: string;
	updatedAt: string;
	disciplines: Discipline[];
	inventory: InventoryItem[];
}

export interface CatalogObject {
	id: number;
	name: string;
	type: ObjectType;
	description: string | null;
}

export interface UseEffect {
	name: string;
	enduranceDelta: number;
}

export interface AuthUser {
	id: number;
	email: string;
}
