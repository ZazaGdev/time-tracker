// Angular Core
import { Component, OnInit, signal, ViewChild, effect } from '@angular/core';

// Angular Common
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

// Third-party Libraries
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
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
  ApexTheme,
  ApexGrid,
} from 'ng-apexcharts';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

// Application Services
import { ReportService, TaxonomyService } from '../../core/services';
import { StackedChartData, DateRangeFilter } from '../../core/services/report.service';

// Application Models
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
  theme: ApexTheme;
  grid: ApexGrid;
}

@Component({
  selector: 'app-hours-chart',
  standalone: true,
  imports: [
    // Angular Common
    CommonModule,
    FormsModule,

    // Angular Material
    MatCardModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,

    // Third-party
    NgApexchartsModule,
  ],
  templateUrl: './hours-chart.component.html',
  styleUrls: ['./hours-chart.component.scss'],
})
export class HoursChartComponent implements OnInit {
  @ViewChild('chart', { static: false }) chart: ChartComponent | undefined;

  // Component state
  startDate: Date = new Date();
  endDate: Date = new Date();
  chartData = signal<StackedChartData[]>([]);
  loading = signal<boolean>(false);

  // Chart configuration
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
    theme: {
      mode: 'light',
      palette: 'palette1',
    },
    grid: {
      borderColor: '#e7e7e7',
      row: {
        colors: ['transparent', 'transparent'],
        opacity: 0.5,
      },
    },
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

  // Get light mode colors
  private getLightModeColors(): string[] {
    return [
      '#6200EE', // Material Purple 500
      '#018786', // Material Teal 700
      '#B00020', // Material Red 700
      '#1976D2', // Material Blue 700
      '#388E3C', // Material Green 700
      '#F57C00', // Material Orange 700
      '#7B1FA2', // Material Purple 700
      '#303F9F', // Material Indigo 700
      '#5D4037', // Material Brown 700
      '#455A64', // Material Blue Grey 700
    ];
  }

  // Get grid theme configuration
  private getGridTheme(isDark: boolean): any {
    return {
      borderColor: isDark ? '#424242' : '#e7e7e7',
      row: {
        colors: ['transparent', 'transparent'],
        opacity: 0.5,
      },
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    };
  }
}
