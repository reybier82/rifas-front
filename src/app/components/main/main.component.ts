import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { RifasService } from '../../services/rifas.service';
import { ComprasService } from '../../services/compras.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit, OnDestroy {
  rifas: any[] = [];
  cargando: boolean = true;

  // Modal de verificación
  mostrarModalVerificar: boolean = false;
  emailVerificar: string = '';
  comprasEncontradas: any[] = [];
  mostrarResultadosVerificacion: boolean = false;
  cargandoVerificacion: boolean = false;
  mostrarAlertaNoCompras: boolean = false;

  // Modal de número ganador
  mostrarModalNumeroGanador: boolean = false;
  rifaGanadoraSeleccionada: any = null;

  // Polling automático
  private pollingInterval: any;
  private readonly POLLING_INTERVAL_MS = 3000; // 3 segundos

  constructor(
    private router: Router,
    private rifasService: RifasService,
    private comprasService: ComprasService
  ) { }

  ngOnInit(): void {
    this.cargarRifas();
    this.iniciarPolling();
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  /**
   * Iniciar polling automático cada 3 segundos
   */
  iniciarPolling(): void {
    this.pollingInterval = setInterval(() => {
      this.cargarRifasSilencioso();
    }, this.POLLING_INTERVAL_MS);
    console.log('🔄 Polling iniciado: actualizando rifas cada 3 segundos');
  }

  /**
   * Detener polling automático
   */
  detenerPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      console.log('⏹️ Polling detenido');
    }
  }

  /**
   * Cargar rifas sin mostrar spinner (para polling)
   */
  cargarRifasSilencioso(): void {
    this.rifasService.obtenerRifasActivas().subscribe({
      next: (response) => {
        if (response.success) {
          const rifasNuevas = response.data.filter((rifa: any) => 
            rifa.estado === 'activa' || rifa.estado === 'completada'
          );
          
          // Actualizar solo si hay cambios
          if (JSON.stringify(this.rifas) !== JSON.stringify(rifasNuevas)) {
            this.rifas = rifasNuevas;
            console.log('✅ Rifas actualizadas automáticamente');
          }
        }
      },
      error: (error) => {
        console.error('Error en polling:', error);
      }
    });
  }

  cargarRifas(): void {
    this.rifasService.obtenerRifasActivas().subscribe({
      next: (response) => {
        if (response.success) {
          // Filtrar para mostrar solo rifas activas y completadas
          this.rifas = response.data.filter((rifa: any) => 
            rifa.estado === 'activa' || rifa.estado === 'completada'
          );
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

  // ==================== MODAL DE VERIFICACIÓN ====================

  abrirModalVerificar(): void {
    this.mostrarModalVerificar = true;
    this.emailVerificar = '';
    this.comprasEncontradas = [];
    this.mostrarResultadosVerificacion = false;
  }

  cerrarModalVerificar(): void {
    this.mostrarModalVerificar = false;
    this.emailVerificar = '';
    this.comprasEncontradas = [];
    this.mostrarResultadosVerificacion = false;
  }

  verificarTickets(): void {
    if (!this.emailVerificar || !this.emailVerificar.includes('@')) {
      return;
    }

    this.cargandoVerificacion = true;
    this.comprasService.verificarTicketsPorEmail(this.emailVerificar).subscribe({
      next: (response: any) => {
        this.cargandoVerificacion = false;
        if (response.success && response.data && response.data.length > 0) {
          this.comprasEncontradas = response.data;
          this.mostrarResultadosVerificacion = true;
        } else {
          // No se encontraron compras o success: false
          this.mostrarAlertaNoCompras = true;
        }
      },
      error: (error: any) => {
        this.cargandoVerificacion = false;
        console.error('Error al verificar compras:', error);
        // También mostrar modal de no encontradas en caso de error
        this.mostrarAlertaNoCompras = true;
      }
    });
  }

  cerrarAlertaNoCompras(): void {
    this.mostrarAlertaNoCompras = false;
    this.emailVerificar = '';
    this.cerrarModalVerificar();
  }

  obtenerNumeros(tickets: any[]): string {
    return tickets.map(t => t.numero).sort((a, b) => a - b).join(', ');
  }

  // ==================== MODAL DE NÚMERO GANADOR ====================

  abrirModalNumeroGanador(rifa: any): void {
    this.rifaGanadoraSeleccionada = rifa;
    this.mostrarModalNumeroGanador = true;
  }

  cerrarModalNumeroGanador(): void {
    this.mostrarModalNumeroGanador = false;
    this.rifaGanadoraSeleccionada = null;
  }

}
