//import { APIKEY } from "./config.js";
import "./sass/style.scss";
const urlParams = new URLSearchParams(window.location.search);
const website = urlParams.get("url");
const webCarbonUrl = "https://kea-alt-del.dk/websitecarbon/site/?url=";

fetchData();

function fetchData() {
  fetch(webCarbonUrl + website)
    .then((res) => res.json())
    .then((data) => showWebcarbonData(data));
}

function showWebcarbonData(data) {
  document.querySelector(".website").textContent = "Your website: " + website;
  document.querySelector(".bytes").textContent = data.bytes + " bytes";
  // run();
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
