
const video = document.getElementById('videoInput') //Obtiene el elemento por medio de su ID
const videobox = document.querySelector(".videoStream") //Obtiene el elemento por medio de su clase
const btn_iniciar = document.querySelector(".btn_iniciar") //Obtiene el elemento por medio de su clase
////const btn_finalizar = document.querySelector(".btn_finalizar") //Obtiene el elemento por medio de su clase
const btn_admin = document.querySelector(".btn_admin") //Obtiene el elemento por medio de su clase

// * Se define la variables en null
var name_user = null 

// ! Si faceapi no carga se vuelve a recargar la pagina
Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
]).then(StartWebCam).then(recognizeFaces)

function StartWebCam(){ // * Obtiene el video para su reconocimiento
    navigator.mediaDevices.getUserMedia({
        video:true,
        audio:false
    })
    .then((stream)=>{
        video.srcObject = stream;
    })
    .catch((error)=>{
        console.error(error)
    })    
}

btn_iniciar.addEventListener("click",function(){
    
    fetch("/register",{ // * Envia un JSON con el nombre de usuario y la opcion a la ruta /register 
        method:"POST",
        body:JSON.stringify({name:name_user,option:"Entrada"}),
        headers:{"Content-Type":"application/json"}
    }).then(response => {
        if(!response.ok){
            throw new Error("Error en la solicitud")
        }
        return response.text()
    }).then(data => {
        if (data == "save") { // ? SI: Aparace un modal de guardado por 2 segundos
            document.getElementById("container2-modal").style.display = "flex"
            setTimeout(function () { 
                document.getElementById("container2-modal").style.display = "none"
            },2000)
        }else if (data == "userNotSchedule") { // ? SINO: Aparece un modal de error
            document.getElementById("container3-modal").style.display = "flex"
            setTimeout(function () {
                document.getElementById("container3-modal").style.display = "none"
            },2000)
        }else if (data == "NoIdCompany") { // ? SINO: redirige al inicio
            window.location.href = "/"
        }
        
    })
    
})

async function get_name(){ // * Obtiene los nombres de los empleados
    var labels = []
    await fetch("/mysql").then(response => response.json()).then(data => {  // * Envia una solicitud a la ruta /mysql para el regreso de datos
        // TODO: Se agrega todos los nombres obtenidos para iterar
        data.forEach(element => {
            labels.push(`${element["first_name"]} ${element["last_name"]}`)
        });
        
    })
    
    return labels // * Retorna los nombres registrados en la base de datos
}

async function recognizeFaces() { // * Reconocimiento de rostros
    
    const labeledDescriptors = await loadLabeledImages(await get_name()) // ! Se espera los nombres de los rostros registrados

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.7)

    const canvas = document.getElementById('canvasFaceRecognition') // * Obtiene el CANVAS por su ID

    const displaySize = { width: video.width, height: video.height }
        faceapi.matchDimensions(canvas, displaySize)
        setInterval(async () => { // TODO: Numero de frames que intentara reconocer rostros
            const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()
            const resizedDetections = faceapi.resizeResults(detections, displaySize)
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
            const results = resizedDetections.map((d) => {
                return faceMatcher.findBestMatch(d.descriptor)
            })
            name_user = null
            // TODO: Crea cuadro en los rostros detectados
            results.forEach( (result, i) => {
                
                const box = resizedDetections[i].detection.box
                const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
                drawBox.draw(canvas)
                name_user = result["_label"]
            }) 
        },1500)
        
}

function loadLabeledImages(labels) { // * Carga los rostros de los empleados
    return Promise.all(
        labels.map(async (label)=>{
            const descriptions = []
            try {
                for(let i=1; i<=1; i++) { // * Itera los rostros 
                    const img = await faceapi.fetchImage(`../labeled_images/${label}/${i}.jpg`)
                    const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                    descriptions.push(detections.descriptor)
                }
                fetch("/error",{ // ! Envia un error de deteccion de rostros
                    method:"POST",
                    body:JSON.stringify({navbar:false}),
                    headers:{"Content-Type":"application/json"}
                })
                return new faceapi.LabeledFaceDescriptors(label, descriptions)
            } catch (error) {
                fetch("/error",{ // ! Envia un error de deteccion de rostros
                    method:"POST",
                    body:JSON.stringify({navbar:true}),
                    headers:{"Content-Type":"application/json"}
                })
                location.reload();
            }
            
        })
    )
}