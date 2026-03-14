import { Component, inject, OnInit } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { DrawerModule } from 'primeng/drawer';
import { RoleSocketService } from '../../core/services/role.socket.service';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-main',
  imports: [Sidebar, Header, RouterModule, DrawerModule],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main implements OnInit {
  private roleSocket = inject(RoleSocketService);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  mobileSidebarVisible = false;

  ngOnInit(): void {
    this.roleSocket.onRolePermissionsUpdated().subscribe((data) => {
      const miRolId = this.authService.getRoleId();
      if (Number(miRolId) === Number(data.roleId)) {
        this.authService.refrescarPermisosSilenciosamente();
      }
    });
  }

  openMobileSidebar() {
    this.mobileSidebarVisible = true;
  }
}
