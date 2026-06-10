import { login as loginRequest, type LoginResponse } from "../lib/auth";

export async function login(username: string, password: string): Promise<LoginResponse> {
  return loginRequest(username, password);
}
