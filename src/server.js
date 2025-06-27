import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import adminRouter from './routers/admin_routes.js'
import profesorRouter from './routers/profesor_routes.js'
import representanteRouter from './routers/representante_routes.js'
import comunRouter from './routers/common_routes.js'
import multer from 'multer'

// Inicializadores de la aplicación
const app = express()
// Suprimir logs de dotenv temporalmente
const originalLog = console.log;
console.log = () => {};
dotenv.config({ debug: false })
console.log = originalLog;

// Configuración de multer para manejar archivos
const upload = multer()

// Configuración del puerto y middlewares globales
app.set('port', process.env.PORT || 3000)
app.use(cors()) // Habilita CORS para todas las rutas
app.use(express.json()) // Para parsear JSON en las peticiones

// Aplicar upload.none() globalmente a todas las rutas
app.use((req, res, next) => {
    // Excluir la ruta específica de subir evidencia
    if (req.path.includes('/subir-evidencia/')) {
        next(); // No aplicar upload.none()
    } else {
        upload.none()(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    error: 'Error en el formato de los datos enviados.'
                });
            }
            next();
        });
    }
});

// Rutas públicas y comunes 
app.use('/api/', comunRouter)

// Rutas privadas (requieren autenticación y roles específicos)
app.use('/api/', adminRouter) // Rutas de administrador
app.use('/api/', profesorRouter) // Rutas de profesor
app.use('/api/', representanteRouter) // Rutas de representante

// Ruta principal para comprobar que el servidor está en línea
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sistema de Gestión Académica - Escuela Descubrir</title>
            <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%23667eea'/><text x='50' y='60' font-family='Arial,sans-serif' font-size='32' font-weight='bold' fill='white' text-anchor='middle'>🎓</text></svg>">
            <link rel="alternate icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAA5klEQVRYhe2XsQ3CMBBFn4EFGIERmIAJmIANGIEJmIAR2IANmIAJmIANGIEJQIqLZVk2dhI7kZBS/pNsy3fv/vmdHUII/jNbA2sLtAVaA1VtDVDV1gBVbQ1Q1dYAVW0NUNU/ATwCa+DOzJaS7iU9mNnazB4lvUs6N7M3SZdm9irpWdKVmT1KupL0ZGaXkq4lPZjZRtK9pA9JT5KcLtJdtAZaqwHqAPACnAMnSg7AGXBsZu+S7sxsI+ld0qWZvUh6kvQo6VrSo6QrM3uU9CzpRdKTpDcze5f0IelJ0o2kW0l3ku7N7EnShaRrSdeS7iXdSrqTdGdm75LuJd1KupV0K+lW0o2kW0k3km4l3Uq6lXQr6VbSraRbSbeS/sEAAAAASUVORK5CYII=">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #333;
                }
                
                .container {
                    background: white;
                    padding: 3rem;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    max-width: 600px;
                    margin: 20px;
                }
                
                .logo {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 50%;
                    margin: 0 auto 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    color: white;
                    font-weight: bold;
                }
                
                h1 {
                    color: #2c3e50;
                    margin-bottom: 1rem;
                    font-size: 2.2rem;
                    font-weight: 600;
                }
                
                .subtitle {
                    color: #7f8c8d;
                    font-size: 1.1rem;
                    margin-bottom: 2rem;
                    line-height: 1.6;
                }
                
                .status {
                    background: #2ecc71;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 50px;
                    display: inline-block;
                    font-weight: 500;
                    margin-bottom: 2rem;
                }
                
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                    margin-top: 2rem;
                }
                
                .info-card {
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 10px;
                    border-left: 4px solid #667eea;
                }
                
                .info-card h3 {
                    color: #2c3e50;
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                }
                
                .info-card p {
                    color: #667eea;
                    font-weight: 600;
                }
                
                .footer {
                    margin-top: 2rem;
                    padding-top: 1rem;
                    border-top: 1px solid #ecf0f1;
                    color: #95a5a6;
                    font-size: 0.9rem;
                }
                
                @media (max-width: 768px) {
                    .container {
                        margin: 10px;
                        padding: 2rem;
                    }
                    
                    h1 {
                        font-size: 1.8rem;
                    }
                    
                    .subtitle {
                        font-size: 1rem;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">EEBPD</div>
                <h1>Sistema de Gestión Académica</h1>
                <p class="subtitle">
                    Plataforma integral para la gestión de notas, asistencias y procesos académicos de la Escuela de Educación Básica Particular "Descubrir"
                </p>
                
                <div class="status">
                    Servidor en línea
                </div>
                
                <div class="info-grid">
                    <div class="info-card">
                        <h3>API Base</h3>
                        <p>/api</p>
                    </div>
                    <div class="info-card">
                        <h3>Versión</h3>
                        <p>v1.0.0</p>
                    </div>
                    <div class="info-card">
                        <h3>Estado</h3>
                        <p>Activo</p>
                    </div>
                </div>
                <div style="margin-top:2rem;">
                    <a href="${process.env.URL_PRODUCTION}" target="_blank" rel="noopener" style="
                        display: inline-block;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 12px 32px;
                        border-radius: 50px;
                        text-decoration: none;
                        font-weight: 600;
                        font-size: 1.1rem;
                        box-shadow: 0 4px 12px rgba(102,126,234,0.15);
                        transition: background 0.2s;
                    " onmouseover="this.style.background='#764ba2'" onmouseout="this.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 100%)'">
                        Ir a la Página Web
                    </a>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Escuela de Educación Básica Particular "Descubrir" - Sistema desarrollado para la gestión académica</p>
                </div>
            </div>
        </body>
        </html>
    `);
});


// Middleware para manejar rutas no encontradas
app.use('/api/*', (req, res, next) => {
    res.status(404).json({ error: 'La ruta solicitada no existe' });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
    // Error de multer (upload.none())
    if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.message.includes('Unexpected end of form')) {
        return res.status(400).json({
            error: 'Error en el formato de los datos. Verifica el Content-Type y el método HTTP.'
        });
    }

    // Error de JSON malformado
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: 'Error en el formato JSON enviado.'
        });
    }

    // Error de validación de express-validator
    if (err.array && typeof err.array === 'function') {
        return res.status(400).json({
            error: err.array()[0].msg
        });
    }

    // Error de JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Token inválido.'
        });
    }

    // Error de JWT expirado
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expirado.'
        });
    }

    // Error de conexión a base de datos
    if (err.name === 'MongoError' || err.name === 'MongooseError') {
        return res.status(500).json({
            error: 'Error de conexión a la base de datos.'
        });
    }

    // Error genérico
    res.status(500).json({
        error: 'Error interno del servidor.'
    });
});

// Exportar la instancia de express por medio de app
export default app