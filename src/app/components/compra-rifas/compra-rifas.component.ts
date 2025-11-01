import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RifasService } from '../../services/rifas.service';
import { PaisesService } from '../../services/paises.service';
import { BancosService } from '../../services/bancos.service';
import { ComprasService } from '../../services/compras.service';

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
  
  // Nuevas propiedades para integración backend
  rifaId: string = '';
  rifaSeleccionada: any = null;
  paises: any[] = [];
  bancos: any[] = [];
  bancosDisponibles: any[] = [];
  cargandoBancos: boolean = false;
  mostrarImagenGrande: boolean = false;
  bancoSeleccionado: any = null;
  numerosAsignados: number[] = [];
  
  // Conversión de moneda
  tasaCambio: number = 216; // Tasa: 216 Bs por cada dólar (8 USD = 1728 Bs)
  precioPorTicket: number = 8.00;
  totalUSD: number = 16.00;
  totalBs: number = 0;
  
  // Modal de verificación
  mostrarModalVerificar: boolean = false;
  emailVerificar: string = '';
  comprasEncontradas: any[] = [];
  mostrarResultadosVerificacion: boolean = false;
  cargandoVerificacion: boolean = false;
  mostrarAlertaNoCompras: boolean = false;

  // Modal de éxito
  mostrarModalExito: boolean = false;
  
  // Estado de procesamiento de compra
  procesandoCompra: boolean = false;

  // Objeto para almacenar errores de validación
  errores: any = {
    nombreCompleto: '',
    email: '',
    confirmarEmail: '',
    telefono: '',
    nombreTitular: '',
    metodoPago: '',
    bancoId: '',
    codigoReferencia: '',
    comprobante: ''
  };

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
    // Cargar bancos del país por defecto (Venezuela)
    this.cargarBancosPorPais();
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
        // Redirigir a la página principal si la rifa no existe
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

  cargarBancosPorPais(): void {
    if (this.codigoPais) {
      this.cargandoBancos = true;
      this.bancosService.obtenerBancosPorPais(this.codigoPais).subscribe({
        next: (response) => {
          this.cargandoBancos = false;
          if (response.success) {
            this.bancosDisponibles = response.data;
            console.log('✅ Bancos cargados para', this.codigoPais, ':', this.bancosDisponibles);
          }
        },
        error: (error) => {
          this.cargandoBancos = false;
          console.error('Error al cargar bancos:', error);
          this.bancosDisponibles = [];
        }
      });
    }
  }

  onCambioPais(): void {
    this.telefono = '';
    this.errores.telefono = '';
    this.bancoSeleccionado = null;
    this.metodoPago = '';
    
    // Cargar bancos del país seleccionado
    this.cargarBancosPorPais();
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

  seleccionarBanco(banco: any): void {
    this.bancoSeleccionado = banco;
    this.metodoPago = banco.metodoPago;
    this.errores.bancoId = '';
    console.log('✅ Banco seleccionado:', banco);
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

  validarBanco(): void {
    if (!this.bancoSeleccionado || this.bancoSeleccionado === '') {
      this.errores.bancoId = 'Debes seleccionar un banco o método de pago';
    } else {
      this.errores.bancoId = '';
    }
  }

  obtenerNombreBancoSeleccionado(): string {
    // Mapeo de IDs a nombres
    const nombresMap: any = {
      '690516ded6b683289b85129d': 'Pago Móvil BDV',
      '690516ded6b683289b85129e': 'Zelle',
      // Agregar Binance cuando tengas el ID
    };
    
    return nombresMap[this.bancoSeleccionado] || 'Banco seleccionado';
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
    this.validarBanco();
    this.validarCodigoReferencia();
    this.validarComprobante();

    return !this.errores.nombreTitular && 
           !this.errores.metodoPago && 
           !this.errores.bancoId &&
           !this.errores.codigoReferencia && 
           !this.errores.comprobante;
  }

  comprarTickets(): void {
    if (!this.validarPaso3()) {
      return;
    }

    // 🔄 Activar estado de carga
    this.procesandoCompra = true;

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
    formData.append('bancoId', this.bancoSeleccionado?._id || '');
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
        this.procesandoCompra = false; // ✅ Desactivar estado de carga
        
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
        this.procesandoCompra = false; // ✅ Desactivar estado de carga en error
        console.error('Error al crear compra:', error);
        alert(error.error?.message || 'Error al procesar la compra');
      }
    });
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
    this.bancoSeleccionado = '';
    this.codigoReferencia = '';
    this.archivoSeleccionado = null;
    this.errores = {
      nombreCompleto: '',
      email: '',
      confirmarEmail: '',
      telefono: '',
      nombreTitular: '',
      metodoPago: '',
      bancoId: '',
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
    if (!this.emailVerificar || !this.emailVerificar.trim()) {
      this.mostrarAlertaNoCompras = true;
      return;
    }

    this.cargandoVerificacion = true;
    this.comprasService.verificarTicketsPorEmail(this.emailVerificar).subscribe({
      next: (response) => {
        this.cargandoVerificacion = false;
        console.log('Respuesta del servidor:', response);
        
        if (response.success && response.data && response.data.length > 0) {
          // Filtrar solo las compras de esta rifa específica
          const comprasFiltradas = response.data.filter((compra: any) => {
            const rifaIdCompra = compra.rifa?._id;
            console.log('Comparando:', rifaIdCompra, 'con', this.rifaId);
            return rifaIdCompra === this.rifaId;
          });
          
          if (comprasFiltradas.length > 0) {
            // Mapear los datos para que coincidan con la estructura esperada
            this.comprasEncontradas = comprasFiltradas.map((compra: any) => ({
              ...compra,
              rifaId: compra.rifa || compra.rifaId,
              estado: compra.estadoVerificacion || compra.estado,
              createdAt: compra.fechaCompra || compra.createdAt
            }));
            
            console.log('Compras procesadas:', this.comprasEncontradas);
            this.mostrarResultadosVerificacion = true;
          } else {
            // No hay compras para esta rifa específica
            this.mostrarAlertaNoCompras = true;
          }
        } else {
          // No hay compras para este email
          this.mostrarAlertaNoCompras = true;
        }
      },
      error: (error) => {
        this.cargandoVerificacion = false;
        console.error('Error al verificar tickets:', error);
        this.mostrarAlertaNoCompras = true;
      }
    });
  }

  cerrarAlertaNoCompras(): void {
    this.mostrarAlertaNoCompras = false;
  }

  cerrarResultadosVerificacion(): void {
    this.mostrarResultadosVerificacion = false;
    this.comprasEncontradas = [];
    this.emailVerificar = '';
    this.cerrarModalVerificar();
  }

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
    this.resetearFormulario();
    // Redirigir a la página principal
    this.router.navigate(['/']);
  }
}
