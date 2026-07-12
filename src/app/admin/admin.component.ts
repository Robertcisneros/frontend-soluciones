import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, Product } from '../services/product.service';
import { ApiService } from '../services/api.service';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsModule],
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
        // ...existing code...

        onCategoriaChartClick(event: any): void {
          if (event && event.name) {
            const cat = this.categories.find(c => c.nombre_categoria === event.name);
            if (cat) {
              this.categoriaSeleccionada = cat.id_categoria;
              this.onCategoriaChange();
            }
          }
        }

        resetCategoriaSeleccionada(): void {
          this.categoriaSeleccionada = 0;
          this.productosPorCategoria = [];
          this.productosChartOption = {};
        }
      // Drilldown para granularidad de ventas
      mesDrilldown: number | null = null;
    ventasPorHora: any[] = [];
    ventasHoraChartOption: EChartsOption = {};
    fechaSeleccionadaParaHoras: string = new Date().toISOString().split('T')[0];
    loadVentasPorHora(): void {
      console.log('[DEBUG] Ejecutando loadVentasPorHora con fecha:', this.fechaSeleccionadaParaHoras);
      const fecha = new Date(this.fechaSeleccionadaParaHoras);
      const anio = fecha.getFullYear();
      this.apiService.getDashboardVentasPorHoraDetalle(anio).subscribe({
        next: (data: any[]) => {
          console.log('[DEBUG] Datos crudos recibidos de ventas por hora:', data);
          // Filtrar por la fecha seleccionada (formato yyyy-mm-dd)
          const fechaSeleccionada = this.fechaSeleccionadaParaHoras;
          let dataFiltrada = data.filter(item => {
            // Construir la fecha en formato yyyy-mm-dd
            const fechaItem = `${item.anio || item.year || anio}-${String(item.mes).padStart(2, '0')}-${String(item.dia).padStart(2, '0')}`;
            return fechaItem === fechaSeleccionada;
          });
          console.log('[DEBUG] Datos filtrados por fecha:', dataFiltrada);
          // Ordenar por hora ascendente
          dataFiltrada = dataFiltrada.sort((a, b) => a.hora - b.hora);
          this.ventasPorHora = [...dataFiltrada];
          // Generar tooltip con productos vendidos por hora
          this.ventasHoraChartOption = {
            title: { text: `Ventas por Hora - ${this.fechaSeleccionadaParaHoras}` , left: 'center' },
            tooltip: {
              trigger: 'axis',
              formatter: (params: any) => {
                let tooltip = '';
                if (Array.isArray(params)) {
                  params.forEach(param => {
                    const hora = param.axisValue;
                    const venta = this.ventasPorHora.find(v => v.hora == hora);
                    tooltip += `<b>${hora}:00</b><br/>Ventas: <b>${param.data}</b><br/>`;
                    if (venta && venta.productos && venta.productos.length > 0) {
                      tooltip += 'Productos:<ul style="margin:0 0 0 12px;padding:0;">';
                      venta.productos.forEach((prod: any) => {
                        tooltip += `<li>${prod.nombre} <span style='color:#888;'>x${prod.cantidad}</span></li>`;
                      });
                      tooltip += '</ul>';
                    }
                  });
                }
                return tooltip;
              }
            },
            xAxis: {
              type: 'category',
              data: dataFiltrada.map(item => item.hora)
            },
            yAxis: { type: 'value' },
            series: [{
              data: dataFiltrada.map(item => item.valor),
              type: 'bar',
              itemStyle: {
                color: {
                  type: 'linear',
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: '#10b981' },
                    { offset: 1, color: '#34d399' }
                  ]
                }
              },
              label: { show: true, position: 'top' }
            }]
          };
          console.log('[DEBUG] ventasHoraChartOption generado:', this.ventasHoraChartOption);
        },
        error: (err: any) => {
          this.ventasHoraChartOption = {};
          console.error('Error al cargar ventas por hora:', err);
        }
      });
    }
  inventarioChartOption: EChartsOption = {};
  products: Product[] = [];
  categories: any[] = [];
  loading: boolean = true;
  activeTab: string = 'productos'; // productos, estadisticas, metas

  // Analytics antiguos
  top: Product | null = null;
  least: Product | null = null;
  withoutRotation: Product[] = [];

  // Dashboard data
  resumenGeneral: any = null;
  comprasResumenAnio: any[] = [];
  categoriaMasVendida: any[] = [];
  formaPagoMasUsada: any[] = [];

  // Inventario Serial Ideal
  inventarioSerialIdeal: any = null;
  inventarioMensajes: string[] = [];

  // Filtros de dashboard
  anioSeleccionado: number = new Date().getFullYear();
  mesSeleccionado: number = new Date().getMonth() + 1;
  ventasDelMes: any[] = [];
  ventasTotalMes: any[] = [];
  ventasTotalAnio: any[] = [];
  categoriaSeleccionada: number = 0;
  productosPorCategoria: any[] = [];

  loadingDashboard: boolean = false;

  // ECharts options
  ventasMesChartOption: EChartsOption = {};
  ventasTotalMesChartOption: EChartsOption = {};
  categoriasChartOption: EChartsOption = {};
  productosChartOption: EChartsOption = {};
  pagosChartOption: EChartsOption = {};
  ventasChartOption: EChartsOption = {}; // para drilldown/custom

  // Nuevo producto (modelo del modal)
  newProduct: any = {
    nombre: '',
    precio: 0,
    stock: 0,
    id_categoria: 0,
    codigo_barras: '',
    descripcion: '',
    imagen: '',
    lote: '',
    fecha_registro: '',
    fecha_vencimiento: ''
  };

  // Modal control
  showAddModal: boolean = false;
  editingProduct: Product | null = null;

  // Variables extra para drilldown/ventas
  granularidadVentas: string = 'mes';
  granularidadStack: any[] = [];
  productosMasVendidosporHora: any[] = [];
  


  constructor(
    private http: HttpClient,
    private productService: ProductService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadDashboardData();
    this.loadMetasVentas();
    this.granularidadStack = [];
  }

  /*********************
   * CARGA DE DATOS
   *********************/
  loadData(): void {
    this.loading = true;
    this.productService.clearCache();
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
        this.loadAnalytics();
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.loading = false;
      }
    });

    this.apiService.getCategorias().subscribe({
      next: (cats) => {
        this.categories = cats;
      },
      error: (err) => console.error('Error al cargar categorías:', err)
    });
  }

  loadAnalytics(): void {
    this.productService.topSelling().subscribe(top => this.top = top);
    this.productService.leastSelling().subscribe(least => this.least = least);
    this.productService.productsWithoutRotation().subscribe(products => {
      this.withoutRotation = products;
    });
  }

  /*********************
   * TABS
   *********************/
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'estadisticas') {
      this.loadDashboardData();
    }
  }

  /*********************
   * DASHBOARD (se mantienen tus funciones)
   *********************/
  loadDashboardData(): void {
    this.loadingDashboard = true;

    this.apiService.getInventarioSerialIdeal().subscribe({
      next: (data) => {
        this.inventarioSerialIdeal = data;
        this.inventarioMensajes = [];

        if (data.stock_bajo?.length) {
          const stockBajo = data.stock_bajo.map((p: { nombre: string; stock: number }) => `${p.nombre} (stock: ${p.stock})`).join(', ');
          this.inventarioMensajes.push(`Productos con stock bajo: ${stockBajo}`);
        }
        if (data.agotados?.length) {
          const agotados = data.agotados.map((p: { nombre: string }) => p.nombre).join(', ');
          this.inventarioMensajes.push(`Productos agotados: ${agotados}`);
        }
        if (typeof data.valor_total_inventario === 'number') {
          this.inventarioMensajes.push(`Valor total del inventario: S/ ${data.valor_total_inventario.toFixed(2)}`);
        }
        if (data.alertas_vencimiento?.length) {
          const vencimiento = data.alertas_vencimiento.map((p: { nombre: string; fecha_vencimiento: string }) => `${p.nombre} (vence: ${p.fecha_vencimiento})`).join(', ');
          this.inventarioMensajes.push(`Productos próximos a vencer: ${vencimiento}`);
        }
        if (typeof data.total_productos === 'number') {
          this.inventarioMensajes.push(`Total de productos activos: ${data.total_productos}`);
        }
        if (data.stock_por_categoria) {
          const categoriasMsg = Object.entries(data.stock_por_categoria).map(([cat, stock]) => `${cat}: ${stock}`).join(', ');
          this.inventarioMensajes.push(`Stock por categoría: ${categoriasMsg}`);
        }

        // Gráfico
        let categorias: string[] = [];
        let stocks: number[] = [];
        if (data.stock_por_categoria && typeof data.stock_por_categoria === 'object') {
          categorias = Object.keys(data.stock_por_categoria);
          stocks = Object.values(data.stock_por_categoria).map(v => Number(v));
        }
        if (!categorias.length) {
          categorias = ['Sin datos'];
          stocks = [0];
        }
        this.inventarioChartOption = {
          title: { text: 'Stock por Categoría', left: 'center' },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: categorias, axisLabel: { rotate: 30 } },
          yAxis: { type: 'value' },
          series: [{ data: stocks, type: 'bar', itemStyle: { color: '#B8883B' }, label: { show: true, position: 'top' } }]
        };
      },
      error: (err) => {
        console.error('Error inventario:', err);
        this.inventarioChartOption = {
          title: { text: 'Stock por Categoría', left: 'center' },
          xAxis: { type: 'category', data: ['Sin datos'] },
          yAxis: { type: 'value' },
          series: [{ data: [0], type: 'bar', itemStyle: { color: '#B8883B' } }]
        };
      }
    });

    this.apiService.getDashboardResumenGeneral().subscribe({
      next: (data) => {
        this.resumenGeneral = data;
        try {
          // Si el backend no provee totalIngresos o es 0/null, calcularlo sumando ventasTotalAnio
          let total = Number(this.resumenGeneral?.totalIngresos);
          if (!total || isNaN(total)) {
            total = (this.ventasTotalAnio || []).reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
          }
          this.resumenGeneral.totalIngresos = total;
        } catch (err) {
          console.error('Error al normalizar totalIngresos:', err);
        }
      },
      error: (err) => console.error('Error resumen general:', err)
    });

    this.apiService.getDashboardVentasTotalAnio().subscribe({
      next: (data) => {
        this.ventasTotalAnio = data;
        try {
          const totalIngresosAnual = (this.ventasTotalAnio || []).reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
          if (!this.resumenGeneral) this.resumenGeneral = {};
          if (typeof this.resumenGeneral.totalIngresos !== 'number' || this.resumenGeneral.totalIngresos === 0) {
            this.resumenGeneral.totalIngresos = totalIngresosAnual;
          }
        } catch (err) {
          console.error('Error calculando total ingresos anual:', err);
        }
      },
      error: (err) => console.error('Error total ventas por año:', err)
    });

    this.apiService.getDashboardComprasResumenAnio().subscribe({
      next: (data) => this.comprasResumenAnio = data,
      error: (err) => console.error('Error compras por año:', err)
    });

    this.apiService.getDashboardCategoriaMasVendida().subscribe({
      next: (data) => {
        this.categoriaMasVendida = data;
        this.updateCategoriasChart();
      },
      error: (err) => console.error('Error categoría más vendida:', err)
    });

    this.apiService.getDashboardFormaPagoMasUsada().subscribe({
      next: (data) => {
        this.formaPagoMasUsada = data;
        this.updatePagosChart();
        this.loadingDashboard = false;
      },
      error: (err) => {
        console.error('Error forma de pago:', err);
        this.loadingDashboard = false;
      }
    });

    this.loadVentasDelMes();
  }

  loadVentasDelMes(): void {
    this.apiService.getDashboardVentasResumenMes(this.anioSeleccionado).subscribe({
      next: (data) => {
        this.ventasDelMes = data;
        this.updateVentasMesChart();
      },
      error: (err) => console.error('Error ventas del mes:', err)
    });

    this.apiService.getDashboardVentasTotalMes(this.anioSeleccionado).subscribe({
      next: (data) => {
        this.ventasTotalMes = data;
        this.updateVentasTotalMesChart();
        try {
          const totalIngresosCalculo = (this.ventasTotalMes || []).reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
          if (!this.resumenGeneral) this.resumenGeneral = {};
          if (typeof this.resumenGeneral.totalIngresos !== 'number' || this.resumenGeneral.totalIngresos === 0) {
            this.resumenGeneral.totalIngresos = totalIngresosCalculo;
          }
        } catch (err) {
          console.error('Error calculando total ingresos:', err);
        }
      },
      error: (err) => console.error('Error total ventas del mes:', err)
    });
  }

  onAnioChange(): void {
    this.loadVentasDelMes();
  }

  onCategoriaChange(): void {
    if (this.categoriaSeleccionada > 0) {
      this.apiService.getDashboardProductoMasVendidoCategoria(this.categoriaSeleccionada).subscribe({
        next: (data) => {
          this.productosPorCategoria = data;
          this.updateProductosChart();
        },
        error: (err) => console.error('Error productos por categoría:', err)
      });
    } else {
      this.productosPorCategoria = [];
      this.productosChartOption = {};
    }
  }

  /*********************
   * GRÁFICOS (mismos métodos que tenías)
   *********************/
  getMesNombre(mes: number): string {
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return meses[mes - 1] || mes.toString();
  }

  updateVentasMesChart(): void {
    this.ventasMesChartOption = {
      title: { text: `Ventas Mensuales ${this.anioSeleccionado}`, left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: this.ventasDelMes.map(item => this.getMesNombre(+item.nombre)) },
      yAxis: { type: 'value' },
      series: [{
        data: this.ventasDelMes.map(item => item.valor),
        type: 'bar',
        itemStyle: { color: { type: 'linear', x:0,y:0,x2:0,y2:1, colorStops: [{offset:0,color:'#8b5cf6'},{offset:1,color:'#a78bfa'}]} },
        label: { show: true, position: 'top' }
      }]
    };
  }

  updateVentasTotalMesChart(): void {
    this.ventasTotalMesChartOption = {
      title: { text: `Ingresos Mensuales ${this.anioSeleccionado}`, left: 'center' },
      tooltip: { trigger: 'axis', formatter: (params: any) => {
        const data = params[0]; return `${data.name}<br/>S/ ${data.value.toFixed(2)}`;
      }},
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value', axisLabel: { formatter: 'S/ {value}' } },
      yAxis: { type: 'category', data: this.ventasTotalMes.map(item => this.getMesNombre(+item.nombre)).reverse() },
      series: [{
        data: this.ventasTotalMes.map(item => item.valor).reverse(),
        type: 'bar',
        itemStyle: { color: { type: 'linear', x:0,y:0,x2:1,y2:0, colorStops:[{offset:0,color:'#10b981'},{offset:1,color:'#34d399'}]} },
        label: { show: true, position: 'right', formatter: (params: any) => `S/ ${params.value.toFixed(2)}` }
      }]
    };
  }

  updateCategoriasChart(): void {
    const total = this.categoriaMasVendida.reduce((sum, item) => sum + item.valor, 0);
    this.categoriasChartOption = {
      title: { text: 'Categorías Más Vendidas', left: 'center' },
      tooltip: { trigger: 'item', formatter: (params: any) => {
        const percentage = ((params.value / total) * 100).toFixed(1);
        return `${params.name}<br/>${params.value} ventas (${percentage}%)`;
      }},
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        type: 'pie', radius: ['40%','70%'], avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: (params: any) => {
          const percentage = ((params.value / total) * 100).toFixed(1);
          return `${params.name}\n${percentage}%`;
        }},
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        data: this.categoriaMasVendida.map(item => ({ name: item.nombre, value: item.valor }))
      }]
    };
  }

  updateProductosChart(): void {
    if (this.productosPorCategoria.length === 0) return;
    this.productosChartOption = {
      title: { text: 'Top Productos', left: 'center' },
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value', axisLabel: { formatter: '{value}' } },
      yAxis: { type: 'category', data: this.productosPorCategoria.map(item => item.nombre).reverse(), axisLabel: { interval: 0, rotate: 0 } },
      series: [{
        data: this.productosPorCategoria.map((item, index) => ({
          value: item.valor,
          itemStyle: { color: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#f59e0b' : '#3b82f6' }
        })).reverse(),
        type: 'bar',
        label: { show: true, position: 'right' }
      }]
    };
  }

  updatePagosChart(): void {
    const total = this.formaPagoMasUsada.reduce((sum, item) => sum + item.valor, 0);
    this.pagosChartOption = {
      title: { text: 'Métodos de Pago', left: 'center' },
      tooltip: { trigger: 'item', formatter: (params: any) => {
        const percentage = ((params.value / total) * 100).toFixed(1);
        return `${params.name}<br/>${params.value} transacciones (${percentage}%)`;
      }},
      series: [{
        type: 'pie', radius: '70%', center: ['50%','50%'],
        data: this.formaPagoMasUsada.map(item => ({ name: item.nombre.charAt(0).toUpperCase() + item.nombre.slice(1), value: item.valor })),
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: (params: any) => {
          const percentage = ((params.value / total) * 100).toFixed(1);
          return `{b}\n${percentage}%`;
        }},
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)'} }
      }]
    };
  }

  /*********************
   * MODAL (AGREGAR/EDITAR)
   *********************/
  /**
   * Abre modal. Si se pasa un producto, lo carga en modo edición.
   */
  openAddModal(product?: Product): void {
    if (product) {
      // Modo edición: mapear defensivamente
      this.editingProduct = product;
      this.newProduct = {
        nombre: (product as any).name || (product as any).nombre || '',
        precio: (product as any).price || (product as any).precio || 0,
        stock: (product as any).stock || 0,
        id_categoria: (product as any).id_categoria || (product as any).idCategoria || 0,
        codigo_barras: (product as any).codigo_barras || (product as any).barcode || '',
        descripcion: (product as any).descripcion || (product as any).description || '',
        imagen: (product as any).imagen || (product as any).image || '',
        lote: (product as any).lote || '',
        fecha_registro: (product as any).fecha_registro || '',
        fecha_vencimiento: (product as any).fecha_vencimiento || ''
      };
    } else {
      // Modo agregar: reset con valores por defecto
      const hoy = new Date().toISOString().split('T')[0];
      const unAnoDespues = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      this.editingProduct = null;
      this.newProduct = {
        nombre: '',
        precio: 0,
        stock: 0,
        id_categoria: 0,
        codigo_barras: '',
        descripcion: '',
        imagen: '',
        lote: 'L-MAS-001',
        fecha_registro: hoy,
        fecha_vencimiento: unAnoDespues
      };
    }

    // Mostrar modal
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.editingProduct = null;
  }

  /**
   * Crea o actualiza según editingProduct.
   */
  addProduct(): void {
    if (!this.newProduct.nombre || this.newProduct.precio <= 0) {
      alert('Por favor completa los campos requeridos: nombre y precio');
      return;
    }

    if (!this.newProduct.id_categoria || this.newProduct.id_categoria === 0) {
      alert('Por favor selecciona una categoría');
      return;
    }

    const productoData = {
      nombre: this.newProduct.nombre,
      precio: this.newProduct.precio,
      stock: this.newProduct.stock,
      id_categoria: this.newProduct.id_categoria,
      codigo_barras: this.newProduct.codigo_barras || '',
      descripcion: this.newProduct.descripcion || '',
      imagen: this.newProduct.imagen || null,
      lote: this.newProduct.lote || 'L-MAS-001',
      fecha_registro: this.newProduct.fecha_registro || new Date().toISOString().split('T')[0],
      fecha_vencimiento: this.newProduct.fecha_vencimiento || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    // Si editingProduct existe => UPDATE
    if (this.editingProduct) {
      const id = (this.editingProduct as any).id;
      this.apiService.updateProducto(id, productoData).subscribe({
        next: (response) => {
          alert('✅ Producto actualizado');
          this.closeAddModal();
          this.loadData();
        },
        error: (err) => {
          console.error('Error al actualizar producto:', err);
          alert('❌ Error al actualizar producto');
        }
      });
      return;
    }

    // Si no, CREATE
    this.apiService.createProducto(productoData).subscribe({
      next: (response) => {
        alert('✅ Producto agregado exitosamente');
        this.closeAddModal();
        this.loadData();
      },
      error: (err) => {
        console.error('Error al crear producto:', err);
        let errorMsg = 'Error al agregar producto';
        if (err.error?.message) errorMsg = err.error.message;
        else if (err.error) errorMsg = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
        alert('❌ ' + errorMsg);
      }
    });
  }

  /*********************
   * CRUD PRODUCT (inline & other)
   *********************/
  updateProductImage(product: Product): void {
    const nuevaImagen = prompt('URL de la nueva imagen para ' + ((product as any).name || (product as any).nombre), (product as any).imagen || '');
    if (nuevaImagen && nuevaImagen !== (product as any).imagen) {
      const updateData = {
        ...product,
        imagen: nuevaImagen
      };
      this.apiService.updateProducto(product.id, updateData).subscribe({
        next: (response) => {
          alert('✅ Imagen actualizada');
          this.loadData();
        },
        error: (err) => {
          console.error('Error al actualizar imagen:', err);
          alert('❌ Error al actualizar imagen');
        }
      });
    }
  }

  updateProduct(product: Product): void {
    const updateData = {
      nombre: (product as any).name || (product as any).nombre || '',
      precio: (product as any).price || (product as any).precio || 0,
      stock: (product as any).stock || 0,
      id_categoria: (product as any).id_categoria || null,
      codigo_barras: (product as any).codigo_barras || '',
      descripcion: (product as any).descripcion || '',
      imagen: (product as any).imagen || null,
      fecha_registro: (product as any).fecha_registro || new Date().toISOString().split('T')[0],
      fecha_vencimiento: (product as any).fecha_vencimiento || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lote: (product as any).lote || 'L-MAS-001'
    };

    this.apiService.updateProducto(product.id, updateData).subscribe({
      next: (response) => {
        alert('✅ Producto actualizado');
        this.loadData();
      },
      error: (err) => {
        console.error('Error al actualizar producto:', err);
        alert('❌ Error al actualizar producto');
      }
    });
  }

  deleteProduct(product: Product): void {
    if (!confirm(`¿Eliminar "${(product as any).name || (product as any).nombre}"?`)) return;
    this.apiService.deleteProducto(product.id).subscribe({
      next: () => {
        alert('✅ Producto eliminado');
        this.loadData();
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        alert('❌ Error al eliminar producto');
      }
    });
  }

  getCategoryName(id_categoria?: number): string {
    if (!id_categoria) return 'Sin categoría';
    const cat = this.categories.find(c => c.id_categoria === id_categoria);
    return cat ? cat.nombre_categoria : 'Sin categoría';
  }

  logout(): void {
    if (confirm('¿Cerrar sesión?')) {
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    }
  }

  /*********************
   * Aquí puedes añadir handlers para drilldown (ventas)
   *********************/
  onVentasChartClick(event: any): void {
    // Ejemplo: al hacer click en una barra, solicitar horas o detalle y actualizar la opción del chart.
    // Implementación específica depende de tus endpoints. Mantengo esto como placeholder.
    console.log('Ventas chart click:', event);
  }

  volverNivelAnterior(): void {
    // Implementa manejo de granularidad/drillstack si lo usas.
    if (this.granularidadStack.length > 0) {
      this.granularidadStack.pop();
      // Actualizar charts según stack
    }
  }
  metaSemana: number = 0;
ventasSemana: number = 0;
porcentajeSemana: number = 0;

metaMes: number = 0;
ventasMes: number = 0;
porcentajeMes: number = 0;
loadMetasVentas() {
  this.http.get<any>("http://localhost:8080/api/dashboard/ventas/meta-cantidad")
    .subscribe({
      next: (data) => {
        console.log("DEBUG METAS:", data);

        this.metaSemana = data.metaSemana || 0;
        this.ventasSemana = data.ventasSemana || 0;
        this.porcentajeSemana = data.porcentajeSemana || 0;

        this.metaMes = data.metaMes || 0;
        this.ventasMes = data.ventasMes || 0;
        this.porcentajeMes = data.porcentajeMes || 0;
      },
      error: (err) => {
        console.error("Error cargando metas:", err);
      }
    });
}

onGranularidadChange() {
  console.log('[DEBUG] Granularidad cambiada:', this.granularidadVentas);
  // Si quieres manejar un historial de navegación en el dashboard:
  if (!this.granularidadStack) {
    this.granularidadStack = [];
  }
  this.granularidadStack.push(this.granularidadVentas);
      if (this.granularidadVentas === 'mes') {
        // Usar ventasDelMes ya cargadas
        console.log('[DEBUG] Mostrando gráfico de ventas por MES', this.ventasDelMes);
        this.ventasChartOption = {
          title: { text: `Ventas por Mes (${this.anioSeleccionado})`, left: 'center' },
          tooltip: { trigger: 'axis' },
          xAxis: {
            type: 'category',
            data: this.ventasDelMes.map(item => this.getMesNombre(+item.nombre))
          },
          yAxis: { type: 'value' },
          series: [{
            data: this.ventasDelMes.map(item => item.valor),
            type: 'bar',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: '#8b5cf6' },
                  { offset: 1, color: '#a78bfa' }
                ]
              }
            },
            label: { show: true, position: 'top' }
          }]
        };
      } else if (this.granularidadVentas === 'dia') {
        console.log('[DEBUG] Solicitando ventas por DÍA para año:', this.anioSeleccionado, 'mesDrilldown:', this.mesDrilldown);
        this.apiService.getDashboardVentasPorDia(this.anioSeleccionado).subscribe({
          next: (data) => {
            let dataFiltrada = data;
            if (this.mesDrilldown) {
              dataFiltrada = data.filter(item => +item.mes === this.mesDrilldown);
            }
            console.log('[DEBUG] Datos de ventas por día recibidos:', dataFiltrada);
            this.ventasChartOption = {
              title: { text: `Ventas por Día${this.mesDrilldown ? ' - ' + this.getMesNombre(this.mesDrilldown) : ''} (${this.anioSeleccionado})`, left: 'center' },
              tooltip: { trigger: 'axis' },
              xAxis: {
                type: 'category',
                data: dataFiltrada.map(item => item.nombre)
              },
              yAxis: { type: 'value' },
              series: [{
                data: dataFiltrada.map(item => item.valor),
                type: 'bar',
                itemStyle: {
                  color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: '#f59e0b' },
                      { offset: 1, color: '#fbbf24' }
                    ]
                  }
                },
                label: { show: true, position: 'top' }
              }]
            };
          },
          error: (err) => {
            this.ventasChartOption = {};
            console.error('Error al cargar ventas por día:', err);
          }
        });
      } else if (this.granularidadVentas === 'hora') {
        console.log('[DEBUG] Solicitando ventas por HORA para fecha:', this.fechaSeleccionadaParaHoras);
        this.loadVentasPorHora();
      } else {
        console.warn('[DEBUG] Granularidad no reconocida:', this.granularidadVentas);
      }
}

}
