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

var express = require('express');
var app = express();
var router = express.Router();
var MongoClient = require('mongodb').MongoClient,
 assert = require('assert');

function errorHandler(err, req, res, next) {
    console.error(err.message);
    console.error(err.stack);
    res.status(500).render('error_template', { error: err });
}

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');



router.get('/',function(req,res,next){

    MongoClient.connect( mongoUrl , function(err, db) {

    console.log("Successfully connected to MongoDB.");

      var out = [];
      var appName = req.query.appName;
      var cycleDate = req.query.cycleDate;
if((appName === '') ||(cycleDate === '')) {
     next('Please provide a valid entry for Application name and Cycle date');
}

else {
      var collection = db.collection(appName); 
 
      collection.findOne({"application name" : appName,
                   "cycle date" : cycleDate},function(err, doc) {
         if(doc == null) {

         next(' There is no Health Check Entry for Application : '+ appName  + ' for Cycle Date : ' + cycleDate + ".Please make sure your query is correct :( ");
         //  res.send("There is no health check entry for " +appName +" for cycle date " + cycleDate + "  Please make sure your query is correct :( ");
         }
         
         else {
        console.log(doc);
        out.push(doc);
        res.render('output.ejs',{health:{"applicationName": out[0]['application name'],
                                          "cycleDate":out[0]['cycle date'],
                                         "cycleCompletionDate":out[0]['Cycle Completion Date'],
                                         "receivedFrom":out[0]['received from'],
                                        "statusOfBusiness":out[0]['status of business'],
                                         "problemIssues":out[0]['problem and issues']}});
         }
      });
}
    });  
});
module.exports = router;