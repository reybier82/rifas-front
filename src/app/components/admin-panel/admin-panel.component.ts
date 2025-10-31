import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  token: string = '';
  tokenValido: boolean = false;
  cargando: boolean = true;
  
  // Tabs
  tabActivo: string = 'pendientes'; // 'pendientes', 'verificadas', 'crear-rifa', 'estadisticas'
  
  // Compras
  comprasPendientes: any[] = [];
  comprasVerificadas: any[] = [];
  cargandoCompras: boolean = false;
  
  // Estadísticas
  estadisticas: any = null;
  
  // Crear rifa
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
  
  // Mensajes
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | 'info' = 'info';

  constructor(
    private route: ActivatedRoute,
    private adminService: AdminService
  ) {}

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

  cambiarTab(tab: string): void {
    this.tabActivo = tab;
    
    if (tab === 'pendientes' && this.comprasPendientes.length === 0) {
      this.cargarComprasPendientes();
    } else if (tab === 'verificadas' && this.comprasVerificadas.length === 0) {
      this.cargarComprasVerificadas();
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

  verificarPago(compraId: string): void {
    if (!confirm('¿Estás seguro de verificar este pago? Se enviará un email al usuario con sus números.')) {
      return;
    }

    this.adminService.verificarPago(this.token, compraId).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarMensaje('Pago verificado exitosamente. Email enviado al usuario.', 'success');
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

  rechazarPago(compraId: string): void {
    const motivo = prompt('Motivo del rechazo:');
    if (!motivo) return;

    this.adminService.rechazarPago(this.token, compraId, motivo).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarMensaje('Pago rechazado', 'info');
          this.cargarComprasPendientes();
        }
      },
      error: (error) => {
        console.error('Error al rechazar pago:', error);
        this.mostrarMensaje('Error al rechazar pago', 'error');
      }
    });
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
          this.limpiarFormularioRifa();
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
