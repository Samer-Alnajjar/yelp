"use strict"

// Import packages
const express = require("express");
const superagent = require("superagent");
const cors = require("cors");
const pg = require("pg"); 
const methodOverride = require("method-override");
const { search } = require("superagent");
require("dotenv").config();


// Configure packages
const app = express();
const PORT = process.env.PORT;
app.use(cors());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Routes

app.get("/", handleHome);

app.get("/search", handleAPI);

app.post("/search", handleStore);

app.get("/details/:id", handleDetails);

app.put("/details/:id", handleUpdate);

app.delete("/details/:id", handleDelete);



// Functions

function handleHome(req, res) {
  let query = "select * from yelp;";

  client.query(query)
      .then(data => {
        res.render("index", {data : data.rows});
      })
      .catch(error => {
      console.log('ERROR WHILE GETTING THE DATA FROM DATABASE', error)
      })
}

function handleAPI(req, res) {
  let searchQuery = req.query.place;

  let query = {
    location: searchQuery,
    term: "restaurants"
  }

  let key = {Authorization : "Bearer 8h2bWUeAVsM6L9g3mZ6mYFfHmfpcOTRJmB7cAWeFm0hKHcE1UwLe7vY56u9ajYZgddScAHjCrwp73VlMMHUXwFcwRIv3UQ2EqMefdKhtVAQzrVIsIpMe_R4Mr8cyYHYx"}

  let url="https://api.yelp.com/v3/businesses/search";

  superagent.get(url).query(query).set(key)
    .then(data => {
      let yelpData = data.body.businesses;
      let arrayOfObjects = [];

      arrayOfObjects = yelpData.map( restaurant => {
        return new Yelp(restaurant);
      })
      res.render("search", {data : arrayOfObjects});
     })
    .catch(error => {
      console.log('ERROR WHILE GETTING THE API DATA', error)
    })
}

function handleStore(req, res) {
  let data = req.body;
  let query = "insert into yelp(name, image_url, price, rating, url) values ($1, $2, $3, $4, $5) returning *;";
  let safeValues = [data.name, data.image_url, data.price, data.rating, data.url];

  client.query(query, safeValues)
      .then(data => {
        res.redirect("/details/"+ data.rows[0].id);
      })
      .catch(error => {
      console.log('', error)
      })
}

function handleDetails(req ,res) {
  let id = req.params.id;

  let query = "select * from yelp where id = $1;";

  client.query(query, [id])
      .then(data => {
        res.render("details", {data : data.rows[0]});
      })
      .catch(error => {
      console.log('ERROR WHILE GETTING THE DETAILS FROM DATABASE', error)
      })
}

function handleUpdate(req, res) {
  let data = req.body;
  let id = req.params.id;

  let query = "update yelp set name = $1, image_url = $2, price = $3, rating = $4, url = $5 WHERE id = $6;";
  let safeValues = [data.name, data.image_url, data.price, data.rating, data.url, id];

  client.query(query, safeValues)
      .then(data => {
        res.redirect("/details/"+id);
      })
      .catch(error => {
      console.log('ERROR WHILE UPDATING THE DATA ', error)
      })

}

function handleDelete(req, res) {
  let id = req.params.id;

  let query = "DELETE FROM yelp WHERE id=$1;";

  client.query(query, [id])
      .then(data => {
        res.redirect("/");
      })
      .catch(error => {
      console.log('ERROR WHILE DELETING DATA FROM DATABASE', error)
      })
}







// Constructors
function Yelp(data) {
  this.name = data.name;
  this.image_url = data.image_url;
  this.price = data.price;
  this.rating = data.rating;
  this.url = data.url;
}


// Listen to Server

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`THE SERVER IS LISTENING TO PORT : ${PORT}`);
    })
  })
  .catch(error => {
    console.log(`ERROR WHILE CONNECTING TO THE DATABASE`, error);
  })
