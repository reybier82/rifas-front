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

  formatearTelefono(event: any): void {
    let valor = event.target.value.replace(/\D/g, ''); // Solo números
    
    // Limitar a 11 dígitos
    if (valor.length > 11) {
      valor = valor.substring(0, 11);
    }
    
    this.telefono = valor;
    event.target.value = valor;
  }

  validarTelefono(): void {
    const codigosValidos = ['0412', '0424', '0414', '0422', '0426', '0416'];
    
    if (!this.telefono || this.telefono.trim() === '') {
      this.errores.telefono = 'El teléfono es obligatorio';
      return;
    }
    
    if (this.telefono.length !== 11) {
      this.errores.telefono = 'El teléfono debe tener exactamente 11 dígitos';
      return;
    }
    
    const codigo = this.telefono.substring(0, 4);
    if (!codigosValidos.includes(codigo)) {
      this.errores.telefono = 'El teléfono debe comenzar con 0412, 0424, 0414, 0422, 0426 o 0416';
      return;
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
