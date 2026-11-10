// Plantillas de correo separadas de la lógica de envío.
const COLOR = '#82a915'
const escapar = (texto = '') => String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const base = (titulo, contenido) => `
<div style="font-family: Arial, sans-serif; color: #333; max-width: 560px; margin: auto;">
  <h1 style="color: ${COLOR}; text-align: center;">${titulo}</h1>
  ${contenido}
  <p>Saludos cordiales,<br><strong>Equipo de Escuela Descubrir</strong></p>
  <footer style="text-align: center; color: #777; margin-top: 24px; font-size: 12px;">
    &copy; ${new Date().getFullYear()} Escuela Descubrir. Este es un mensaje automático.
  </footer>
</div>`

const boton = (url, texto) => `<p style="text-align: center; margin: 24px 0;">
  <a href="${url}" style="background-color: ${COLOR}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">${texto}</a></p>`

const urlFront = (ruta) => `${(process.env.URL_PRODUCTION || '').replace(/\/$/, '')}/${ruta}`

// Ya no se envían contraseñas por correo: la persona crea la suya con el enlace
export const bienvenida = ({ nombre, token }) => ({
    asunto: 'Activa tu cuenta en Escuela Descubrir',
    html: base('Bienvenido/a', `
      <p>Hola ${escapar(nombre)}, se ha creado tu cuenta en la plataforma de la Escuela Descubrir.</p>
      <p>Para activarla, crea tu contraseña con el siguiente enlace (válido por 72 horas):</p>
      ${boton(urlFront(`v2/activar/${encodeURIComponent(token)}`), 'Activar cuenta')}
      <p>Si no esperabas este correo, ignóralo.</p>`)
})

export const recuperacion = ({ nombre, token }) => ({
    asunto: 'Restablecer contraseña',
    html: base('Restablecer contraseña', `
      <p>Hola ${escapar(nombre)}, recibimos una solicitud para restablecer tu contraseña.</p>
      ${boton(urlFront(`v2/restablecer/${encodeURIComponent(token)}`), 'Crear nueva contraseña')}
      <p>El enlace vence en 1 hora. Si no lo solicitaste, ignora este correo.</p>`)
})

export const estudianteVinculado = ({ nombre, estudiante }) => ({
    asunto: 'Estudiante vinculado a tu cuenta',
    html: base('Nuevo estudiante vinculado', `
      <p>Hola ${escapar(nombre)}, el estudiante <strong>${escapar(estudiante.nombre)} ${escapar(estudiante.apellido)}</strong>
      (cédula ${escapar(estudiante.cedula)}) fue vinculado a tu cuenta. Ya puedes consultar su información.</p>
      ${boton(urlFront(''), 'Ir a la plataforma')}`)
})

export const cambioEmail = ({ nombre, nuevoEmail }) => ({
    asunto: 'Tu email fue cambiado',
    html: base('Cambio de email', `
      <p>Hola ${escapar(nombre)}, el email de tu cuenta se cambió a <strong>${escapar(nuevoEmail)}</strong>.</p>
      <p>Si no fuiste tú, contacta de inmediato a la administración.</p>`)
})
