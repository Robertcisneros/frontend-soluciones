import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
        // Meta de ventas semanal y mensual
        getMetaCantidad(): Observable<any> {
          return this.http.get<any>(`${this.API_URL}/dashboard/ventas/meta-cantidad`);
        }
      // Nuevo endpoint para ventas por hora con detalle de productos
      getDashboardVentasPorHoraDetalle(anio: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}/dashboard/ventas/por-hora-productos/${anio}`);
      }
    // ...existing code...

    // Ventas por día y por hora (dashboard)
    getDashboardVentasPorDia(anio: number): Observable<any[]> {
      return this.http.get<any[]>(`${this.API_URL}/dashboard/ventas/por-dia/${anio}`);
    }

    getDashboardVentasPorHora(anio: number): Observable<any[]> {
      return this.http.get<any[]>(`${this.API_URL}/dashboard/ventas/por-hora/${anio}`);
    }
  private readonly API_URL = environment.apiUrl.endsWith('/api') 
  ? environment.apiUrl 
  : `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  // Métodos de autenticación
  login(correo: string, contrasena: string): Observable<any> {
    console.log('Enviando petición a:', `${this.API_URL}/auth/login-cliente`);
    console.log('Con datos:', { correo, contrasena: '***' });
    return this.http.post(`${this.API_URL}/auth/login-cliente`, { correo, contrasena });
  }

  loginUsuario(correo: string, contrasena: string): Observable<any> {
    console.log('Enviando petición a:', `${this.API_URL}/auth/login-usuario`);
    console.log('Con datos:', { correo, contrasena: '***' });
    return this.http.post(`${this.API_URL}/auth/login-usuario`, { correo, contrasena });
  }

  register(usuario: any): Observable<any> {
    // Asegurar que el campo se llame 'contraseña' con ñ como espera el backend
    const cliente = {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      contraseña: usuario.contrasena, // Mapear contrasena -> contraseña
      telefono: usuario.telefono,
      direccion: usuario.direccion,
      rol: 'cliente'
    };
    console.log('Datos enviados al backend:', { ...cliente, contraseña: '***' });
    return this.http.post(`${this.API_URL}/auth/registrar`, cliente);
  }

  // Métodos de productos
  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/productos`, {
      headers: this.getAuthHeaders()
    });
  }

  getProducto(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/productos/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  createProducto(producto: any): Observable<any> {
    return this.http.post(`${this.API_URL}/productos`, producto, {
      headers: this.getAuthHeaders()
    });
  }

  updateProducto(id: number, producto: any): Observable<any> {
    return this.http.put(`${this.API_URL}/productos/${id}`, producto, {
      headers: this.getAuthHeaders()
    });
  }

  deleteProducto(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/productos/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Métodos de categorías
  getCategorias(): Observable<any[]> {
    // No necesita autenticación para ver categorías públicas
    return this.http.get<any[]>(`${this.API_URL}/categorias`);
  }

  // Métodos de ventas
  getVentas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/ventas`, {
      headers: this.getAuthHeaders()
    });
  }

  createVenta(venta: any): Observable<any> {
    return this.http.post(`${this.API_URL}/ventas`, venta, {
      headers: this.getAuthHeaders()
    });
  }

  // Métodos de usuarios (admin)
  getUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/usuarios`, {
      headers: this.getAuthHeaders()
    });
  }

  createUsuario(usuario: any): Observable<any> {
    return this.http.post(`${this.API_URL}/usuarios`, usuario, {
      headers: this.getAuthHeaders()
    });
  }

  updateUsuario(id: number, usuario: any): Observable<any> {
    return this.http.put(`${this.API_URL}/usuarios/${id}`, usuario, {
      headers: this.getAuthHeaders()
    });
  }

  deleteUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/usuarios/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Métodos de reportes
  getReporteVentas(fechaInicio?: string, fechaFin?: string): Observable<any> {
    let url = `${this.API_URL}/reportes/ventas`;
    if (fechaInicio && fechaFin) {
      url += `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    }
    return this.http.get<any>(url, {
      headers: this.getAuthHeaders()
    });
  }

  getReporteInventario(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/reportes/inventario`, {
      headers: this.getAuthHeaders()
    });
  }

  // ============================================
  // MÉTODOS DE DASHBOARD
  // ============================================

  // Resumen de Ventas por Tiempo
  getDashboardVentasResumenAnio(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/dashboard/ventas/resumen-anio`);
  }

  getDashboardVentasResumenMes(anio: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/dashboard/ventas/resumen-mes/${anio}`);
  }

  getDashboardVentasLista(anio: number, mes: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/dashboard/ventas/lista/${anio}/${mes}`);
  }

  getDashboardVentasTotalAnio(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/dashboard/ventas/total-anio`);
  }

  getDashboardVentasTotalMes(anio: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/dashboard/ventas/total-mes/${anio}`);
  }

  // Resumen de Compras por Tiempo
  getDashboardComprasResumenAnio(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/dashboard/compras/resumen-anio`);
  }

  getDashboardComprasResumenMes(anio: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/dashboard/compras/resumen-mes/${anio}`);
  }

  getDashboardComprasLista(anio: number, mes: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/dashboard/compras/lista/${anio}/${mes}`);
  }

  getDashboardComprasTotalAnio(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/dashboard/compras/total-anio`);
  }

  getDashboardComprasTotalMes(anio: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/dashboard/compras/total-mes/${anio}`);
  }

  // Resumen General
  getDashboardResumenGeneral(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/dashboard/resumen-general`);
  }

  // Dashboards Especiales
  getDashboardCategoriaMasVendida(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/dashboard/categoria-mas-vendida`);
  }

  getDashboardProductoMasVendidoCategoria(idCategoria: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/dashboard/producto-mas-vendido-categoria/${idCategoria}`);
  }

  getDashboardFormaPagoMasUsada(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/dashboard/forma-pago-mas-usada`);
  }

    // Inventario Serial Ideal (Admin)
    getInventarioSerialIdeal(): Observable<any> {
      return this.http.get<any>(`${this.API_URL}/dashboard/inventario-serial-ideal`, {
        headers: this.getAuthHeaders()
      });
    }

  // Helpers
  private getAuthHeaders(): HttpHeaders {
    const usuario = this.getUsuarioActual();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (usuario && usuario.token) {
      headers = headers.set('Authorization', `Bearer ${usuario.token}`);
    }
    
    return headers;
  }

  getUsuarioActual(): any {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  }

  logout(): void {
    localStorage.removeItem('usuario');
  }

  isAuthenticated(): boolean {
    return !!this.getUsuarioActual();
  }

  getUserRole(): string | null {
    const usuario = this.getUsuarioActual();
    return usuario ? usuario.rol : null;
  }
}
