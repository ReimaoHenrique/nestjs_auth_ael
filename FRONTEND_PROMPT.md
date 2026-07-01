# Integração Frontend Angular × API de Autenticação

**Base URL:** `https://nestjs-auth-ael.vercel.app`  
**Swagger:** `https://nestjs-auth-ael.vercel.app/docs`

---

## Fluxo

```
[Register] → salva email + password + tags (opcional)
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
  "password": "senha-forte-123",
  "tags": ["financeiro", "rh"]
}
```

**Response 201:**
```json
{
  "id": 1,
  "email": "henrique@example.com",
  "name": "Henrique Reimao",
  "tags": ["financeiro", "rh"]
}
```

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
  "tags": ["financeiro", "rh"]
}
```

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

## Implementação Angular

### 1. Serviço de Autenticação

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  email: string;
  name: string | null;
  tags: string[];
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private api = 'https://nestjs-auth-ael.vercel.app/auth';

  private readonly ACCESS_KEY = 'accessToken';
  private readonly REFRESH_KEY = 'refreshToken';

  get accessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  login(email: string, password: string): Observable<Tokens> {
    return this.http.post<Tokens>(`${this.api}/login`, { email, password }).pipe(
      tap(tokens => this.saveTokens(tokens)),
    );
  }

  register(data: { name?: string; email: string; password: string; tags?: string[] }): Observable<User> {
    return this.http.post<User>(`${this.api}/register`, data);
  }

  refresh(): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(`${this.api}/refresh`, {
      refreshToken: this.refreshToken,
    });
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.api}/me`);
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/logout`, {
      refreshToken: this.refreshToken,
    });
  }

  saveTokens(tokens: Tokens): void {
    localStorage.setItem(this.ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_KEY, tokens.refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}
```

### 2. Interceptor HTTP

```typescript
import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse,
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private auth = inject(AuthService);
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.auth.accessToken;

    if (token) {
      req = this.addToken(req, token);
    }

    return next.handle(req).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401 && token) {
          return this.handle401(req, next);
        }
        return throwError(() => error);
      }),
    );
  }

  private addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  private handle401(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.auth.refresh().pipe(
        switchMap(({ accessToken }) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(accessToken);
          this.auth.saveTokens({ accessToken, refreshToken: this.auth.refreshToken! });
          return next.handle(this.addToken(req, accessToken));
        }),
        catchError(err => {
          this.isRefreshing = false;
          this.auth.clearTokens();
          return throwError(() => err);
        }),
      );
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next.handle(this.addToken(req, token!))),
    );
  }
}
```

### 3. Auth Guard

```typescript
import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean {
    if (this.auth.isAuthenticated()) return true;
    this.router.navigate(['/login']);
    return false;
  }
}
```

### 4. App Config

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HTTP_INTERCEPTORS, withInterceptorsFromDi } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
};
```

### 5. Login + Register com Tags

```typescript
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form (ngSubmit)="onSubmit()">
      <input [(ngModel)]="name" name="name" placeholder="Nome" />
      <input [(ngModel)]="email" name="email" type="email" placeholder="Email" required />
      <input [(ngModel)]="password" name="password" type="password" placeholder="Senha" required />
      <fieldset>
        <legend>Tags de acesso</legend>
        <label *ngFor="let tag of availableTags">
          <input type="checkbox" [value]="tag" (change)="toggleTag(tag)" />
          {{ tag }}
        </label>
      </fieldset>
      <button type="submit" [disabled]="loading">Cadastrar</button>
      <p *ngIf="error">{{ error }}</p>
    </form>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  selectedTags: string[] = [];
  availableTags = ['financeiro', 'rh', 'diario_de_obra', 'administrativo', 'comercial', 'estoque'];
  loading = false;
  error = '';

  toggleTag(tag: string) {
    const i = this.selectedTags.indexOf(tag);
    i >= 0 ? this.selectedTags.splice(i, 1) : this.selectedTags.push(tag);
  }

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.auth.register({
      name: this.name || undefined,
      email: this.email,
      password: this.password,
      tags: this.selectedTags.length ? this.selectedTags : undefined,
    }).subscribe({
      next: () => {
        this.auth.login(this.email, this.password).subscribe(() => {
          this.router.navigate(['/']);
        });
      },
      error: () => { this.error = 'Erro ao cadastrar'; this.loading = false; },
      complete: () => (this.loading = false),
    });
  }
}
```

---

## Resumo

1. **Login:** `AuthService.login()` → salva tokens no `localStorage`
2. **Register:** `AuthService.register()` com `tags` opcional → login automático
3. **Requisições:** `AuthInterceptor` injeta `Authorization: Bearer` automaticamente
4. **401:** interceptor faz refresh automático e retenta
5. **Logout:** `AuthService.logout()` + limpa `localStorage`
6. **Rotas:** `AuthGuard` redireciona pra `/login` se não autenticado
