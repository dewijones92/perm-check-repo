// File: src/app/models/user.model.ts
export interface User {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  token?: string;
}

export enum Role {
  USER = 'USER',
  ADMIN_BASIC = 'ADMIN_BASIC',
  ADMIN_ADVANCED = 'ADMIN_ADVANCED',
  MANAGER = 'MANAGER',
  AUDITOR = 'AUDITOR'
}

// File: src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, Role } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor() {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<boolean> {
    // Implement login logic here
    // For this example, we'll just set a mock user
    const mockUser: User = {
      id: '1',
      name: 'John Doe',
      email: email,
      roles: [Role.ADMIN_ADVANCED],
      token: 'mock-jwt-token'
    };
    this.currentUserSubject.next(mockUser);
    return new Observable<boolean>(observer => {
      observer.next(true);
      observer.complete();
    });
  }

  logout(): void {
    this.currentUserSubject.next(null);
  }

  hasRole(role: Role): boolean {
    const user = this.currentUserValue;
    return user !== null && user.roles.includes(role);
  }
}

// File: src/app/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authService.hasRole(Role.ADMIN_ADVANCED)) {
      return true;
    } else {
      console.warn('Access denied: User does not have ADMIN_ADVANCED role');
      return this.router.createUrlTree(['/access-denied']);
    }
  }
}

// File: src/app/guards/admin-dashboard.guard.ts
@Injectable({
  providedIn: 'root'
})
export class AdminDashboardGuard extends AdminGuard {
  constructor(authService: AuthService, router: Router) {
    super(authService, router);
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (super.canActivate(route, state)) {
      console.log('Access granted: User can access Admin Dashboard');
      return true;
    }
    return false;
  }
}

// File: src/app/guards/admin-users.guard.ts
@Injectable({
  providedIn: 'root'
})
export class AdminUsersGuard extends AdminGuard {
  constructor(authService: AuthService, router: Router) {
    super(authService, router);
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (super.canActivate(route, state)) {
      console.log('Access granted: User can access Admin Users page');
      return true;
    }
    return false;
  }
}

// File: src/app/guards/admin-settings.guard.ts
@Injectable({
  providedIn: 'root'
})
export class AdminSettingsGuard extends AdminGuard {
  constructor(authService: AuthService, router: Router) {
    super(authService, router);
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (super.canActivate(route, state)) {
      console.log('Access granted: User can access Admin Settings page');
      return true;
    }
    return false;
  }
}

// File: src/app/guards/role.guard.ts
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const requiredRoles = route.data['roles'] as Role[];
    
    if (!requiredRoles || requiredRoles.length === 0) {
      console.warn('No roles specified for this route');
      return true;
    }

    const hasRequiredRole = requiredRoles.some(role => this.authService.hasRole(role));

    if (hasRequiredRole) {
      return true;
    } else {
      console.warn(`Access denied: User does not have any of the required roles: ${requiredRoles.join(', ')}`);
      return this.router.createUrlTree(['/access-denied']);
    }
  }
}

// File: src/app/components/user-profile.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-user-profile',
  template: `
    <h2>User Profile</h2>
    <p>Name: {{ user.name }}</p>
    <p>Email: {{ user.email }}</p>
    <p>Roles: {{ user.roles.join(', ') }}</p>
  `
})
export class UserProfileComponent {
  user: User;

  constructor(private authService: AuthService) {
    this.user = this.authService.currentUserValue!;
  }
}

// File: src/app/guards/user-profile.guard.ts
@Injectable({
  providedIn: 'root'
})
export class UserProfileGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    if (this.authService.currentUserValue) {
      return true;
    }
    return this.router.createUrlTree(['/login']);
  }
}

// File: src/app/services/logging.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] ${level.toUpperCase()}: ${message}`);
  }
}

