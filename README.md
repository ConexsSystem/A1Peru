# Intranet A1Perú

**Sistema web de gestión de servicios de movilidad corporativa** desarrollado en React 19. Solución integral que permite a los usuarios solicitar servicios de taxi, gestionar favoritos, consultar historial, validar servicios y administrar catálogos empresariales desde una intranet moderna, segura y responsive.

## 🚀 Características principales

### **🚖 Gestión de Servicios**
- **Solicitud de servicios**: Formulario avanzado con selección de origen, múltiples destinos, área, centro de costos y motivo
- **Cálculo de tarifas en tiempo real** con validación previa antes de la confirmación
- **Soporte multiusuario**: Solicita servicios para ti o para otros usuarios de la empresa
- **Tracking en tiempo real** del estado de los servicios solicitados

### **📍 Gestión de Ubicaciones**
- **Integración completa con Google Maps API** para selección visual de direcciones
- **Sistema de favoritos** para guardar y reutilizar direcciones frecuentes  
- **Autocompletado inteligente** de ubicaciones con sugerencias contextuales
- **Visualización de rutas** y cálculo automático de distancias

### **📊 Panel de Control y Reportes**
- **Dashboard interactivo** con estadísticas de uso y métricas empresariales
- **Historial completo** de servicios con filtros avanzados por fecha, estado y usuario
- **Validación de servicios** realizados con sistema de vales digitales
- **Exportación a Excel** de reportes y datos históricos

### **⚙️ Administración**
- **Gestión de áreas** empresariales y centros de costos
- **Configuración de motivos** para la correcta imputación de servicios
- **Administración de usuarios** y perfiles de acceso
- **Sistema de roles** (usuario/administrador)

### **🎨 Experiencia de Usuario**
- **Componentes reutilizables** con diseño consistente y responsivo
- **Notificaciones en tiempo real** con React Toastify
- **Validaciones robustas** usando React Hook Form + Yup
- **Interfaz moderna** con Material UI (MUI)

## 🏗️ Arquitectura del proyecto

```
src/
├── components/
│   ├── common/           # Componentes reutilizables
│   │   ├── Button.js     # Botones personalizados
│   │   ├── Input.js      # Campos de entrada
│   │   ├── Select.js     # Selectores desplegables
│   │   └── ExportExcelButton.js  # Exportación de datos
│   ├── layout/           # Componentes de diseño
│   │   ├── Sidebar.js    # Navegación lateral
│   │   ├── Topbar.js     # Barra superior
│   │   ├── Modal.js      # Sistema de modales (2460 líneas)
│   │   └── GoogleMaps.js # Integración con Google Maps
│   ├── pages/            # Vistas principales de la aplicación
│   │   ├── Login.js      # Autenticación de usuarios
│   │   ├── Dashboard.js  # Panel principal con métricas
│   │   ├── Request.js    # Solicitud de servicios (1139 líneas)
│   │   ├── MyServices.js # Mis servicios solicitados
│   │   ├── History.js    # Historial de servicios
│   │   ├── Favorites.js  # Gestión de ubicaciones favoritas
│   │   ├── Valide.js     # Validación de servicios
│   │   ├── Tracking.js   # Seguimiento en tiempo real
│   │   ├── Personal.js   # Gestión de personal
│   │   ├── Areas.js      # Administración de áreas
│   │   ├── CostCenter.js # Centros de costos
│   │   └── Vale.js       # Sistema de vales
│   └── image/            # Recursos gráficos y logos
├── hooks/                # Custom hooks de React
│   ├── useFavorites.js   # Lógica de favoritos (152 líneas)
│   └── useLocationSuggestions.js  # Sugerencias de ubicación (211 líneas)
├── utils/                # Utilidades y helpers
│   ├── tariffUtils.js    # Cálculos de tarifas (213 líneas)
│   ├── utils.js          # Funciones auxiliares generales
│   └── ToastifyComponent.js  # Configuración de notificaciones
├── routes/               # Configuración de rutas
│   └── ProtectedRoute.js # Rutas protegidas con autenticación
├── assets/               # Recursos estáticos
├── App.js               # Componente raíz con routing (159 líneas)
└── index.js             # Punto de entrada de la aplicación
```

## 🛠️ Stack Tecnológico

### **Frontend Core**
- **React 19** - Framework principal
- **React Router DOM 7.3** - Navegación y rutas protegidas
- **React Hook Form 7.55 + Yup 1.6** - Formularios y validaciones

### **UI/UX**
- **Material UI (MUI) 6.4** - Componentes visuales y sistema de diseño
- **React Icons 5.5** - Iconografía consistente
- **React Toastify 11.0** - Sistema de notificaciones

### **Visualización de Datos**
- **ApexCharts 4.5 + React ApexCharts 1.7** - Gráficos interactivos
- **React Charts 3.0** - Visualizaciones adicionales

### **Integración Externa**
- **Google Maps JavaScript API** - Geolocalización y mapas
- **Axios 1.8** - Cliente HTTP para APIs REST

### **Utilidades**
- **XLSX 0.18** - Procesamiento de archivos Excel
- **html2canvas 1.4 + jsPDF 3.0** - Generación de PDFs
- **Web Vitals 2.1** - Métricas de rendimiento

### **Desarrollo y Testing**
- **React Scripts 5.0** - Configuración de build
- **Testing Library** - Suite de testing (DOM, React, User Event)

## 🚀 Instalación y configuración

### **1. Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd A1Peru
```

### **2. Instalar dependencias**
```bash
npm install
```

### **3. Configurar variables de entorno**
Crea un archivo `.env` en la raíz del proyecto:

```bash
# API Principal
REACT_APP_BASE_URL=https://tu-api-principal.com/

