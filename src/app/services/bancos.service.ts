import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BancosService {
  private apiUrl = `${environment.apiUrl}/bancos`;

  constructor(private http: HttpClient) { }

  obtenerBancosPorPais(codigoPais: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pais/${codigoPais}`);
  }
}