// File: src/app/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const user = this.authService.currentUserValue;
    if (user && user.token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${user.token}`
        }
      });
    }
    return next.handle(request);
  }
}

// File: src/app/components/navigation.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { Role } from '../models/user.model';

@Component({
  selector: 'app-navigation',
  template: `
    <nav>
      <ul>
        <li><a routerLink="/home">Home</a></li>
        <li *ngIf="authService.hasRole(Role.USER)"><a routerLink="/profile">Profile</a></li>
        <li *ngIf="authService.hasRole(Role.ADMIN_ADVANCED)"><a routerLink="/admin/dashboard">Admin Dashboard</a></li>
        <li *ngIf="authService.hasRole(Role.MANAGER)"><a routerLink="/manager">Manager Dashboard</a></li>
        <li *ngIf="authService.hasRole(Role.AUDITOR)"><a routerLink="/auditor">Auditor Dashboard</a></li>
        <li><a (click)="logout()">Logout</a></li>
      </ul>
    </nav>
  `
})
export class NavigationComponent implements OnInit {
  Role = Role;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit() {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

// File: src/app/services/caching.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CachingService {
  private cache: Map<string, Observable<any>> = new Map();

  constructor(private http: HttpClient) {}

  get(url: string, ttl: number = 60000): Observable<any> {
    const cachedResponse = this.cache.get(url);
    if (cachedResponse) {
      return cachedResponse;
    }

    const response = this.http.get(url).pipe(
      tap(() => {
        setTimeout(() => this.cache.delete(url), ttl);
      }),
      shareReplay(1)
    );

    this.cache.set(url, response);
    return response;
  }
}

// File: src/app/directives/has-role.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/user.model';

@Directive({
  selector: '[appHasRole]'
})
export class HasRoleDirective implements OnInit {
  @Input('appHasRole') roles!: Role[];
  private isVisible = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.updateView();
    this.authService.currentUser.subscribe(() => this.updateView());
  }

  private updateView() {
    const hasRole = this.roles.some(role => this.authService.hasRole(role));

    if (hasRole && !this.isVisible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    } else if (!hasRole && this.isVisible) {
      this.viewContainer.clear();
      this.isVisible = false;
    }
  }
}

// File: src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard.component';
import { AdminUsersComponent } from './components/admin-users.component';
import { AdminSettingsComponent } from './components/admin-settings.component';
import { UserProfileComponent } from './components/user-profile.component';
import { AccessDeniedComponent } from './components/access-denied.component';
import { AdminDashboardGuard } from './guards/admin-dashboard.guard';
import { AdminUsersGuard } from './guards/admin-users.guard';
import { AdminSettingsGuard } from './guards/admin-settings.guard';
import { UserProfileGuard } from './guards/user-profile.guard';
import { RoleGuard } from './guards/role.guard';
import { Role } from './models/user.model';

const routes: Routes = [
  {
    path: 'admin',
    children: [
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
        canActivate: [AdminDashboardGuard]
      },
      {
        path: 'users',
        component: AdminUsersComponent,
        canActivate: [AdminUsersGuard]
      },
      {
        path: 'settings',
        component: AdminSettingsComponent,
        canActivate: [AdminSettingsGuard]
      }
    ]
  },
  {
    path: 'profile',
    component: UserProfileComponent,
    canActivate: [UserProfileGuard]
  },
  {
    path: 'manager',
    component: ManagerDashboardComponent,
    canActivate: [RoleGuard],
    data: { roles: [Role.AUDITOR] }
  },
  {
    path: 'auditor',
    component: AuditorDashboardComponent,
    canActivate: [RoleGuard],
    data: { roles: [Role.AUDITOR, Role.ADMIN_ADVANCED] }
  },
  { path: 'access-denied', component: AccessDeniedComponent },
  { path: '**', redirectTo: '/access-denied' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

// File: src/app/app.module.ts (continued)
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AdminDashboardComponent } from './components/admin-dashboard.component';
import { AdminUsersComponent } from './components/admin-users.component';
import { AdminSettingsComponent } from './components/admin-settings.component';
import { UserProfileComponent } from './components/user-profile.component';
import { NavigationComponent } from './components/navigation.component';
import { AccessDeniedComponent } from './components/access-denied.component';
import { LoginComponent } from './components/login.component';
import { ManagerDashboardComponent } from './components/manager-dashboard.component';
import { AuditorDashboardComponent } from './components/auditor-dashboard.component';
import { HasRoleDirective } from './directives/has-role.directive';
import { AuthService } from './services/auth.service';
import { LoggingService } from './services/logging.service';
import { CachingService } from './services/caching.service';
import { AuthInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    AdminDashboardComponent,
    AdminUsersComponent,
    AdminSettingsComponent,
    UserProfileComponent,
    NavigationComponent,
    AccessDeniedComponent,
    LoginComponent,
    ManagerDashboardComponent,
    AuditorDashboardComponent,
    HasRoleDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    AuthService,
    LoggingService,
    CachingService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

// File: src/app/components/login.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  template: `
    <h2>Login</h2>
    <form (ngSubmit)="onSubmit()">
      <div>
        <label for="email">Email:</label>
        <input type="email" id="email" [(ngModel)]="email" name="email" required>
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" [(ngModel)]="password" name="password" required>
      </div>
      <button type="submit">Login</button>
    </form>
  `
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.authService.login(this.email, this.password).subscribe(
      success => {
        if (success) {
          this.router.navigate(['/']);
        } else {
          console.error('Login failed');
        }
      },
      error => {
        console.error('Login error:', error);
      }
    );
  }
}

// File: src/app/components/manager-dashboard.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-manager-dashboard',
  template: `
    <h2>Manager Dashboard</h2>
    <p>Welcome to the Manager Dashboard. Here you can manage your team and projects.</p>
  `
})
export class ManagerDashboardComponent {}

// File: src/app/components/auditor-dashboard.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-auditor-dashboard',
  template: `
    <h2>Auditor Dashboard</h2>
    <p>Welcome to the Auditor Dashboard. Here you can review and audit system activities.</p>
  `
})
export class AuditorDashboardComponent {}

// File: src/app/components/admin-dashboard.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <h2>Admin Dashboard</h2>
    <p>Welcome to the Admin Dashboard. Here you can manage the entire system.</p>
    <nav>
      <ul>
        <li><a routerLink="/admin/users">Manage Users</a></li>
        <li><a routerLink="/admin/settings">System Settings</a></li>
      </ul>
    </nav>
  `
})
export class AdminDashboardComponent {}

// File: src/app/components/admin-users.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-users',
  template: `
    <h2>Admin Users Management</h2>
    <p>Here you can manage all users in the system.</p>
    <!-- Add user management functionality here -->
  `
})
export class AdminUsersComponent {}

// File: src/app/components/admin-settings.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-settings',
  template: `
    <h2>Admin Settings</h2>
    <p>Here you can configure system-wide settings.</p>
    <!-- Add settings management functionality here -->
  `
})
export class AdminSettingsComponent {}

// File: src/app/components/access-denied.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-access-denied',
  template: `
    <h2>Access Denied</h2>
    <p>Sorry, you do not have permission to access this page.</p>
    <a routerLink="/">Return to Home</a>
  `
})
export class AccessDeniedComponent {}

// File: src/app/app.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <app-navigation></app-navigation>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {}

// File: src/main.ts
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));