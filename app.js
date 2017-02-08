console.log('VCAP SERVICES: ' + JSON.stringify(process.env.VCAP_SERVICES, null, 4));
var mongoUrl;
if(process && process.env && process.env.VCAP_SERVICES) {
  var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
  for (var svcName in vcapServices) {
    if (svcName.match(/^mongo.*/)) {
      mongoUrl = vcapServices[svcName][0].credentials.uri;
      mongoUrl = mongoUrl || vcapServices[svcName][0].credentials.url;
      break;
    }
  }
} else {
  mongoUrl = "localhost:27017/hcapp";
}
console.log('Mongo URL: ' + mongoUrl);


var express = require('express'),
    app = express(),
    engines = require('consolidate'),
    bodyParser = require('body-parser'),
    cfenv = require('cfenv'),
    MongoClient = require('mongodb').MongoClient,
    assert = require('assert');
    var controller = require( __dirname + '/controller');
    var appEnv = cfenv.getAppEnv();


app.use(express.static(__dirname + '/public'));

var http = require ('http');
var fs = require('fs'); 

app.engine('html', engines.nunjucks);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true })); 


// Handler for internal server errors
function errorHandler(err, req, res, next) {
    console.error(err.message);
    console.error(err.stack);
    res.status(500).render('error_template', { error: err });
}

MongoClient.connect(mongoUrl, function(err, db) {

    assert.equal(null, err);
    console.log(err);
    console.log("Successfully connected to MongoDB.");

     app.get('/', function(req, res, next) {
        res.render('index', {});
    });

    app.get('/add_entry', function(req, res, next) {
        res.render('add_entry', {});
    });
    
    app.post('/add_entry', function(req, res, next) {

        var appName = req.body.appName;
        var cycleDate = req.body.cycleDate;
        var cycleCompDate = req.body.cycleCompDate;
        var receivedFrom = req.body.receivedFrom;
        var StatusOfBusiness = req.body.StatusOfBusiness;
        var ProblemIssues = req.body.ProblemIssues;
        if ((appName == '') || (cycleDate == '') || (cycleCompDate == '') || (receivedFrom == '')|| (StatusOfBusiness == '')|| (ProblemIssues == '')) {
            next('Please provide an entry for all fields.');
        } else {
            db.collection(appName).insertOne(
                { 
                  'application name': appName, 
                  'cycle date' : cycleDate, 
                  'Cycle Completion Date' : cycleCompDate , 
                  'received from': receivedFrom , 
                  'status of business': StatusOfBusiness,
                   'problem and issues': ProblemIssues 
                },
                function (err, r) {
                    assert.equal(null, err);
                    res.writeHead(200,{ 'Content-Type' : 'text/html' });
                   var html = fs.readFileSync(__dirname + "/views/display.html",'utf8');
                   var message = receivedFrom;
                   var message1 = appName ;
                   var message2 = cycleCompDate;
                   console.log("message :" + message);
                   html=html.replace('{message}', message);
                   html=html.replace('{message1}', message1);
                   html=html.replace('{message2}', message2);
                   res.end(html);
                     //  res.render('display',{receivedFrom});
                    //   res.send("Thanks " + receivedFrom + ".you have updated health check for " + appName + ".Please close the window");
                } );
        }
    });
    
     app.use('/output',controller);
    



    
    app.use(errorHandler);
    
   app.listen(appEnv.port, '0.0.0.0', function() {
  console.log("server starting on " + appEnv.url);
});

});

