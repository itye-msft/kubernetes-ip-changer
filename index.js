var express = require('express')
const Client = require('kubernetes-client').Client
const config = require('kubernetes-client').config;

//setup an API client
let client;
try {
    //assuming we are in the pod, try get the credentials from account service
    client = new Client({ config: config.getInCluster(), version: '1.9' });
} catch (e) {
    //we must be debugging locally, than pickup credentials from kube config
    client = new Client({ config: config.fromKubeconfig(), version: '1.9' });
}

//gather settings to operate
const settings = {
    ServingPort: process.env.PortServiceServingPort || 4000
}

//start serving requests
var app = express()
app.listen(settings.ServingPort, function () {
    console.log('Listening on port ' + settings.ServingPort);
})


app.get('/', function (req, res) {
    res.send('Service is running');
});

app.get('/recycle', (request, response, next) => {
    RecycleServices().then(function (length) {
        response.send('Recycled ' + length + ' Services.');
    })
    .catch(next);
});

//Helper functions

function RecycleServices() {
    //make an API call for all services 
    return client.api.v1.services.get()
        .then(function (services) {
            //select only load balancers
            let svcs = getServicesToRecycle(services);
            svcs.forEach(svc => {
                recycleService(svc);
            });
            return svcs.length;
        });
}

function getServicesToRecycle(services) {
    //select only load balancers
    let svcs = [];
    services.body.items.forEach(service => {
        for (var key in service.metadata.labels) {
            if (key == "recycle" && service.metadata.labels[key] == "yes") {
                svcs.push(service);
            }
        }
    });
    return svcs;
}

function recycleService(svc, callback) {
    console.log(svc);
    client.api.v1.namespaces(svc.metadata.namespace).services(svc.metadata.name).delete()
        .then(function (response) {
            delete svc.metadata.annotations;
            delete svc.metadata.creationTimestamp;
            delete svc.metadata.resourceVersion;
            delete svc.metadata.selfLink;
            delete svc.metadata.uid;
            delete svc.__proto__;
            delete svc.spec.clusterIP;
            delete svc.spec.__proto__;
            delete svc.__proto__;
            delete svc.status;

            client.apis.v1.namespaces(svc.metadata.namespace).services.post({ body: svc })
                .then(function (svcresponse) {
                    console.log(svcresponse);
                    //callback(svcresponse);
                });
        })
        .catch(function (err) {
            console.log(err);
        });
}
