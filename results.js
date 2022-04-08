import { db_APIKEY } from "./config.js";
import "./sass/style.scss";
const urlParams = new URLSearchParams(window.location.search);
const website = urlParams.get("url");
const industry = urlParams.get("industry");
const webCarbonURL = "https://kea-alt-del.dk/websitecarbon/site/?url=";
const dbURL = "https://serialkillers-7bdb.restdb.io/rest/carboncalc";
let co2;
let energy;
const carbonConstant = 0.0000006028619828;

fetchData();
let websiteData;

function fetchData() {
  fetch(webCarbonURL + website)
    .then((res) => res.json())
    .then((data) => {
      websiteData = data;
      showWebcarbonData(websiteData);
    });
}

function checkDb() {
  fetch(dbURL, {
    headers: {
      "x-apikey": db_APIKEY,
    },
  })
    .then((res) => res.json())
    .then((data) => displayData(data));
}

function displayData(data) {
  let url = normalizeURL(website);
  if (data.some((e) => e.URL === url)) {
    console.log("data already in db");
  } else {
    post(websiteData, url);
  }
}

function showWebcarbonData(data) {
  co2 = data.statistics.co2.grid.grams * 120;
  energy = data.statistics.energy;
  checkDb();
  console.log(data);
  document.querySelector(".website").textContent = "Your website: " + website;
  document.querySelector(".bytes").textContent =
    "Your website uses " + (data.bytes / 1024).toFixed(2) + " kilobytes";
  document.querySelector(".co2").textContent =
    "During one page load your website produces " +
    data.statistics.co2.grid.grams.toFixed(2) +
    "g of CO2";
  document.querySelector(".co2year").textContent =
    "With 10.000 users per month, your website is producing " +
    co2.toFixed(2) +
    "kg of CO2 per year";
  // run();
  document.querySelector("p.co2year").textContent =
    "The same weight as" + " " + flightCalc() + " " + "flights from Copenhagen to London";

  document.querySelector(".bike p").textContent =
    "That is" + " " + bikeCalc() + " kWh of energy. That's enough to bike";

  document.querySelector(".bigDog p").textContent =
    "The same weight as" + " " + bigDog() + " " + "German Shephards";
  document.querySelector(".smallDog p").textContent =
    "The same weight as" + " " + smallDog() + " " + "Chiuahuas";

  function flightCalc() {
    return (co2 / 423).toFixed(1);
  }

  function bikeCalc() {
    return (energy / 0.11).toFixed(2);
  }

  // function bikeHoursCalc() {
  //   return 0.11*
  // }

  function bigDog() {
    return (co2 / 35).toFixed(1);
  }

  function smallDog() {
    return (co2 / 2).toFixed(1);
  }
}

function post(data, url) {
  console.log("data", data);
  const newURL = {
    URL: url,
    totalbytes: data.bytes,
    co2: data.statistics.co2.grid.grams,
    greenhost: data.green,
    industry: industry,
  };
  if (data.green === "unknown") {
    newURL.greenhost = false;
  }
  const postData = JSON.stringify(newURL);
  fetch(dbURL, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      "x-apikey": db_APIKEY,
    },
    body: postData,
  }).then((res) => res.json());
  //.then((data) => displayCar(data));
  console.log("posted");
}

function normalizeURL(url) {
  let normalizedURL;
  url = url.split("://");
  console.log(url);
  if (url.length > 1) {
    if (url[1].substring(0, url[1].indexOf(".")) === "www") {
      normalizedURL = "http://" + url[1].substring(url[1].indexOf(".") + 1);
    } else {
      normalizedURL = "http://" + url[1];
    }
  } else if (url[0].substring(0, url[0].indexOf(".")) === "www") {
    normalizedURL = "http://" + url[0].substring(url[0].indexOf(".") + 1);
  } else {
    normalizedURL = "http://" + url;
  }
  if (normalizedURL.lastIndexOf("/") + 1 === normalizedURL.length) {
    normalizedURL = normalizedURL.slice(0, -1);
  }
  return normalizedURL;
}

// function showGoogleData(data) {
//   console.log(data);
//   document.querySelector("#mini").textContent = data.lighthouseResult.audits["unminified-javascript"].description;
// }

// function run() {
//   const url = setUpQuery();
//   fetch(url)
//     .then((response) => response.json())
//     .then((data) => showGoogleData(data));
// }

// function setUpQuery() {
//   const api = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
//   const parameters = {
//     url: website,
//     key: APIKEY,
//   };
//   let query = `${api}?url=${parameters.url}&key=${parameters.key}`;
//   return query;
// }
