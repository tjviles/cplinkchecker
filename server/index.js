const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');

var { SiteChecker } = require("broken-link-checker");

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
    path: 'linkcheck.csv',
    header: [
        {id: 'status', title: 'STATUS'},
        {id: 'url', title: 'URL'}
    ]
});
 
var records = [];

const siteChecker = new SiteChecker(
    { 
        excludeInternalLinks: false,
        excludeExternalLinks: false, 
        filterLevel: 0,
        acceptedSchemes: ["http", "https"],
        excludedKeywords: ["linkedin"],
        honorRobotExclusions: false
    },
    {
        "error": (error) => {
            console.error(error);
        },
        "link": (result, customData) => {
            if(result.broken) {
                if(result.http.response && ![undefined, 200].includes(result.http.response.statusCode)) {
                    console.log(`${result.http.response.statusCode} => ${result.url.original}`);
                    records.push({status: `${result.http.response.statusCode}`, url: `${result.url.original}`});
                }
            }
            //else(console.log(`${result.http.response.statusCode} => ${result.url.original}`))
            else{
                console.log(`${result.http.response.statusCode} => ${result.url.original}`);
            }
        },
        "end": () => {
            console.log("COMPLETED!");
            csvWriter.writeRecords(records)       // returns a promise
                .then(() => {
                console.log('...Done');
    });
        }
    }
);

const CivicPlus = require ('@oneblink/sdk/tenants/civicplus')

const options = {
    accessKey: '635158e9221cbf0100000001',
    secretKey: 'NN0Y0K2gSZnOFUiU1I0zJNZPtnp97mXzlWITrWeQ'
}

const forms = new CivicPlus.Forms(options)

//siteChecker.enqueue("https://www.camdensheriff.org/");

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



app.get("/api", (req, res) => {
    const formId = req.body.formId
    const submissionId = req.body.submissionId
    const isDraft = false
    forms
    .getSubmissionData(formId, submissionId, isDraft)
    .then((result) => {
        const definition = result.definition
        const submission = result.submission
        console.log(submission)
    })
    .catch((error) => {
        console.log("Error getting submission ID")
    })
    res.send("endpoint reached")
}); 


app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});