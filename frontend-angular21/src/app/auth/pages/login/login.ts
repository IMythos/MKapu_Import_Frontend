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
  imports: [CardModule, ButtonModule, PasswordModule, FormsModule, IftaLabelModule, InputTextModule, ToastModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  providers: [MessageService]
})
export class Login {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  isLoading = false;

  constructor(private themeService: ThemeService) {}

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  onSubmit(): void {
    /*
  if (this.loginForm.invalid) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Formulario inválido',
      detail: 'Por favor, complete todos los campos'
    });
    return;


  this.isLoading = true;
 
  console.log('este es el form:', { username, password });

    */
    const { username, password } = this.loginForm.value;

  this.authService.login(username, password).subscribe({
    next: (data) => {
      console.log('Login exitoso:', data);
      this.messageService.add({
        severity: 'success',
        summary: 'Bienvenido',
        detail: 'Inicio de sesión exitoso'
      });
    },
    error: (err) => {
      console.error('Error al logearse:', err);
      this.isLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error de autenticación',
        detail: err.error?.message || 'Credenciales incorrectas'
      });
    },
    complete: () => {
      this.isLoading = false;
    }
  });

  /*
  // ✅ SIMULACIÓN temporal para desarrollo
  setTimeout(() => {
    this.isLoading = false;
    
    // Guardar token falso en localStorage (para que los guards lo detecten)
    localStorage.setItem('token', 'fake-token-for-dev');
    localStorage.setItem('userRole', 'ADMIN'); // o el rol que necesites

    this.messageService.add({
      severity: 'success',
      summary: 'Bienvenido',
      detail: 'Inicio de sesión exitoso (modo desarrollo)'
    });

    // Redirigir al dashboard de admin

    //this.router.navigate(['/gestion-productos']);

    this.router.navigate(['/dashboard-admin']);
  }, 500);
  */
}

}
