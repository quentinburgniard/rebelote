import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';

const ctx = document.getElementById('myChart');

Chart.register(BarController);
Chart.register(BarElement);
Chart.register(CategoryScale);
Chart.register(LinearScale);

new Chart(ctx, {
  data: {
    datasets: [{
      data: stats[0],
      borderWidth: 1
    }]
   },
   options: {
    scales: {
      y: {
        beginAtZero: true
      }
    }
  },
  type: 'bar'
});