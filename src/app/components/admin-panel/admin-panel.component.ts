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
  filtroEstado: 'todos' | 'pendiente' | 'verificado' | 'rechazado' = 'todos';
  busquedaComprador: string = '';
  
  // Crear rifa
  mostrarModalRifa: boolean = false;
  nuevaRifa = {
    titulo: '',
    descripcion: '',
    precioTicketUSD: 8,
    cantidadNumeros: 100,
    fechaSorteo: '',
    imagen: null as File | null
  };
  imagenPreview: string = '';
  creandoRifa: boolean = false;
  fechaMinima: string = new Date().toISOString().split('T')[0]; // Fecha de hoy en formato YYYY-MM-DD
  
  // Mensajes
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | 'info' = 'info';
  
  // Modales
  mostrarModalVerificar: boolean = false;
  mostrarModalRechazar: boolean = false;
  mostrarModalDetalles: boolean = false;
  compraSeleccionada: any = null;
  motivoRechazo: string = '';
  
  // Modales desde compradores
  mostrarModalVerificarCompradores: boolean = false;
  mostrarModalRechazarCompradores: boolean = false;
  compraSeleccionadaCompradores: any = null;
  motivoRechazoCompradores: string = '';
  
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

    this.adminService.verificarPago(this.token, this.compraSeleccionada._id).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarMensaje('Pago verificado exitosamente. Email enviado al usuario.', 'success');
          this.cerrarModalVerificar();
          this.cargarComprasPendientes();
          this.cargarEstadisticas();
        }
      },
      error: (error) => {
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

    this.adminService.rechazarPago(this.token, this.compraSeleccionada._id, this.motivoRechazo).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarMensaje('Pago rechazado y email enviado al usuario', 'info');
          this.cerrarModalRechazar();
          this.cargarComprasPendientes();
          this.cargarEstadisticas();
        }
      },
      error: (error) => {
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
    if (!this.nuevaRifa.titulo || !this.nuevaRifa.descripcion || !this.nuevaRifa.fechaSorteo) {
      this.mostrarMensaje('Completa todos los campos obligatorios', 'error');
      return;
    }

    this.creandoRifa = true;

    const formData = new FormData();
    formData.append('titulo', this.nuevaRifa.titulo);
    formData.append('descripcion', this.nuevaRifa.descripcion);
    formData.append('precioTicketUSD', this.nuevaRifa.precioTicketUSD.toString());
    formData.append('cantidadNumeros', this.nuevaRifa.cantidadNumeros.toString());
    formData.append('fechaSorteo', this.nuevaRifa.fechaSorteo);
    
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
      precioTicketUSD: 8,
      cantidadNumeros: 100,
      fechaSorteo: '',
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

  // ==================== MODAL DE COMPRADORES ====================

  abrirModalCompradores(rifaId: string): void {
    this.mostrarModalCompradores = true;
    this.cargandoCompradores = true;
    this.filtroEstado = 'todos';
    this.busquedaComprador = '';
    
    this.adminService.obtenerComprasPorRifa(this.token, rifaId).subscribe({
      next: (response) => {
        this.cargandoCompradores = false;
        if (response.success) {
          this.compradoresRifa = response.data.compras;
          this.aplicarFiltros();
        }
      },
      error: (error) => {
        this.cargandoCompradores = false;
        console.error('Error al cargar compradores:', error);
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

  cambiarFiltroEstado(estado: 'todos' | 'pendiente' | 'verificado' | 'rechazado'): void {
    this.filtroEstado = estado;
    this.aplicarFiltros();
  }

  buscarComprador(): void {
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let resultado = [...this.compradoresRifa];
    
    // Filtrar por estado
    if (this.filtroEstado !== 'todos') {
      resultado = resultado.filter(c => c.estado === this.filtroEstado);
    }
    
    // Filtrar por búsqueda (nombre o email)
    if (this.busquedaComprador.trim()) {
      const busqueda = this.busquedaComprador.toLowerCase().trim();
      resultado = resultado.filter(c => 
        c.nombreCompleto.toLowerCase().includes(busqueda) ||
        c.email.toLowerCase().includes(busqueda)
      );
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
    
    // Si está activa, verificar que no tenga compras pendientes
    if (rifa.estado === 'activa') {
      return estadisticas.compras.pendientes === 0;
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
    
    if (rifa.estado === 'activa' && estadisticas.compras.pendientes > 0) {
      return `Hay ${estadisticas.compras.pendientes} compra(s) pendiente(s)`;
    }
    
    return '';
  }

  // Cambiar estado de la rifa
  cambiarEstadoRifa(): void {
    if (!this.rifaSeleccionadaEstadisticas || !this.puedeCambiarEstadoRifa()) return;
    
    const rifa = this.rifaSeleccionadaEstadisticas.rifa;
    const nuevoEstado = rifa.estado === 'activa' ? 'inactiva' : 'activa';
    const accion = nuevoEstado === 'activa' ? 'activar' : 'inactivar';
    
    if (!confirm(`¿Estás seguro de ${accion} esta rifa?`)) return;
    
    this.adminService.cambiarEstadoRifa(rifa._id, nuevoEstado, this.token).subscribe({
      next: (response: any) => {
        this.mostrarMensaje(`Rifa ${nuevoEstado === 'activa' ? 'activada' : 'inactivada'} exitosamente`, 'success');
        // Actualizar el estado local
        this.rifaSeleccionadaEstadisticas.rifa.estado = nuevoEstado;
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
    
    this.adminService.verificarPago(this.token, this.compraSeleccionadaCompradores._id).subscribe({
      next: (response: any) => {
        this.mostrarMensaje('Pago verificado y email enviado exitosamente', 'success');
        this.cerrarModalVerificarCompradores();
        // Recargar compradores
        this.cargarCompradoresRifa(this.compraSeleccionadaCompradores.rifaId._id || this.compraSeleccionadaCompradores.rifaId);
      },
      error: (error: any) => {
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
    
    this.adminService.rechazarPago(this.token, this.compraSeleccionadaCompradores._id, this.motivoRechazoCompradores).subscribe({
      next: (response: any) => {
        this.mostrarMensaje('Pago rechazado y notificación enviada', 'success');
        this.cerrarModalRechazarCompradores();
        // Recargar compradores
        this.cargarCompradoresRifa(this.compraSeleccionadaCompradores.rifaId._id || this.compraSeleccionadaCompradores.rifaId);
      },
      error: (error: any) => {
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
}
