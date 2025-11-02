import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RifasService } from '../../services/rifas.service';
import { ComprasService } from '../../services/compras.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
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

  constructor(
    private router: Router,
    private rifasService: RifasService,
    private comprasService: ComprasService
  ) { }

  ngOnInit(): void {
    this.cargarRifas();
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
