export type AuthUser = {
	id: string;
	email: string;
	name: string;
	role: string;
	isAdmin: boolean;
};

export type SessionUserResponse = {
	authenticated: boolean;
	user: Pick<AuthUser, 'id' | 'email' | 'name' | 'isAdmin'> | null;
};

export type DbUserRow = {
	id: string;
	email: string;
	name: string | null;
	role: string | null;
	password_hash: string | null;
};
