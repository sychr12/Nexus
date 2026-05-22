const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

interface LoginResponse {
  token: string;
  username?: string;
  perfil?: string;
  role?: string;
}

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {

  try {

    const response = await fetch(
      `${API_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      }
    );

    // erro da API
    if (!response.ok) {

      let errorMessage = "Usuário ou senha inválidos";

      try {

        const errorData = await response.json();

        errorMessage =
          errorData.message ||
          errorData.error ||
          errorMessage;

      } catch {

        const textError = await response.text();

        if (textError) {
          errorMessage = textError;
        }
      }

      throw new Error(errorMessage);
    }

    // sucesso
    const data: LoginResponse = await response.json();

    return data;

  } catch (error) {

    console.error("Erro ao fazer login:", error);

    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error("Erro inesperado no login");
  }
}
