  import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-compra-rifas',
  templateUrl: './compra-rifas.component.html',
  styleUrls: ['./compra-rifas.component.css']
})
export class CompraRifasComponent implements OnInit {
  // Control de pasos
  pasoActual: number = 1;
  
  // Opciones de cantidad de tickets
  opcionesCantidad: number[] = [2, 5, 10, 15, 20];
  
  // Datos del formulario
  cantidadTickets: number = 2;
  nombreCompleto: string = '';
  email: string = '';
  confirmarEmail: string = '';
  codigoPais: string = 'VE'; // País por defecto: Venezuela
  telefono: string = '';
  nombreTitular: string = '';
  metodoPago: string = '';
  codigoReferencia: string = '';
  archivoSeleccionado: File | null = null;
  
  // Conversión de moneda
  tasaCambio: number = 216; // Tasa: 216 Bs por cada dólar (8 USD = 1728 Bs)
  precioPorTicket: number = 8.00;
  totalUSD: number = 16.00;
  totalBs: number = 0;
  
  // Modal de verificación
  mostrarModalVerificar: boolean = false;
  emailVerificar: string = '';

  // Modal de éxito
  mostrarModalExito: boolean = false;

  // Objeto para almacenar errores de validación
  errores: any = {
    nombreCompleto: '',
    email: '',
    confirmarEmail: '',
    telefono: '',
    nombreTitular: '',
    metodoPago: '',
    codigoReferencia: '',
    comprobante: ''
  };

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.calcularTotal();
  }

  seleccionarCantidad(cantidad: number): void {
    this.cantidadTickets = cantidad;
    this.calcularTotal();
  }

  incrementarCantidad(): void {
    this.cantidadTickets++;
    this.calcularTotal();
  }

  decrementarCantidad(): void {
    if (this.cantidadTickets > 2) {
      this.cantidadTickets--;
      this.calcularTotal();
    }
  }

  calcularTotal(): void {
    this.totalUSD = this.cantidadTickets * this.precioPorTicket;
    this.totalBs = this.totalUSD * this.tasaCambio;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado = file;
      this.errores.comprobante = '';
      console.log('Archivo seleccionado:', file.name);
    }
  }

  // Métodos de validación
  validarNombreCompleto(): void {
    if (!this.nombreCompleto || this.nombreCompleto.trim() === '') {
      this.errores.nombreCompleto = 'El nombre completo es obligatorio';
    } else if (this.nombreCompleto.trim().length < 3) {
      this.errores.nombreCompleto = 'El nombre debe tener al menos 3 caracteres';
    } else {
      this.errores.nombreCompleto = '';
    }
  }

  validarEmail(): void {
    const emailRegex = /^[a-zA-Z0-9._-]+@gmail\.com$/;
    
    if (!this.email || this.email.trim() === '') {
      this.errores.email = 'El email es obligatorio';
    } else if (!emailRegex.test(this.email)) {
      this.errores.email = 'Solo se permiten correos de Gmail (@gmail.com)';
    } else {
      this.errores.email = '';
    }
  }

  validarConfirmarEmail(): void {
    if (!this.confirmarEmail || this.confirmarEmail.trim() === '') {
      this.errores.confirmarEmail = 'Debes confirmar tu email';
    } else if (this.email !== this.confirmarEmail) {
      this.errores.confirmarEmail = 'Los emails no coinciden';
    } else {
      this.errores.confirmarEmail = '';
    }
  }

  onCambioPais(): void {
    // Limpiar teléfono al cambiar de país
    this.telefono = '';
    this.errores.telefono = '';
  }

  obtenerCodigoTelefonico(): string {
    const codigos: any = {
      'VE': '+58',
      'US': '+1',
      'CO': '+57',
      'CL': '+56'
    };
    return codigos[this.codigoPais] || '+58';
  }

  obtenerPlaceholderTelefono(): string {
    const placeholders: any = {
      'VE': '4241234567',
      'US': '2025551234',
      'CO': '3001234567',
      'CL': '912345678'
    };
    return placeholders[this.codigoPais] || '4241234567';
  }

  obtenerMaxLengthTelefono(): number {
    const maxLengths: any = {
      'VE': 10, // Sin el 0 inicial
      'US': 10,
      'CO': 10,
      'CL': 9
    };
    return maxLengths[this.codigoPais] || 10;
  }

  formatearTelefono(event: any): void {
    let valor = event.target.value.replace(/\D/g, ''); // Solo números
    
    const maxLength = this.obtenerMaxLengthTelefono();
    if (valor.length > maxLength) {
      valor = valor.substring(0, maxLength);
    }
    
    this.telefono = valor;
    event.target.value = valor;
  }

  validarTelefono(): void {
    if (!this.telefono || this.telefono.trim() === '') {
      this.errores.telefono = 'El teléfono es obligatorio';
      return;
    }
    
    const maxLength = this.obtenerMaxLengthTelefono();
    
    // Validaciones específicas por país
    if (this.codigoPais === 'VE') {
      const codigosValidos = ['412', '424', '414', '422', '426', '416'];
      
      if (this.telefono.length !== 10) {
        this.errores.telefono = 'El teléfono debe tener exactamente 10 dígitos';
        return;
      }
      
      const codigo = this.telefono.substring(0, 3);
      if (!codigosValidos.includes(codigo)) {
        this.errores.telefono = 'El teléfono debe comenzar con 412, 424, 414, 422, 426 o 416';
        return;
      }
    } else if (this.codigoPais === 'US') {
      if (this.telefono.length !== 10) {
        this.errores.telefono = 'El teléfono debe tener exactamente 10 dígitos';
        return;
      }
    } else if (this.codigoPais === 'CO') {
      if (this.telefono.length !== 10) {
        this.errores.telefono = 'El teléfono debe tener exactamente 10 dígitos';
        return;
      }
    } else if (this.codigoPais === 'CL') {
      if (this.telefono.length !== 9) {
        this.errores.telefono = 'El teléfono debe tener exactamente 9 dígitos';
        return;
      }
    }
    
    this.errores.telefono = '';
  }

  copiarTexto(texto: string): void {
    navigator.clipboard.writeText(texto).then(() => {
      // Opcional: Mostrar mensaje de éxito
      alert('¡Copiado al portapapeles!');
    }).catch(err => {
      console.error('Error al copiar:', err);
    });
  }

  validarNombreTitular(): void {
    if (!this.nombreTitular || this.nombreTitular.trim() === '') {
      this.errores.nombreTitular = 'El nombre del titular es obligatorio';
    } else if (this.nombreTitular.trim().length < 3) {
      this.errores.nombreTitular = 'El nombre debe tener al menos 3 caracteres';
    } else {
      this.errores.nombreTitular = '';
    }
  }

  seleccionarMetodoPago(metodo: string): void {
    this.metodoPago = metodo;
    this.validarMetodoPago();
  }

  validarMetodoPago(): void {
    if (!this.metodoPago || this.metodoPago === '') {
      this.errores.metodoPago = 'Debes seleccionar un método de pago';
    } else {
      this.errores.metodoPago = '';
    }
  }

  formatearCodigoReferencia(event: any): void {
    let valor = event.target.value.replace(/\D/g, ''); // Solo números
    
    // Limitar a 6 dígitos
    if (valor.length > 6) {
      valor = valor.substring(0, 6);
    }
    
    this.codigoReferencia = valor;
    event.target.value = valor;
  }

  validarCodigoReferencia(): void {
    if (!this.codigoReferencia || this.codigoReferencia.trim() === '') {
      this.errores.codigoReferencia = 'El código de referencia es obligatorio';
      return;
    }
    
    if (this.codigoReferencia.length !== 6) {
      this.errores.codigoReferencia = 'Debe ingresar exactamente los últimos 6 dígitos';
      return;
    }
    
    this.errores.codigoReferencia = '';
  }

  validarComprobante(): void {
    if (!this.archivoSeleccionado) {
      this.errores.comprobante = 'Debes adjuntar el comprobante de pago';
    } else {
      this.errores.comprobante = '';
    }
  }

  // Validar todos los campos del paso 2
  validarPaso2(): boolean {
    this.validarNombreCompleto();
    this.validarEmail();
    this.validarConfirmarEmail();
    this.validarTelefono();

    return !this.errores.nombreCompleto && 
           !this.errores.email && 
           !this.errores.confirmarEmail && 
           !this.errores.telefono;
  }

  // Validar todos los campos del paso 3
  validarPaso3(): boolean {
    this.validarNombreTitular();
    this.validarMetodoPago();
    this.validarCodigoReferencia();
    this.validarComprobante();

    return !this.errores.nombreTitular && 
           !this.errores.metodoPago && 
           !this.errores.codigoReferencia && 
           !this.errores.comprobante;
  }

  comprarTickets(): void {
    // Validar todos los campos del paso 3
    if (!this.validarPaso3()) {
      return;
    }

    // Aquí puedes agregar la lógica para enviar los datos al backend
    const datosCompra = {
      cantidadTickets: this.cantidadTickets,
      nombreCompleto: this.nombreCompleto,
      email: this.email,
      telefono: this.telefono,
      nombreTitular: this.nombreTitular,
      metodoPago: this.metodoPago,
      codigoReferencia: this.codigoReferencia,
      totalUSD: this.totalUSD,
      totalBs: this.totalBs,
      comprobante: this.archivoSeleccionado?.name || ''
    };

    console.log('Compra realizada:', datosCompra);
    
    // Mostrar modal de éxito
    this.mostrarModalExito = true;
    
    // Cerrar automáticamente después de 3 segundos y redirigir
    setTimeout(() => {
      this.cerrarModalExito();
    }, 3000);
  }

  resetearFormulario(): void {
    this.pasoActual = 1;
    this.cantidadTickets = 2;
    this.nombreCompleto = '';
    this.email = '';
    this.confirmarEmail = '';
    this.codigoPais = 'VE';
    this.telefono = '';
    this.nombreTitular = '';
    this.metodoPago = '';
    this.codigoReferencia = '';
    this.archivoSeleccionado = null;
    this.errores = {
      nombreCompleto: '',
      email: '',
      confirmarEmail: '',
      telefono: '',
      nombreTitular: '',
      metodoPago: '',
      codigoReferencia: '',
      comprobante: ''
    };
    this.calcularTotal();
  }

  irAPaso2(): void {
    this.pasoActual = 2;
  }

  irAPaso3(): void {
    // Validar datos personales antes de avanzar
    if (this.validarPaso2()) {
      this.pasoActual = 3;
    }
  }

  volverAPaso1(): void {
    this.pasoActual = 1;
  }

  volverAPaso2(): void {
    this.pasoActual = 2;
  }

  abrirModalVerificar(): void {
    this.mostrarModalVerificar = true;
  }

  cerrarModalVerificar(): void {
    this.mostrarModalVerificar = false;
    this.emailVerificar = '';
  }

  verificarTickets(): void {
    if (!this.emailVerificar) {
      alert('Por favor ingresa tu email');
      return;
    }

    // Aquí puedes agregar la lógica para verificar los tickets en el backend
    console.log('Verificando tickets para:', this.emailVerificar);
    alert(`Verificando tickets para el email: ${this.emailVerificar}`);
    
    // Cerrar modal después de verificar
    this.cerrarModalVerificar();
  }

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
    this.resetearFormulario();
    // Redirigir a la página principal
    this.router.navigate(['/']);
  }
}
