# 🔗 Guía de Integración Frontend-Backend

## 📋 Pasos para Conectar el Frontend Angular con el Backend

### 1️⃣ Configurar HttpClientModule

**Archivo:** `rifas-front/src/app/app.module.ts`

```typescript
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule  // ← Agregar esto
  ],
  // ...
})
```

---

### 2️⃣ Configurar URL de la API

**Archivo:** `rifas-front/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'  // ← Agregar esto
};
```

**Archivo:** `rifas-front/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-dominio.com/api'  // URL de producción
};
```

---

### 3️⃣ Crear Servicios HTTP

#### A) Servicio de Rifas

**Crear:** `rifas-front/src/app/services/rifas.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Rifa {
  _id: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  precioTicketUSD: number;
  ticketsDisponibles: number;
  totalTickets: number;
  fechaSorteo: Date;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class RifasService {
  private apiUrl = `${environment.apiUrl}/rifas`;

  constructor(private http: HttpClient) { }

  obtenerRifasActivas(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  obtenerRifaPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}
```

#### B) Servicio de Países

**Crear:** `rifas-front/src/app/services/paises.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaisesService {
  private apiUrl = `${environment.apiUrl}/paises`;

  constructor(private http: HttpClient) { }

  obtenerPaises(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
```

#### C) Servicio de Bancos

**Crear:** `rifas-front/src/app/services/bancos.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BancosService {
  private apiUrl = `${environment.apiUrl}/bancos`;

  constructor(private http: HttpClient) { }

  obtenerBancosPorPais(codigoPais: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pais/${codigoPais}`);
  }
}
```

#### D) Servicio de Compras (Principal)

**Crear:** `rifas-front/src/app/services/compras.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ComprasService {
  private apiUrl = `${environment.apiUrl}/compras`;

  constructor(private http: HttpClient) { }

  obtenerTasaBCV(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/tasa`);
  }

  crearCompra(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }

  verificarTicketsPorEmail(email: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verificar/${email}`);
  }
}
```

---

### 4️⃣ Actualizar MainComponent

**Archivo:** `rifas-front/src/app/components/main/main.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RifasService } from '../../services/rifas.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  rifas: any[] = [];
  cargando: boolean = true;

  constructor(
    private router: Router,
    private rifasService: RifasService
  ) { }

  ngOnInit(): void {
    this.cargarRifas();
  }

  cargarRifas(): void {
    this.rifasService.obtenerRifasActivas().subscribe({
      next: (response) => {
        if (response.success) {
          this.rifas = response.data;
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar rifas:', error);
        this.cargando = false;
      }
    });
  }

  redirectToCompraRifas(rifaId: string): void {
    this.router.navigate(['/rifa'], { queryParams: { id: rifaId } });
  }
}
```

**Actualizar HTML:** `rifas-front/src/app/components/main/main.component.html`

```html
<!-- Reemplazar el grid hardcoded con esto: -->
<div *ngIf="cargando" class="text-center py-8">
  <p class="text-white">Cargando rifas...</p>
</div>

<div *ngIf="!cargando && rifas.length === 0" class="text-center py-8">
  <p class="text-white">No hay rifas disponibles en este momento.</p>
</div>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
  <article *ngFor="let rifa of rifas" 
           class="flex flex-col gap-3 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
    <div class="w-full aspect-video bg-center bg-no-repeat bg-cover" 
         [style.background-image]="'url(' + rifa.imagenUrl + ')'" 
         role="img" 
         [attr.aria-label]="rifa.titulo"></div>
    <div class="p-4 flex flex-col flex-grow min-h-[220px]">
      <h3 class="text-lg font-bold text-gray-900 dark:text-white h-16 overflow-hidden">
        {{ rifa.titulo }}
      </h3>
      <div class="flex items-center justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
        <span class="font-semibold text-blue-600">${{ rifa.precioTicketUSD }} por boleto</span>
        <span>{{ rifa.ticketsDisponibles }} disponibles</span>
      </div>
      <p class="mt-3 mb-4 text-sm text-gray-600 dark:text-gray-400">
        {{ rifa.descripcion }}
      </p>
      <button class="w-full mt-auto h-12 rounded-lg bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors" 
              (click)="redirectToCompraRifas(rifa._id)">
        Comprar Boleto
      </button>
    </div>
  </article>
