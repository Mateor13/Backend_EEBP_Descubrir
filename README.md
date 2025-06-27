# 🎓 Sistema de Gestión Académica - Escuela Descubrir

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-v4.21+-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-v8.16+-47A248?style=flat&logo=mongodb&logoColor=white)

## 📋 Descripción

Plataforma integral para la gestión de notas, asistencias y procesos académicos de la **Escuela Descubrir**. Sistema completo que permite la administración de estudiantes, profesores, representantes y cursos de manera eficiente y segura.

## ✨ Características Principales

### 🔐 **Sistema de Autenticación**
- JWT (JSON Web Tokens) para sesiones seguras
- Roles diferenciados: Administrador, Profesor, Representante
- Recuperación de contraseñas via email
- Confirmación de cuentas por token

### 👥 **Gestión de Usuarios**
- **Administradores**: Control total del sistema
- **Profesores**: Gestión de notas, observaciones y evidencias
- **Representantes**: Consulta de información académica de estudiantes

### 📚 **Funcionalidades Académicas**
- ✅ Registro y gestión de notas por materia
- ✅ Control de asistencias y justificaciones
- ✅ Sistema de observaciones estudiantiles
- ✅ Subida de evidencias fotográficas
- ✅ Gestión de períodos lectivos
- ✅ Asignación de materias y cursos
- ✅ Reportes académicos detallados

## 🚀 Tecnologías Utilizadas

### **Backend**
- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación y autorización
- **bcryptjs** - Encriptación de contraseñas
- **Multer** - Manejo de archivos
- **Nodemailer** - Envío de correos

### **Validación y Seguridad**
- **express-validator** - Validación de datos
- **CORS** - Configuración de recursos cruzados
- **dotenv** - Variables de entorno

## 🛠️ Instalación y Configuración

### **Prerrequisitos**
- Node.js (v18 o superior)
- MongoDB Atlas o MongoDB local
- Cuenta de Gmail para envío de correos

### **1. Clonar el repositorio**
```bash
git clone https://github.com/Mateor13/Proyect_Fullstack.git
cd ProyectoFull
```

### **2. Instalar dependencias**
```bash
npm install
```

### **3. Configurar variables de entorno**
Crear un archivo `.env` en la raíz del proyecto:

```env
#Puerto de la aplicacion
PORT = puerto_para_la_aplicacion

#Configuracion de la base de datos
MONGODB_URI_LOCAL = enlace_mongodb_local
MONGODB_URI_PRODUCTION = enlace_mongodb_atlas

#Configuracion del Email
HOST_MAILTRAP = smtp.gmail.com
PORT_MAILTRAP = 465
USER_MAILTRAP = usuario@ejemplo.com
PASS_MAILTRAP = clave_aplicacion

#Configuracion del Backend
URL_BACKEND = enlace_localhost
URL_PRODUCTION = enlace_del_frontend

#Clave del JWT
JWT_SECRET = clave_aleatoria_jwt

#Adminitrador quemado
ADMIN_EMAIL = usuario@ejemplo.com
ADMIN_PASSWORD = clave_admin
ADMIN_ID = cedula_admin
ADMIN_NAME = nombre_admin
ADMIN_LASTNAME = apellido_admin
ADMIN_CEDULA = cedula_admin
ADMIN_PHONE = telefono_admin
ADMIN_ADDRESS = direccion_admin

#Credenciales de IMGUR
IMGUR_CLIENT_ID = id_imgur
IMGUR_CLIENT_SECRET = clave_imgur
```

### **4. Ejecutar el proyecto**

**Desarrollo:**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```


## 🛡️ Seguridad

- ✅ Validación de datos en todas las rutas
- ✅ Encriptación de contraseñas con bcrypt
- ✅ Tokens JWT con expiración
- ✅ Middleware de autenticación y autorización
- ✅ Validación de roles por endpoint

## 👨‍💻 Autor

**Mateo Torres** - [GitHub](https://github.com/Mateor13)

## 🙏 Agradecimientos

- Escuela Descubrir por la oportunidad de desarrollo
- Comunidad de Node.js y Express.js
- MongoDB por la excelente documentación

---

⭐ **¡Si te gusta este proyecto, no olvides darle una estrella!** ⭐
