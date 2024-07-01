// Step 1: Define the User interface and Role enum
interface User {

  id: string;
  name: string;
  email: string;
  roles: Role[];
}

enum Role {
  USER = 'USER',

  ADMIN_BASIC = 'ADMIN_BASIC',
  ADMIN_ADVANCED = 'ADMIN_ADVANCED',
  MANAGER = 'MANAGER',
  AUDITOR = 'AUDITOR'
}

// Step 2: Create an AuthService to manage authentication and roles
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
      roles: [Role.ADMIN_ADVANCED]
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

// Step 3: Create a base AdminGuard class
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

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


// Step 4: Create specific guards for different admin pages
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

// Step 5: Create a RoleGuard for more flexible role-based access control
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

// Step 6: Set up routing with guards
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminUsersComponent } from './admin-users.component';
import { AdminSettingsComponent } from './admin-settings.component';
import { AccessDeniedComponent } from './access-denied.component';

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
    path: 'manager',
    component: ManagerDashboardComponent,
    canActivate: [RoleGuard],
    data: { roles: [Role.MANAGER, Role.ADMIN_ADVANCED] }
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
