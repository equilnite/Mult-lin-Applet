let myChart; // To store the chart instance
const niceColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

function linearRegression(y, x) {
    const n = y.length;
    if (n !== x.length || n === 0) {
        return { slope: NaN, intercept: NaN };
    }

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i];
    }

    const meanX = sumX / n;
    const meanY = sumY / n;

    const numerator = sumXY - n * meanX * meanY;
    const denominator = sumX2 - n * meanX * meanX;

    const slope = denominator === 0 ? NaN : numerator / denominator;
    const intercept = meanY - slope * meanX;

    return { slope, intercept };
}

function processData() {
    const quantitativeXInput = document.getElementById('quantitativeX').value;
    const quantitativeYInput = document.getElementById('quantitativeY').value;
    const categoricalZInput = document.getElementById('categoricalZ').value;

    const xValues = quantitativeXInput.split(/[,\s\n]+/).filter(val => val !== '').map(Number).filter(val => !isNaN(val));
    const yValues = quantitativeYInput.split(/[,\s\n]+/).filter(val => val !== '').map(Number).filter(val => !isNaN(val));
    const zValues = categoricalZInput.split(/[,\s\n]+/).filter(val => val !== '').map(val => val.trim());

    if (xValues.length !== yValues.length || xValues.length !== zValues.length) {
        alert("The number of data points for all variables must be the same.");
        return;
    }

    const categories = [...new Set(zValues)];
    const datasets = [];
    const coefficients = {};
    const jitterAmount = parseFloat(document.getElementById('jitterAmount').value) || 0;
    const pointOpacity = parseFloat(document.getElementById('pointOpacity').value) || 1;

    categories.forEach((category, index) => {
        const xByCategory = xValues.filter((_, i) => zValues[i] === category);
        const yByCategory = yValues.filter((_, i) => zValues[i] === category);
        const colorIndex = index % niceColors.length;
        const color = niceColors[colorIndex];

        datasets.push({
            label: category,
            data: xByCategory.map((x, i) => ({
                originalX: x, // Store the original x value
                originalY: yByCategory[i], // Store the original y value
                x: x + (Math.random() - 0.5) * jitterAmount,
                y: yByCategory[i] + (Math.random() - 0.5) * jitterAmount
            })),
            backgroundColor: color + Math.round(pointOpacity * 255).toString(16).padStart(2, '0'), // Add opacity to hex color
            borderColor: color,
            pointRadius: 5,
            showLine: false
        });

        if (xByCategory.length > 1) {
            const regression = linearRegression(yByCategory, xByCategory);
            coefficients[category] = { slope: regression.slope.toFixed(3), intercept: regression.intercept.toFixed(3) };
            if (!isNaN(regression.slope) && !isNaN(regression.intercept)) {
                const minX = Math.min(...xByCategory);
                const maxX = Math.max(...xByCategory);
                datasets.push({
                    type: 'line',
                    label: `${category} Regression`,
                    data: [{ x: minX, y: regression.intercept + regression.slope * minX }, { x: maxX, y: regression.intercept + regression.slope * maxX }],
                    borderColor: color,
                    fill: false,
                    pointRadius: 0
                });
            } else {
                coefficients[category] = { slope: 'N/A', intercept: 'N/A' };
            }
        } else {
            coefficients[category] = { slope: 'N/A', intercept: 'N/A' };
        }
    });

    displayCoefficients(coefficients);
    if (!myChart) {
        renderChart(datasets);
    } else {
        updateChartData(datasets);
    }
}

function updateChartData(newDatasets) {
    if (myChart) {
        myChart.data.datasets = newDatasets;
        myChart.update();
    }
}

function renderChart(datasets) {
    const ctx = document.getElementById('myChart').getContext('2d');
    const graphTitle = document.getElementById('graphTitle').value;
    const xAxisLabel = document.getElementById('xAxisLabel').value;
    const yAxisLabel = document.getElementById('yAxisLabel').value;
    const xStep = parseFloat(document.getElementById('xStepSize').value);
    const yStep = parseFloat(document.getElementById('yStepSize').value);

    myChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: datasets
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: graphTitle,
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: true
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (context.parsed && context.parsed.x !== null && context.parsed.y !== null && !label.includes('Regression')) {
                                const originalX = context.dataset.data[context.dataIndex].originalX;
                                const originalY = context.dataset.data[context.dataIndex].originalY;
                                label += ` (x:${originalX}, y:${originalY})`;
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
                        text: xAxisLabel
                    },
                    ticks: {
                        stepSize: isNaN(xStep) ? undefined : xStep
                    },
                    grid: {
                        display: !isNaN(xStep)
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel
                    },
                    ticks: {
                        stepSize: isNaN(yStep) ? undefined : yStep
                    },
                    grid: {
                        display: !isNaN(yStep)
                    }
                }
            },
            responsive: false,
            maintainAspectRatio: false
        }
    });
}

function updateChartOptions() {
    if (myChart) {
        const jitterAmount = parseFloat(document.getElementById('jitterAmount').value) || 0;
        const pointOpacity = parseFloat(document.getElementById('pointOpacity').value) || 1;

        myChart.data.datasets.forEach(dataset => {
            if (!dataset.label.includes('Regression')) {
                dataset.data.forEach((point, index) => {
                    if (dataset._original && dataset._original[index]) {
                        const originalX = dataset._original[index].x;
                        const originalY = dataset._original[index].y;
                        point.originalX = originalX; // Ensure originalX is still stored
                        point.originalY = originalY; // Ensure originalY is still stored
                        point.x = originalX + (Math.random() - 0.5) * jitterAmount;
                        point.y = originalY + (Math.random() - 0.5) * jitterAmount;
                    } else {
                        // Fallback if _original is missing or doesn't have the index
                        point.x = point.x + (Math.random() - 0.5) * jitterAmount;
                        point.y = point.y + (Math.random() - 0.5) * jitterAmount;
                        point.originalX = point.x;
                        point.originalY = point.y;
                    }
                });
                const colorBase = dataset.borderColor;
                dataset.backgroundColor = colorBase + Math.round(pointOpacity * 255).toString(16).padStart(2, '0');
            }
        });

        myChart.options.plugins.title.text = document.getElementById('graphTitle').value;
        myChart.options.scales.x.title.text = document.getElementById('xAxisLabel').value;
        myChart.options.scales.y.title.text = document.getElementById('yAxisLabel').value;

        const xStep = parseFloat(document.getElementById('xStepSize').value);
        const yStep = parseFloat(document.getElementById('yStepSize').value);

        myChart.options.scales.x.ticks.stepSize = isNaN(xStep) ? undefined : xStep;
        myChart.options.scales.y.ticks.stepSize = isNaN(yStep) ? undefined : yStep;
        myChart.options.scales.x.grid.display = !isNaN(xStep);
        myChart.options.scales.y.grid.display = !isNaN(yStep);

        myChart.update(); // Trigger an update, not a full re-render
    }
}

function displayCoefficients(coefficients) {
    const coefficientsDisplay = document.getElementById('coefficientsDisplay');
    coefficientsDisplay.innerHTML = ''; // Clear previous coefficients

    for (const category in coefficients) {
        if (coefficients.hasOwnProperty(category)) {
            const coef = coefficients[category];
            const p = document.createElement('p');
            p.textContent = `${category}: Slope = ${coef.slope}, Intercept = ${coef.intercept}`;
            coefficientsDisplay.appendChild(p);
        }
    }
}

// Function to trigger initial data processing and chart rendering on load (optional)
// window.onload = function() {
//     // ... (rest of your window.onload function - no changes needed) ...
// };