</div>
```

---

### 5️⃣ Actualizar CompraRifasComponent

**Archivo:** `rifas-front/src/app/components/compra-rifas/compra-rifas.component.ts`

Agregar imports y servicios:

```typescript
import { ActivatedRoute } from '@angular/router';
import { RifasService } from '../../services/rifas.service';
import { PaisesService } from '../../services/paises.service';
import { BancosService } from '../../services/bancos.service';
import { ComprasService } from '../../services/compras.service';

export class CompraRifasComponent implements OnInit {
  // Agregar propiedades
  rifaId: string = '';
  rifaSeleccionada: any = null;
  paises: any[] = [];
  bancos: any[] = [];
  bancosDisponibles: any[] = [];
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private rifasService: RifasService,
    private paisesService: PaisesService,
    private bancosService: BancosService,
    private comprasService: ComprasService
  ) { }

  ngOnInit(): void {
    // Obtener ID de la rifa desde la URL
    this.route.queryParams.subscribe(params => {
      this.rifaId = params['id'];
      if (this.rifaId) {
        this.cargarRifa();
      }
    });
    
    this.cargarPaises();
    this.cargarTasa();
  }

  cargarRifa(): void {
    this.rifasService.obtenerRifaPorId(this.rifaId).subscribe({
      next: (response) => {
        if (response.success) {
          this.rifaSeleccionada = response.data;
          this.precioPorTicket = response.data.precioTicketUSD;
          this.calcularTotal();
        }
      },
      error: (error) => {
        console.error('Error al cargar rifa:', error);
        alert('Error al cargar la rifa');
        this.router.navigate(['/']);
      }
    });
  }

  cargarPaises(): void {
    this.paisesService.obtenerPaises().subscribe({
      next: (response) => {
        if (response.success) {
          this.paises = response.data;
        }
      },
      error: (error) => {
        console.error('Error al cargar países:', error);
      }
    });
  }

  cargarTasa(): void {
    this.comprasService.obtenerTasaBCV().subscribe({
      next: (response) => {
        if (response.success) {
          this.tasaCambio = response.data.tasa;
          this.calcularTotal();
        }
      },
      error: (error) => {
        console.error('Error al obtener tasa:', error);
      }
    });
  }

  onCambioPais(): void {
    this.telefono = '';
    this.errores.telefono = '';
    
    // Cargar bancos del país seleccionado
    if (this.codigoPais) {
      this.bancosService.obtenerBancosPorPais(this.codigoPais).subscribe({
        next: (response) => {
          if (response.success) {
            this.bancosDisponibles = response.data;
          }
        },
        error: (error) => {
          console.error('Error al cargar bancos:', error);
        }
      });
    }
  }

  comprarTickets(): void {
    if (!this.validarPaso3()) {
      return;
    }

    // ⭐ IMPORTANTE: Crear FormData para enviar archivo
    // FormData es necesario para enviar archivos (multipart/form-data)
    const formData = new FormData();
    
    // Agregar todos los campos de texto
    formData.append('rifaId', this.rifaId);
    formData.append('cantidadTickets', this.cantidadTickets.toString());
    formData.append('nombreCompleto', this.nombreCompleto);
    formData.append('email', this.email);
    formData.append('codigoPais', this.codigoPais);
    formData.append('telefono', this.telefono);
    formData.append('nombreTitular', this.nombreTitular);
    formData.append('metodoPago', this.metodoPago);
    formData.append('bancoId', this.bancoSeleccionado);
    formData.append('codigoReferencia', this.codigoReferencia);
    
    // ⭐ CRÍTICO: Agregar el archivo (comprobante de pago)
    // El nombre del campo debe ser 'comprobante' (igual que en el backend)
    // archivoSeleccionado es un objeto File que viene del input type="file"
    if (this.archivoSeleccionado) {
      formData.append('comprobante', this.archivoSeleccionado, this.archivoSeleccionado.name);
    }

    // ⭐ NOTA: NO establecer Content-Type manualmente
    // Angular lo hace automáticamente con FormData
    // HttpClient detecta FormData y configura multipart/form-data

    // Enviar al backend
    this.comprasService.crearCompra(formData).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Compra exitosa:', response.data);
          this.mostrarModalExito = true;
          
          // Guardar números para mostrar en el modal
          this.numerosAsignados = response.data.tickets;
          
          setTimeout(() => {
            this.cerrarModalExito();
          }, 5000);
        }
      },
      error: (error) => {
        console.error('Error al crear compra:', error);
        alert(error.error?.message || 'Error al procesar la compra');
      }
    });
  }

  verificarTickets(): void {
    if (!this.emailVerificar) {
      alert('Por favor ingresa tu email');
      return;
    }

    this.comprasService.verificarTicketsPorEmail(this.emailVerificar).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Tickets encontrados:', response.data);
          // Mostrar los tickets en un modal o lista
          alert(`Se encontraron ${response.data.length} compra(s) para este email`);
        }
      },
      error: (error) => {
        console.error('Error al verificar tickets:', error);
        alert(error.error?.message || 'No se encontraron compras para este email');
      }
    });
    
    this.cerrarModalVerificar();
  }
}
```

---

### 6️⃣ Manejo de Archivos (Comprobante de Pago)

#### A) Método onFileSelected

Este método ya existe en tu componente, pero asegúrate de que esté correctamente implementado:

```typescript
// En CompraRifasComponent
archivoSeleccionado: File | null = null;

