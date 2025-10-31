import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Verificar si el token de admin es válido
   */
  verificarToken(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/verify/${token}`);
  }

  /**
   * Obtener compras pendientes de verificación
   */
  obtenerComprasPendientes(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/${token}/compras/pendientes`);
  }

  /**
   * Obtener compras verificadas
   */
  obtenerComprasVerificadas(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/${token}/compras/verificadas`);
  }

  /**
   * Obtener todas las compras
   */
  obtenerTodasLasCompras(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/${token}/compras`);
  }

  /**
   * Verificar pago de una compra
   */
  verificarPago(token: string, compraId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/${token}/compras/${compraId}/verificar`, {});
  }

  /**
   * Rechazar pago de una compra
   */
  rechazarPago(token: string, compraId: string, motivo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/${token}/compras/${compraId}/rechazar`, { motivo });
  }

  /**
   * Crear nueva rifa
   */
  crearRifa(token: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/${token}/rifas`, formData);
  }

  /**
   * Obtener estadísticas
   */
  obtenerEstadisticas(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/${token}/estadisticas`);
  }
}
