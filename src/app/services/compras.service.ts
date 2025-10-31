import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ComprasService {
  private apiUrl = `${environment.apiUrl}/compras`;

  constructor(private http: HttpClient) { }

  obtenerTasaBCV(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/tasa`);
  }

  crearCompra(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }

  verificarTicketsPorEmail(email: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verificar/${email}`);
  }
}
