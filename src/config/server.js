const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyparser = require('body-parser');
const multer = require('multer')

const app = express(); // * Crea el servidor

const storage = multer.diskStorage({ // ! Los rostros se almacenara en la carpeta Upload
    destination:path.join(__dirname,'../app/upload'),
    filename:(req,file,cb)=>{
        cb(null,file.originalname)
    }
})

// TODO: Configuraciones
app.use(express.static(path.join(__dirname,'../app')));
app.use('/css',express.static(__dirname +'../app/css'));
app.use('/js',express.static(__dirname +'../app/js'));
app.use('/models',express.static(__dirname +'../app/models'));
app.use('/labeled_images',express.static(__dirname +'../app/labeled_images'));
app.use('/upload',express.static(__dirname +'../app/upload'));
app.use(session({
    secret:'S4rf:094(){}',
    resave: true,
    saveUninitialized: true
}))

app.set('port',process.env.PORT || 8065); // ? Escucha en el puerto 8065

app.set('view engine','ejs'); // * Permisos para renderizar visas ejs

app.set('views',path.join(__dirname,'../app/views')); // * Permiso para utilizar la carpeta views

app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended: false}));
app.use(multer({
    storage:storage,
    dest:path.join(__dirname,'../app/upload')
}).fields([{name:"image1",maxCount:1},{name:"image2",maxCount:1}]));

module.exports = app;