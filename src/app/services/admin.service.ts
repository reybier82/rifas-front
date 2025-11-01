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
   * Obtener compras rechazadas
   */
  obtenerComprasRechazadas(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/${token}/compras/rechazadas`);
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
   * Obtener estadísticas generales (LEGACY)
   */
  obtenerEstadisticas(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/${token}/estadisticas`);
  }

  /**
   * Obtener lista de rifas con estadísticas resumidas
   */
  obtenerRifasConEstadisticas(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/${token}/rifas-estadisticas`);
  }

  /**
   * Obtener estadísticas detalladas de una rifa específica
   */
  obtenerEstadisticasRifa(token: string, rifaId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/${token}/rifas/${rifaId}/estadisticas`);
  }

  /**
   * Obtener todas las compras de una rifa específica
   */
  obtenerComprasPorRifa(token: string, rifaId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/${token}/rifas/${rifaId}/compras`);
  }

  /**
   * Cambiar estado de una rifa (activa/inactiva)
   */
  cambiarEstadoRifa(rifaId: string, nuevoEstado: string, token: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/${token}/rifas/${rifaId}/estado`, { estado: nuevoEstado });
  }

  /**
   * Editar una rifa existente
   */
  editarRifa(rifaId: string, formData: FormData, token: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/${token}/rifas/${rifaId}`, formData);
  }

  /**
   * Notificar al ganador de una rifa
   */
  notificarGanador(data: any, token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/${token}/notificar-ganador`, data);
  }
}
