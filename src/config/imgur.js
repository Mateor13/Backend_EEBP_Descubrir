import axios from 'axios'

// Sube una imagen a Imgur y devuelve su URL pública.
// En pruebas (NODE_ENV=test) no se llama a Imgur: se devuelve una URL ficticia.
export const subirImagenImgur = async (buffer) => {
    if (process.env.NODE_ENV === 'test') return 'https://i.imgur.com/prueba.png'
    const response = await axios.post(
        'https://api.imgur.com/3/image',
        { image: buffer.toString('base64'), type: 'base64' },
        { headers: { Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}` } }
    )
    return response.data.data.link
}
