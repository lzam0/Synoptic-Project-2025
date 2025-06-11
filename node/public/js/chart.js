// public/js/charts.js
// This script assumes that 'rawData' is a global variable
// set by the Pug template (e.g., window.rawData),
// and window.stationName and window.riverName are also available.

(function () {
  // Defensive check: If rawData is not defined, not an array, or empty,
  // it means no data was passed from the server for this view.
  // In this scenario, the Pug template will render selection options instead of canvases,
  // so this script should gracefully exit without errors.
  if (typeof window.rawData === 'undefined' || !Array.isArray(window.rawData) || window.rawData.length === 0) {
    console.info("charts.js: No rawData available or data array is empty. Skipping chart rendering.");
    return; // Exit the IIFE if no data is present.
  }

  // --- Data Aggregation for Yearly Averages ---
  // Object to store aggregated data, grouped by year.
  // Each year will store sum of 'level', sum of 'flow', and a 'count' of entries for that year.
  const yearlyData = {};

  // Iterate over each data point in rawData
  window.rawData.forEach(d => {
    // Ensure 'year' is a valid number
    const year = parseInt(d.year, 10);
    if (isNaN(year)) {
      console.warn(`charts.js: Skipping data point due to invalid year: ${d.year}`);
      return;
    }

    // Initialize yearlyData for the current year if it doesn't exist
    if (!yearlyData[year]) {
      yearlyData[year] = { levelSum: 0, flowSum: 0, count: 0 };
    }

    // Add 'level' to sum if it's a valid number. Use 0 if invalid to not break sum.
    if (d.level !== null && !isNaN(d.level)) {
      yearlyData[year].levelSum += parseFloat(d.level);
    } else {
      // console.warn(`charts.js: Invalid 'level' value for year ${year}: ${d.level}. Skipping for average calculation.`);
    }

    // Add 'flow' to sum if it's a valid number. Use 0 if invalid to not break sum.
    if (d.flow !== null && !isNaN(d.flow)) {
      yearlyData[year].flowSum += parseFloat(d.flow);
    } else {
      // console.warn(`charts.js: Invalid 'flow' value for year ${year}: ${d.flow}. Skipping for average calculation.`);
    }

    // Increment count for the current year if at least one valid number (level or flow) was found
    if ((d.level !== null && !isNaN(d.level)) || (d.flow !== null && !isNaN(d.flow))) {
        yearlyData[year].count += 1;
    }
  });

  // Prepare labels (years) and calculated average values for charting
  // Sort years to ensure chronological order on the charts
  const labels = Object.keys(yearlyData).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  // Calculate average levels and flows for each year
  const avgLevels = labels.map(year => {
    // Calculate average, handle division by zero or invalid sums. Format to two decimal places.
    const avg = yearlyData[year].count > 0 ? (yearlyData[year].levelSum / yearlyData[year].count) : NaN;
    return avg; // Let Chart.js handle formatting or keep as float for precision
  });

  const avgFlows = labels.map(year => {
    const avg = yearlyData[year].count > 0 ? (yearlyData[year].flowSum / yearlyData[year].count) : NaN;
    return avg; // Let Chart.js handle formatting or keep as float for precision
  });

  // Get station and river name from window variables (set by Pug)
  const stationName = window.stationName || 'Unknown Station';
  const riverDisplayName = window.riverName || 'Unknown River';

  // --- Chart.js Global Configuration (Optional but good practice) ---
  Chart.defaults.font.family = 'Inter, sans-serif'; // Assuming Inter font or similar readable font
  Chart.defaults.color = '#333'; // Default text color


  // --- Line Chart: Average Water Level and Flow per Year ---
  const myChartCanvas = document.getElementById('myChart');
  if (myChartCanvas) {
    const ctx = myChartCanvas.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels, // Years on the X-axis
        datasets: [
          {
            label: 'Avg Level (m)', // Label for the first line dataset
            data: avgLevels, // Data points for average level
            borderColor: 'rgb(54, 162, 235)', // Blue color for the line
            backgroundColor: 'rgba(54, 162, 235, 0.2)', // Light blue fill under the line
            fill: false, // Do not fill the area under the line
            yAxisID: 'y-level', // Associate with the 'y-level' axis
            tension: 0.1, // Smooth the line
            pointRadius: 3, // Size of data points
            pointHoverRadius: 7
          },
          {
            label: 'Avg Flow (cumec)', // Label for the second line dataset
            data: avgFlows, // Data points for average flow
            borderColor: 'rgb(75, 192, 192)', // Greenish-blue color for the line
            backgroundColor: 'rgba(75, 192, 192, 0.2)', // Light greenish-blue fill
            fill: false,
            yAxisID: 'y-flow', // Associate with the 'y-flow' axis
            tension: 0.1,
            pointRadius: 3,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true, // Make the chart responsive to container size
        maintainAspectRatio: false, // Allow canvas to resize freely
        interaction: {
          mode: 'index', // Show tooltips for all datasets at a given index
          intersect: false // Tooltips appear even if not directly over a point
        },
        stacked: false, // Datasets are not stacked
        plugins: {
          title: {
            display: true,
            text: `${riverDisplayName} (${stationName}) - Average Water Level and Flow per Year`, // Dynamic title
            font: { size: 18, weight: 'bold' },
            padding: { top: 10, bottom: 20 }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toFixed(2); // Format tooltip value to 2 decimal places
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Year', // X-axis title
              font: { size: 14, weight: 'bold' }
            },
            type: 'category', // Use 'category' type for discrete years
            ticks: {
                autoSkip: true,
                maxRotation: 45,
                minRotation: 0
            }
          },
          'y-level': { // Configuration for the left Y-axis (Level)
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Average Level (m)', // Y-axis title
              font: { size: 14, weight: 'bold' }
            },
            grid: {
              drawOnChartArea: true // Draw grid lines for this axis
            }
          },
          'y-flow': { // Configuration for the right Y-axis (Flow)
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Average Flow (cumec)', // Y-axis title
              font: { size: 14, weight: 'bold' }
            },
            grid: {
              drawOnChartArea: false // Do not draw grid lines for this axis (to avoid clutter)
            }
          }
        }
      }
    });
  } else {
    console.warn("charts.js: Canvas element with ID 'myChart' not found. This is expected if no data is loaded.");
  }


  // --- Bar Chart: Average Flow per Year ---
  const barChartCanvas = document.getElementById('barChart');
  if (barChartCanvas) {
    const barCtx = barChartCanvas.getContext('2d');
    new Chart(barCtx, {
      type: 'bar', // Type of chart: bar
      data: {
        labels: labels, // Years on the X-axis
        datasets: [
          {
            label: 'Avg Flow (cumec)', // Label for the bar dataset
            data: avgFlows, // Data points for average flow
            backgroundColor: 'rgba(75, 192, 192, 0.8)', // Bar color
            borderColor: 'rgba(75, 192, 192, 1)', // Border color of bars
            borderWidth: 1, // Border width
            borderRadius: 5 // Rounded corners for bars
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${riverDisplayName} (${stationName}) - Average Water Flow per Year (Bar Chart)`, // Dynamic title
            font: { size: 18, weight: 'bold' },
            padding: { top: 10, bottom: 20 }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toFixed(2); // Format tooltip value to 2 decimal places
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Year', // X-axis title
              font: { size: 14, weight: 'bold' }
            },
            type: 'category', // Use 'category' type for discrete years
            ticks: {
                autoSkip: true,
                maxRotation: 45,
                minRotation: 0
            }
          },
          y: {
            beginAtZero: true, // Start Y-axis from zero
            title: {
              display: true,
              text: 'Average Flow (cumec)', // Y-axis title
              font: { size: 14, weight: 'bold' }
            },
            grid: {
              drawOnChartArea: true
            }
          }
        }
      }
    });
  } else {
    console.warn("charts.js: Canvas element with ID 'barChart' not found. This is expected if no data is loaded.");
  }


  // --- Function to Render Data Table ---
  function renderDataTable() {
    const tableContainer = document.getElementById('dataTableContainer');
    if (!tableContainer) {
      console.warn("charts.js: Data table container with ID 'dataTableContainer' not found. Skipping table rendering.");
      return;
    }

    let tableHTML = `<h2 class="mt-5 text-center">Average Data Table for ${riverDisplayName} (${stationName})</h2>`; // Dynamic table title
    // Bootstrap classes for responsive and styled table
    tableHTML += '<div class="table-responsive"><table class="table table-striped table-hover table-bordered shadow-sm">';
    tableHTML += '<thead class="table-dark"><tr><th>Year</th><th>Average Level (m)</th><th>Average Flow (cumec)</th><th>Count</th></tr></thead>'; // Table headers
    tableHTML += '<tbody>';

    // Iterate through the aggregated yearlyData to populate the table
    labels.forEach(year => {
      const level = yearlyData[year].count > 0 ? yearlyData[year].levelSum / yearlyData[year].count : NaN;
      const flow = yearlyData[year].count > 0 ? yearlyData[year].flowSum / yearlyData[year].count : NaN;
      const count = yearlyData[year].count;

      tableHTML += `<tr>
        <td>${year}</td>
        <td>${!isNaN(level) ? level.toFixed(2) : 'N/A'}</td>
        <td>${!isNaN(flow) ? flow.toFixed(2) : 'N/A'}</td>
        <td>${count}</td>
      </tr>`;
    });

    tableHTML += '</tbody></table></div>';
    tableContainer.innerHTML = tableHTML; // Inject the generated table HTML into the container
  }

  // Call the function to render the data table when the script runs
  renderDataTable();

})();
