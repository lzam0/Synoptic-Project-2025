// public/js/charts.js
// This script assumes that 'rawData' is a global variable
// set by the Pug template (e.g., window.rawData),
// and window.stationName and window.riverName are also available.

(function () {
  // Check if rawData exists and is an array before proceeding
  if (typeof window.rawData === 'undefined' || !Array.isArray(window.rawData) || window.rawData.length === 0) {
    console.error("Error: window.rawData is not defined, not an array, or empty. Cannot render charts.");
    return; // Exit if data is not available
  }

  // Extract relevant data directly from rawData
  // Sort by date to ensure chronological order for line graphs
  window.rawData.sort((a, b) => new Date(a.date) - new Date(b.date));

  const dates = window.rawData.map(d => d.date);
  const levels = window.rawData.map(d => (d.level !== null && !isNaN(d.level)) ? parseFloat(d.level) : null);
  const flows = window.rawData.map(d => (d.flow !== null && !isNaN(d.flow)) ? parseFloat(d.flow) : null);

  // Get station and river name from window variables (set by Pug)
  const stationName = window.stationName || 'Unknown Station';
  const riverDisplayName = window.riverName || 'Unknown River';

  // --- Line Chart: Level and Flow over Date ---
  const myChartCanvas = document.getElementById('myChart');
  if (myChartCanvas) {
    const ctx = myChartCanvas.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates, // Dates on the X-axis
        datasets: [
          {
            label: 'Level (m)', // Label for the first line dataset
            data: levels, // Data points for level
            borderColor: 'rgb(54, 162, 235)', // Blue color for the line
            backgroundColor: 'rgba(54, 162, 235, 0.2)', // Light blue fill under the line
            fill: false, // Do not fill the area under the line
            yAxisID: 'y-level', // Associate with the 'y-level' axis
            tension: 0.1 // Smooth the line
          },
          {
            label: 'Flow (cumec)', // Label for the second line dataset
            data: flows, // Data points for flow
            borderColor: 'rgb(75, 192, 192)', // Greenish-blue color for the line
            backgroundColor: 'rgba(75, 192, 192, 0.2)', // Light greenish-blue fill
            fill: false,
            yAxisID: 'y-flow', // Associate with the 'y-flow' axis
            tension: 0.1
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
            text: `${riverDisplayName} (${stationName}) - Water Level and Flow Over Time`, // Dynamic title
            font: {
              size: 16
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date' // X-axis title is Date
            },
            type: 'time', // Use time scale for dates
            time: {
              unit: 'month', // Display units in months or days depending on data density
              tooltipFormat: 'yyyy-MM-dd', // Format for tooltips
              displayFormats: {
                  month: 'yyyy-MM',
                  day: 'yyyy-MM-dd'
              }
            }
          },
          'y-level': { // Configuration for the left Y-axis (Level)
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Level (m)' // Y-axis title is Level
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
              text: 'Flow (cumec)' // Y-axis title is Flow
            },
            grid: {
              drawOnChartArea: false // Do not draw grid lines for this axis (to avoid clutter)
            }
          }
        }
      }
    });
  } else {
    console.error("Canvas element with ID 'myChart' not found.");
  }


  // --- Bar Chart: Flow over Date ---
  const barChartCanvas = document.getElementById('barChart');
  if (barChartCanvas) {
    const barCtx = barChartCanvas.getContext('2d');
    new Chart(barCtx, {
      type: 'bar', // Type of chart: bar
      data: {
        labels: dates, // Dates on the X-axis
        datasets: [
          {
            label: 'Flow (cumec)', // Label for the bar dataset
            data: flows, // Data points for flow
            backgroundColor: 'rgba(75, 192, 192, 0.8)', // Bar color
            borderColor: 'rgba(75, 192, 192, 1)', // Border color of bars
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${riverDisplayName} (${stationName}) - Water Flow Over Time (Bar Chart)`, // Dynamic title
            font: {
              size: 16
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date' // X-axis title is Date
            },
            type: 'time', // Use time scale for dates
            time: {
              unit: 'month',
              tooltipFormat: 'yyyy-MM-dd',
              displayFormats: {
                  month: 'yyyy-MM',
                  day: 'yyyy-MM-dd'
              }
            }
          },
          y: {
            beginAtZero: true, // Start Y-axis from zero
            title: {
              display: true,
              text: 'Flow (cumec)' // Y-axis title is Flow
            }
          }
        }
      }
    });
  } else {
    console.error("Canvas element with ID 'barChart' not found.");
  }


  // --- Function to Render Data Table ---
  function renderDataTable() {
    const tableContainer = document.getElementById('dataTableContainer');
    if (!tableContainer) {
      console.error("Data table container with ID 'dataTableContainer' not found.");
      return;
    }

    let tableHTML = `<h2 class="mt-5 text-center">Data Table for ${riverDisplayName} (${stationName})</h2>`; // Dynamic title
    // Bootstrap classes for responsive and styled table
    tableHTML += '<div class="table-responsive"><table class="table table-striped table-hover table-bordered shadow-sm">';
    tableHTML += '<thead class="table-dark"><tr><th>Date</th><th>Time</th><th>Level (m)</th><th>Flow (cumec)</th></tr></thead>'; // Updated headers
    tableHTML += '<tbody>';

    // Iterate through the rawData to populate the table (no aggregation needed here)
    window.rawData.forEach(d => {
      const level = (d.level !== null && !isNaN(d.level)) ? parseFloat(d.level).toFixed(3) : 'N/A'; // Format to 3 decimal places
      const flow = (d.flow !== null && !isNaN(d.flow)) ? parseFloat(d.flow).toFixed(3) : 'N/A'; // Format to 3 decimal places
      const time = d.time ? d.time.slice(0, 5) : 'N/A'; // Format time to HH:MM

      tableHTML += `<tr>
        <td>${d.date || 'N/A'}</td>
        <td>${time}</td>
        <td>${level}</td>
        <td>${flow}</td>
      </tr>`;
    });

    tableHTML += '</tbody></table></div>';
    tableContainer.innerHTML = tableHTML;
  }

  // Call the function to render the data table when the script runs
  renderDataTable();

})();
