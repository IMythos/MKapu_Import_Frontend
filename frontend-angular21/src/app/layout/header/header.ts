import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { RoleService } from '../../core/services/role.service';
import { CashboxSocketService } from '../../ventas/services/cashbox-socket.service';
import { UserRole } from '../../core/constants/roles.constants';
import { ThemeService } from '../../core/services/theme.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule, ToolbarModule, ButtonModule, InputTextModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
  standalone: true,
})
export class Header implements OnInit {
  private router         = inject(Router);
  private roleService    = inject(RoleService);
  protected cashboxSocket= inject(CashboxSocketService);
  protected themeService = inject(ThemeService);

  @Output() toggleSidebar = new EventEmitter<void>();

  readonly isVentas  = this.roleService.getCurrentUserRole() === UserRole.VENTAS;
  notifCount = this.loadNotifCount();

  readonly caja = this.cashboxSocket.caja;

  ngOnInit(): void {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => (this.notifCount = this.loadNotifCount()));

    if (this.isVentas) {
      const id_sede = this.roleService.getCurrentUser()?.idSede;
      if (id_sede) {
        this.cashboxSocket.checkActiveSession(id_sede);
      }
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  private loadNotifCount(): number {
    const raw   = localStorage.getItem('transferencia_notif_count');
    const count = raw ? Number(raw) : 0;
    return Number.isFinite(count) && count > 0 ? count : 0;
  }
}