onFileSelected(event: any): void {
  const file = event.target.files[0];
  if (file) {
    // ⭐ Validar tipo de archivo (solo imágenes)
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!tiposPermitidos.includes(file.type)) {
      this.errores.comprobante = 'Solo se permiten imágenes (JPG, PNG, GIF, WEBP)';
      this.archivoSeleccionado = null;
      return;
    }
    
    // ⭐ Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (file.size > maxSize) {
      this.errores.comprobante = 'El archivo no debe superar los 5MB';
      this.archivoSeleccionado = null;
      return;
    }
    
    // ⭐ Guardar el archivo
    this.archivoSeleccionado = file;
    this.errores.comprobante = '';
    console.log('Archivo seleccionado:', file.name, 'Tamaño:', (file.size / 1024).toFixed(2) + ' KB');
  }
}
```

#### B) Input de Archivo en el HTML

En el **Paso 3** del formulario, asegúrate de tener:

```html
<!-- Campo para subir comprobante -->
<div class="mb-4">
  <label class="block text-sm font-medium text-gray-700 mb-2">
    Comprobante de Pago *
  </label>
  <input 
    type="file"
    accept="image/*"
    (change)="onFileSelected($event)"
    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    required>
  
  <!-- Mostrar nombre del archivo seleccionado -->
  <p *ngIf="archivoSeleccionado" class="text-sm text-green-600 mt-2">
    ✓ Archivo seleccionado: {{ archivoSeleccionado.name }}
  </p>
  
  <!-- Mostrar error si existe -->
  <p *ngIf="errores.comprobante" class="text-sm text-red-600 mt-2">
    {{ errores.comprobante }}
  </p>
</div>
```

#### C) Flujo Completo del Archivo

```
1. Usuario hace clic en "Seleccionar archivo"
   ↓
2. Usuario selecciona imagen (JPG, PNG, etc.)
   ↓
3. onFileSelected() se ejecuta
   ↓
4. Se valida tipo y tamaño
   ↓
5. Se guarda en archivoSeleccionado (File object)
   ↓
6. Usuario hace clic en "Comprar"
   ↓
7. comprarTickets() crea FormData
   ↓
8. Se agrega archivo: formData.append('comprobante', archivoSeleccionado)
   ↓
9. HttpClient envía como multipart/form-data
   ↓
10. Backend (Multer) recibe el archivo
   ↓
11. Backend sube a ImgBB
   ↓
12. Backend guarda URL en MongoDB
   ↓
