document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculate-btn');
    calculateBtn.addEventListener('click', calculateRetirement);
    
    // Set default values
    document.getElementById('current-age').value = 30;
    document.getElementById('retirement-age').value = 50;
    document.getElementById('life-expectancy').value = 95;
    document.getElementById('current-savings').value = 1000;
    document.getElementById('monthly-contribution').value = 5;
    document.getElementById('monthly-expenses').value = 20;
    document.getElementById('pension-age').value = 65;
    document.getElementById('pension-amount').value = 10;
    document.getElementById('pre-retirement-return').value = 4;
    document.getElementById('post-retirement-return').value = 3;
    document.getElementById('inflation-rate').value = 1;
});

// Conversion factor: 1万円 = 10000円
const CONVERSION_FACTOR = 10000;

function calculateRetirement() {
    // Get input values
    const currentAge = parseInt(document.getElementById('current-age').value);
    const retirementAge = parseInt(document.getElementById('retirement-age').value);
    const lifeExpectancy = parseInt(document.getElementById('life-expectancy').value);
    
    // Convert from 万円 to 円 for calculations
    const currentSavings = parseFloat(document.getElementById('current-savings').value) * CONVERSION_FACTOR;
    const monthlyContribution = parseFloat(document.getElementById('monthly-contribution').value) * CONVERSION_FACTOR;
    const monthlyExpenses = parseFloat(document.getElementById('monthly-expenses').value) * CONVERSION_FACTOR;
    const pensionAmount = parseFloat(document.getElementById('pension-amount').value) * CONVERSION_FACTOR;
    
    const pensionAge = parseInt(document.getElementById('pension-age').value);
    const preRetirementReturn = parseFloat(document.getElementById('pre-retirement-return').value) / 100;
    const postRetirementReturn = parseFloat(document.getElementById('post-retirement-return').value) / 100;
    const inflationRate = parseFloat(document.getElementById('inflation-rate').value) / 100;
    
    // Calculate years to retirement and years in retirement
    const yearsToRetirement = retirementAge - currentAge;
    const yearsInRetirement = lifeExpectancy - retirementAge;
    
    // Simulate pre-retirement (accumulation phase) year by year
    const yearlyData = [];
    let accumulationBalance = currentSavings;
    let monthlyContributionTracker = monthlyContribution;
    
    // Pre-retirement phase (accumulation)
    for (let year = 0; year < yearsToRetirement; year++) {
        const age = currentAge + year;
        
        // Apply inflation to monthly contributions after the first year
        if (year > 0) {
            monthlyContributionTracker *= (1 + inflationRate);
        }
        
        // Annual contribution
        const yearlyContribution = monthlyContributionTracker * 12;
        
        // Calculate year-end balance
        const interestEarned = accumulationBalance * preRetirementReturn;
        const yearEndBalance = accumulationBalance + interestEarned + yearlyContribution;
        
        yearlyData.push({
            age: age,
            phase: 'accumulation',
            pensionIncome: 0,
            expenses: 0,
            contribution: yearlyContribution,
            withdrawal: 0,
            interestEarned: interestEarned,
            balance: yearEndBalance
        });
        
        // Update balance for next year
        accumulationBalance = yearEndBalance;
    }
    
    // The final balance of accumulation phase is the starting balance of retirement phase
    const totalRetirementSavings = accumulationBalance;
    let currentBalance = totalRetirementSavings;
    let fundsDepleteAge = null;
    
    // Retirement phase (decumulation)
    for (let year = 0; year <= yearsInRetirement; year++) {
        const currentRetirementAge = retirementAge + year;
        
        // Calculate expenses with inflation
        const inflationFactor = Math.pow(1 + inflationRate, year);
        const yearlyExpenses = monthlyExpenses * 12 * inflationFactor;
        
        // Calculate pension income (if eligible)
        let yearlyPensionIncome = 0;
        if (currentRetirementAge >= pensionAge) {
            yearlyPensionIncome = pensionAmount * 12 * inflationFactor;
        }
        
        // Calculate withdrawal needed
        const yearlyWithdrawal = Math.max(0, yearlyExpenses - yearlyPensionIncome);
        
        // Calculate year-end balance
        const interestEarned = currentBalance * postRetirementReturn;
        const yearEndBalance = currentBalance + interestEarned - yearlyWithdrawal;
        
        yearlyData.push({
            age: currentRetirementAge,
            phase: 'retirement',
            pensionIncome: yearlyPensionIncome,
            expenses: yearlyExpenses,
            contribution: 0,
            withdrawal: yearlyWithdrawal,
            interestEarned: interestEarned,
            balance: yearEndBalance
        });
        
        // Check if funds are depleted
        if (yearEndBalance <= 0 && fundsDepleteAge === null) {
            fundsDepleteAge = currentRetirementAge;
        }
        
        // Update balance for next year
        currentBalance = Math.max(0, yearEndBalance);
        
        // Stop calculation if funds are completely depleted
        if (currentBalance === 0) {
            break;
        }
    }
    
    // Determine if plan is on track
    const isOnTrack = fundsDepleteAge === null || fundsDepleteAge >= lifeExpectancy;
    const lastAge = fundsDepleteAge || (retirementAge + yearsInRetirement);
    
    // Display results
    displayResults({
        totalRetirementSavings,
        isOnTrack,
        lastAge,
        currentAge,
        retirementAge,
        pensionAge,
        lifeExpectancy,
        inflationRate,
        yearlyData
    });
}

