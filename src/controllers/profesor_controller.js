import Profesor from "../models/profesor.js"
import {  sendMailToRecoveryPasswordProfesor } from '../config/nodemailer.js';
import { generarJWT } from '../helpers/JWT.js';
import materias from "../models/materias.js";
import observaciones from "../models/observaciones.js";
import cursos from "../models/cursos.js";
import estudiante from "../models/estudiantes.js";
import notas from "../models/notas.js";
import mongoose from "mongoose";

//Funciones de validación
const validarCurso = (curso) => {
    const regExp = new RegExp(/^[0-7][A-E]$/)
    return regExp.test(curso)
}
const validarFecha = (fecha) => {
    const regExp = new RegExp(/^\d{4} - \d{2} - \d{2}$/);
    return regExp.test(fecha);
};

const confirmarCuenta = async (req, res) => {
    //Paso 1: Obtener el token
    const {token} = req.params;
    //Paso 2: Realizar validaciones
    if (!token) return res.status(400).json({error: 'El token es obligatorio'});
    const profBDD = await Profesor.findOne({token});
    if (!profBDD) return res.status(400).json({error: 'La cuenta ya ha sido confirmada o el token no es válido'});
    //Paso 3: Manipular la BDD
    profBDD.confirmEmail = true;
    profBDD.token = null;
    await profBDD.save();
    res.status(200).json({msg: 'Cuenta confirmada correctamente'});
}

const loginProfesor = async (req, res) => {
    //Paso 1: Obtener los datos
    const {email, password} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    const profBDD = await Profesor.findOne({email}).select('-estado');
    if (!profBDD) return res.status(400).json({error: 'El email no esta registrado'});
    const validarPassword = await profBDD.compararPassword(password);
    if (!validarPassword) return res.status(400).json({error: 'La contraseña es incorrecta'});
    if (profBDD?.confirmEmail === false) return res.status(400).json({error: 'Confirma tu cuenta para poder ingresar'});
    //Paso 3: Generar JWT
    const jwt = generarJWT(profBDD._id, "profesor");
    res.status(200).json({msg: 'Bienvenido al sistema', token:jwt});
}

