const API_URL = "http://localhost:8080";

export async function login(username: string, password: string) {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      // Tenta pegar a mensagem de erro do corpo da resposta
      let errorMessage = "Login inválido";
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Se não for JSON, pega o texto
        const errorText = await res.text();
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Erro no login:", error);
    throw error;
  }
}