function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.classList.remove('hidden');
    
    // Display summary
    const summaryDiv = document.getElementById('result-summary');
    
    let summaryHtml = `
        <div class="summary-item">
            <span class="summary-label">退職時の貯蓄総額:</span>
            <span>${formatCurrency(results.totalRetirementSavings)}</span>
            <span class="explanation">（${results.currentAge}歳から${results.retirementAge}歳まで毎月の貯蓄と投資リターンで積み立てた金額）</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">資金が続く年齢:</span>
            <span>${results.lastAge}歳</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">インフレ調整について:</span>
            <span class="explanation">毎月の貯蓄額は年々インフレ率(${(results.inflationRate*100).toFixed(0)}%)で増加し、退職後の支出と年金もインフレ率で調整されます。</span>
        </div>
    `;
    
    if (results.isOnTrack) {
        summaryHtml += `
            <div class="summary-item">
                <span class="summary-label">結果:</span>
                <span class="success">資金は生涯にわたって十分です</span>
            </div>
        `;
    } else {
        summaryHtml += `
            <div class="summary-item">
                <span class="summary-label">結果:</span>
                <span class="warning">資金は${results.lastAge}歳までしか持ちません</span>
            </div>
        `;
    }
    
    // Add phase markers for easier understanding
    summaryHtml += `
        <div class="phase-markers">
            <div class="phase-marker accumulation">
                <span class="dot"></span> 積立期間（${results.currentAge}歳～${results.retirementAge}歳）
            </div>
            <div class="phase-marker retirement">
                <span class="dot"></span> 退職期間（${results.retirementAge}歳～${results.lifeExpectancy}歳）
            </div>
            <div class="phase-marker pension">
                <span class="dot"></span> 年金開始（${results.pensionAge}歳～）
            </div>
        </div>
    `;
    
    summaryDiv.innerHTML = summaryHtml;
    
    // Create table
    createResultTable(results.yearlyData, results.retirementAge);
    
    // Create chart
    createBalanceChart(results.yearlyData, results.retirementAge, results.pensionAge);
}