const recuperarPassword = async (req, res) => {
    //Paso 1: Obtener los datos
    const {email} = req.body
    //Paso 2: Realizar validaciones
    if(Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    const profBDD = await Profesor.findOne({email})
    if(!profBDD) return res.status(400).json({error: 'El email no esta registrado'});
    const token = await profBDD.generarToken();
    //Paso 3: Manipular la BDD
    await sendMailToRecoveryPasswordProfesor(email, token);
    await profBDD.save();
    res.status(200).json({msg: 'Revise su email para recuperar su contraseña, para reestablecer su contraseña'});
}

const comprobarTokenPassword = async (req, res) => {
    //Paso 1: Obtener el token
    const {token} = req.params;
    //Paso 2: Realizar validaciones
    if(!token) return res.status(400).json({error: 'El token es obligatorio'});
    const profBDD = await Profesor.findOne({token})
    if(profBDD?.token !== token) return res.status(400).json({error: 'El token no es válido'});
    //Paso 3: Manipular la BDD
    await profBDD.save();
    res.status(200).json({msg: 'Token válido, ya puede reestablecer su contraseña'});
}

const nuevoPassword = async (req, res) => {
    //Paso 1: Obtener los datos
    const {password, confirmpassword} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (password !== confirmpassword) return res.status(400).json({error: 'Las contraseñas no coinciden'});
    const profBDD = await Profesor.findOne({token: req.params.token});
    if (profBDD?.token !== req.params.token) return res.status(400).json({error: 'El token no es válido'});
    //Paso 3: Manipular la BDD
    profBDD.token = null
    profBDD.password = await profBDD.encriptarPassword(password);
    await profBDD.save();
    res.status(200).json({msg: 'Contraseña actualizada correctamente'});
}

const cambiarPassword = async (req, res) => {
    //Paso 1: Obtener los datos
    const {password, newpassword, confirmpassword} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (newpassword !== confirmpassword) return res.status(400).json({error: 'Las contraseñas no coinciden'});
    const profBDD = await Profesor.findById(req.userBDD.id);
    const validarPassword = await profBDD.compararPassword(password);
    if (!validarPassword) return res.status(400).json({error: 'La contraseña actual es incorrecta'});
    if (newpassword.length < 6) return res.status(400).json({error: 'La contraseña debe tener al menos 6 caracteres'});
    if (password === newpassword) return res.status(400).json({error: 'La nueva contraseña debe ser diferente a la actual'});
    //Paso 3: Manipular la BDD
    profBDD.password = await adminiBDD.encriptarPassword(newpassword);
    await profBDD.save();
    res.status(200).json({msg: 'Contraseña actualizada correctamente'});
}

const cambiarDatos = async (req, res) => {
    //Paso 1: Obtener los datos
    const {nombre, apellido, email} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    const profBDD = await Profesor.findById(req.userBDD.id);
    if (!(await profBDD.validarEmail(email))) return res.status(400).json({error: 'El email no es válido'});
    if (profBDD.email !== email) {
        const existeEmail = await Profesor.findOne({email});
        if (existeEmail) return res.status(400).json({error: 'El email ya esta registrado'});
    }
    //Paso 3: Manipular la BDD
    profBDD.nombre = nombre;
    profBDD.apellido = apellido;
    profBDD.email = email;
    await profBDD.save();
    res.status(200).json({msg: 'Datos actualizados correctamente'});
}

const subirNotasEstudiantes = async (req, res) => {
    // Paso 1: Obtener los datos
    const { cedula, nota, materia, motivo } = req.body;
    const { id } = req.userBDD;

    // Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    if (!cedula) return res.status(400).json({ error: 'Especificar cédula estudiante' });
    if (!materia) return res.status(400).json({ error: 'Especificar el id de la materia' });
    if (!nota) return res.status(400).json({ error: 'Especificar nota o que diferente de 0' });
    if (!motivo) return res.status(400).json({ error: 'Especificar motivo' });
    if (nota < 0 || nota > 10.0) return res.status(400).json({ error: 'La nota debe estar entre 0.1 y 10' });

    // Buscar al estudiante por cédula
    const estudianteBDD = await estudiante.findOne({ cedula });
    if (!estudianteBDD) return res.status(400).json({ error: 'El estudiante no está registrado' });

    // Verificar que el estudiante esté registrado en la materia especificada
    const materiaBDD = await materias.findOne({ _id: materia, profesor: id });
    if (!materiaBDD) return res.status(400).json({ error: 'Esta materia no existe o no esta registrada en ella' });
    
    // Verificar que el estudiante esté registrado en el curso
    const Curso = await cursos.findOne({ materias: materia, estudiantes: estudianteBDD._id });
    if (!Curso) return res.status(400).json({ error: 'El estudiante no está registrado en este curso' });
    
    // Paso 3: Manipular la BDD
    //Verificar que el estudiante tenga notas
    const notasEstudiante = await notas.findOne({ estudiante: estudianteBDD._id, materia: materiaBDD._id });
    if (!notasEstudiante) {
        const nuevaNota = new notas({ estudiante: estudianteBDD._id, materia: materiaBDD._id });
        const subirNota = await nuevaNota.agregarNota(nota, motivo);
        if (subirNota?.error) return res.status(400).json({ error: subirNota.error });
        await nuevaNota.save();
    }else{
        const subirNota = await notasEstudiante.agregarNota(nota, motivo);
        if (subirNota?.error) return res.status(400).json({ error: subirNota.error });
        await notasEstudiante.save();
    }
    res.status(200).json({ msg: 'Nota registrada correctamente' });
};

const modificarNotasEstudiantes = async (req, res) => {
    // Paso 1: Obtener los datos
    const { cedula, nota, materia, motivo } = req.body;
    const { id } = req.userBDD;

    // Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    if (!cedula) return res.status(400).json({ error: 'Especificar cédula estudiante' });
    if (!materia) return res.status(400).json({ error: 'Especificar el id de la materia' });
    if (!nota) return res.status(400).json({ error: 'Especificar nota o que diferente de 0' });
    if (!motivo) return res.status(400).json({ error: 'Especificar motivo' });
    if (nota < 0 || nota > 10.0) return res.status(400).json({ error: 'La nota debe estar entre 0.1 y 10' });

    // Buscar al estudiante por cédula
    const estudianteBDD = await estudiante.findOne({ cedula });
    if (!estudianteBDD) return res.status(400).json({ error: 'El estudiante no está registrado' });

    // Verificar que el estudiante esté registrado en la materia especificada
    const materiaBDD = await materias.findOne({ _id: materia, profesor: id });
    if (!materiaBDD) return res.status(400).json({ error: 'Esta materia no existe o no esta registrada en ella' });
    
    // Verificar que el estudiante esté registrado en el curso
    const Curso = await cursos.findOne({ materias: materia, estudiantes: estudianteBDD._id });
    if (!Curso) return res.status(400).json({ error: 'El estudiante no está registrado en este curso' });
    
    //Verificar que el estudiante tenga notas
    const notasEstudiante = await notas.findOne({ estudiante: estudianteBDD._id, materia: materiaBDD._id });
    if (!notasEstudiante) return res.status(400).json({ error: 'El estudiante no tiene notas registradas' });

    //Paso 3: Manipular la BDD
    const actualizarNota = await notasEstudiante.actualizarNota(nota, motivo);
    if (actualizarNota?.error) return res.status(400).json({error: actualizarNota.error});
    estudianteBDD.save();
    res.status(200).json({msg: 'Nota actualizada correctamente'});
}

const observacionesEstudiantes  = async (req, res) => {
    //Paso 1: Obtener los datos
    const {cedula, observacion} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!cedula) return res.status(400).json({error: 'Especificar cédula estudiante'});
    if (!observacion) return res.status(400).json({error: 'Especificar observacion'});
    const estudianteBDD = await observaciones.findOne({cedula});
    if (!estudianteBDD) return res.status(400).json({error: 'El estudiante no registrado en esta materia'});
    //Paso 3: Manipular la BDD
    const profesorBDD = await Profesor.findById(req.userBDD.id);
    const fecha = new Date();
    const nuevaObservacion = {fecha, observacion, autor: profesorBDD.nombre};
    await estudianteBDD.registrarObservacion(nuevaObservacion);
    estudianteBDD.save();
    res.status(200).json({msg: 'Observación registrada correctamente'});
}

