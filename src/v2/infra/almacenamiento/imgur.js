import axios from 'axios'

// Puerto de almacenamiento: { subirImagen(buffer) -> url }. Cambiar a S3/Cloudinary solo toca este archivo.
export const crearAlmacenamientoImgur = () => ({
    async subirImagen(buffer) {
        const { data } = await axios.post(
            'https://api.imgur.com/3/image',
            { image: buffer.toString('base64'), type: 'base64' },
            { headers: { Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}` }, timeout: 20000 }
        )
        return data.data.link
    }
})

export const crearAlmacenamientoFalso = () => ({
    subidos: 0,
    async subirImagen() { this.subidos++; return `https://example.test/evidencia-${this.subidos}.png` }
})