13. Backend responde con éxito
```

#### D) Importante: Content-Type

**❌ NO HAGAS ESTO:**
```typescript
// NO establecer Content-Type manualmente
const headers = new HttpHeaders({
  'Content-Type': 'multipart/form-data' // ❌ INCORRECTO
});
```

**✅ HAZ ESTO:**
```typescript
// Angular detecta FormData automáticamente
this.http.post(url, formData) // ✅ CORRECTO
// Angular establece Content-Type con boundary automáticamente
```

---

### 7️⃣ Actualizar HTML del Formulario

En el **Paso 3** del formulario, agregar selector de banco:

```html
<!-- Después del campo de método de pago -->
<div class="mb-4">
  <label class="block text-sm font-medium text-gray-700 mb-2">
    Banco / Método *
  </label>
  <select 
    [(ngModel)]="bancoSeleccionado"
    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    required>
    <option value="">Selecciona un banco</option>
    <option *ngFor="let banco of bancosDisponibles" [value]="banco._id">
      {{ banco.nombre }} - {{ banco.metodoPago }}
    </option>
  </select>
</div>
```

---

### 8️⃣ Probar la Integración

#### Checklist de Pruebas:

1. **Backend corriendo**
   ```bash
   cd rifas-back
   npm start
   ```

2. **Frontend corriendo**
   ```bash
   cd rifas-front
   ng serve
   ```

3. **Verificar en navegador:**
   - ✅ http://localhost:4200 carga correctamente
   - ✅ Se muestran las rifas desde la API
   - ✅ Al hacer clic en "Comprar Boleto" se carga el formulario
   - ✅ Los países se cargan desde la API
   - ✅ Al seleccionar país, se cargan los bancos
   - ✅ La tasa BCV se actualiza automáticamente
   - ✅ **Se puede seleccionar archivo de comprobante**
   - ✅ **Se muestra el nombre del archivo seleccionado**
   - ✅ Al enviar el formulario, se crea la compra
   - ✅ **El comprobante se sube a ImgBB**
   - ✅ Se recibe email de confirmación
   - ✅ El modal de éxito muestra los números asignados

---

### 9️⃣ Troubleshooting - Problemas con Archivos

#### Error: "No se envía el archivo al backend"

**Síntomas:**
- El backend responde que falta el comprobante
- `req.file` es `undefined` en el backend

**Soluciones:**

1. **Verifica que uses FormData:**
```typescript
const formData = new FormData(); // ✅ Correcto
formData.append('comprobante', this.archivoSeleccionado);
```

2. **Verifica el nombre del campo:**
```typescript
// El nombre debe coincidir con el backend (Multer)
formData.append('comprobante', file); // ✅ 'comprobante' es correcto
```

3. **NO uses JSON:**
```typescript
// ❌ INCORRECTO
const body = {
  comprobante: this.archivoSeleccionado // No funciona
};

// ✅ CORRECTO
const formData = new FormData();
formData.append('comprobante', this.archivoSeleccionado);
```

4. **NO establezcas Content-Type:**
```typescript
// ❌ INCORRECTO
const headers = new HttpHeaders({
  'Content-Type': 'multipart/form-data'
});

// ✅ CORRECTO (sin headers)
this.http.post(url, formData) // Angular lo hace automáticamente
```

#### Error: "Solo se permiten imágenes"

**Causa:** Intentas subir un archivo que no es imagen

**Solución:**
```typescript
// Validar en el frontend
const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
if (!tiposPermitidos.includes(file.type)) {
  alert('Solo se permiten imágenes');
  return;
}
```

#### Error: "El archivo es muy grande"

**Causa:** El archivo supera los 5MB

**Solución:**
```typescript
// Validar tamaño
const maxSize = 5 * 1024 * 1024; // 5MB
if (file.size > maxSize) {
  alert('El archivo no debe superar los 5MB');
  return;
}
```

#### Error: "Error al subir imagen a ImgBB"

**Causa:** Problema con la API de ImgBB

**Soluciones:**
1. Verifica que `IMGBB_API_KEY` esté configurada en `.env`
2. Verifica que la API Key sea válida
3. Verifica conexión a internet
4. Revisa los logs del backend

#### Verificar que el archivo se envía correctamente

**En el navegador (DevTools):**

1. Abre DevTools (F12)
2. Ve a la pestaña "Network"
3. Envía el formulario
4. Busca la petición POST a `/api/compras`
5. En "Headers", verifica:
   ```
   Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
   ```
6. En "Payload" o "Request", deberías ver:
   ```
   ------WebKitFormBoundary...
   Content-Disposition: form-data; name="comprobante"; filename="imagen.jpg"
   Content-Type: image/jpeg
   
   [binary data]
   ```

---

### 🔟 Manejo de Errores

Agregar interceptor para manejar errores globalmente:

**Crear:** `rifas-front/src/app/interceptors/error.interceptor.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Ocurrió un error';
        
        if (error.error instanceof ErrorEvent) {
          // Error del cliente
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Error del servidor
          errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
        }
        
        console.error('Error HTTP:', errorMessage);
        return throwError(() => error);
      })
    );
  }
}
```

Registrar en `app.module.ts`:

```typescript
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ErrorInterceptor } from './interceptors/error.interceptor';

