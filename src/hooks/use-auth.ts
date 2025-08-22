import { useState } from "react";

interface LoginData {
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  // Add more user properties as needed.
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  async function login(data: LoginData): Promise<User> {
    // Replace '/api/login' with your actual API endpoint.
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Login failed");
    }

    const userData: User = await response.json();
    setUser(userData);
    return userData;
  }

  return { user, login };
}
