import { google_APIKEY, db_APIKEY } from "./config.js";
import "./sass/style.scss";
import ord from "ord";

const urlParams = new URLSearchParams(window.location.search);
const website = urlParams.get("url");
const industry = urlParams.get("industry");
const webCarbonURL = "https://kea-alt-del.dk/websitecarbon/site/?url=";
const dbURL = "https://serialkillers-7bdb.restdb.io/rest/carboncalc";
const carbonConstant = 0.0000006028619828;

//to store database/api data
let dbData;
let currentWebsiteData;

let webPSavings;
let unusedCodeSavings;

let kilobytes;
let co2;

window.addEventListener("DOMContentLoaded", start);

function start() {
  fetchCarbonApiData();
  fetchGoogleApiData();
  get(); //get data from db, check for duplicates and post
}

function fetchCarbonApiData() {
  //start loading screen
  fetch(webCarbonURL + website)
    .then((res) => res.json())
    .then((data) => {
      currentWebsiteData = data;
      setVariables();
      greenhostCheckboxCheck();
      displayData();
    });
}

//greenhost checkbox
function greenhostCheckboxCheck() {
  if (currentWebsiteData.green === true) {
    document.querySelector("#host").disabled = true; //todo: make it disappear
  } else {
    document.querySelector("#host").addEventListener("change", (e) => changeHost(e.target));
  }
}

function changeHost(checkbox) {
  if (checkbox.checked) {
    co2 = co2 * 0.91;
  } else {
    co2 = co2 / 0.91;
  }
  displayData();
}

//webp images checkbox
function webpCheckboxCheck() {
  if (webPSavings == 0) {
    document.querySelector("#webp").disabled = true; //todo: make it disappear
  } else {
    document.querySelector("#webp").addEventListener("change", (e) => changeToWebP(e.target));
  }
}

function changeToWebP(checkbox) {
  if (checkbox.checked) {
    kilobytes = kilobytes - webPSavings;
  } else {
    kilobytes = kilobytes + webPSavings;
  }
  co2 = kilobytes * carbonConstant * 1024;
  if (document.querySelector("#host").checked) co2 = co2 * 0.91;
  displayData();
}

//unused CSS & JS
function unusedCodeCheck() {
  if (unusedCodeSavings == 0) {
    document.querySelector("#unused").disabled = true; //todo: make it disappear
  } else {
    document.querySelector("#unused").addEventListener("change", (e) => removeUnused(e.target));
  }
}

function removeUnused(checkbox) {
  if (checkbox.checked) {
    kilobytes = kilobytes - unusedCodeSavings;
  } else {
    kilobytes = kilobytes + unusedCodeSavings;
  }
  co2 = kilobytes * carbonConstant * 1024;
  if (document.querySelector("#host").checked) co2 = co2 * 0.91;
  displayData();
}

function setVariables() {
  kilobytes = currentWebsiteData.bytes / 1024;
  co2 = currentWebsiteData.statistics.co2.grid.grams;
}

function compareWithinIndustry(url) {
  let filtered = dbData.filter((record) => {
    return record.industry == industry;
  });
  filtered.sort((a, b) => a.points - b.points);
  console.log("url", url);
  let index = filtered.map((object) => object.URL).indexOf(url) + 1;
  document.querySelector(".comparison").textContent =
    "We have tested " +
    filtered.length +
    " websites within your industry. In order from the cleanest to the dirtiest, your website is " +
    index +
    ord(index);
  console.log("after", filtered);
}

function displayData() {
  document.querySelector(".website").textContent = "Your website: " + website;
  document.querySelector(".bytes").textContent = "Your website uses " + kilobytes.toFixed(2) + " kilobytes";
  document.querySelector(".co2").textContent = "During one page load your website produces " + co2.toFixed(2) + "g of CO2";
  document.querySelector(".co2year").textContent =
    "With 10.000 users per month, your website is producing " + (co2 * 120).toFixed(2) + "kg of CO2 per year";
}

function showGoogleData(data) {
  //hide the loading screen
  webPSavings = data.lighthouseResult.audits["modern-image-formats"].details.overallSavingsBytes / 1024;
  unusedCodeSavings =
    data.lighthouseResult.audits["unused-css-rules"].details.overallSavingsBytes / 1024 +
    data.lighthouseResult.audits["unused-javascript"].details.overallSavingsBytes / 1024;

  document.querySelector(".images").textContent =
    "If you would change your jpgs to webps, you would save " + webPSavings.toFixed(2) + "kilobytes";
  document.querySelector(".unused").textContent = "If you would delete unused" + unusedCodeSavings.toFixed(2) + "kilobytes";
  webpCheckboxCheck();
  unusedCodeCheck();
  console.log(data);
}

function fetchGoogleApiData() {
  const url = setUpQuery();
  fetch(url)
    .then((response) => response.json())
    .then((data) => showGoogleData(data));
}

function setUpQuery() {
  const api = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
  const parameters = {
    url: normalizeURL(website),
    key: google_APIKEY,
  };
  let query = `${api}?url=${parameters.url}&key=${parameters.key}`;
  return query;
}

//all database operations
function get() {
  fetch(dbURL, {
    headers: {
      "x-apikey": db_APIKEY,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      dbData = data;
      checkForDbDuplicates(data);
    });
}

function checkForDbDuplicates(data) {
  let url = normalizeURL(website);
  compareWithinIndustry(url);
  if (data.some((e) => e.URL === url)) {
    console.log("url already in the database");
  } else {
    post(currentWebsiteData, url);
  }
}

function post(data, url) {
  const newURL = {
    URL: url,
    totalbytes: data.bytes,
    co2: co2,
    greenhost: data.green,
    industry: industry,
    points: co2.toFixed(2), //used to compare within industry
  };

  if (data.green === "unknown") {
    newURL.greenhost = false;
  } else {
    newURL.points = (newURL.points * 0.91).toFixed(2); //having a green host reduces co2 production by 9%
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

  console.log("posted");
}

function normalizeURL(url) {
  let normalizedURL;
  url = url.toLowerCase();
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
