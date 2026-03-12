import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    PasswordModule,
    FormsModule,
    IftaLabelModule,
    InputTextModule,
    ToastModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
  providers: [MessageService],
})
export class Login {

  private fb             = inject(FormBuilder);
  private authService    = inject(AuthService);
  private router         = inject(Router);
  private messageService = inject(MessageService);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  isLoading = false;

  constructor(private themeService: ThemeService) {}

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary:  'Campos requeridos',
        detail:   'Por favor, ingresa tu usuario y contraseña.',
      });
      return;
    }

    const { username, password } = this.loginForm.value;
    this.isLoading = true;

    this.authService.login(username, password).subscribe({
      next: (data) => {
        console.log('Login exitoso:', data);
        this.messageService.add({
          severity: 'success',
          summary:  'Bienvenido',
          detail:   'Inicio de sesión exitoso',
        });
      },
  error: (err) => {
    this.isLoading = false;

    if (err.status === 403) {
      this.messageService.add({
        severity: 'warn',
        summary:  'Cuenta desactivada',
        detail:   err.error?.message || 'Tu cuenta ha sido desactivada. Comunícate con tu supervisor.',
        life:     6000,
      });
      return;
    }

    this.messageService.add({
      severity: 'error',
      summary:  'Error de autenticación',
      detail:   err.error?.message || 'Credenciales incorrectas',
    });
  },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}