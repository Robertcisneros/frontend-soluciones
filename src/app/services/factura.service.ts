import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Venta {
  idVenta?: number;
  fechaVenta?: Date;
  idCliente: number;
  idUsuario?: number;
  total: number;
  estado: string;
  metodoPago: string; // ← AGREGADO
  observacion?: string;
}

export interface DetalleVenta {
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  lote?: string;
  fecha_vencimiento?: string;
}

export interface Factura {
  idFactura?: number;
  idVenta: number;
  numeroFactura?: string;
  fechaEmision?: Date;
  tipoComprobante: string;
  total: number;
  estado: string;
  datosFiscales?: string;
}

export interface VentaRequest {
  venta: Venta;
  detalles: DetalleVenta[];
  factura: Factura;
}

@Injectable({
  providedIn: 'root'
})
export class FacturaService {
  private apiUrl = environment.apiUrl.endsWith('/api') 
    ? environment.apiUrl 
    : `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  /**
   * Crea una venta completa con sus detalles y genera la factura
   */
  crearVentaConFactura(ventaData: VentaRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/ventas/registrar-venta`, ventaData);
  }

  /**
   * Descarga la factura en PDF
   */
  descargarFacturaPDF(idFactura: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/facturas/${idFactura}/pdf`, {
      responseType: 'blob'
    });
  }

  /**
   * Obtiene una factura por ID
   */
  obtenerFactura(idFactura: number): Observable<Factura> {
    return this.http.get<Factura>(`${this.apiUrl}/facturas/${idFactura}`);
  }

  /**
   * Obtiene las facturas de un cliente
   */
  obtenerFacturasCliente(idCliente: number): Observable<Factura[]> {
    return this.http.get<Factura[]>(`${this.apiUrl}/facturas/cliente/${idCliente}`);
  }

  /**
   * Obtiene la última factura de un cliente
   */
  obtenerUltimaFacturaCliente(idCliente: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/facturas/cliente/${idCliente}/ultima`);
  }
}
