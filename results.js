import "./sass/style.scss";
import ord from "ord";
import Chart from "chart.js/auto";

const db_APIKEY = "624ea14b67937c128d7c95bb";
const urlParams = new URLSearchParams(window.location.search);
const website = urlParams.get("url");
const industry = urlParams.get("industry");
const dbURL = "https://serialkillers-7bdb.restdb.io/rest/carboncalc";

//bytes to co2 ratio from web carbon api
const carbonConstant = 0.0000006028619828;
//bytes to adjusted bytes (0.755), then multiplied by adjusted bytes to energy ratio
const energyConstant = 0.755 * 0.000000001681037247;

//to store database/api data
let dbData;
let currentWebsiteData;
let jsonFilenameBase;

let webPSavings;
let unusedCodeSavings;
let filtered;

let kilobytes;
let co2;
let energy;

window.addEventListener("DOMContentLoaded", start);

function start() {
  jsonFilenameBase = normalizeURL(website).substring(7);
  jsonFilenameBase = jsonFilenameBase.replace(".", "_");
  fetchCarbonApiData();
  fetchGoogleApiData();
  get(); //get data from db, check for duplicates and post
}

function fetchCarbonApiData() {
  //start loading screen
  document.querySelector(".loading-container").classList.remove("hidden");

  let webCarbonJson = "./" + jsonFilenameBase + ".json";
  fetch(webCarbonJson)
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
    document.querySelector("#host").classList.add("hidden");
    document.querySelector("#host").nextElementSibling.classList.add("hidden");
    document.querySelector(".host").classList.add("hidden");
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
    document.querySelector("#webp").classList.add("hidden");
    document.querySelector("#webp").nextElementSibling.classList.add("hidden");
    document.querySelector(".images").classList.add("hidden");
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
  energy = kilobytes * energyConstant * 1024;
  if (document.querySelector("#host").checked) co2 = co2 * 0.91;
  displayData();
}

//unused CSS & JS
function unusedCodeCheck() {
  if (unusedCodeSavings == 0) {
    document.querySelector("#unused").classList.add("hidden");
    document.querySelector("#unused").nextElementSibling.classList.add("hidden");
    document.querySelector(".unused").classList.add("hidden");
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
  energy = kilobytes * energyConstant * 1024;
  if (document.querySelector("#host").checked) co2 = co2 * 0.91;
  displayData();
}

function setVariables() {
  kilobytes = currentWebsiteData.bytes / 1024;
  co2 = currentWebsiteData.statistics.co2.grid.grams;
  energy = currentWebsiteData.statistics.energy;
}

function compareWithinIndustry(url) {
  filtered = dbData.filter((record) => {
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

  showGraph();
}

function flightCalc() {
  return ((co2 * 120) / 423).toFixed(1);
}

function bikeCalc() {
  return (energy * 120000).toFixed(2);
}

function bigDog() {
  return ((co2 * 120) / 35).toFixed(1);
}

function smallDog() {
  return ((co2 * 120) / 2).toFixed(1);
}

function displayData() {
  document.querySelector(".website").textContent = website;
  document.querySelector(".bytes").textContent = "uses " + kilobytes.toFixed(2) + " kilobytes";
  document.querySelector("span.co2").textContent = co2.toFixed(2) + "g";
  document.querySelector("span.co2year").textContent = (co2 * 120).toFixed(2) + "kg";
  document.querySelector(".flight p").textContent =
    "The same weight of CO2 as " + flightCalc() + " flights from Copenhagen to London";

  document.querySelector(".bike p").textContent =
    "That is " +
    bikeCalc() +
    " kWh of energy. That's enough to bike for " +
    (bikeCalc() / 0.11).toFixed(2) +
    " hours. During this time you can make circa " +
    ((bikeCalc() / 0.11) * 15).toFixed(2) +
    " kilometers, which is " +
    (((bikeCalc() / 0.11) * 15) / 40000).toFixed(2) +
    " times the distance all the way around the equator";

  document.querySelector(".bigDog p").textContent = "The same weight as " + bigDog() + " German Shephards";
  document.querySelector(".smallDog p").textContent = "The same weight as " + smallDog() + " Chihuahuas";
}

function showGoogleData(data) {
  setTimeout(() => {
    document.querySelector("main").classList.remove("hidden");
    document.querySelector(".loading-container").classList.add("hidden");
  }, 1000);

  webPSavings = data.lighthouseResult.audits["modern-image-formats"].details.overallSavingsBytes / 1024;
  unusedCodeSavings =
    data.lighthouseResult.audits["unused-css-rules"].details.overallSavingsBytes / 1024 +
    data.lighthouseResult.audits["unused-javascript"].details.overallSavingsBytes / 1024;

  document.querySelector(".images").textContent =
    "If you would change your jpgs to webps, you would save " + webPSavings.toFixed(2) + "kilobytes";
  document.querySelector(".unused").textContent =
    "If you would delete unused CSS rules and JavaScript, you would save " + unusedCodeSavings.toFixed(2) + " kilobytes";
  webpCheckboxCheck();
  unusedCodeCheck();
  console.log(data);
}

function fetchGoogleApiData() {
  //const url = setUpQuery();

  let googleJson = "./g_" + jsonFilenameBase + ".json";
  fetch(googleJson)
    .then((response) => response.json())
    .then((data) => showGoogleData(data));
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
  if (data.some((e) => e.URL === url)) {
    console.log("url already in the database");
  } else {
    post(currentWebsiteData, url);
  }
  compareWithinIndustry(url);
}

function post(data, url) {
  const newURL = {
    URL: url,
    totalbytes: data.bytes,
    co2: co2,
    greenhost: data.green,
    industry: industry,
    points: Number(co2.toFixed(2)), //used to compare within industry
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
  })
    .then((res) => res.json())
    .then((data) => {
      get();
    });
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

function showGraph() {
  let values = filtered.map((a) => a.points);
  console.log(values);

  const ctx = document.getElementById("myChart").getContext("2d");
  const myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["1st", "2nd", "3rd", "4th", "5th"],
      datasets: [
        {
          label: "amount of CO2",
          data: values,
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
            "rgba(255, 159, 64, 0.2)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        x: {
          ticks: {
            color: "#92dce5",
          },
          y: {
            beginAtZero: true,
          },
        },
      },
    },
  });
}
