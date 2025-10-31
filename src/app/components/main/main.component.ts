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
