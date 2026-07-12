export const environment = {
  production: true, // Lo cambiamos a true para producción
  apiUrl: 'https://backend-soluciones.onrender.com', // Quitamos el "/api" del final de la URL base
  endpoints: {
    // Tus endpoints se mantienen igual porque ya incluyen la ruta "/api" al inicio
    login: '/api/usuarios/login', 
    register: '/api/usuarios/register',
    productos: '/api/productos',
    ventas: '/api/api/ventas', // Ojo: si en tu navegador pusiste /api/productos, mantén este formato
    usuarios: '/api/usuarios',
    reportes: '/api/reportes'
  }
};