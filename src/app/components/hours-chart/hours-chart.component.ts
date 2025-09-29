import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { ReportService, TaxonomyService } from '../../core/services';
import { ReportPeriod } from '../../core/services/report.service';

export interface HoursChartData {
  categoryName: string;
  totalHours: number;
  categoryId: number;
}

@Component({
  selector: 'app-hours-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="hours-chart-card">
      <mat-card-header>
        <mat-card-title>Hours by Category - {{ periodLabel }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="chart-container" *ngIf="!loading() && chartData().length > 0">
          <canvas #chartCanvas></canvas>
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
      .hours-chart-card {
        margin-bottom: 24px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .chart-container {
        width: 100%;
        height: 400px;
        position: relative;

        canvas {
          max-width: 100%;
          height: 100%;
        }
      }

      .no-data,
      .loading {
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
export class HoursChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() date!: Date;
  @Input() period: ReportPeriod = 'daily';

  chartData = signal<HoursChartData[]>([]);
  loading = signal<boolean>(false);

  private chart: Chart | null = null;

  constructor(private reportService: ReportService, private taxonomyService: TaxonomyService) {
    // React to data changes
    effect(() => {
      const data = this.chartData();
      if (this.chart && data.length > 0) {
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

  ngAfterViewInit(): void {
    this.initializeChart();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
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
        return 'Daily';
    }
  }

  private initializeChart(): void {
    if (!this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Hours',
            data: [],
            backgroundColor: [
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 99, 132, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)',
              'rgba(199, 199, 199, 0.6)',
              'rgba(83, 102, 255, 0.6)',
            ],
            borderColor: [
              'rgba(54, 162, 235, 1)',
              'rgba(255, 99, 132, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(199, 199, 199, 1)',
              'rgba(83, 102, 255, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Hours',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Categories',
            },
          },
        },
        plugins: {
          title: {
            display: false, // We use the card title instead
          },
          legend: {
            display: false, // Single dataset, no legend needed
          },
        },
      },
    });

    // Load initial data if available
    const data = this.chartData();
    if (data.length > 0) {
      this.updateChart(data);
    }
  }

  private updateChart(data: HoursChartData[]): void {
    if (!this.chart) return;

    this.chart.data.labels = data.map((item) => item.categoryName);
    this.chart.data.datasets[0].data = data.map((item) => item.totalHours);
    this.chart.update();
  }

  async loadChartData(): Promise<void> {
    if (!this.date) return;

    this.loading.set(true);

    try {
      // Get chart data from service
      const rawChartData = await this.reportService.getChartData(this.date, this.period);

      // Get categories to resolve names
      const categories = await this.taxonomyService.getCategories();

      // Resolve category names
      const resolvedData: HoursChartData[] = rawChartData.map((item) => ({
        categoryId: item.categoryId,
        categoryName: categories.find((c) => c.id === item.categoryId)?.name || 'Unknown',
        totalHours: item.totalHours,
      }));

      this.chartData.set(resolvedData);
    } catch (error) {
      console.error('Error loading chart data:', error);
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
