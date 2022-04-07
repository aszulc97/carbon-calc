import { db_APIKEY } from "./config.js";
import "./sass/style.scss";
const urlParams = new URLSearchParams(window.location.search);
const website = urlParams.get("url");
const industry = urlParams.get("industry");
const webCarbonURL = "https://kea-alt-del.dk/websitecarbon/site/?url=";
const dbURL = "https://serialkillers-7bdb.restdb.io/rest/carboncalc";

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

//sprawdz czy njest
//jesli nie to wstaw
//jesli jest to sprawdz czy identyko
//jesli nie to put

function showWebcarbonData(data) {
  checkDb();
  console.log(data);
  document.querySelector(".website").textContent = "Your website: " + website;
  document.querySelector(".bytes").textContent = data.statistics.co2.grid.grams;
  // run();
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
