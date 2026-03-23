import { Component, OnDestroy, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { RoleService } from '../../core/services/role.service';
import { CashboxSocketService } from '../../ventas/services/cashbox-socket.service';
import { ThemeService } from '../../core/services/theme.service';
import { CommonModule } from '@angular/common';
import { TransferNotificationRuntimeService } from '../../administracion/services/transfer-notification-runtime.service';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-header',
  imports: [CommonModule, ToolbarModule, ButtonModule, InputTextModule,
            RouterLink, ToastModule, TooltipModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
  standalone: true,
})
export class Header implements OnInit, OnDestroy {
  private router          = inject(Router);
  private roleService     = inject(RoleService);
  protected cashboxSocket = inject(CashboxSocketService);
  protected themeService  = inject(ThemeService);
  private readonly transferNotificationRuntime = inject(TransferNotificationRuntimeService);

  @Output() toggleSidebar = new EventEmitter<void>();

  // Getter para que se re-evalúe cada vez que el template lo consulta
  get showCaja(): boolean {
    return this.roleService.hasPermiso('VER_CAJA');
  }

  // Solo el administrador ve configuración de empresa y términos
  get isAdmin(): boolean {
    return this.roleService.getRoleName().toUpperCase() === 'ADMINISTRADOR';
  }

  notifCount = this.loadNotifCount();
  readonly caja = this.cashboxSocket.caja;
  sedeNombre: string = this.roleService.getCurrentUser()?.sedeNombre ?? '';

  private readonly handleNotificationCountUpdate = (event: Event): void => {
    const customEvent = event as CustomEvent<number>;
    const count = Number(customEvent.detail ?? 0);
    this.notifCount = Number.isFinite(count) && count > 0 ? count : 0;
  };

  ngOnInit(): void {
    this.transferNotificationRuntime.start();

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => (this.notifCount = this.loadNotifCount()));

    if (typeof window !== 'undefined') {
      window.addEventListener('transfer-notification-count-updated', this.handleNotificationCountUpdate);
    }

    if (this.showCaja) {
      const user    = this.roleService.getCurrentUser();
      const id_sede = user?.idSede;
      if (id_sede) {
        this.cashboxSocket.checkActiveSession(id_sede);
      }
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('transfer-notification-count-updated', this.handleNotificationCountUpdate);
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  private loadNotifCount(): number {
    if (typeof localStorage === 'undefined') return 0;
    const raw   = localStorage.getItem('transferencia_notif_count');
    const count = raw ? Number(raw) : 0;
    return Number.isFinite(count) && count > 0 ? count : 0;
  }
}