# Identificador de empresa
REACT_APP_IDEMPRESA=tu_id_empresa

# API de Geolocalización
REACT_APP_GEO_API_URL=https://tu-api-geo.com/

# URL de vales (opcional)
REACT_APP_VALE=https://tu-sistema-vales.com/
```

### **4. Configurar Google Maps**
El proyecto incluye Google Maps API. La clave está configurada en `/public/index.html`:
```html
<script async defer
  src="https://maps.googleapis.com/maps/api/js?key=TU_API_KEY&loading=async&v=beta&libraries=marker">
</script>
```

> ⚠️ **Importante**: Reemplaza `TU_API_KEY` con tu clave válida de Google Maps API

### **5. Iniciar la aplicación**
```bash
npm start
```
La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📜 Scripts disponibles

```bash
# Desarrollo
npm start          # Servidor de desarrollo (puerto 3000)
npm test           # Ejecutar tests con Jest
npm run build      # Build de producción optimizado
npm run eject      # Exponer configuración de webpack (irreversible)
```

## 🔧 Configuración avanzada

### **Variables de entorno disponibles**

| Variable | Descripción | Requerida | Ejemplo |
|----------|-------------|-----------|---------|
| `REACT_APP_BASE_URL` | URL base de la API principal | ✅ | `https://api.empresa.com/` |
| `REACT_APP_IDEMPRESA` | ID único de la empresa | ✅ | `12345` |
| `REACT_APP_GEO_API_URL` | URL de la API de geolocalización | ✅ | `https://geo-api.empresa.com/` |
| `REACT_APP_VALE` | URL del sistema de vales | ❌ | `https://vales.empresa.com/` |

### **Autenticación y seguridad**
- **Sistema de tokens**: Almacenamiento en localStorage con clave `key`
- **Rutas protegidas**: Validación automática de autenticación
- **Roles de usuario**: Soporte para usuarios estándar y administradores
- **Sesión persistente**: Mantenimiento de estado entre recargas

### **APIs integradas**
El sistema consume múltiples endpoints:
- **Autenticación**: Login, logout, validación de tokens
- **Servicios**: CRUD completo de solicitudes de movilidad
- **Geolocalización**: Búsqueda de direcciones, cálculo de rutas
- **Catálogos**: Áreas, centros de costos, motivos, personal
- **Reportes**: Historiales, estadísticas, exportaciones

## 🎨 Personalización

### **Estilos y temas**
- **CSS principal**: `/src/App.css` (278 líneas)
- **Componentes**: Cada componente tiene su archivo CSS dedicado
- **Variables CSS**: Configuradas para fácil personalización
- **Responsive**: Diseño adaptativo para todos los dispositivos

### **Componentes personalizables**
```javascript
// Ejemplo de uso de componentes reutilizables
import Button from './components/common/Button';
import Input from './components/common/Input';
import Select from './components/common/Select';

// Uso en formularios
<Input 
  label="Dirección de origen"
  value={origin}
  onChange={setOrigin}
  placeholder="Ingresa la dirección de origen"
/>

<Button 
  variant="primary"
  onClick={handleSubmit}
  loading={isSubmitting}
>
  Solicitar Servicio
</Button>
```

### **Extensión de funcionalidades**
- **Nuevas páginas**: Crear componentes en `/src/components/pages/`
- **Custom hooks**: Implementar lógica reutilizable en `/src/hooks/`
- **Utilidades**: Agregar helpers en `/src/utils/`
- **Rutas**: Configurar navegación en `/src/App.js`

## 📊 Características técnicas avanzadas

### **Gestión de estado**
- **Local state**: React useState para estado de componentes
- **Custom hooks**: Lógica compleja encapsulada y reutilizable
- **localStorage**: Persistencia de autenticación y preferencias

### **Optimizaciones de rendimiento**
- **Lazy loading**: Carga diferida de componentes pesados
- **Memoización**: useCallback para optimizar renders
- **Debouncing**: Búsquedas de ubicaciones optimizadas

### **Manejo de errores**
- **Error boundaries**: Captura de errores en componentes
- **Validaciones robustas**: Esquemas Yup para formularios
- **Feedback visual**: Notificaciones informativas para el usuario

## 🤝 Contribución

### **Flujo de desarrollo**
1. **Fork** del repositorio
2. **Crear rama**: `git checkout -b feature/nueva-funcionalidad`
3. **Desarrollar**: Implementar cambios siguiendo las convenciones
4. **Testing**: Verificar que los tests pasen
5. **Commit**: `git commit -am 'feat: Agrega nueva funcionalidad'`
6. **Push**: `git push origin feature/nueva-funcionalidad`
7. **Pull Request**: Abrir PR con descripción detallada

### **Convenciones de código**
- **ES6+**: Usar características modernas de JavaScript
- **Componentes funcionales**: Preferir hooks sobre clases
- **CSS modular**: Un archivo CSS por componente
- **Nomenclatura**: camelCase para variables, PascalCase para componentes

### **Estructura de commits**
```bash
feat: nueva funcionalidad
fix: corrección de bug
docs: actualización de documentación
style: cambios de formato (sin afectar lógica)
refactor: mejoras de código sin cambiar funcionalidad
test: agregar o modificar tests
```

## 📝 Licencia y soporte

- **Versión actual**: 0.1.0
- **Privado**: Sí (uso interno empresarial)
- **Soporte**: Contactar al equipo de desarrollo

---

**Desarrollado con ❤️ para A1 Perú**
