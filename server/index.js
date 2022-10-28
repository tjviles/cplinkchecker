const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs')
const util = require('util')

const readFileAsync = util.promisify(fs.readFile)

const { SiteChecker } = require("broken-link-checker");




const CivicPlus = require ('@oneblink/sdk/tenants/civicplus')

const options = {
    accessKey: '635158e9221cbf0100000001',
    secretKey: 'NN0Y0K2gSZnOFUiU1I0zJNZPtnp97mXzlWITrWeQ'
}

function domain_from_url(url) {
    var result
    var match
    if (match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im)) {
        result = match[1]
        if (match = result.match(/^[^\.]+\.(.+\..+)$/)) {
            result = match[1]
        }
    }
    return result
}

//siteChecker.enqueue("https://www.camdensheriff.org/");

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

async function checkThatSite(incomingURL){
    
}

app.post("/api", (req, res) => {
    const fileNameFromURL = domain_from_url(req.body.submission.URL);
    const forms = new CivicPlus.Forms(options)
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    const csvWriter = createCsvWriter({
        //path: `${req.body.submission.filename}.csv`,
        path: `${fileNameFromURL}.csv`,
        header: [
            {id: 'status', title: 'STATUS'},
            {id: 'url', title: 'URL'},
            {id: 'pagefound', title: 'PAGEFOUND'}
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
                        //console.log(`${result.http.response.statusCode} => ${result.url.original}`);
                        console.log(result);
                        records.push({status: `${result.http.response.statusCode}`, url: `${result.url.original}`, pagefound: `${result.base.original}`});
                    }
                }
                //else(console.log(`${result.http.response.statusCode} => ${result.url.original}`))
                else{
                    //console.log(`${result.http.response.statusCode} => ${result.url.original}`);
                }
            },
            "end": () => {
                console.log("COMPLETED!");
                csvWriter.writeRecords(records)       // returns a promise
                    .then(() => {
                        console.log('...Done');
                        async function run() {
                            const formId = 29724
                            //const imageFileName = `${req.body.submission.filename}.csv`
                            const imageFileName = `${fileNameFromURL}.csv`
                            const imageBuffer = await readFileAsync(imageFileName)
                            const fileResult = await forms.createSubmissionAttachment({
                              formId,
                              body: imageBuffer,
                              isPrivate: false,
                              contentType: 'csv',
                              fileName: imageFileName,
                            })
                            res.send({badlinks: fileResult.url
                            });
                        }
                        run();
                        //res.send('Great Job!');
                    });
            }
        });
    siteChecker.enqueue(req.body.submission.URL)
});

app.get("/", (req, res) => {
    res.json({ message: "Hello World"  });
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});