interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: "CLIENT" | "PARTNER";
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    tokens: null,
    isAuthenticated: false,
  };
  private refreshPromise: Promise<string> | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    const accessToken = localStorage.getItem('access-token');
    const refreshToken = localStorage.getItem('refresh-token');
    const userStr = localStorage.getItem('user');

    if (accessToken && refreshToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.authState = {
          user,
          tokens: { accessToken, refreshToken },
          isAuthenticated: true,
        };
      } catch (error) {
        this.clearAuth();
      }
    }
  }

  private saveToStorage(tokens: AuthTokens, user: User): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem('access-token', tokens.accessToken);
    localStorage.setItem('refresh-token', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  }

  private clearStorage(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('access-token');
    localStorage.removeItem('refresh-token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth-token'); // Remove old token format
  }

  setAuth(tokens: AuthTokens, user: User): void {
    this.authState = {
      user,
      tokens,
      isAuthenticated: true,
    };
    this.saveToStorage(tokens, user);
  }

  clearAuth(): void {
    this.authState = {
      user: null,
      tokens: null,
      isAuthenticated: false,
    };
    this.clearStorage();
    this.refreshPromise = null;
  }

  getAccessToken(): string | null {
    return this.authState.tokens?.accessToken || null;
  }

  getRefreshToken(): string | null {
    return this.authState.tokens?.refreshToken || null;
  }

  getUser(): User | null {
    return this.authState.user;
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated && !!this.authState.tokens?.accessToken;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  async refreshAccessToken(): Promise<string> {
    // If there's already a refresh in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      const newAccessToken = await this.refreshPromise;
      return newAccessToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<string> {
    const response = await fetch('http://localhost:3001/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      this.clearAuth();
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    if (this.authState.user && this.authState.tokens) {
      const newTokens: AuthTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || refreshToken, // Use new refresh token if provided
      };
      
      this.setAuth(newTokens, this.authState.user);
    }

    return data.accessToken;
  }

  async getValidAccessToken(): Promise<string | null> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      return null;
    }

    // If token is not expired, return it
    if (!this.isTokenExpired(accessToken)) {
      return accessToken;
    }

    // Token is expired, try to refresh
    try {
      return await this.refreshAccessToken();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      this.clearAuth();
      return null;
    }
  }
}

export const authService = AuthService.getInstance();
export type { AuthTokens, User, AuthState };
