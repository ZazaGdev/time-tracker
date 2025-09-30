import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { FormsModule } from '@angular/forms';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexLegend,
  ApexFill,
  ApexTooltip,
  ApexStroke,
} from 'ng-apexcharts';
import { ReportService, TaxonomyService } from '../../core/services';
import { StackedChartData, DateRangeFilter } from '../../core/services/report.service';
import { startOfWeek, endOfWeek, subWeeks, format, addDays } from 'date-fns';
import { Category } from '../../core/models';

export interface ChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  legend: ApexLegend;
  fill: ApexFill;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  colors: string[];
}

@Component({
  selector: 'app-hours-chart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    NgApexchartsModule,
    FormsModule,
  ],
  template: `
    <mat-card class="hours-chart-card">
      <mat-card-header>
        <mat-card-title>Hours by Date and Category</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <!-- Date Range Filters -->
        <div class="filters-container">
          <div class="date-filters">
            <mat-form-field appearance="outline">
              <mat-label>Start Date</mat-label>
              <input
                matInput
                [matDatepicker]="startPicker"
                [(ngModel)]="startDate"
                (ngModelChange)="onDateRangeChange()"
              />
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>End Date</mat-label>
              <input
                matInput
                [matDatepicker]="endPicker"
                [(ngModel)]="endDate"
                (ngModelChange)="onDateRangeChange()"
              />
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>
          </div>

          <div class="quick-filters">
            <button mat-button (click)="setQuickRange('thisWeek')">This Week</button>
            <button mat-button (click)="setQuickRange('lastWeek')">Last Week</button>
            <button mat-button (click)="setQuickRange('last2weeks')">Last 2 Weeks</button>
            <button mat-button (click)="setQuickRange('lastMonth')">Last Month</button>
          </div>
        </div>

        <!-- Chart -->
        <div class="chart-container">
          <apx-chart
            #chart
            [series]="chartOptions.series"
            [chart]="chartOptions.chart"
            [xaxis]="chartOptions.xaxis"
            [yaxis]="chartOptions.yaxis"
            [dataLabels]="chartOptions.dataLabels"
            [plotOptions]="chartOptions.plotOptions"
            [legend]="chartOptions.legend"
            [fill]="chartOptions.fill"
            [tooltip]="chartOptions.tooltip"
            [stroke]="chartOptions.stroke"
            [colors]="chartOptions.colors"
          ></apx-chart>
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

      .filters-container {
        margin-bottom: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .date-filters {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;

        mat-form-field {
          min-width: 200px;
        }
      }

      .quick-filters {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        button {
          border: 1px solid #ddd;
        }
      }

      .chart-container {
        width: 100%;
        height: 400px;
        position: relative;
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

      @media (max-width: 768px) {
        .date-filters,
        .quick-filters {
          flex-direction: column;
        }

        .date-filters mat-form-field {
          min-width: unset;
          width: 100%;
        }
      }
    `,
  ],
})
export class HoursChartComponent implements OnInit {
  @ViewChild('chart', { static: false }) chart: ChartComponent | undefined;

  startDate: Date = new Date();
  endDate: Date = new Date();

  chartData = signal<StackedChartData[]>([]);
  loading = signal<boolean>(false);

  chartOptions: ChartOptions = {
    series: [],
    chart: {
      type: 'bar',
      height: 350,
      stacked: true,
      toolbar: {
        show: true,
      },
      zoom: {
        enabled: true,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
      },
    },
    xaxis: {
      categories: [],
      title: {
        text: 'Date',
      },
    },
    yaxis: {
      title: {
        text: 'Hours',
      },
      labels: {
        formatter: (val: number) => {
          return val.toFixed(1) + 'h';
        },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      offsetX: 40,
    },
    fill: {
      opacity: 1,
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      y: {
        formatter: (val: number) => {
          return val.toFixed(2) + ' hours';
        },
      },
    },
    stroke: {
      show: true,
      width: 1,
      colors: ['transparent'],
    },
    colors: [
      '#008FFB',
      '#00E396',
      '#FEB019',
      '#FF4560',
      '#775DD0',
      '#546E7A',
      '#26a69a',
      '#D10CE8',
      '#FF9800',
      '#607D8B',
    ],
  };

  constructor(private reportService: ReportService, private taxonomyService: TaxonomyService) {
    // Set default date range to this week
    this.setQuickRange('thisWeek');
  }

  ngOnInit(): void {
    this.loadChartData();
  }

  setQuickRange(range: string): void {
    const today = new Date();

    switch (range) {
      case 'thisWeek':
        this.startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        this.endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'lastWeek':
        const lastWeek = subWeeks(today, 1);
        this.startDate = startOfWeek(lastWeek, { weekStartsOn: 1 });
        this.endDate = endOfWeek(lastWeek, { weekStartsOn: 1 });
        break;
      case 'last2weeks':
        this.startDate = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        this.endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'lastMonth':
        this.startDate = subWeeks(today, 4);
        this.endDate = today;
        break;
    }

    this.onDateRangeChange();
  }

  onDateRangeChange(): void {
    if (this.startDate && this.endDate && this.startDate <= this.endDate) {
      this.loadChartData();
    }
  }

  async loadChartData(): Promise<void> {
    if (!this.startDate || !this.endDate) return;

    this.loading.set(true);

    try {
      // Get stacked chart data from service
      const dateRange: DateRangeFilter = {
        startDate: this.startDate,
        endDate: this.endDate,
      };

      const rawChartData = await this.reportService.getStackedChartData(dateRange);

      // Get categories to resolve names and colors
      const categories = await this.taxonomyService.getCategories();

      // Resolve category names in the data
      const resolvedData: StackedChartData[] = rawChartData.map((dayData) => ({
        ...dayData,
        categories: dayData.categories.map((cat) => ({
          ...cat,
          categoryName: categories.find((c) => c.id === cat.categoryId)?.name || 'Unknown',
        })),
      }));

      this.chartData.set(resolvedData);
      this.updateChart(resolvedData, categories);
    } catch (error) {
      console.error('Error loading chart data:', error);
      this.chartData.set([]);
      this.updateChart([], []);
    } finally {
      this.loading.set(false);
    }
  }

  private updateChart(data: StackedChartData[], categories: Category[]): void {
    if (data.length === 0) {
      this.chartOptions = {
        ...this.chartOptions,
        series: [],
        xaxis: {
          ...this.chartOptions.xaxis,
          categories: [],
        },
      };
      return;
    }

    // Get all unique categories across all dates
    const allCategories = new Set<number>();
    data.forEach((dayData) => {
      dayData.categories.forEach((cat) => {
        allCategories.add(cat.categoryId);
      });
    });

    // Create series for each category
    const series: ApexAxisChartSeries = Array.from(allCategories).map((categoryId) => {
      const category = categories.find((c) => c.id === categoryId);
      const categoryName = category?.name || 'Unknown';

      const seriesData = data.map((dayData) => {
        const categoryData = dayData.categories.find((cat) => cat.categoryId === categoryId);
        return categoryData ? categoryData.hours : 0;
      });

      return {
        name: categoryName,
        data: seriesData,
      };
    });

    // Update chart options
    this.chartOptions = {
      ...this.chartOptions,
      series,
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: data.map((dayData) => format(new Date(dayData.date), 'MMM dd')),
      },
    };
  }

  // Public method to refresh data (can be called from parent components)
  async refresh(): Promise<void> {
    await this.loadChartData();
  }
}
