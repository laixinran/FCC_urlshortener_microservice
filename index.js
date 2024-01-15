require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const urlparser = require('url');


//set up mongoose (basically same as the moogoose section solution, check back there if you're unsure)
const mongoose = require('mongoose');

//connect to database
mongoose.connect(process.env["DB_URL"], {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
});


//create a schema, define the document structure & field 
urlSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  short_url: {
    type: Number,
    required: true
  }
});


//create a model from urlSchema
let Url = mongoose.model('Url', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); //parse JSON data in the req.body
app.use(express.urlencoded({ extended: true })); //parse URL in the req.body
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


//POST
app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body;
  console.log('Received URL:', url);

  const hostname = urlparser.parse(url).hostname;
  console.log('Hostname:', hostname);

  //use the function dns.lookup(host, callback) from the dns core module to verify a submitted URL
  dns.lookup(hostname, async (err, address) => {
    if (err || !address) {
      console.error('DNS Lookup Error:', err);
      res.json({ error: "invalid url" });
    } else {
      const urlCount = await Url.countDocuments({});

      //create an instance document based on Url model
      const urlDoc = new Url({
        url: url,
        short_url: urlCount
      });

      await urlDoc.save();
      console.log('Inserted URL:', urlDoc);
      res.json({ original_url: url, short_url: urlCount });
    }
  });
});


//GET
app.get('/api/shorturl/:short_url', async (req, res) => {
  const shorturl = req.params.short_url;
  const urlDoc = await Url.findOne({ short_url: +shorturl });

  if (!urlDoc) {
    res.json({ error: "invalid short URL" });
  } else {
    res.redirect(urlDoc.url); //make sure you pass a string instead just an url
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});