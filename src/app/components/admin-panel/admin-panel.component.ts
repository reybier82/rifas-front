import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit, OnDestroy {
  token: string = '';
  tokenValido: boolean = false;
  cargando: boolean = true;
  
  // Tabs
  tabActivo: string = 'pendientes'; // 'pendientes', 'verificadas', 'rechazadas', 'crear-rifa', 'estadisticas'
  
  // Compras
  comprasPendientes: any[] = [];
  comprasVerificadas: any[] = [];
  comprasRechazadas: any[] = [];
  cargandoCompras: boolean = false;
  cargaInicial: boolean = true; // Solo mostrar loading en primera carga
  
  // Búsqueda
  busquedaPendientes: string = '';
  busquedaVerificadas: string = '';
  busquedaRechazadas: string = '';
  
  // Listas filtradas
  comprasPendientesFiltradas: any[] = [];
  comprasVerificadasFiltradas: any[] = [];
  comprasRechazadasFiltradas: any[] = [];
  
  // Auto-refresh
  private refreshInterval: any;
  
  // Estadísticas
  estadisticas: any = null;
  rifasConEstadisticas: any[] = [];
  rifaSeleccionadaEstadisticas: any = null;
  mostrarModalEstadisticasDetalle: boolean = false;
  // Modal de compradores
  mostrarModalCompradores: boolean = false;
  compradoresRifa: any[] = [];
  compradoresFiltrados: any[] = [];
  cargandoCompradores: boolean = false;
  rifaIdCompradores: string = ''; // ID de la rifa actual en el modal de compradores
  busquedaComprador: string = '';
  filtroEstado: 'todos' | 'pendiente' | 'verificado' | 'rechazado' | 'ganador' | 'numeros' = 'todos';
  rifaCompletada: boolean = false; // Indica si la rifa está completada
  numeroGanadorRifa: number | null = null; // Número ganador de la rifa
  numerosJugados: number[] = []; // Números vendidos de la rifa
  numerosJugadosFiltrados: number[] = []; // Números filtrados por búsqueda
  busquedaNumero: string = ''; // Búsqueda de número específico
  
  // Crear rifa
  mostrarModalRifa: boolean = false;
  nuevaRifa = {
    titulo: '',
    descripcion: '',
    precioTicketBs: 300,
    cantidadNumeros: 100,
    fechaSorteo: '',
    horaSorteo: '20:00',
    loteria: '',
    imagen: null as File | null
  };
  imagenPreview: string = '';
  creandoRifa: boolean = false;
  fechaMinima: string = new Date().toISOString().split('T')[0]; // Fecha de hoy en formato YYYY-MM-DD
  
  // Editar rifa
  mostrarModalEditarRifa: boolean = false;
  rifaEditando: any = null;
  editandoRifa: boolean = false;
  
  // Notificar ganador
  mostrarModalNotificarGanador: boolean = false;
  emailGanador: string = '';
  numeroGanador: string = '';
  notificandoGanador: boolean = false;
  errorNotificarGanador: string = ''; // Mensaje de error dentro del modal
  
  // Mensajes
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | 'info' = 'info';
  
  // Modales
  mostrarModalVerificar: boolean = false;
  mostrarModalRechazar: boolean = false;
  mostrarModalDetalles: boolean = false;
  compraSeleccionada: any = null;
  motivoRechazo: string = '';
  rechazandoPago: boolean = false;
  verificandoPago: boolean = false;
  
  // Modales desde compradores
  mostrarModalVerificarCompradores: boolean = false;
  rechazandoPagoCompradores: boolean = false;
  verificandoPagoCompradores: boolean = false;
  mostrarModalRechazarCompradores: boolean = false;
  compraSeleccionadaCompradores: any = null;
  motivoRechazoCompradores: string = '';
  
  // Modal de confirmación para inactivar rifa
  mostrarModalConfirmarInactivar: boolean = false;
  
  // Ver comprobante
  mostrarModalComprobante: boolean = false;
  comprobanteUrl: string = '';
  comprobanteReferencia: string = '';

  constructor(
    private route: ActivatedRoute,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnDestroy(): void {
    // Limpiar interval al destruir componente
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.token = params['token'];
      this.verificarToken();
    });
  }

  verificarToken(): void {
    this.adminService.verificarToken(this.token).subscribe({
      next: (response) => {
        if (response.success) {
          this.tokenValido = true;
          this.cargarComprasPendientes();
          this.cargarEstadisticas();
          this.iniciarAutoRefresh();
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Token inválido:', error);
        this.tokenValido = false;
        this.cargando = false;
        this.mostrarMensaje('Token de administrador inválido', 'error');
      }
    });
  }
  
  iniciarAutoRefresh(): void {
    // Refrescar cada 3 segundos (sin mostrar loading)
    this.refreshInterval = setInterval(() => {
      if (this.tabActivo === 'pendientes') {
        this.cargarComprasPendientes(false);
      } else if (this.tabActivo === 'verificadas') {
        this.cargarComprasVerificadas(false);
      } else if (this.tabActivo === 'rechazadas') {
        this.cargarComprasRechazadas(false);
      }
      this.cargarEstadisticas();
    }, 3000); // 3 segundos
  }

  cambiarTab(tab: string): void {
    this.tabActivo = tab;
    
    if (tab === 'pendientes' && this.comprasPendientes.length === 0) {
      this.cargarComprasPendientes();
    } else if (tab === 'verificadas' && this.comprasVerificadas.length === 0) {
      this.cargarComprasVerificadas();
    } else if (tab === 'rechazadas' && this.comprasRechazadas.length === 0) {
      this.cargarComprasRechazadas();
    } else if (tab === 'estadisticas' && !this.estadisticas) {
      this.cargarEstadisticas();
    }
  }

  cargarComprasPendientes(mostrarLoading: boolean = true): void {
    if (mostrarLoading) {
      this.cargandoCompras = true;
    }
    this.adminService.obtenerComprasPendientes(this.token).subscribe({
      next: (response) => {
        if (response.success) {
          this.comprasPendientes = response.data;
          this.filtrarComprasPendientes();
        }
        this.cargandoCompras = false;
      },
      error: (error) => {
        console.error('Error al cargar compras pendientes:', error);
        this.mostrarMensaje('Error al cargar compras pendientes', 'error');
        this.cargandoCompras = false;
      }
    });
  }

  filtrarComprasPendientes(): void {
    const busqueda = this.busquedaPendientes.toLowerCase().trim();
    
    if (!busqueda) {
      this.comprasPendientesFiltradas = this.comprasPendientes;
      return;
    }
    
    this.comprasPendientesFiltradas = this.comprasPendientes.filter(compra => {
      const nombre = compra.nombreCompleto?.toLowerCase() || '';
      const email = compra.email?.toLowerCase() || '';
      const rifa = compra.rifaId?.titulo?.toLowerCase() || '';
      
      return nombre.includes(busqueda) || 
             email.includes(busqueda) || 
             rifa.includes(busqueda);
    });
  }

  cargarComprasVerificadas(mostrarLoading: boolean = true): void {
    if (mostrarLoading) {
      this.cargandoCompras = true;
    }
    this.adminService.obtenerComprasVerificadas(this.token).subscribe({
      next: (response) => {
        if (response.success) {
          this.comprasVerificadas = response.data;
          this.filtrarComprasVerificadas();
        }
        this.cargandoCompras = false;
      },
      error: (error) => {
        console.error('Error al cargar compras verificadas:', error);
        this.mostrarMensaje('Error al cargar compras verificadas', 'error');
        this.cargandoCompras = false;
      }
    });
  }

  filtrarComprasVerificadas(): void {
    const busqueda = this.busquedaVerificadas.toLowerCase().trim();
    
    if (!busqueda) {
      this.comprasVerificadasFiltradas = this.comprasVerificadas;
      return;
    }
    
    this.comprasVerificadasFiltradas = this.comprasVerificadas.filter(compra => {
      const nombre = compra.nombreCompleto?.toLowerCase() || '';
      const email = compra.email?.toLowerCase() || '';
      const rifa = compra.rifaId?.titulo?.toLowerCase() || '';
      
      return nombre.includes(busqueda) || 
             email.includes(busqueda) || 
             rifa.includes(busqueda);
    });
  }

  cargarComprasRechazadas(mostrarLoading: boolean = true): void {
    if (mostrarLoading) {
      this.cargandoCompras = true;
    }
    this.adminService.obtenerComprasRechazadas(this.token).subscribe({
      next: (response) => {
        if (response.success) {
          this.comprasRechazadas = response.data;
          this.filtrarComprasRechazadas();
        }
        this.cargandoCompras = false;
      },
      error: (error) => {
        console.error('Error al cargar compras rechazadas:', error);
        this.mostrarMensaje('Error al cargar compras rechazadas', 'error');
        this.cargandoCompras = false;
      }
    });
  }

  filtrarComprasRechazadas(): void {
    const busqueda = this.busquedaRechazadas.toLowerCase().trim();
    
    if (!busqueda) {
      this.comprasRechazadasFiltradas = this.comprasRechazadas;
      return;
    }
    
    this.comprasRechazadasFiltradas = this.comprasRechazadas.filter(compra => {
      const nombre = compra.nombreCompleto?.toLowerCase() || '';
      const email = compra.email?.toLowerCase() || '';
      const rifa = compra.rifaId?.titulo?.toLowerCase() || '';
      
      return nombre.includes(busqueda) || 
             email.includes(busqueda) || 
             rifa.includes(busqueda);
    });
  }

  cargarEstadisticas(): void {
    this.adminService.obtenerRifasConEstadisticas(this.token).subscribe({
      next: (response) => {
        if (response.success) {
          this.rifasConEstadisticas = response.data;
        }
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.mostrarMensaje('Error al cargar estadísticas', 'error');
      }
    });
  }

  verDetallesEstadisticas(rifaId: string): void {
    this.adminService.obtenerEstadisticasRifa(this.token, rifaId).subscribe({
      next: (response) => {
        if (response.success) {
          this.rifaSeleccionadaEstadisticas = response.data;
          this.mostrarModalEstadisticasDetalle = true;
        }
      },
      error: (error) => {
        console.error('Error al cargar estadísticas de rifa:', error);
        this.mostrarMensaje('Error al cargar estadísticas de la rifa', 'error');
      }
    });
  }

  cerrarModalEstadisticasDetalle(): void {
    this.mostrarModalEstadisticasDetalle = false;
    this.rifaSeleccionadaEstadisticas = null;
  }

  abrirModalVerificar(compra: any): void {
    this.compraSeleccionada = compra;
    this.mostrarModalVerificar = true;
  }

  cerrarModalVerificar(): void {
    this.mostrarModalVerificar = false;
    this.compraSeleccionada = null;
  }

  confirmarVerificacion(): void {
    if (!this.compraSeleccionada) return;

    this.verificandoPago = true;
    this.adminService.verificarPago(this.token, this.compraSeleccionada._id).subscribe({
      next: (response) => {
        this.verificandoPago = false;
        if (response.success) {
          this.mostrarMensaje('Pago verificado exitosamente. Email enviado al usuario.', 'success');
          this.cerrarModalVerificar();
          this.cargarComprasPendientes();
          this.cargarEstadisticas();
        }
      },
      error: (error) => {
        this.verificandoPago = false;
        console.error('Error al verificar pago:', error);
        this.mostrarMensaje('Error al verificar pago', 'error');
      }
    });
  }

  abrirModalRechazar(compra: any): void {
    this.compraSeleccionada = compra;
    this.motivoRechazo = '';
    this.mostrarModalRechazar = true;
  }

  cerrarModalRechazar(): void {
    this.mostrarModalRechazar = false;
    this.compraSeleccionada = null;
    this.motivoRechazo = '';
  }

  confirmarRechazo(): void {
    if (!this.compraSeleccionada || !this.motivoRechazo.trim()) {
      this.mostrarMensaje('Debes especificar un motivo de rechazo', 'error');
      return;
    }

    this.rechazandoPago = true;
    this.adminService.rechazarPago(this.token, this.compraSeleccionada._id, this.motivoRechazo).subscribe({
      next: (response) => {
        this.rechazandoPago = false;
        if (response.success) {
          this.mostrarMensaje('Pago rechazado y email enviado al usuario', 'success');
          this.cerrarModalRechazar();
          this.cargarComprasPendientes();
          this.cargarEstadisticas();
        }
      },
      error: (error) => {
        this.rechazandoPago = false;
        console.error('Error al rechazar pago:', error);
        this.mostrarMensaje('Error al rechazar pago', 'error');
      }
    });
  }

  verDetallesCompra(compra: any): void {
    this.compraSeleccionada = compra;
    this.mostrarModalDetalles = true;
    // Forzar detección de cambios inmediata
    this.cdr.detectChanges();
  }

  cerrarModalDetalles(): void {
    this.mostrarModalDetalles = false;
    this.compraSeleccionada = null;
  }

  verComprobante(url: string, referencia: string = ''): void {
    this.comprobanteUrl = url;
    this.comprobanteReferencia = referencia;
    this.mostrarModalComprobante = true;
  }

  cerrarModalComprobante(): void {
    this.mostrarModalComprobante = false;
    this.comprobanteUrl = '';
    this.comprobanteReferencia = '';
  }

  seleccionarImagen(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.nuevaRifa.imagen = file;
      
      // Preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  abrirModalRifa(): void {
    this.mostrarModalRifa = true;
  }

  cerrarModalRifa(): void {
    this.mostrarModalRifa = false;
    this.limpiarFormularioRifa();
  }

  crearRifa(): void {
    if (!this.nuevaRifa.titulo || !this.nuevaRifa.descripcion || !this.nuevaRifa.fechaSorteo || !this.nuevaRifa.horaSorteo) {
      this.mostrarMensaje('Completa todos los campos obligatorios', 'error');
      return;
    }

    this.creandoRifa = true;

    // Combinar fecha y hora en formato ISO con zona horaria de Venezuela (UTC-4)
    // Agregamos -04:00 para indicar que es hora de Venezuela
    const fechaHoraSorteo = `${this.nuevaRifa.fechaSorteo}T${this.nuevaRifa.horaSorteo}:00-04:00`;

    const formData = new FormData();
    formData.append('titulo', this.nuevaRifa.titulo);
    formData.append('descripcion', this.nuevaRifa.descripcion);
    formData.append('precioTicketBs', this.nuevaRifa.precioTicketBs.toString());
    formData.append('cantidadNumeros', this.nuevaRifa.cantidadNumeros.toString());
    formData.append('fechaSorteo', fechaHoraSorteo);
    formData.append('loteria', this.nuevaRifa.loteria);
    
    if (this.nuevaRifa.imagen) {
      formData.append('imagen', this.nuevaRifa.imagen);
    }

    this.adminService.crearRifa(this.token, formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarMensaje('Rifa creada exitosamente', 'success');
          this.cerrarModalRifa();
          this.cargarEstadisticas();
        }
        this.creandoRifa = false;
      },
      error: (error) => {
        console.error('Error al crear rifa:', error);
        this.mostrarMensaje('Error al crear rifa', 'error');
        this.creandoRifa = false;
      }
    });
  }

  limpiarFormularioRifa(): void {
    this.nuevaRifa = {
      titulo: '',
      descripcion: '',
      precioTicketBs: 300,
      cantidadNumeros: 100,
      fechaSorteo: '',
      horaSorteo: '20:00',
      loteria: '',
      imagen: null
    };
    this.imagenPreview = '';
  }

  mostrarMensaje(texto: string, tipo: 'success' | 'error' | 'info'): void {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    
    setTimeout(() => {
      this.mensaje = '';
    }, 5000);
  }

  obtenerNumeros(tickets: any[]): string {
    return tickets.map(t => t.numero).sort((a, b) => a - b).join(', ');
  }

  // Verificar si una compra es ganadora
  esGanador(compra: any): boolean {
    if (!compra.tickets || compra.tickets.length === 0) return false;
    return compra.tickets.some((ticket: any) => ticket.esGanador === true);
  }

  // Obtener el número ganador de una compra
  obtenerNumeroGanador(compra: any): number | null {
    if (!compra.tickets || compra.tickets.length === 0) return null;
    const ticketGanador = compra.tickets.find((ticket: any) => ticket.esGanador === true);
    return ticketGanador ? ticketGanador.numero : null;
  }

  // ==================== MODAL DE COMPRADORES ====================

  abrirModalCompradores(rifaId: string): void {
    this.rifaIdCompradores = rifaId; // Guardar el ID de la rifa
    this.mostrarModalCompradores = true;
    this.cargandoCompradores = true;
    this.filtroEstado = 'todos';
    this.busquedaComprador = '';
    
    // Verificar si la rifa está completada
    const rifaActual = this.rifasConEstadisticas.find((r: any) => r._id === rifaId);
    this.rifaCompletada = rifaActual?.estado === 'completada';
    this.numeroGanadorRifa = rifaActual?.numeroGanador || null;
    
    this.adminService.obtenerComprasPorRifa(this.token, rifaId).subscribe({
      next: (response) => {
        this.cargandoCompradores = false;
        if (response.success) {
          this.compradoresRifa = response.data.compras;
          this.aplicarFiltros();
        }
      },
      error: (error) => {
        console.error('Error al cargar compradores:', error);
        this.cargandoCompradores = false;
      }
    });
  }

  cerrarModalCompradores(): void {
    this.mostrarModalCompradores = false;
    this.compradoresRifa = [];
    this.compradoresFiltrados = [];
    this.busquedaComprador = '';
    this.filtroEstado = 'todos';
  }

  cambiarFiltroEstado(estado: 'todos' | 'pendiente' | 'verificado' | 'rechazado' | 'ganador' | 'numeros'): void {
    this.filtroEstado = estado;
    
    // Si se selecciona "numeros", extraer todos los números jugados
    if (estado === 'numeros') {
      this.extraerNumerosJugados();
    } else {
      this.aplicarFiltros();
    }
  }

  // Extraer todos los números jugados de las compras verificadas
  extraerNumerosJugados(): void {
    const numeros: number[] = [];
    
    // Solo tomar números de compras verificadas
    this.compradoresRifa
      .filter(compra => compra.estado === 'verificado')
      .forEach(compra => {
        if (compra.tickets && compra.tickets.length > 0) {
          compra.tickets.forEach((ticket: any) => {
            numeros.push(ticket.numero);
          });
        }
      });
    
    // Ordenar números de menor a mayor y eliminar duplicados
    this.numerosJugados = [...new Set(numeros)].sort((a, b) => a - b);
    // Inicializar filtrados con todos los números
    this.numerosJugadosFiltrados = [...this.numerosJugados];
    this.busquedaNumero = '';
  }

  // Filtrar números por búsqueda
  filtrarNumeros(): void {
    if (!this.busquedaNumero || this.busquedaNumero.trim() === '') {
      this.numerosJugadosFiltrados = [...this.numerosJugados];
    } else {
      const numeroBuscado = parseInt(this.busquedaNumero);
      this.numerosJugadosFiltrados = this.numerosJugados.filter(num => num === numeroBuscado);
    }
  }

  buscarComprador(): void {
    // Si estamos en la vista de números, filtrar números
    if (this.filtroEstado === 'numeros') {
      this.filtrarNumerosPorBuscador();
    } else {
      this.aplicarFiltros();
    }
  }

  // Filtrar números usando el buscador principal
  filtrarNumerosPorBuscador(): void {
    if (!this.busquedaComprador || this.busquedaComprador.trim() === '') {
      this.numerosJugadosFiltrados = [...this.numerosJugados];
    } else {
      const textoBuscado = this.busquedaComprador.trim();
      // Filtrar números que contengan el texto buscado
      this.numerosJugadosFiltrados = this.numerosJugados.filter(num => 
        num.toString().includes(textoBuscado)
      );
    }
  }

  aplicarFiltros(): void {
    let resultado = [...this.compradoresRifa];
    
    // Filtrar por estado
    if (this.filtroEstado === 'ganador') {
      // Mostrar solo el ganador (usando el campo esGanador)
      resultado = resultado.filter(c => 
        c.estado === 'verificado' && 
        c.tickets && 
        c.tickets.some((ticket: any) => ticket.esGanador === true)
      );
    } else if (this.filtroEstado !== 'todos') {
      resultado = resultado.filter(c => c.estado === this.filtroEstado);
    }
    
    // Filtrar por búsqueda (nombre, email o números de rifa)
    if (this.busquedaComprador.trim()) {
      const busqueda = this.busquedaComprador.toLowerCase().trim();
      resultado = resultado.filter(c => {
        // Buscar en nombre y email
        const matchNombreEmail = c.nombreCompleto.toLowerCase().includes(busqueda) ||
                                 c.email.toLowerCase().includes(busqueda);
        
        // Buscar en números de tickets
        const matchNumeros = c.tickets && c.tickets.some((ticket: any) => 
          ticket.numero.toString().includes(busqueda)
        );
        
        return matchNombreEmail || matchNumeros;
      });
    }
    
    this.compradoresFiltrados = resultado;
  }

  obtenerBadgeEstado(estado: string): string {
    const badges: any = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'verificado': 'bg-green-100 text-green-800',
      'rechazado': 'bg-red-100 text-red-800'
    };
    return badges[estado] || 'bg-gray-100 text-gray-800';
  }

  obtenerTextoEstado(estado: string): string {
    const textos: any = {
      'pendiente': 'Pendiente',
      'verificado': 'Verificado',
      'rechazado': 'Rechazado'
    };
    return textos[estado] || estado;
  }

  // Verificar si se puede inactivar la rifa
  puedeCambiarEstadoRifa(): boolean {
    if (!this.rifaSeleccionadaEstadisticas) return false;
    
    const rifa = this.rifaSeleccionadaEstadisticas.rifa;
    const estadisticas = this.rifaSeleccionadaEstadisticas.estadisticas;
    
    // Si la rifa está cerrada, no se puede cambiar
    if (rifa.estado === 'cerrada') return false;
    
    // Si está activa, verificar que no tenga compras pendientes NI tickets vendidos
    if (rifa.estado === 'activa') {
      return estadisticas.compras.pendientes === 0 && estadisticas.tickets.vendidos === 0;
    }
    
    // Si está inactiva, siempre se puede activar
    return true;
  }

  // Obtener mensaje de por qué no se puede cambiar el estado
  getMensajeEstadoRifa(): string {
    if (!this.rifaSeleccionadaEstadisticas) return '';
    
    const rifa = this.rifaSeleccionadaEstadisticas.rifa;
    const estadisticas = this.rifaSeleccionadaEstadisticas.estadisticas;
    
    if (rifa.estado === 'cerrada') {
      return 'La rifa ya finalizó';
    }
    
    if (rifa.estado === 'activa') {
      const problemas = [];
      if (estadisticas.compras.pendientes > 0) {
        problemas.push(`${estadisticas.compras.pendientes} compra(s) pendiente(s)`);
      }
      if (estadisticas.tickets.vendidos > 0) {
        problemas.push(`${estadisticas.tickets.vendidos} ticket(s) vendido(s)`);
      }
      if (problemas.length > 0) {
        return `Hay ${problemas.join(' y ')}`;
      }
    }
    
    return '';
  }

  // Cambiar estado de la rifa
  cambiarEstadoRifa(): void {
    if (!this.rifaSeleccionadaEstadisticas || !this.puedeCambiarEstadoRifa()) return;
    
    const rifa = this.rifaSeleccionadaEstadisticas.rifa;
    
    // Si está activa, mostrar modal de confirmación
    if (rifa.estado === 'activa') {
      this.mostrarModalConfirmarInactivar = true;
    } else {
      // Si está inactiva, activar directamente
      this.ejecutarCambioEstadoRifa();
    }
  }

  // Cerrar modal de confirmación
  cerrarModalConfirmarInactivar(): void {
    this.mostrarModalConfirmarInactivar = false;
  }

  // Ejecutar cambio de estado
  ejecutarCambioEstadoRifa(): void {
    if (!this.rifaSeleccionadaEstadisticas) return;
    
    const rifa = this.rifaSeleccionadaEstadisticas.rifa;
    const nuevoEstado = rifa.estado === 'activa' ? 'inactiva' : 'activa';
    
    this.adminService.cambiarEstadoRifa(rifa._id, nuevoEstado, this.token).subscribe({
      next: (response: any) => {
        this.mostrarMensaje(`Rifa ${nuevoEstado === 'activa' ? 'activada' : 'inactivada'} exitosamente`, 'success');
        // Actualizar el estado local
        this.rifaSeleccionadaEstadisticas.rifa.estado = nuevoEstado;
        // Cerrar modal si está abierto
        this.cerrarModalConfirmarInactivar();
        // Recargar estadísticas
        this.cargarEstadisticas();
      },
      error: (error: any) => {
        console.error('Error al cambiar estado de rifa:', error);
        this.mostrarMensaje('Error al cambiar estado de la rifa', 'error');
      }
    });
  }

  // Abrir modal de verificación desde compradores
  abrirModalVerificarDesdeCompradores(compra: any): void {
    this.compraSeleccionadaCompradores = compra;
    this.mostrarModalVerificarCompradores = true;
  }

  // Cerrar modal de verificación desde compradores
  cerrarModalVerificarCompradores(): void {
    this.mostrarModalVerificarCompradores = false;
    this.compraSeleccionadaCompradores = null;
  }

  // Confirmar verificación desde compradores
  confirmarVerificacionCompradores(): void {
    if (!this.compraSeleccionadaCompradores) return;
    
    this.verificandoPagoCompradores = true;
    this.adminService.verificarPago(this.token, this.compraSeleccionadaCompradores._id).subscribe({
      next: (response: any) => {
        this.verificandoPagoCompradores = false;
        this.mostrarMensaje('Pago verificado y email enviado exitosamente', 'success');
        this.cerrarModalVerificarCompradores();
        // Recargar compradores
        this.cargarCompradoresRifa(this.compraSeleccionadaCompradores.rifaId._id || this.compraSeleccionadaCompradores.rifaId);
      },
      error: (error: any) => {
        this.verificandoPagoCompradores = false;
        console.error('Error al verificar pago:', error);
        this.mostrarMensaje('Error al verificar pago', 'error');
      }
    });
  }

  // Abrir modal de rechazo desde compradores
  abrirModalRechazarDesdeCompradores(compra: any): void {
    this.compraSeleccionadaCompradores = compra;
    this.motivoRechazoCompradores = '';
    this.mostrarModalRechazarCompradores = true;
  }

  // Cerrar modal de rechazo desde compradores
  cerrarModalRechazarCompradores(): void {
    this.mostrarModalRechazarCompradores = false;
    this.compraSeleccionadaCompradores = null;
    this.motivoRechazoCompradores = '';
  }

  // Confirmar rechazo desde compradores
  confirmarRechazoCompradores(): void {
    if (!this.compraSeleccionadaCompradores) return;
    
    if (!this.motivoRechazoCompradores || this.motivoRechazoCompradores.trim() === '') {
      this.mostrarMensaje('Debes ingresar un motivo de rechazo', 'error');
      return;
    }
    
    this.rechazandoPagoCompradores = true;
    this.adminService.rechazarPago(this.token, this.compraSeleccionadaCompradores._id, this.motivoRechazoCompradores).subscribe({
      next: (response: any) => {
        this.rechazandoPagoCompradores = false;
        this.mostrarMensaje('Pago rechazado y notificación enviada', 'success');
        this.cerrarModalRechazarCompradores();
        // Recargar compradores
        this.cargarCompradoresRifa(this.compraSeleccionadaCompradores.rifaId._id || this.compraSeleccionadaCompradores.rifaId);
      },
      error: (error: any) => {
        this.rechazandoPagoCompradores = false;
        console.error('Error al rechazar pago:', error);
        this.mostrarMensaje('Error al rechazar pago', 'error');
      }
    });
  }

  // Cargar compradores de una rifa (helper para recargar después de verificar/rechazar)
  private cargarCompradoresRifa(rifaId: string): void {
    this.cargandoCompradores = true;
    this.adminService.obtenerComprasPorRifa(this.token, rifaId).subscribe({
      next: (response: any) => {
        this.compradoresRifa = response.data?.compras || response.compras || [];
        this.aplicarFiltros();
        this.cargandoCompradores = false;
      },
      error: (error: any) => {
        console.error('Error al cargar compradores:', error);
        this.cargandoCompradores = false;
      }
    });
  }

  // Verificar si se puede editar la rifa
  puedeEditarRifa(): boolean {
    if (!this.rifaSeleccionadaEstadisticas) return false;
    
    const estadisticas = this.rifaSeleccionadaEstadisticas.estadisticas;
    
    // No se puede editar si hay compras pendientes o verificadas
    return estadisticas.compras.pendientes === 0 && estadisticas.compras.verificadas === 0;
  }

  // Obtener mensaje de por qué no se puede editar
  getMensajeNoEditable(): string {
    if (!this.rifaSeleccionadaEstadisticas) return '';
    
    const estadisticas = this.rifaSeleccionadaEstadisticas.estadisticas;
    
    const problemas = [];
    if (estadisticas.compras.pendientes > 0) {
      problemas.push(`${estadisticas.compras.pendientes} compra(s) pendiente(s)`);
    }
    if (estadisticas.compras.verificadas > 0) {
      problemas.push(`${estadisticas.compras.verificadas} compra(s) verificada(s)`);
    }
    
    if (problemas.length > 0) {
      return `No se puede editar. Hay ${problemas.join(' y ')}`;
    }
    
    return '';
  }

  // Obtener mensaje mejorado para inactivar
  getMensajeInactivar(): string {
    if (!this.rifaSeleccionadaEstadisticas) return '';
    
    const estadisticas = this.rifaSeleccionadaEstadisticas.estadisticas;
    
    const problemas = [];
    if (estadisticas.compras.pendientes > 0) {
      problemas.push(`${estadisticas.compras.pendientes} compra(s) pendiente(s)`);
    }
    if (estadisticas.compras.verificadas > 0) {
      problemas.push(`${estadisticas.compras.verificadas} compra(s) verificada(s)`);
    }
    
    if (problemas.length > 0) {
      return `No se puede inactivar. Hay ${problemas.join(' y ')}`;
    }
    
    return '';
  }

  // Abrir modal de editar rifa
  abrirModalEditarRifa(): void {
    if (!this.rifaSeleccionadaEstadisticas) return;
    
    const rifa = this.rifaSeleccionadaEstadisticas.rifa;
    
    // Extraer fecha y hora del campo fechaSorteo
    const fechaSorteo = new Date(rifa.fechaSorteo);
    const fecha = fechaSorteo.toISOString().split('T')[0];
    const hora = fechaSorteo.toTimeString().slice(0, 5);
    
    this.rifaEditando = {
      _id: rifa._id,
      titulo: rifa.titulo,
      descripcion: rifa.descripcion,
      precioTicketBs: rifa.precioTicketBs,
      fechaSorteo: fecha,
      horaSorteo: hora,
      imagenUrl: rifa.imagenUrl,
      imagen: null as File | null
    };
    
    this.imagenPreview = rifa.imagenUrl;
    this.mostrarModalEditarRifa = true;
  }

  // Cerrar modal de editar rifa
  cerrarModalEditarRifa(): void {
    this.mostrarModalEditarRifa = false;
    this.rifaEditando = null;
    this.imagenPreview = '';
  }

  // Seleccionar imagen para editar
  seleccionarImagenEditar(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.rifaEditando.imagen = file;
      
      // Preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Guardar cambios de la rifa
  guardarCambiosRifa(): void {
    if (!this.rifaEditando || !this.rifaEditando.titulo || !this.rifaEditando.descripcion || !this.rifaEditando.fechaSorteo || !this.rifaEditando.horaSorteo) {
      this.mostrarMensaje('Completa todos los campos obligatorios', 'error');
      return;
    }

    this.editandoRifa = true;

    // Combinar fecha y hora
    const fechaHoraSorteo = `${this.rifaEditando.fechaSorteo}T${this.rifaEditando.horaSorteo}:00`;

    const formData = new FormData();
    formData.append('titulo', this.rifaEditando.titulo);
    formData.append('descripcion', this.rifaEditando.descripcion);
    formData.append('precioTicketBs', this.rifaEditando.precioTicketBs.toString());
    formData.append('fechaSorteo', fechaHoraSorteo);
    
    if (this.rifaEditando.imagen) {
      formData.append('imagen', this.rifaEditando.imagen);
    }

    this.adminService.editarRifa(this.rifaEditando._id, formData, this.token).subscribe({
      next: (response: any) => {
        this.mostrarMensaje('Rifa actualizada exitosamente', 'success');
        this.cerrarModalEditarRifa();
        // Recargar estadísticas
        this.cargarEstadisticas();
        // Actualizar datos del modal de estadísticas
        if (this.rifaSeleccionadaEstadisticas) {
          this.verDetallesEstadisticas(this.rifaSeleccionadaEstadisticas.rifa._id);
        }
        this.editandoRifa = false;
      },
      error: (error: any) => {
        console.error('Error al editar rifa:', error);
        this.mostrarMensaje('Error al actualizar la rifa', 'error');
        this.editandoRifa = false;
      }
    });
  }

  // Abrir modal de notificar ganador
  abrirModalNotificarGanador(): void {
    this.emailGanador = '';
    this.numeroGanador = '';
    this.errorNotificarGanador = '';
    this.mostrarModalNotificarGanador = true;
  }

  // Cerrar modal de notificar ganador
  cerrarModalNotificarGanador(): void {
    this.mostrarModalNotificarGanador = false;
    this.emailGanador = '';
    this.numeroGanador = '';
    this.errorNotificarGanador = '';
  }

  // Cambiar visibilidad de rifa completada
  cambiarVisibilidadRifa(): void {
    if (!this.rifaSeleccionadaEstadisticas) return;

    const rifaId = this.rifaSeleccionadaEstadisticas.rifa._id;
    const visible = this.rifaSeleccionadaEstadisticas.rifa.visible;

    this.adminService.cambiarVisibilidadRifa(rifaId, this.token).subscribe({
      next: (response: any) => {
        this.mostrarMensaje(
          visible ? 'Rifa oculta de la página principal' : 'Rifa visible en la página principal',
          'success'
        );
        // Actualizar el estado local
        this.rifaSeleccionadaEstadisticas.rifa.visible = !visible;
        // Recargar estadísticas
        this.cargarEstadisticas();
      },
      error: (error: any) => {
        console.error('Error al cambiar visibilidad:', error);
        this.mostrarMensaje('Error al cambiar visibilidad', 'error');
      }
    });
  }

  // Notificar al ganador
  notificarGanador(): void {
    // Limpiar error previo
    this.errorNotificarGanador = '';

    if (!this.emailGanador || !this.numeroGanador) {
      this.errorNotificarGanador = 'Completa todos los campos';
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.emailGanador)) {
      this.errorNotificarGanador = 'Email inválido';
      return;
    }

    // Validar que el número ganador exista entre los compradores
    const numeroGanadorInt = parseInt(this.numeroGanador);
    const numeroExiste = this.compradoresRifa.some(compra => 
      compra.tickets && compra.tickets.some((ticket: any) => ticket.numero === numeroGanadorInt)
    );

    if (!numeroExiste) {
      this.errorNotificarGanador = `El número ${this.numeroGanador} no existe entre los números comprados`;
      return;
    }

    this.notificandoGanador = true;

    const data = {
      rifaId: this.rifaIdCompradores,
      emailGanador: this.emailGanador,
      numeroGanador: this.numeroGanador
    };

    this.adminService.notificarGanador(data, this.token).subscribe({
      next: (response: any) => {
        this.mostrarMensaje('Notificación enviada al ganador exitosamente. La rifa ha sido completada.', 'success');
        this.cerrarModalNotificarGanador();
        this.cerrarModalCompradores();
        this.notificandoGanador = false;
        // Recargar estadísticas para reflejar el cambio de estado
        this.cargarEstadisticas();
      },
      error: (error: any) => {
        console.error('Error al notificar ganador:', error);
        const mensaje = error.error?.message || 'Error al enviar notificación';
        this.errorNotificarGanador = mensaje;
        this.notificandoGanador = false;
      }
    });
  }
}
