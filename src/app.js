

const app = require('./config/server');

require("./app/routes/reconocimiento")(app);

//start server

app.listen(app.get('port'),()=>{
    console.log('server on port', app.get('port'));
});

