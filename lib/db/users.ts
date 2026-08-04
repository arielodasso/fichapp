import { pool } from "./client";

export type UserRole = "ADMIN" | "EMPLOYEE";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { rows } = await pool.query<UserRow>(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.email, input.passwordHash, input.name, input.role]
  );
  return mapUser(rows[0]);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { rows } = await pool.query<UserRow>(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const { rows } = await pool.query<UserRow>(
    `SELECT * FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function listUsers(): Promise<User[]> {
  const { rows } = await pool.query<UserRow>(
    `SELECT * FROM users ORDER BY name ASC`
  );
  return rows.map(mapUser);
}

export async function countUsers(): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM users`
  );
  return Number(rows[0].count);
}
