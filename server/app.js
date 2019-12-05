'use strict';

// ********** DEPENDENCY - Load Modules as Object **********
const express = require("express");
const https = require('https');
const http = require('http');
const request = require("request");
const fs = require("fs");
const multer = require('multer');


// ********** MIDDLEWARES **********
var app = express();
app.use(express.static(__dirname));
app.use(express.static(__dirname + "/../client/"));
app.use(express.json());

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '.wav')
        // cb(null, file.fieldname + '-' + Date.now())
    }
})
var upload = multer({ 
    storage: storage 
    , limits: { fieldSize: 25 * 1024 * 1024 }
})

// Allow Cross Origin Request
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, OPTIONS, DELETE, GET');
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Enable Trust Proxy
app.enable("trust proxy");


// ********** ROUTES ENDPOINT  **********
// ********** IOT SOUND MODEL **********
//const targetwav = __dirname + '\/uploads\/audiofile.wav';
const targetwav = __dirname + '\/uploads\/50.20.wav';     // FOR testing..
const resultfile = __dirname + "\/result.json";
console.log(targetwav);

app.post('/api/knock', function(req, res) {
    console.log('>> python knock api...');
    let {PythonShell} = require('python-shell');
            
    PythonShell.run(__dirname + '\/knock.py', null, function (err) {
    if (err) throw err;
    console.log('finished');
    });
})

app.post('/api/modelscore', upload.single('audiofile'), function (req, res, next) {
    console.log('>> modelscore api...');
    
    const file = req.file
    if (!file) {
        const error = new Error('Please upload a file')
        error.httpStatusCode = 400
        return next(error)
    }

    console.log('>>> POST request...');
    var apioptions = {
        method: 'POST',
        url: 'https://cogear1.ibm-sound.com/IoT-SoundServer/api/model/classifyWAV',
        headers:
        {
            Host: 'cogear1.ibm-sound.com'
            , Authorization: 'Basic YWNvdXN0aWMucG9rQGdtYWlsLmNvbTpBY291c3RpY3BvazEyMw=='
        },
        formData:
        {
            wav: fs.createReadStream(targetwav),
            modelName: 'tap03'
        }
    };

    // IOT SOUND MODEL submission
    try {

        console.log("IOT SOUND MODEL submission:");
        if (fs.existsSync(targetwav)) {
            request(apioptions, function (error, response, body) {
                if (error) {
                    res.send({ body: error });
                    throw new Error(error);
                } else {
                    res.send({ body: body });
                    var date = new Date().toLocaleString();
                    fs.appendFile(resultfile, date +', '+ body +'\n', function(err) {
                        if(err) return console.log(err);
                        console.log("Score model result appended!");
                    }); 
                    //console.log("Scoring: \n" + body);
                    
                }
            });
        }
    } catch (err) { console.error(err) }

});




// ********** IOT SOUND MODEL (VIA WATCH EVENT FOLDER) **********
// const targetwav = __dirname + "\\audio\\speech.wav";
// const watchpath = __dirname + "\\audio\\";
// const resultfile = __dirname + "\\result.json";

// var apioptions = {
//     method: 'POST',
//     url: 'https://cogear1.ibm-sound.com/IoT-SoundServer/api/model/classifyWAV',
//     headers:
//     {
//         Host: 'cogear1.ibm-sound.com'
//         , Authorization: 'Basic d2FuY2hveUBnbWFpbC5jb206RmF0MDBib3k='
//         // , 'Content-Type': 'application/x-www-form-urlencoded'
//     },
//     formData:
//     {
//         wav: fs.createReadStream(targetwav),
//         modelName: 'Hardisk'
//     }
// };

// // // WATCH Target Path and Audio File
// try {
//     fs.watch(watchpath, function (event, trigger) {
//         console.log("Audiofile Folder Activity:");
//         console.log("Event: " + event + "\nTrigger: " + trigger);

//         if (fs.existsSync(targetwav)) {
//             console.log("targetwav exists...");

//             request(apioptions, function (error, response, body) {
//                 if (error) {
//                     // res.send({ body: error });
//                     throw new Error(error);
//                 } else {
//                     // res.send({ body: body });
//                     var date = new Date().toLocaleString();
//                     fs.appendFile(resultfile, date +', '+ body + '\n', function(err) {
//                         if(err) {
//                             return console.log(err);
//                         }
//                         console.log("Score model result appended!");
//                     }); 
//                     console.log("Scoring: \n" + body);
//                 }
//             });
//         }
//     })
// } catch (err) { console.error(err) }


// ********** SERVER PORT SETUP **********
var secureoptions = {
    key: fs.readFileSync(__dirname + '\/cert\/key.pem'),
    cert: fs.readFileSync(__dirname + '\/cert\/cert.pem')
};
const port = process.env.PORT || 4906;

// Secured HTTPS
https.createServer(secureoptions, app).listen(port, function () {
    console.log(`%s \nNode App listening at: https://localhost:${port}`, new Date());
    // console.log(`%s \nNode App listening at: https://point.sg.ibm.com:${port}`, new Date());
});

// // Non-secured HTTP
// http.createServer(app).listen(port, function () {
//     console.log(`%s \nNode App listening at: http://point.sg.ibm.com:${port}`, new Date());
// });

// // Non-secured HTTP
// app.listen(port, function () {
//     console.log(`%s \nNode App listening at port: ${port}...`, new Date());
// });