function createResultTable(yearlyData, retirementAge) {
    const tableBody = document.getElementById('result-table-body');
    tableBody.innerHTML = '';
    
    // Add table headers to better explain the data
    const tableHead = document.querySelector('#result-table thead tr');
    tableHead.innerHTML = `
        <th>年齢</th>
        <th>フェーズ</th>
        <th>年間貯蓄</th>
        <th>年金収入</th>
        <th>支出</th>
        <th>引出額</th>
        <th>投資収益</th>
        <th>年末残高</th>
    `;
    
    // Filter to show important years for clarity
    const filteredData = yearlyData.filter((data, index) => {
        // Show first and last year
        if (index === 0 || index === yearlyData.length - 1) return true;
        
        // Show retirement age
        if (data.age === retirementAge) return true;
        
        // Show pension start age
        if (data.pensionIncome > 0 && yearlyData[index-1].pensionIncome === 0) return true;
        
        // Show every 5 years
        return data.age % 5 === 0;
    });
    
    filteredData.forEach(data => {
        const row = document.createElement('tr');
        row.className = data.phase; // Add class for styling
        
        const phaseText = data.phase === 'accumulation' ? '積立期間' : '退職期間';
        
        row.innerHTML = `
            <td>${data.age}</td>
            <td>${phaseText}</td>
            <td>${formatCurrency(data.contribution)}</td>
            <td>${formatCurrency(data.pensionIncome)}</td>
            <td>${formatCurrency(data.expenses)}</td>
            <td>${formatCurrency(data.withdrawal)}</td>
            <td>${formatCurrency(data.interestEarned)}</td>
            <td>${formatCurrency(data.balance)}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

function createBalanceChart(yearlyData, retirementAge, pensionAge) {
    const ctx = document.getElementById('balance-chart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (window.retirementChart) {
        window.retirementChart.destroy();
    }
    
    const ages = yearlyData.map(data => data.age);
    const balances = yearlyData.map(data => data.balance / CONVERSION_FACTOR); // Convert to 万円 for display
    
    // Find retirement and pension ages for visualization
    const retirementIndex = yearlyData.findIndex(data => data.age === retirementAge);
    const pensionIndex = yearlyData.findIndex(data => data.pensionIncome > 0);
    
    window.retirementChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ages,
            datasets: [{
                label: '資産残高',
                data: balances,
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                borderWidth: 2,
                fill: 'start',
                pointRadius: 0, // Hide points for cleaner look
                pointHoverRadius: 5, // Show points on hover
                tension: 0.4 // Add curvature to the line
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '生涯の資産残高推移'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const dataIndex = context.dataIndex;
                            const data = yearlyData[dataIndex];
                            const phase = data.phase === 'accumulation' ? '積立期間' : '退職期間';
                            return [
                                `年齢: ${data.age}歳 (${phase})`,
                                `残高: ${formatManYen(balances[dataIndex])}`,
                                data.phase === 'accumulation' 
                                    ? `年間貯蓄: ${formatManYen(data.contribution / CONVERSION_FACTOR)} (インフレ調整済み)`
                                    : `年金収入: ${formatManYen(data.pensionIncome / CONVERSION_FACTOR)}`,
                                data.phase === 'retirement' 
                                    ? `年間支出: ${formatManYen(data.expenses / CONVERSION_FACTOR)}`
                                    : '',
                                `投資収益: ${formatManYen(data.interestEarned / CONVERSION_FACTOR)}`
                            ].filter(text => text !== '');
                        }
                    }
                },
                annotation: {
                    annotations: {
                        retirementLine: {
                            type: 'line',
                            xMin: retirementAge,
                            xMax: retirementAge,
                            borderColor: 'rgba(255, 99, 132, 0.8)',
                            borderWidth: 2,
                            label: {
                                content: '退職',
                                display: true,
                                position: 'start'
                            }
                        },
                        pensionLine: pensionIndex !== -1 ? {
                            type: 'line',
                            xMin: pensionAge,
                            xMax: pensionAge,
                            borderColor: 'rgba(75, 192, 192, 0.8)',
                            borderWidth: 2,
                            label: {
                                content: '年金開始',
                                display: true,
                                position: 'start'
                            }
                        } : undefined
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '資産残高 (万円)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '年齢'
                    }
                }
            }
        }
    });
}

function formatCurrency(amount) {
    // Convert to 万円 for display
    const manYen = amount / CONVERSION_FACTOR;
    return formatManYen(manYen);
}

function formatManYen(manYen) {
    // Format to Japanese currency style with 万円
    return new Intl.NumberFormat('ja-JP', {
        maximumFractionDigits: 1,
        minimumFractionDigits: 0
    }).format(manYen) + ' 万円';
} 