@NgModule({
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ]
})
```

---

### 9️⃣ Variables Adicionales Necesarias

Agregar al componente `CompraRifasComponent`:

```typescript
bancoSeleccionado: string = '';
numerosAsignados: number[] = [];
```

---

### 🔟 Actualizar Modal de Éxito

Mostrar los números asignados en el modal:

```html
<div *ngIf="mostrarModalExito" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
    <div class="text-center">
      <div class="text-6xl mb-4">🎉</div>
      <h3 class="text-2xl font-bold text-gray-900 mb-4">¡Compra Exitosa!</h3>
      
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
        <h4 class="font-bold text-blue-900 mb-2">Tus Números de la Suerte:</h4>
        <div class="flex flex-wrap gap-2 justify-center">
          <span *ngFor="let numero of numerosAsignados" 
                class="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xl">
            {{ numero }}
          </span>
        </div>
      </div>
      
      <p class="text-gray-600 mb-6">
        Revisa tu correo electrónico para ver los detalles completos de tu compra.
      </p>
      
      <button (click)="cerrarModalExito()" 
              class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
        Entendido
      </button>
    </div>
  </div>
</div>
```

---

## ✅ Checklist Final

- [ ] HttpClientModule agregado
- [ ] environment.ts configurado con apiUrl
- [ ] Servicios HTTP creados (rifas, paises, bancos, compras)
- [ ] MainComponent actualizado para cargar rifas
- [ ] CompraRifasComponent actualizado para enviar datos
- [ ] Selector de bancos agregado
- [ ] Modal de éxito muestra números asignados
- [ ] Manejo de errores implementado
- [ ] Backend corriendo en puerto 8080
- [ ] Frontend corriendo en puerto 4200
- [ ] CORS configurado correctamente
- [ ] Prueba completa de compra realizada
- [ ] Email de confirmación recibido

---

## 🎯 Resultado Esperado

Al completar estos pasos, tendrás:

1. ✅ Rifas cargadas dinámicamente desde MongoDB
2. ✅ Formulario conectado al backend
3. ✅ Números aleatorios generados en el servidor
4. ✅ Email enviado automáticamente
5. ✅ Tasa BCV actualizada en tiempo real
6. ✅ Comprobantes guardados en el servidor
7. ✅ Sistema completamente funcional

---

## 🐛 Troubleshooting

### Error de CORS
Si ves errores de CORS en la consola:
- Verifica que el backend tenga `http://localhost:4200` en la lista de orígenes permitidos
- Reinicia ambos servidores

### No se cargan las rifas
- Verifica que el backend esté corriendo
- Abre http://localhost:8080/api/rifas en el navegador
- Revisa la consola del navegador para ver errores

### No se envían emails
- Verifica las credenciales en `.env`
- Usa una contraseña de aplicación de Gmail
- Revisa los logs del servidor backend

---

## 📸 Ejemplo Completo: Envío de Archivo

### Código Completo del Componente

