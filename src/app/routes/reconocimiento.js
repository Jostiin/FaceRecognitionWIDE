
const dbConnection = require('../../config/dbConnection');
const fs = require("fs")
const path = require('path');

//Se define variables para su uso 
var name_user = null

var error_navbar = false

//Se exporta el modulo
module.exports = app => {
    //Se crea una instancia de conexion
    const conection = dbConnection();

    app.get('/',(req,res) =>{
        res.render('index',{
            navbar:error_navbar
        })
        
    });
    //Se hace una consulta a la base de datos para face-api.js
    app.get('/mysql',(req,res) =>{
        conection.query(`SELECT first_name,	last_name, face_image1, face_image2 from face_employe`,function(error,result){
            if(error){
                throw error
            }else{
                for (let index = 0; index < result.length; index++) {
                    //Revisa si la carpeta existe, sino se crea 
                    if(fs.existsSync(`src/app/labeled_images/${result[index]["first_name"]} ${result[index]["last_name"]}`)){
                        fs.writeFileSync(`src/app/labeled_images/${result[index]["first_name"]} ${result[index]["last_name"]}/1.jpg`,result[index]["face_image1"])
                        fs.writeFileSync(`src/app/labeled_images/${result[index]["first_name"]} ${result[index]["last_name"]}/2.jpg`,result[index]["face_image2"])
                    }else{
                     
                        fs.mkdir(`src/app/labeled_images/${result[index]["first_name"]} ${result[index]["last_name"]}`,{recursive:true},(err)=>{
                            if(err) throw err
                            else{
                                fs.writeFileSync(`src/app/labeled_images/${result[index]["first_name"]} ${result[index]["last_name"]}/1.jpg`,result[index]["face_image1"])
                                fs.writeFileSync(`src/app/labeled_images/${result[index]["first_name"]} ${result[index]["last_name"]}/2.jpg`,result[index]["face_image2"])
                            }
                        })
                      
                    }

                }
                res.send(JSON.stringify(result))
                
            }
        })
       
    });
    //Ruta de guardado exitoso
    app.get("/save_succesfull",(req,res)=>{
        //Si los datos registran null se redirige a index
        res.render("save")    
    })
    //Ruta para redirecionar a index
    app.post('/reset',(req,res) =>{
        acces = false
        res.redirect("/")
    })

    app.post('/error',(req,res) =>{
        error_navbar = req.body.navbar
        res.redirect("/")
    })

    app.post('/add_user',(req,res) =>{
        res.render("add_user")
    })
    
    app.post('/edit_user',(req,res) =>{
        let id = req.body.btn_edit
        
        conection.query(`SELECT id,company_id,code,first_name,last_name,phone,email,address FROM face_employe WHERE id='${id}'`,function(error,result){
            if(error){
                throw error
            }else{
                res.render("edit_user",{
                    user:result
                })
            }
        })
        
    })
    
    app.get('/admin',(req,res) =>{
        let username = req.session.usuario
        let password = req.session.clave
        if(req.session.usuario && req.session.clave){
            
            conection.query(`SELECT company_id FROM users WHERE administrador=1 AND username='${username}' AND password='${password}'`,function(error,result){
                if(error){
                    throw error
                    
                }else{
                    if (result.length == 0) {
                       
                        res.redirect("/login")
                    }else{
                        conection.query(`SELECT id,company_id,code,first_name,last_name,phone,email,address FROM face_employe WHERE company_id=${result[0]["company_id"]};`,function(error,resulte){
                            if(error){
                                throw error
                            }else{
                                res.render("crud",{
                                    companyID: result[0]["company_id"],
                                    users:resulte,
                                    msgbad:false
                                })
                            }
                        })
                    }
                }
            })
            
        }else{
            res.redirect("/login")
        }
      
    })

    app.post('/admin',(req,res) =>{         
        let username = req.session.usuario
        let password = req.session.clave
        if(req.session.usuario && req.session.clave){
            
            conection.query(`SELECT * FROM users WHERE administrador=1 AND name='${username}' AND password='${password}'`,function(error,result){
                if(error){
                    throw error
                    
                }else{
                    if (result.length == 0) {
                       
                        res.redirect("/login")
                    }else{
                        conection.query(`SELECT id,company_id,code,first_name,last_name,phone,email,address FROM face_employe;`,function(error,result){
                            if(error){
                                throw error
                            }else{
                                res.render("crud",{
                                    users:result,
                                    msgbad:false
                                })
                            }
                        })
                    }
                }
            })
            
        }else{
            res.redirect("/login")
        }
    })

    app.post('/panel-control',(req,res) =>{
        
        conection.query(`SELECT id,company_id,face_employe_code,face_employe_name,date,time,description,face_schedule_id FROM face_log;`,function(error,result){
            if(error){
                throw error
            }else{
                res.render("control",{
                    users:result
                })
            }
        })
       
       
    })

    app.post('/add_schedule',(req,res) =>{
        
        

        let companyID = req.body.company_id
        let timeIngreso1 = `${req.body.ingreso1}:00`
        let timeIngreso2 = `${req.body.ingreso2}:00`
        let timeAlmuerzo1 = `${req.body.almuerzo1}:00`
        let timeAlmuerzo2 = `${req.body.almuerzo2}:00`
        let timeSalida1 = `${req.body.salida1}:00`
        let timeSalida2 = `${req.body.salida2}:00`

        ListNameSchedule = {
            "INGRESO":[timeIngreso1,timeIngreso2],
            "ALMUERZO":[timeAlmuerzo1,timeAlmuerzo2],
            "ALMUERZO RETORNO":[timeAlmuerzo1,timeAlmuerzo2],
            "SALIDA":[timeSalida1,timeSalida2]
        }

    
        if (timeAlmuerzo1 != ":00" && timeAlmuerzo2 != ":00") {

            for (let element in ListNameSchedule) {
                conection.query("INSERT INTO face_schedule SET ?",{company_id:companyID,name:element,hour_ini:ListNameSchedule[element][0],hour_end:ListNameSchedule[element][1]},(err,result)=>{
                    if(err){
                        throw err
                    }else{
                        
                        res.redirect("/admin")
                    }
                })
            }
        
        }else{
            for (let element in ListNameSchedule) {
                if (element != "ALMUERZO" || element != "ALMUERZO RETORNO") {
                    conection.query("INSERT INTO face_schedule SET ?",{company_id:companyID,name:element,hour_ini:ListNameSchedule[element][0],hour_end:ListNameSchedule[element][1]},(err,result)=>{
                        if(err){
                            throw err
                        }else{
                            res.redirect("/admin")
                        }
                    })
                }
                
            }
        }
        
        
        res.redirect("/admin")
    })

    app.post('/add',(req,res) =>{

        function InsertFaceSchedule(companyID,name,code) {
            conection.query(`SELECT id FROM face_schedule WHERE company_id=${companyID} AND name='${name}'`,(err,result)=>{
                if(err){
                    throw err
                }else{
                    result.forEach(element => {
                        conection.query("INSERT INTO face_employe_schedule SET ?",{	face_employe_code:code,face_schedule_id:element["id"],status:1},(err,result)=>{
                            if(err){
                                throw err
                            }else{
                               
                            }
                        })
                    });

                }
            })

        }
        let CheckboxIngreso = req.body.checkboxIngreso
        let CheckboxAlmuerzo = req.body.checkboxAlmuerzo
        let CheckboxSalida = req.body.checkboxSalida
        let companyID = req.body.company_id
        let code = req.body.code
        
        let firstName = req.body.first_name
        let lastName = req.body.last_name
        let Phone = req.body.phone
        let Email = req.body.email
        let Address = req.body.address
        let image1 = req.files.image1[0]
        let image2 = req.files.image2[0]
        let ruta1 = path.join(__dirname,`../upload/${image1["originalname"]}`)
        let ruta2 = path.join(__dirname,`../upload/${image2["originalname"]}`)
        var image1UP = fs.readFileSync(ruta1)
        var image2UP = fs.readFileSync(ruta2)
        
        conection.query("INSERT INTO face_employe SET ?",{company_id:companyID,code:code,first_name:firstName,last_name:lastName,phone:Phone,email:Email,address:Address,face_image1:image1UP,face_image2:image2UP},(err,result)=>{
            if(err){
                throw err
            }else{
                //res.redirect("/add_schedule")
            }
        })

        if (CheckboxIngreso != undefined) {
            InsertFaceSchedule(companyID,"INGRESO",code)
        }
        if (CheckboxAlmuerzo != undefined) {
            
            InsertFaceSchedule(companyID,"ALMUERZO",code)
            InsertFaceSchedule(companyID,"ALMUERZO RETORNO",code)
        }
        if (CheckboxSalida != undefined) {
            
            InsertFaceSchedule(companyID,"SALIDA",code)
        }
        
        
        //-------------SE ELIMINAN LAS FOTOS DESCARGADAS
        
        fs.unlink(ruta1,(err)=>{
            if(err){
                
                return;
            }
           

        })
        fs.unlink(ruta2,(err)=>{
            if(err){
                
                return;
            }
           

        })
        res.redirect("/admin")
    })
    
    app.post('/delete',(req,res) =>{
        let id = req.body.btn_delete
        
        conection.query(`DELETE FROM face_employe WHERE id='${id}'`,function(error,result){
            if(error){
                throw error
            }else{
               
            }
        })
        res.redirect("/admin")
    })
    
    app.post('/edit',(req,res) =>{
        
        let id  = req.body.idBtn
        let companyID= req.body.company_id
        let code = req.body.code
        let first_name = req.body.first_name
        let last_name = req.body.last_name
        let phone  = req.body.phone
        let email  = req.body.email
        let address  = req.body.address
        
        let image1 = req.files.face_image1
        let image2 = req.files.face_image2
        
        if(image1 == undefined && image2 == undefined){
           
            conection.query(`UPDATE face_employe SET company_id='${companyID}',code='${code}',first_name='${first_name}',last_name='${last_name}',phone='${phone}',email='${email}',address='${address}' WHERE id='${id}'`,function(error,result){
                if(error){
                    throw error
                }else{
                  
                }
            })
        }
        else if(image1 == undefined){

            let ruta2 = path.join(__dirname,`../upload/${image2[0]["originalname"]}`)
            let image2UP = fs.readFileSync(ruta2)
            conection.query(`UPDATE face_employe SET ? WHERE id='${id}'`,{company_id:companyID,code:code,first_name:first_name,last_name:last_name,phone:phone,email:email,address:address,face_image2:image2UP},(err,result)=>{
                if(err){
                    throw err
                }else{}
            })
           
        }
        else if(image2 == undefined){
            let ruta1 = path.join(__dirname,`../upload/${image1[0]["originalname"]}`)
            let image1UP = fs.readFileSync(ruta1)
            conection.query(`UPDATE face_employe SET ? WHERE id='${id}'`,{company_id:companyID,code:code,first_name:first_name,last_name:last_name,phone:phone,email:email,address:address,face_image1:image1UP},(err,result)=>{
                if(err){
                    throw err
                }else{}
            })
            
        }
        else{
            let ruta1 = path.join(__dirname,`../upload/${image1[0]["originalname"]}`)
            let ruta2 = path.join(__dirname,`../upload/${image2[0]["originalname"]}`)
            let image1UP = fs.readFileSync(ruta1)
            let image2UP = fs.readFileSync(ruta2) 
            conection.query(`UPDATE face_employe SET ? WHERE id='${id}'`,{company_id:companyID,code:code,first_name:first_name,last_name:last_name,phone:phone,email:email,address:address,face_image1:image1UP,face_image2:image2UP},(err,result)=>{
                if(err){
                    throw err
                }else{}
            })
        }
        res.redirect("/")
       
        
    })
    //Ruta para actualizar los datos del usuario detectado
    app.post('/register',(req,res) =>{
        isregister = false
        option_ = req.body.option;
        name_user = req.body.name        //Si los datos devueltos son null no actualiza
        if(name_user == null || name_user == "unknown") console.log("no existe nombre")
        else{
            let partesNombre = name_user.split(/\s+/)
            let PartesNombre1 = partesNombre[0]
            let PartesNombre2 = partesNombre[1]
            conection.query(`SELECT company_id,code,last_name from face_employe WHERE first_name='${PartesNombre1}' AND last_name='${PartesNombre2}'`,function(error,result){
                if(error){
                    throw error   
                }else{
                    conection.query(`SELECT face_schedule.id,name,hour_ini,hour_end FROM face_employe_schedule JOIN face_schedule ON face_employe_schedule.face_schedule_id=face_schedule.id WHERE face_employe_schedule.face_employe_code=${result[0]["code"]} AND face_schedule.company_id=${result[0]["company_id"]};`,function(error,result6){
                        if(error){
                            throw error
                        }else{
                            var date = new Date()
                            let fecha = `${date.getFullYear()}-0${date.getMonth()+1}-${date.getDate()}`
                            let hour = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
                            let Fullname = `${name_user}`
                            
                            conection.query(`SELECT description FROM face_log WHERE face_employe_name='${Fullname}' AND date='${fecha}'` ,function(error,result5){
                                if(error){
                                    throw error
                                }else{
                                    
                                    let DateEmpleoyed = new Date(`${fecha.replace(/-/g,'/')} ${hour}`)
                                    var isAffect = 0;

                                    function QueryHandler(element) {
                                        return new Promise((resolve,reject)=>{
                                            conection.query(`INSERT INTO face_log (company_id, face_employe_code, face_employe_name, date, time, description, face_schedule_id)  SELECT '${result[0]["company_id"]}','${result[0]["code"]}','${Fullname}','${fecha}','${hour}','${element["name"]}','${result6[0]["id"]}' FROM DUAL WHERE NOT EXISTS (SELECT * FROM face_log WHERE date='${fecha}' AND description='${element["name"]}')`,function(error,result3){
                                                if(error){
                                                    throw error
                                                }else{
                                                    if (result3.affectedRows == 1) {
                                                        
                                                        isAffect = 1
                                                        resolve("save")
                                                       
                                                    }else{
                                                        resolve()
                                                    }
                                                }
                                                
                                            })
                                        })
                                        
                                    }
                                    async function mainLoop() {
                                        for (let element of result6) {
                                           
                                            if(DateEmpleoyed >= new Date(`${fecha.replace(/-/g,'/')} ${element["hour_ini"]}`) && DateEmpleoyed <= new Date(`${fecha.replace(/-/g,'/')} ${element["hour_end"]}`)){
                                                const result = await QueryHandler(element)
                                                if (result === "save") {
                                                    res.send("save")
                                                    break
                                                }
                                                
                                            }else{}
                                            if (isAffect==1) {
                                                break
                                            }
                                            
                                        }
                                    }
                                    mainLoop()
                                    
                                        
                                    }
                                    /*
                                    result6.forEach(element => {
                                        if(DateEmpleoyed >= new Date(`${fecha.replace(/-/g,'/')} ${element["hour_ini"]}`) && DateEmpleoyed <= new Date(`${fecha.replace(/-/g,'/')} ${element["hour_end"]}`)){
                                            conection.query(`INSERT INTO face_log (company_id, face_employe_code, face_employe_name, date, time, description, face_schedule_id)  SELECT '${result[0]["company_id"]}','${result[0]["code"]}','${Fullname}','${fecha}','${hour}','${element["name"]}','${result6[0]["id"]}' FROM DUAL WHERE NOT EXISTS (SELECT * FROM face_log WHERE date='${fecha}' AND description='${element["name"]}')`,function(error,result3){
                                                if(error){
                                                    throw error
                                                }else{
                                                    if (result3.affectedRows == 1) {
                                                        res.send("save")
                                                    }else{}
                                                }
                                            })
                                            return
                                        }else{}  
                                    });*/
                                    
                            })
                        }
                    })
                            
                }
            })

        }
       
    });
    
    app.get('/login',(req,res) =>{
        res.render('login')  
    });
    
    app.get('/add_schedule',(req,res) =>{
        if(req.session.usuario && req.session.clave){
            res.render('add_schedule')  
        }else{
            res.redirect("/login")
        }
        
    });

    app.post('/login',(req,res) =>{
        let username = req.body.name
        let password = req.body.pass

        req.session.usuario = username
        req.session.clave = password
        res.redirect("/admin")
    });

    
}