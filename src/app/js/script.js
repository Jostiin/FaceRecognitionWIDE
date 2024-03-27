
const video = document.getElementById('videoInput') //Obtiene el elemento por medio de su ID
const videobox = document.querySelector(".videoStream") //Obtiene el elemento por medio de su clase
const btn_iniciar = document.querySelector(".btn_iniciar") //Obtiene el elemento por medio de su clase
//const btn_finalizar = document.querySelector(".btn_finalizar") //Obtiene el elemento por medio de su clase
const btn_admin = document.querySelector(".btn_admin") //Obtiene el elemento por medio de su clase

//Se define la variables en null
var name_user = null 

//Si faceapi no se carga vuelve a cargar la pagina

Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    
    
]).then(StartWebCam).then(recognizeFaces)

function StartWebCam(){
    
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
    //Envia un JSON con el nombre de usuario y la opcion a la ruta /register 
    fetch("/register",{
        method:"POST",
        body:JSON.stringify({name:name_user,option:"Entrada"}),
        headers:{"Content-Type":"application/json"}
    }).then(response => {
        if(!response.ok){
            throw new Error("Error en la solicitud")
        }
        return response.text()
    }).then(data => {
        if (data == "save") {
            window.location.href = "/save_succesfull"
        }
        
    })
    
})


async function get_name(){
    var labels = []
    //Envia una solicitud a la ruta /mysql para el regreso de datos
    //Await: Se espera que la solicitud se envie y se devuelva
    await fetch("/mysql").then(response => response.json()).then(data => {
        
        data.forEach(element => {
            
            labels.push(element["first_name"])
        });
        
    })
    //Retorna los nombres registrados en la base de datos
    return labels
}

async function recognizeFaces() {
    //Se espera los nombres de los rostros registrados
    const labeledDescriptors = await loadLabeledImages(await get_name())

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.7)

    
    const canvas = document.getElementById('canvasFaceRecognition') //Obtiene el elemento por medio de su ID

    const displaySize = { width: video.width, height: video.height }
        faceapi.matchDimensions(canvas, displaySize)
        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()
            const resizedDetections = faceapi.resizeResults(detections, displaySize)
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
            const results = resizedDetections.map((d) => {
                return faceMatcher.findBestMatch(d.descriptor)
            })
            name_user = null
            results.forEach( (result, i) => {
                
                const box = resizedDetections[i].detection.box
                //Dibuja cuando se detecta un rostro registrado
                const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
                drawBox.draw(canvas)
                name_user = result["_label"]
            }) 
        },1500)
    /*
    video.addEventListener('play', async () => {
        //Crea un elemento canvas
        const canvas = faceapi.createCanvasFromMedia(video)
        //Se agrega como hijo al contenedor
        videobox.append(canvas)

        const displaySize = { width: video.width, height: video.height }
        faceapi.matchDimensions(canvas, displaySize)
        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()
            const resizedDetections = faceapi.resizeResults(detections, displaySize)
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
            const results = resizedDetections.map((d) => {
                return faceMatcher.findBestMatch(d.descriptor)
            })
            name_user = null
            results.forEach( (result, i) => {
                
                const box = resizedDetections[i].detection.box
                //Dibuja cuando se detecta un rostro registrado
                const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
                drawBox.draw(canvas)
                name_user = result["_label"]
            }) 
        },1500)
    })*/

}

function loadLabeledImages(labels) {
    return Promise.all(
        labels.map(async (label)=>{
            const descriptions = []
            //Recorre las imagenes de los rostros
            try {
                for(let i=1; i<=1; i++) {

                    const img = await faceapi.fetchImage(`../labeled_images/${label}/${i}.jpg`)
                    const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                    descriptions.push(detections.descriptor)
                }
                fetch("/error",{
                    method:"POST",
                    body:JSON.stringify({navbar:false}),
                    headers:{"Content-Type":"application/json"}
                })
                return new faceapi.LabeledFaceDescriptors(label, descriptions)
            } catch (error) {
                fetch("/error",{
                    method:"POST",
                    body:JSON.stringify({navbar:true}),
                    headers:{"Content-Type":"application/json"}
                })
                location.reload();
            }
            
        })
    )
}