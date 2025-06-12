(function () {
  //Check if rawData is not defined, not an array, or empty,
  if (typeof window.rawData === 'undefined' || !Array.isArray(window.rawData) || window.rawData.length === 0) {
    console.info("charts.js: No rawData available or data array is empty. Skipping chart rendering.");
    return; 
  }

  const yearlyData = {};

  // Iterate over each data point in rawData
  window.rawData.forEach(d => {
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
    }

    // Add 'flow' to sum if it's a valid number. Use 0 if invalid to not break sum.
    if (d.flow !== null && !isNaN(d.flow)) {
      yearlyData[year].flowSum += parseFloat(d.flow);
    } else {
    }

    // Increment count for the current year if at least one valid number (level or flow) was found
    if ((d.level !== null && !isNaN(d.level)) || (d.flow !== null && !isNaN(d.flow))) {
        yearlyData[year].count += 1;
    }
  });

  const labels = Object.keys(yearlyData).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  // Calculate average levels and flows for each year
  const avgLevels = labels.map(year => {
    const avg = yearlyData[year].count > 0 ? (yearlyData[year].levelSum / yearlyData[year].count) : NaN;
    return avg; 
  });

  const avgFlows = labels.map(year => {
    const avg = yearlyData[year].count > 0 ? (yearlyData[year].flowSum / yearlyData[year].count) : NaN;
    return avg; 
  });

  // Get station and river name from window variables (set by Pug)
  const stationName = window.stationName || 'Unknown Station';
  const riverDisplayName = window.riverName || 'Unknown River';

  //  sets global defaults
  Chart.defaults.font.family = 'Inter, sans-serif'; 
  Chart.defaults.color = '#333'; 


  // --- Line Chart: Average Water Level and Flow per Year ---
  const myChartCanvas = document.getElementById('myChart');
  if (myChartCanvas) {
    const ctx = myChartCanvas.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels, 
        datasets: [
          {
            label: 'Avg Level (m)', 
            data: avgLevels, 
            borderColor: 'rgb(54, 162, 235)', 
            backgroundColor: 'rgba(54, 162, 235, 0.2)', 
            fill: false, 
            yAxisID: 'y-level', 
            tension: 0.1, 
            pointRadius: 3, 
            pointHoverRadius: 7
          },
          {
            label: 'Avg Flow (cumec)',
            data: avgFlows,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: false,
            yAxisID: 'y-flow',
            tension: 0.1,
            pointRadius: 3,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true, 
        maintainAspectRatio: false, 
        interaction: {
          mode: 'index',
          intersect: false 
        },
        stacked: false, 
        plugins: {
          title: {
            display: true,
            text: `${riverDisplayName} (${stationName}) - Average Water Level and Flow per Year`, 
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
                  label += context.parsed.y.toFixed(2);
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
              text: 'Year',
              font: { size: 14, weight: 'bold' }
            },
            type: 'category',
            ticks: {
                autoSkip: true,
                maxRotation: 45,
                minRotation: 0
            }
          },
          'y-level': {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Average Level (m)',
              font: { size: 14, weight: 'bold' }
            },
            grid: {
              drawOnChartArea: true
            }
          },
          'y-flow': {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Average Flow (cumec)',
              font: { size: 14, weight: 'bold' }
            },
            grid: {
              drawOnChartArea: false 
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
      type: 'bar',
      data: {
        labels: labels, 
        datasets: [
          {
            label: 'Avg Flow (cumec)',
            data: avgFlows,
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
            borderColor: 'rgba(75, 192, 192, 1)', 
            borderWidth: 1,
            borderRadius: 5 
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${riverDisplayName} (${stationName}) - Average Water Flow per Year (Bar Chart)`, 
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
                  label += context.parsed.y.toFixed(2);
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
              text: 'Year', 
              font: { size: 14, weight: 'bold' }
            },
            type: 'category', 
            ticks: {
                autoSkip: true,
                maxRotation: 45,
                minRotation: 0
            }
          },
          y: {
            beginAtZero: true, 
            title: {
              display: true,
              text: 'Average Flow (cumec)', 
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

    let tableHTML = `<h2 class="mt-5 text-center">Average Data Table for ${riverDisplayName} (${stationName})</h2>`; 
    // Bootstrap classes for responsive and styled table
    tableHTML += '<div class="table-responsive"><table class="table table-striped table-hover table-bordered shadow-sm">';
    tableHTML += '<thead class="table-dark"><tr><th>Year</th><th>Average Level (m)</th><th>Average Flow (cumec)</th><th>Count</th></tr></thead>'; 
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
    tableContainer.innerHTML = tableHTML; 
  }

  // Call the function to render the data table when the script runs
  renderDataTable();

})();
