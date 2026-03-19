import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import 'primeflex/primeflex.css';
import { App } from './app/app';
import { routes } from './app/app.routes';
import MyPreset from './app/core/mypreset';

bootstrapApplication(App, {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
    MessageService,
    ConfirmationService,
    providePrimeNG({
      theme: {
        preset: MyPreset,
        options: {
          darkModeSelector: '.app-dark',
        },
      },
      translation: {
        firstDayOfWeek: 1,
        dayNames: [
          'domingo',
          'lunes',
          'martes',
          'miercoles',
          'jueves',
          'viernes',
          'sabado',
        ],
        dayNamesShort: ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'],
        dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
        monthNames: [
          'enero',
          'febrero',
          'marzo',
          'abril',
          'mayo',
          'junio',
          'julio',
          'agosto',
          'septiembre',
          'octubre',
          'noviembre',
          'diciembre',
        ],
        monthNamesShort: [
          'ene',
          'feb',
          'mar',
          'abr',
          'may',
          'jun',
          'jul',
          'ago',
          'sep',
          'oct',
          'nov',
          'dic',
        ],
        today: 'Hoy',
        clear: 'Limpiar',
        dateFormat: 'dd/mm/yy',
      },
    }),
  ],
}).catch((err) => console.error(err));