```typescript
// compra-rifas.component.ts
export class CompraRifasComponent implements OnInit {
  // Propiedades para el archivo
  archivoSeleccionado: File | null = null;
  bancoSeleccionado: string = '';
  numerosAsignados: number[] = [];
  
  // ... otras propiedades ...
  
  // Método para seleccionar archivo
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!tiposPermitidos.includes(file.type)) {
        this.errores.comprobante = 'Solo se permiten imágenes (JPG, PNG, GIF, WEBP)';
        this.archivoSeleccionado = null;
        return;
      }
      
      // Validar tamaño (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.errores.comprobante = 'El archivo no debe superar los 5MB';
        this.archivoSeleccionado = null;
        return;
      }
      
      // Guardar archivo
      this.archivoSeleccionado = file;
      this.errores.comprobante = '';
      console.log('✓ Archivo listo:', file.name);
    }
  }
  
  // Método para enviar compra
  comprarTickets(): void {
    if (!this.validarPaso3()) {
      return;
    }
    
    // Crear FormData
    const formData = new FormData();
    
    // Agregar campos de texto
    formData.append('rifaId', this.rifaId);
    formData.append('cantidadTickets', this.cantidadTickets.toString());
    formData.append('nombreCompleto', this.nombreCompleto);
    formData.append('email', this.email);
    formData.append('codigoPais', this.codigoPais);
    formData.append('telefono', this.telefono);
    formData.append('nombreTitular', this.nombreTitular);
    formData.append('metodoPago', this.metodoPago);
    formData.append('bancoId', this.bancoSeleccionado);
    formData.append('codigoReferencia', this.codigoReferencia);
    
    // ⭐ Agregar archivo
    if (this.archivoSeleccionado) {
      formData.append('comprobante', this.archivoSeleccionado, this.archivoSeleccionado.name);
      console.log('✓ Archivo agregado a FormData');
    }
    
    // Enviar al backend
    console.log('→ Enviando compra al backend...');
    this.comprasService.crearCompra(formData).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✓ Compra exitosa!');
          console.log('→ Números asignados:', response.data.tickets);
          console.log('→ URL del comprobante:', response.data.comprobanteUrl); // URL de ImgBB
          
          this.numerosAsignados = response.data.tickets;
          this.mostrarModalExito = true;
        }
      },
      error: (error) => {
        console.error('✗ Error:', error);
        alert(error.error?.message || 'Error al procesar la compra');
      }
    });
  }
}
```

### HTML del Input de Archivo

```html
<!-- Paso 3: Información de Pago -->
<div *ngIf="pasoActual === 3">
  <!-- ... otros campos ... -->
  
  <!-- Campo de comprobante -->
  <div class="mb-6">
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Comprobante de Pago *
    </label>
    
    <!-- Input de archivo -->
    <div class="relative">
      <input 
        type="file"
        accept="image/*"
        (change)="onFileSelected($event)"
        class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
        required>
    </div>
    
    <!-- Feedback visual -->
    <div class="mt-2">
      <!-- Archivo seleccionado -->
      <div *ngIf="archivoSeleccionado" class="flex items-center gap-2 text-sm text-green-600">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <span>{{ archivoSeleccionado.name }}</span>
        <span class="text-gray-500">({{ (archivoSeleccionado.size / 1024).toFixed(2) }} KB)</span>
      </div>
      
      <!-- Error -->
      <p *ngIf="errores.comprobante" class="flex items-center gap-2 text-sm text-red-600">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <span>{{ errores.comprobante }}</span>
      </p>
      
      <!-- Ayuda -->
      <p class="text-xs text-gray-500 mt-1">
        Formatos permitidos: JPG, PNG, GIF, WEBP. Tamaño máximo: 5MB
      </p>
    </div>
  </div>
  
  <!-- Botón de compra -->
  <button 
    (click)="comprarTickets()"
    [disabled]="!archivoSeleccionado"
    class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
    Confirmar Compra
  </button>
</div>
```

### Resultado Esperado

Cuando todo funcione correctamente, verás en la consola del navegador:

```
✓ Archivo listo: comprobante.jpg
✓ Archivo agregado a FormData
→ Enviando compra al backend...
✓ Compra exitosa!
→ Números asignados: [42, 157, 389, 521, 876]
→ URL del comprobante: https://i.ibb.co/w04Prt6/comprobante.jpg
```

Y en la consola del backend:

```
Comprobante subido a ImgBB: https://i.ibb.co/w04Prt6/comprobante.jpg
Email enviado: mensaje-id-123
```

---

¡Listo para integrar! 🚀
