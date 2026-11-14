# Ordomática

Aplicación web interactiva, motor de cálculo multicriterio y servidor MCP/API para análisis de matrices, afinidad contextual y relaciones de orden mediante el método de Ordomática.

---

## 🏛️ Arquitectura por Capas y Seguridad

El sistema está diseñado bajo una arquitectura modular desacoplada con separación estricta de responsabilidades:

```
ordomati/
├── src/
│   ├── logic/          # 🧠 Lógica de Negocio Pura (Algoritmos matriciales, difusos, OWA y ranking)
│   ├── io/             # 💾 Serialización / Deserialización de casos completos
│   ├── ui/             # 🖥️ Aplicación Web SPA (React + Tailwind CSS + Lucide Icons)
│   ├── api/            # 🔒 API REST Interna (Puerto 3001, aislada y privada)
│   ├── mcp/            # 🤖 Servidor Model Context Protocol (Puerto 3002 SSE / STDIO)
│   ├── web/            # 🌐 Servidor HTTP para la SPA compilada en producción (Puerto 3000)
│   └── server/         # 🚀 Launcher unificado para orquestar todos los servicios
├── Dockerfile          # Contenedor multi-stage optimizado (Node 20 Alpine)
├── docker-compose.yml  # Orquestación lista para producción y desarrollo local
└── .github/workflows/  # Despliegue continuo automático a GitHub Pages
```

### Principio de Aislamiento de la API:
- **API REST (Puerto 3001):** Funciona como un servicio **estrictamente interno** (`127.0.0.1:3001`). No se publica al exterior ni se mapea en el host de Docker.
- **Servidor MCP (Puerto 3002):** Es el punto de entrada para los modelos de lenguaje (LLM). Recibe las llamadas del agente y las delega internamente a la API REST privada.
- **Web (Puerto 3000 / GitHub Pages):** Interfaz gráfica interactiva para usuarios humanos.

---

## 🚀 1. Despliegue Directo de la Web en GitHub Pages (`github.io`)

La interfaz web de Ordomática es una **Single Page Application (SPA)** completamente estática: todos los cálculos matriciales y la reactividad se ejecutan en el propio navegador del usuario, lo que permite hospedarla de forma 100% gratuita y sin dependencias de backend en **GitHub Pages**.

### Configuración Automática con GitHub Actions

El repositorio incluye un workflow oficial preconfigurado en [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml) que compila y publica la web automáticamente en cada `git push` a la rama `main`.

#### Pasos para activarlo en tu repositorio de GitHub:

1. Ve a la pestaña **Settings** de tu repositorio en GitHub.
2. En el menú lateral izquierdo, selecciona **Pages** (dentro de la sección *Code and automation*).
3. En el apartado **Build and deployment**:
   - En **Source**, selecciona el desplegable y elige **GitHub Actions**.
4. ¡Listo! Haz un `git push` a la rama `main` (o pulsa *Run workflow* en la pestaña **Actions**).
5. GitHub compilará el proyecto (`npm run build`) y desplegará la web en:
   ```
   https://<tu-usuario-o-organizacion>.github.io/<nombre-del-repositorio>/
   ```

