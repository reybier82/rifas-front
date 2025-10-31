import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaisesService {
  private apiUrl = `${environment.apiUrl}/paises`;

  constructor(private http: HttpClient) { }

  obtenerPaises(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
