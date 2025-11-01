import { Component, OnInit, OnDestroy } from '@angular/core';
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
  
  // Auto-refresh
  private refreshInterval: any;
  
  // Estadísticas
  estadisticas: any = null;
  
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
  compraSeleccionada: any = null;
  motivoRechazo: string = '';
  
  // Ver comprobante
  mostrarModalComprobante: boolean = false;
  comprobanteUrl: string = '';

  constructor(
    private route: ActivatedRoute,
    private adminService: AdminService
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
    // Refrescar cada 30 segundos
    this.refreshInterval = setInterval(() => {
      if (this.tabActivo === 'pendientes') {
        this.cargarComprasPendientes();
      } else if (this.tabActivo === 'verificadas') {
        this.cargarComprasVerificadas();
      } else if (this.tabActivo === 'rechazadas') {
        this.cargarComprasRechazadas();
      }
      this.cargarEstadisticas();
    }, 30000); // 30 segundos
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

  cargarComprasPendientes(): void {
    this.cargandoCompras = true;
    this.adminService.obtenerComprasPendientes(this.token).subscribe({
      next: (response) => {
        if (response.success) {
          this.comprasPendientes = response.data;
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

  cargarComprasVerificadas(): void {
    this.cargandoCompras = true;
    this.adminService.obtenerComprasVerificadas(this.token).subscribe({
      next: (response) => {
        if (response.success) {
          this.comprasVerificadas = response.data;
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

  cargarComprasRechazadas(): void {
    this.cargandoCompras = true;
    this.adminService.obtenerComprasRechazadas(this.token).subscribe({
      next: (response) => {
        if (response.success) {
          this.comprasRechazadas = response.data;
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

  cargarEstadisticas(): void {
    this.adminService.obtenerEstadisticas(this.token).subscribe({
      next: (response) => {
        if (response.success) {
          this.estadisticas = response.data;
        }
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
      }
    });
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

  verComprobante(url: string): void {
    this.comprobanteUrl = url;
    this.mostrarModalComprobante = true;
  }

  cerrarModalComprobante(): void {
    this.mostrarModalComprobante = false;
    this.comprobanteUrl = '';
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
}
