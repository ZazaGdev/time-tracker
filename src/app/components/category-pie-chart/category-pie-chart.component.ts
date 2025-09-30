import { Component, Input, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
// import { BaseChartDirective } from 'ng2-charts';
// import { ChartConfiguration, ChartOptions } from 'chart.js';
import { ReportService, TaxonomyService } from '../../core/services';
import { ReportPeriod } from '../../core/services/report.service';

export interface PieChartData {
  categoryName: string;
  totalHours: number;
  categoryId: number;
  color: string;
}

@Component({
  selector: 'app-category-pie-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="pie-chart-card">
      <mat-card-header>
        <mat-card-title>{{ title }} - {{ periodLabel }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="chart-container">
          <!-- Chart temporarily disabled during migration to ApexCharts -->
          <p style="text-align: center; padding: 40px; color: #666;">
            Pie chart coming soon with ApexCharts
          </p>
          <!--
          <canvas
            baseChart
            [type]="pieChartType"
            [data]="pieChartData"
            [options]="pieChartOptions"
          ></canvas>
          -->
        </div>
        <div class="no-data" *ngIf="!loading() && chartData().length === 0">
          <p>No data available for the selected period.</p>
        </div>
        <div class="loading" *ngIf="loading()">
          <p>Loading chart data...</p>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .pie-chart-card {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      mat-card-content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .chart-container {
        flex: 1;
        width: 100%;
        height: 300px;
        position: relative;
        display: block;

        canvas {
          width: 100% !important;
          height: 300px !important;
          display: block;
        }
      }

      .no-data,
      .loading {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 40px;
        color: #666;

        p {
          margin: 0;
          font-size: 16px;
        }
      }

      .loading {
        font-style: italic;
      }
    `,
  ],
})
export class CategoryPieChartComponent implements OnInit {
  @Input() date!: Date;
  @Input() period: ReportPeriod = 'weekly';
  @Input() title: string = 'Category Distribution';

  chartData = signal<PieChartData[]>([]);
  loading = signal<boolean>(false);

  // Color palette for categories
  private colors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#FF6384',
    '#C9CBCF',
    '#4BC0C0',
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
  ];

  // Chart.js configuration for ng2-charts - Temporarily disabled during migration to ApexCharts
  public pieChartType = 'pie' as const;
  // public pieChartData: ChartConfiguration<'pie'>['data'] = {
  public pieChartData: any = {
    labels: ['Loading...'],
    datasets: [
      {
        data: [1],
        backgroundColor: this.colors,
        borderColor: ['#ffffff'],
        borderWidth: 1,
      },
    ],
  };

  // public pieChartOptions: ChartOptions<'pie'> = {
  public pieChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false, // We use the card title instead
      },
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = (context.dataset.data as number[]).reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toFixed(2)}h (${percentage}%)`;
          },
        },
      },
    },
  };

  constructor(private reportService: ReportService, private taxonomyService: TaxonomyService) {
    // React to data changes
    effect(() => {
      const data = this.chartData();
      if (data.length > 0) {
        this.updateChart(data);
      }
    });
  }

  ngOnInit(): void {
    // Defer loading to next tick to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.loadChartData();
    }, 0);
  }

  get periodLabel(): string {
    switch (this.period) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      default:
        return 'Weekly';
    }
  }

  private updateChart(data: PieChartData[]): void {
    console.log('Updating pie chart with data:', data);
    this.pieChartData = {
      ...this.pieChartData,
      labels: data.map((item) => item.categoryName),
      datasets: [
        {
          ...this.pieChartData.datasets[0],
          data: data.map((item) => item.totalHours),
          backgroundColor: data.map((_, index) => this.colors[index % this.colors.length]),
        },
      ],
    };
  }

  async loadChartData(): Promise<void> {
    if (!this.date) return;

    this.loading.set(true);

    try {
      // Get chart data from service
      const rawChartData = await this.reportService.getChartData(this.date, this.period);

      // Get categories to resolve names
      const categories = await this.taxonomyService.getCategories();

      // Resolve category names and add colors
      const resolvedData: PieChartData[] = rawChartData.map((item, index) => ({
        categoryId: item.categoryId,
        categoryName: categories.find((c) => c.id === item.categoryId)?.name || 'Unknown',
        totalHours: item.totalHours,
        color: this.colors[index % this.colors.length],
      }));

      this.chartData.set(resolvedData);
    } catch (error) {
      console.error('Error loading pie chart data:', error);
      this.chartData.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  // Public method to refresh data (can be called from parent components)
  async refresh(): Promise<void> {
    await this.loadChartData();
  }
}
