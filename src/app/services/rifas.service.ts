import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Rifa {
  _id: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  precioTicketUSD: number;
  ticketsDisponibles: number;
  totalTickets: number;
  fechaSorteo: Date;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class RifasService {
  private apiUrl = `${environment.apiUrl}/rifas`;

  constructor(private http: HttpClient) { }

  obtenerRifasActivas(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  obtenerRifaPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  obtenerEstadoNumeros(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/numeros`);
  }
}
