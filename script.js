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

// Write a summary sentence and draw the chart for the chosen country
function showCountry() {
  const country = document.getElementById("country").value;
  const summary = document.getElementById("summary");

  const rows = allRows
    .filter(row => row.Entity === country && row[DEATHS_COLUMN] != null)
    .sort((a, b) => a.Year - b.Year);

  if (rows.length === 0) {
    summary.textContent = "No data available for this selection.";
    if (chart) chart.destroy();
    return;
  }

  const first = rows[0];
  const last = rows[rows.length - 1];
  summary.textContent =
    `${country}: ${last[DEATHS_COLUMN].toLocaleString()} cancer deaths in ${last.Year}, ` +
    `compared with ${first[DEATHS_COLUMN].toLocaleString()} in ${first.Year}.`;

  drawChart(country, rows);
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