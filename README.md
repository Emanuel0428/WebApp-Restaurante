# Bigotes Pizzería Artesanal Alemana 🍕

Bienvenido al repositorio de **Bigotes Pizzería Artesanal Alemana**, una aplicación web moderna construida con **React**, **TypeScript**, **Vite** y **Tailwind CSS**. Esta aplicación ofrece una experiencia de usuario fluida para explorar nuestro menú, realizar pedidos y conocer más sobre nuestra pizzería artesanal con un toque alemán.

## 🌟 Características Principales

- **Menú Interactivo**: Explora nuestras categorías de productos (Entradas, Platos Fuertes, Bebidas)
- **Personalización de Pedidos**: Sistema intuitivo para personalizar cada producto
- **Carrito de Compras**: Gestión eficiente de pedidos con contexto global
- **Diseño Responsivo**: Experiencia optimizada para dispositivos móviles y escritorio
- **Base de Datos en Tiempo Real**: Integración con Supabase para gestión de productos
- **Interfaz Moderna**: Diseño elegante con Tailwind CSS y animaciones suaves

## 🛠️ Tecnologías Utilizadas

- **Frontend**:
  - React 18
  - TypeScript
  - Vite
  - Tailwind CSS
  - React Router DOM
  - React Slick
- **Backend**:
  - Supabase (Base de datos y autenticación)
- **Herramientas de Desarrollo**:
  - ESLint
  - Prettier
  - TypeScript

## 📋 Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn
- Git

## 🚀 Instalación y Configuración

1. **Clonar el Repositorio**:
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd WebApp-Restaurante
   ```

2. **Instalar Dependencias**:
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Configurar Variables de Entorno**:
   - Crea un archivo `.env` en la raíz del proyecto
   - Añade las variables necesarias para Supabase:
     ```env
     VITE_SUPABASE_URL=tu_url_de_supabase
     VITE_SUPABASE_ANON_KEY=tu_clave_anonima
     ```

4. **Iniciar el Servidor de Desarrollo**:
   ```bash
   npm run dev
   # o
   yarn dev
   ```

## 📁 Estructura del Proyecto

```
WebApp-Restaurante/
├── src/
│   ├── assets/         # Imágenes y recursos estáticos
│   ├── components/     # Componentes reutilizables
│   ├── context/       # Contextos de React (ej: CartContext)
│   ├── lib/           # Configuraciones y utilidades
│   ├── pages/         # Componentes de página
│   └── App.tsx        # Componente principal
├── public/            # Archivos públicos
├── index.html         # Archivo HTML principal
└── package.json       # Dependencias y scripts
```

## 🔧 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run preview`: Previsualiza la versión de producción localmente

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Notas Adicionales

- La aplicación utiliza Supabase como backend, asegúrate de tener las credenciales correctamente configuradas
- Las imágenes de los productos se almacenan en la carpeta `assets` por categorías
- El sistema de carrito utiliza Context API para la gestión del estado global

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

Desarrollado con ❤️ por Federico M. | Emanuel L.
