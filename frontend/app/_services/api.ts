import { login as loginRequest, type LoginResponse } from "@/app/_lib/auth";

export async function login(username: string, password: string): Promise<LoginResponse> {
  return loginRequest(username, password);
}
