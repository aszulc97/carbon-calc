import "./sass/style.scss";

const webCarbonUrl = "https://kea-alt-del.dk/websitecarbon/site/?url=";

document.querySelector("button").addEventListener("click", getWebsite);

let website;

function getWebsite() {
  website = document.querySelector("input").value;
  fetchData();
}

function fetchData() {
  fetch(webCarbonUrl + website)
    .then((res) => res.json())
    .then((data) => showWebcarbonData(data));
}

function showWebcarbonData(data) {
  document.querySelector("h1").textContent = "Your website: " + website;
  document.querySelector("#size").textContent = data.bytes + " bytes";
  run();
}

function showGoogleData(data) {
  console.log(data);
  document.querySelector("#mini").textContent = data.lighthouseResult.audits["unminified-javascript"].description;
}

function run() {
  const url = setUpQuery();
  fetch(url)
    .then((response) => response.json())
    .then((data) => showGoogleData(data));
}

function setUpQuery() {
  const api = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
  const parameters = {
    url: website,
    key: "AIzaSyCCsJR7PD4hGIi2x8r2y8B4rgpYooeICYQ",
  };
  let query = `${api}?url=${parameters.url}&key=${parameters.key}`;
  return query;
}