const visualizarEstudiantesCurso = async (req, res) => {
    //Paso 1: Obtener los datos
    const {curso, materia} = req.body;
    const {id} = req.userBDD;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!validarCurso(curso)) return res.status(400).json({error: 'El curso no es válido'});
    const cursoBDD = await cursos.findOne({nombre: curso});
    if (!cursoBDD) return res.status(400).json({error: 'El curso no está registrado'});
    const estudiantes = await cursoBDD.buscarEstudiantesPorMateriaYProfesor(id, materia);
    if (estudiantes.error) return res.status(400).json({error: estudiantes.error});
    //Paso 3: Manipular la BDD
    res.status(200).json({estudiantes});
}

const visualizarCursosAsignados = async (req, res) => {
    //Paso 1: Obtener los datos
    const {id} = req.userBDD;
    //Paso 2: Manipular la BDD
    const cursosAsignados = await cursos.aggregate([
        {$lookup:{
            from: 'materias',
            localField: 'materias',
            foreignField: '_id',
            as: 'materiasAsig'
        }},
        {$match: {'materiasAsig.profesor': new mongoose.Types.ObjectId(id)}},
        {$project:{
            _id:1,
            nombre:1,
            'materiasAsig.nombre':1,
            'materiasAsig.profesor':1
        }}
    ]);
    if (!cursosAsignados || cursosAsignados.length === 0) return res.status(400).json({ error: 'No tiene cursos asignados' });
    res.status(200).json({cursosAsignados});
}

const visualizarEstudiante = async (req, res) => {
    //Paso 1: Obtener los datos
    const {cedula, materia} = req.body;
    //Paso 2: Realizar validaciones
    if (Object.values(req.body).includes('')) return res.status(400).json({error: 'Todos los campos son obligatorios'});
    if (!cedula) return res.status(400).json({error: 'Especificar cédula estudiante'});
    const estudianteXCurso = await cursos.aggregate([
        {
            $lookup: {
                from: 'estudiantes',
                localField: 'estudiantes',
                foreignField: '_id',
                as: 'estudiantesDetalle'
            }
        },
        {
            $lookup: {
                from: 'materias',
                localField: 'materias',
                foreignField: '_id',
                as: 'materiasDetalle'
            }
        },
        {
            $unwind: '$estudiantesDetalle'
        },
        {
            $unwind: '$materiasDetalle'
        },
        {
            $match: {
                'estudiantesDetalle.cedula': cedula,
                'materiasDetalle._id': new mongoose.Types.ObjectId(materia)
            }
        },
        {
            $lookup: {
                from: 'notas',
                let: { estudianteId: '$estudiantesDetalle._id', materiaId: '$materiasDetalle._id' },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ['$estudiante', '$$estudianteId'] }, { $eq: ['$materia', '$$materiaId'] }] } } },
                    { $unwind: '$notas' },
                    { $project: { 'notas.nota': 1, 'notas.motivo': 1, 'notas.fecha': 1, _id: 0 } }
                ],
                as: 'notasDetalle'
            }
        },
        {
            $project: {
                _id: 0,
                'materiasDetalle.nombre': 1,
                'estudiantesDetalle.nombre': 1,
                'estudiantesDetalle.apellido': 1,
                'notasDetalle': 1
            }
        }
    ]);   
    if (!estudianteXCurso || estudianteXCurso.length === 0) {
        return res.status(404).json({ error: 'Estudiante no encontrado en la materia especificada' });
    }

    // Paso 3: Manipular la BDD
    res.status(200).json({ estudianteXCurso });   
}

export  {
    confirmarCuenta,
    loginProfesor,
    recuperarPassword,
    comprobarTokenPassword,
    nuevoPassword,
    cambiarDatos,
    cambiarPassword,
    subirNotasEstudiantes,
    modificarNotasEstudiantes,
    observacionesEstudiantes,
    visualizarEstudiantesCurso,
    visualizarCursosAsignados,
    visualizarEstudiante
}