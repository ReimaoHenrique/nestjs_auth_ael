# Integração Frontend × API de Autenticação

**Base URL:** `https://nestjs-auth-ael.vercel.app`  
**Swagger:** `https://nestjs-auth-ael.vercel.app/docs`

---

## Fluxo

```
[Register] → salva email + password
     ↓
[Login]    → recebe accessToken (15min) + refreshToken (7d)
     ↓
[Me]       → usa accessToken no header Authorization para pegar dados do user
     ↓
[Refresh]  → quando accessToken expirar, troca refreshToken por um novo accessToken
     ↓
[Logout]   → descarta o refreshToken no servidor
```

---

## Endpoints

### POST /auth/register

```http
POST https://nestjs-auth-ael.vercel.app/auth/register
Content-Type: application/json

{
  "name": "Henrique Reimao",
  "email": "henrique@example.com",
  "password": "senha-forte-123"
}
```

**Response 201:**
```json
{
  "id": 1,
  "email": "henrique@example.com",
  "name": "Henrique Reimao",
  "access": "default"
}
```

---

### POST /auth/login

```http
POST https://nestjs-auth-ael.vercel.app/auth/login
Content-Type: application/json

{
  "email": "henrique@example.com",
  "password": "senha-forte-123"
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJI...",
  "refreshToken": "eyJhbGciOiJI..."
}
```

---

### GET /auth/me

```http
GET https://nestjs-auth-ael.vercel.app/auth/me
Authorization: Bearer eyJhbGciOiJI...
```

**Response 200:**
```json
{
  "id": 1,
  "email": "henrique@example.com",
  "name": "Henrique Reimao",
  "access": "default"
}
```

---

### POST /auth/refresh

```http
POST https://nestjs-auth-ael.vercel.app/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJI..."
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJI..."
}
```

---

### POST /auth/logout

```http
POST https://nestjs-auth-ael.vercel.app/auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJI..."
}
```

**Response 200:**
```json
{
  "message": "Logged out successfully"
}
```

---

## Exemplo de implementação (React + TypeScript)

```typescript
// api/auth.ts
const API = 'https://nestjs-auth-ael.vercel.app/auth'

interface Tokens {
  accessToken: string
  refreshToken: string
}

// --- Login ---
async function login(email: string, password: string): Promise<Tokens> {
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Invalid credentials')
  return res.json()
}

// --- Register ---
async function register(data: { name?: string; email: string; password: string }) {
  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Registration failed')
  return res.json()
}

// --- Refresh ---
async function refresh(refreshToken: string): Promise<{ accessToken: string }> {
  const res = await fetch(`${API}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) throw new Error('Refresh failed')
  return res.json()
}

// --- Logout ---
async function logout(refreshToken: string) {
  await fetch(`${API}/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
}

// --- Me (user autenticado) ---
async function me(accessToken: string) {
  const res = await fetch(`${API}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Unauthorized')
  return res.json()
}
```

```typescript
// hooks/useAuth.tsx
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface User {
  id: number
  email: string
  name: string | null
  access: string
}

interface AuthContext {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (data: { name?: string; email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthCtx = createContext<AuthContext>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Tenta restaurar sessão ao carregar a página
  useEffect(() => {
    const access = localStorage.getItem('accessToken')
    const refresh = localStorage.getItem('refreshToken')
    if (access && refresh) {
      me(access)
        .then(setUser)
        .catch(() => refreshTokens(refresh))
    }
    setLoading(false)
  }, [])

  async function refreshTokens(refreshToken: string) {
    try {
      const { accessToken } = await refresh(refreshToken)
      localStorage.setItem('accessToken', accessToken)
      const user = await me(accessToken)
      setUser(user)
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setUser(null)
    }
  }

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await login(email, password)
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
    const user = await me(tokens.accessToken)
    setUser(user)
  }, [])

  const register = useCallback(async (data: { name?: string; email: string; password: string }) => {
    await register(data)
    // login automático após cadastro
    await login(data.email, data.password)
  }, [])

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('refreshToken')
    if (refresh) await logout(refresh)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }, [])

  return (
    <AuthCtx.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
```

```typescript
// api/client.ts — fetch wrapper com refresh automático
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = []

function processQueue(error: any, token: string | null) {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

export async function authFetch(url: string, options: RequestInit = {}) {
  let accessToken = localStorage.getItem('accessToken')

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (res.status !== 401) return res  // se não for 401, continua

  // 401 → tenta refresh automático
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) throw new Error('No refresh token')

  if (isRefreshing) {
    // Se já está refreshindo, enfileira
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject })
    }).then(token => {
      return fetch(url, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${token}` },
      })
    })
  }

  isRefreshing = true

  try {
    const { accessToken: newToken } = await refresh(refreshToken)
    localStorage.setItem('accessToken', newToken)
    processQueue(null, newToken)
    return fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
    })
  } catch (err) {
    processQueue(err, null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    throw err
  } finally {
    isRefreshing = false
  }
}
```

---

## Resumo para o frontend

1. **Login:** chama `POST /auth/login`, salva `accessToken` e `refreshToken` no `localStorage`
2. **Requisições autenticadas:** manda `Authorization: Bearer <accessToken>` no header
3. **Token expirou (401):** usa `POST /auth/refresh` com o `refreshToken` para pegar um novo `accessToken`, atualiza o `localStorage` e retenta a request original
4. **Logout:** chama `POST /auth/logout` com o `refreshToken` e limpa o `localStorage`
5. **Register:** chama `POST /auth/register` e já faz login automático em seguida
