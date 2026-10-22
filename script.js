const FILE = "cancer-data.csv";
const DEATHS_COLUMN = "Total deaths from malignant neoplasms among both sexes";

let allRows = [];
let chart;

// Read the CSV file and turn each line into a row we can use
Papa.parse(FILE, {
  download: true,
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
  complete: function (results) {
    allRows = results.data;
    fillCountryList();
    showCountry();
  }
});

// Put every country name into the dropdown
function fillCountryList() {
  const select = document.getElementById("country");
  const countries = [...new Set(allRows.map(row => row.Entity))].sort();

  countries.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });

  select.value = countries.includes("World") ? "World" : countries[0];
  select.addEventListener("change", showCountry);
}

// Write a summary sentence, draw the chart and write the findings
function showCountry() {
  const country = document.getElementById("country").value;
  const summary = document.getElementById("summary");

  const rows = allRows
    .filter(row => row.Entity === country && row[DEATHS_COLUMN] != null)
    .sort((a, b) => a.Year - b.Year);

  if (rows.length === 0) {
    summary.textContent = "No data available for this selection.";
    document.getElementById("insights").innerHTML = "";
    if (chart) chart.destroy();
    return;
  }

  const first = rows[0];
  const last = rows[rows.length - 1];
  summary.textContent =
    `${country}: ${last[DEATHS_COLUMN].toLocaleString()} cancer deaths in ${last.Year}, ` +
    `compared with ${first[DEATHS_COLUMN].toLocaleString()} in ${first.Year}.`;

  drawChart(country, rows);
  writeInsights(country, rows);
}

// Draw a line chart of deaths over the years
function drawChart(country, rows) {
  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
      labels: rows.map(row => row.Year),
      datasets: [{
        label: `Cancer deaths in ${country}`,
        data: rows.map(row => row[DEATHS_COLUMN]),
        borderColor: "#1d6fa5",
        backgroundColor: "#1d6fa5",
        tension: 0.25,
        pointRadius: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: "Year" } },
        y: { title: { display: true, text: "Number of deaths" } }
      }
    }
  });
}

// Write short findings about the chosen country
function writeInsights(country, rows) {
  const list = document.getElementById("insights");
  const first = rows[0];
  const last = rows[rows.length - 1];
  const items = [];

  // 1. Overall change from the first year to the last year
  if (first[DEATHS_COLUMN] > 0 && rows.length > 1) {
    const change = ((last[DEATHS_COLUMN] - first[DEATHS_COLUMN]) / first[DEATHS_COLUMN]) * 100;
    const direction = change >= 0 ? "rose" : "fell";
    items.push(
      `Between ${first.Year} and ${last.Year}, recorded cancer deaths in ${country} ${direction} by ` +
      `${Math.abs(change).toFixed(1)}%, from ${first[DEATHS_COLUMN].toLocaleString()} to ${last[DEATHS_COLUMN].toLocaleString()}.`
    );
  }

  // 2. The year with the most deaths
  let peak = rows[0];
  rows.forEach(row => {
    if (row[DEATHS_COLUMN] > peak[DEATHS_COLUMN]) peak = row;
  });
  items.push(`The highest number recorded was in ${peak.Year}, with ${peak[DEATHS_COLUMN].toLocaleString()} deaths.`);

  // 3. The biggest change from one year to the next
  let biggestYear = null;
  let biggestChange = 0;
  for (let i = 1; i < rows.length; i++) {
    const difference = rows[i][DEATHS_COLUMN] - rows[i - 1][DEATHS_COLUMN];
    if (Math.abs(difference) > Math.abs(biggestChange)) {
      biggestChange = difference;
      biggestYear = rows[i].Year;
    }
  }
  if (biggestYear !== null) {
    const word = biggestChange > 0 ? "up" : "down";
    items.push(
      `The largest one-year change was in ${biggestYear} (${word} ${Math.abs(biggestChange).toLocaleString()} deaths). ` +
      `A sudden jump like this is worth checking, because it can reflect a change in how deaths were recorded and not only a real change.`
    );
  }

  list.innerHTML = items.map(text => `<li>${text}</li>`).join("");
}