# Intranet A1Perú

Sistema web para la gestión de servicios de movilidad corporativa, desarrollado en React. Permite a los usuarios solicitar servicios de taxi, gestionar favoritos, consultar historial, validar servicios y administrar áreas, centros de costos y motivos, todo desde una intranet moderna y segura.

## Características principales

- **Solicitud de servicios**: Formulario avanzado para solicitar traslados, con selección de origen, destino(s), área, centro de costos, motivo y detalle. Incluye cálculo de tarifa en tiempo real y confirmación previa a la generación del servicio.
- **Gestión de favoritos**: Guarda y reutiliza direcciones frecuentes para agilizar la solicitud de servicios.
- **Historial y validación**: Consulta y valida servicios realizados, con filtros por fecha, estado y exportación a Excel.
- **Panel de control (Dashboard)**: Visualiza estadísticas de uso, servicios realizados, pendientes y finalizados, con gráficos interactivos.
- **Gestión de áreas, centros de costos y motivos**: Administración sencilla de catálogos para la correcta imputación de servicios.
- **Soporte multiusuario**: Solicita servicios para ti o para otros usuarios de la empresa.
- **Componentes reutilizables**: Inputs, selects, botones, modales y tablas, todos con diseño consistente y responsivo.
- **Integración con Google Maps**: Selección visual de direcciones y visualización de rutas.
- **Notificaciones y validaciones**: Feedback inmediato al usuario ante errores, validaciones o acciones exitosas.

## Estructura del proyecto

```
src/
  components/
    common/      # Componentes reutilizables (Input, Button, Select, etc.)
    layout/      # Layout general, Sidebar, Topbar, Modal, GoogleMaps
    pages/       # Vistas principales: Request, Dashboard, History, Valide, etc.
    image/       # Imágenes y recursos gráficos
  hooks/         # Custom hooks (favoritos, sugerencias de ubicación)
  utils/         # Utilidades generales y de tarifas
  assets/        # Recursos estáticos
  routes/        # Rutas protegidas y navegación
  App.js         # Componente raíz
  index.js       # Punto de entrada
```

## Instalación

1. **Clona el repositorio**  
   ```bash
   git clone <url-del-repo>
   cd A1Peru
   ```

2. **Instala las dependencias**  
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**  
   Crea un archivo `.env` en la raíz con las siguientes variables (ajusta según tu entorno):
   ```
   REACT_APP_BASE_URL=
   REACT_APP_IDEMPRESA=
   REACT_APP_GEO_API_URL=
   ```

4. **Inicia la aplicación**  
   ```bash
   npm start
   ```
   Accede a [http://localhost:3000](http://localhost:3000)

## Scripts disponibles

- `npm start` — Inicia la app en modo desarrollo.
- `npm run build` — Genera la versión de producción.
- `npm test` — Ejecuta los tests.
- `npm run eject` — Expone la configuración de build (irreversible).

## Variables de entorno

El proyecto utiliza las siguientes variables de entorno (definidas en el archivo `.env`):

- `REACT_APP_BASE_URL` — URL base de la API principal
- `REACT_APP_IDEMPRESA` — ID de la empresa para las consultas
- `REACT_APP_GEO_API_URL` — URL base de la API de geolocalización y rutas

## Principales dependencias

- **React 19**
- **React Router DOM** — Navegación y rutas protegidas
- **React Hook Form + Yup** — Formularios y validaciones
- **MUI (Material UI)** — Componentes visuales y modales
- **ApexCharts** — Gráficos interactivos
- **Axios** — Llamadas HTTP
- **React Toastify** — Notificaciones
- **Google Maps API** — Geolocalización y rutas

## Personalización y desarrollo

- Los estilos principales están en `src/components/pages/*.css` y `src/components/layout/modal.css`.
- Los componentes de modal están en `src/components/layout/Modal.js`.
- Para agregar nuevas páginas, crea un archivo en `src/components/pages/` y agrégalo a las rutas.
- Los hooks personalizados están en `src/hooks/`.

## Contribución

1. Haz un fork del repositorio.
2. Crea una rama para tu feature o fix: `git checkout -b feature/nueva-funcionalidad`
3. Haz tus cambios y commitea: `git commit -am 'Agrega nueva funcionalidad'`
4. Haz push a tu rama: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request.

---
