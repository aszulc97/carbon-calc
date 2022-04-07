import { db_APIKEY } from "./config.js";
import "./sass/style.scss";
const urlParams = new URLSearchParams(window.location.search);
const website = urlParams.get("url");
const industry = urlParams.get("industry");
const webCarbonURL = "https://kea-alt-del.dk/websitecarbon/site/?url=";
const dbURL = "https://serialkillers-7bdb.restdb.io/rest/carboncalc";

fetchData();

function fetchData() {
  fetch(webCarbonURL + website)
    .then((res) => res.json())
    .then((data) => showWebcarbonData(data));
}

function showWebcarbonData(data) {
  post(data);
  console.log(data);
  document.querySelector(".website").textContent = "Your website: " + website;
  document.querySelector(".bytes").textContent = data.statistics.co2.grid.grams;
  // run();
}

function post(data) {
  const newURL = {
    URL: website,
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