> [!NOTE]
> La configuración de Vite (`base: './'`) en [`vite.config.ts`](file:///vite.config.ts) ya está preparada con rutas relativas, por lo que los recursos (`.js`, `.css`, fuentes e imágenes) cargarán correctamente bajo cualquier subdominio o subcarpeta de GitHub Pages.

---

## 🐳 2. Cómo Arrancar en Local con Docker

Puedes levantar el entorno completo (Web + Servidor MCP + API Interna) en tu máquina con Docker en un solo comando.

### Requisitos Previos:
- Docker y Docker Compose instalados ([Docker Desktop](https://www.docker.com/products/docker-desktop/)).

### Opción A: Usando Docker Compose (Recomendado)

1. En la raíz del proyecto, ejecuta:
   ```bash
   docker compose up --build
   ```
   *(O añade `-d` para ejecutarlo en segundo plano)*.

2. Al finalizar el arranque, verás en la consola:
   ```
   ========================================================================
   🚀 INICIALIZANDO PLATAFORMA INTEGRADA ORDOMÁTICA
   ========================================================================
   🌐 Interfaz Web:       http://localhost:3000
   🤖 Servidor MCP (SSE): http://localhost:3002/sse (para LLMs/Agentes)
   🔒 API Interna:        http://127.0.0.1:3001 (Privada / Solo interna)
   🔗 Enlace MCP -> API:  http://127.0.0.1:3001
   ========================================================================
   ```

3. **Accesos:**
   - **Aplicación Web:** Abre [`http://localhost:3000`](http://localhost:3000) en cualquier navegador.
   - **Servidor MCP:** Escuchando en [`http://localhost:3002/sse`](http://localhost:3002/sse).
   - **API Interna:** Escuchando solo en `127.0.0.1:3001` dentro del contenedor; protegida contra accesos externos.

Para detener los contenedores:
```bash
docker compose down
```

### Opción B: Usando Docker CLI Estándar

Si prefieres construir y correr la imagen directamente sin docker-compose:

```bash
# 1. Construir la imagen
docker build -t ordomati .

# 2. Ejecutar el contenedor publicando solo los puertos Web (3000) y MCP (3002)
docker run -d --name ordomati -p 3000:3000 -p 3002:3002 ordomati

# 3. Comprobar los logs
docker logs -f ordomati
```

---

## 🤖 3. Cómo Usar Ordomática desde un LLM mediante MCP

El protocolo **Model Context Protocol (MCP)** permite que cualquier modelo de lenguaje o agente de IA interactúe con el motor de Ordomática como si fuera una herramienta nativa de su contexto.

### Herramientas MCP Disponibles:

| Herramienta | Descripción | Parámetros |
| :--- | :--- | :--- |
| `calculate_ordomatica` | Ejecuta el motor completo de Ordomática a través de la API interna. Devuelve el ranking de alternativas con puntuación final y el desglose de todas las matrices intermedias ($V^P$, $A^C$, $V^C$, $V^{CRN}$, $RWA$). | `dataset` (opcional: si se omite, usa la plantilla predeterminada) |
| `get_default_dataset` | Solicita a la API interna la plantilla estándar de 4 alternativas y 3 dimensiones lista para ser adaptada. | Ninguno |
| `export_case_json` | Serializa un dataset a una cadena JSON estandarizada para guardar o compartir la sesión. | `dataset` (objeto completo) |
| `import_case_json` | Deserializa y repara un JSON de caso completo, validando dimensiones y matrices. | `jsonContent` (string JSON) |
| `api_health_check` | Comprueba la conectividad y el estado de la API interna de cálculo. | Ninguno |

---

### Configuración del LLM / Agente

#### 1. Conexión mediante HTTP/SSE (Cursor, Windsurf, Cline, Roo Code, Antigravity)

Con el contenedor Docker levantado, añade el servidor MCP a la configuración de tu cliente:

**En `~/.cursor/mcp.json` o la configuración de tu extensión:**
```json
{
  "mcpServers": {
    "ordomatics": {
      "url": "http://localhost:3002/sse"
    }
  }
}
```

#### 2. Conexión mediante Stdio (Claude Desktop)

Para usarlo con **Claude Desktop**, añade la siguiente configuración a tu archivo `claude_desktop_config.json`:

* **Ruta en Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
* **Ruta en macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**A través del contenedor Docker ya arrancado:**
```json
{
  "mcpServers": {
    "ordomatics": {
      "command": "docker",
      "args": ["exec", "-i", "ordomati", "node", "--import", "tsx", "src/mcp/server.ts", "--stdio"]
    }
  }
}
```

**O directamente en local (sin Docker, requiere Node 20+):**
```json
{
  "mcpServers": {
    "ordomatics": {
      "command": "npx",
      "args": ["-y", "tsx", "c:/Users/carlo/StudioProjects/ordomati/src/mcp/server.ts", "--stdio"]
    }
  }
}
```

---

### 💡 Ejemplos de Prompts para Interactuar con el LLM

Una vez conectado el MCP, puedes pedirle al LLM cosas como:

#### Ejemplo 1: Evaluación y Ranking Rápido
> *"Por favor, obtén el dataset por defecto de Ordomática usando la herramienta MCP, ejecuta el cálculo y explícame cuál es la mejor alternativa y por qué."*

#### Ejemplo 2: Análisis de Decisión Multicriterio Personalizado
> *"Quiero tomar una decisión entre 4 proveedores de nube (AWS, Azure, GCP y On-Premise) evaluando 3 dimensiones: Coste, Latencia y Facilidad de Uso. Modifica la plantilla de Ordomática con estos valores y calcula el ranking final mostrando las puntuaciones agregadas."*

#### Ejemplo 3: Análisis de Sensibilidad y Pesos OWA
> *"Toma el caso actual y recalcula la decisión variando los pesos OWA hacia un criterio pesimista (mayor peso en los valores más bajos). Compara si la alternativa ganadora cambia respecto al caso base."*

---

## 🛠️ Desarrollo en Local (Sin Docker)

Si deseas trabajar directamente sobre el código fuente en tu máquina:

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo web con Vite HMR (http://localhost:5173)
npm run dev

# Ejecutar la suite completa de pruebas unitarias (22 tests)
npm test

# Iniciar todos los servicios en local (Web + MCP + API)
npm start

# Compilar para producción
npm run build
```

---

## 📄 Licencia

Este proyecto está desarrollado para la toma de decisiones multicriterio y el análisis de relaciones de orden. Distribuido bajo licencia de código abierto.
