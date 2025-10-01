// Angular Core
import {
  Component,
  OnInit,
  signal,
  ViewChild,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';

// Angular Common
import { CommonModule } from '@angular/common';

// Angular Material
import { MatCardModule } from '@angular/material/card';

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

    // Angular Material
    MatCardModule,

    // Third-party
    NgApexchartsModule,
  ],
  templateUrl: './hours-chart.component.html',
  styleUrls: ['./hours-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoursChartComponent implements OnInit {
  @ViewChild('chart', { static: false }) chart: ChartComponent | undefined;

  // Component state
  startDate: Date = new Date();
  endDate: Date = new Date();
  chartData = signal<StackedChartData[]>([]);
  loading = signal<boolean>(false);

  // Current period for coordination with parent
  currentPeriod: 'daily' | 'weekly' | 'monthly' = 'weekly';
  currentDate: Date = new Date();

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
    // Set default date range to this week and period
    this.currentPeriod = 'weekly';
    this.currentDate = new Date();
    const today = new Date();
    this.startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    this.endDate = endOfWeek(today, { weekStartsOn: 1 });
  }

  ngOnInit(): void {
    // Use setTimeout to ensure the chart is initialized after view
    setTimeout(() => {
      this.loadChartData();
    }, 100);
  }

  async loadChartData(): Promise<void> {
    if (!this.startDate || !this.endDate) return;

    this.loading.set(true);
    console.log('🔄 Loading chart data for range:', this.startDate, 'to', this.endDate);

    try {
      // Get stacked chart data from service
      const dateRange: DateRangeFilter = {
        startDate: this.startDate,
        endDate: this.endDate,
      };

      const rawChartData = await this.reportService.getStackedChartData(dateRange);
      console.log('📊 Raw chart data received:', rawChartData.length, 'days', rawChartData);

      // Get categories to resolve names and colors
      const categories = await this.taxonomyService.getCategories();
      console.log('🏷️ Categories loaded:', categories.length, categories);

      // Resolve category names in the data
      const resolvedData: StackedChartData[] = rawChartData.map((dayData) => ({
        ...dayData,
        categories: dayData.categories.map((cat) => ({
          ...cat,
          categoryName: categories.find((c) => c.id === cat.categoryId)?.name || 'Unknown',
        })),
      }));

      console.log('✅ Resolved chart data:', resolvedData);
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
    console.log('📈 Updating chart with data:', data.length, 'days');

    if (data.length === 0) {
      console.log('⚠️ No data to display in chart');
      // Use updateOptions to prevent chart recreation
      if (this.chart) {
        this.chart.updateOptions(
          {
            series: [],
            xaxis: { categories: [] },
          },
          false
        );
      }
      return;
    }

    // Get all unique categories across all dates
    const allCategories = new Set<number>();
    data.forEach((dayData) => {
      dayData.categories.forEach((cat) => {
        allCategories.add(cat.categoryId);
      });
    });
    console.log('🏷️ Found categories in data:', Array.from(allCategories));

    // Create series for each category
    const series: ApexAxisChartSeries = Array.from(allCategories).map((categoryId) => {
      const category = categories.find((c) => c.id === categoryId);
      const categoryName = category?.name || 'Unknown';

      const seriesData = data.map((dayData) => {
        const categoryData = dayData.categories.find((cat) => cat.categoryId === categoryId);
        return categoryData ? categoryData.hours : 0;
      });

      console.log(`📊 Series for ${categoryName}:`, seriesData);

      return {
        name: categoryName,
        data: seriesData,
      };
    });

    // Format dates properly for X-axis
    const formattedCategories = data.map((dayData) => {
      const date = new Date(dayData.date);
      const dayName = format(date, 'EEE'); // Mon, Tue, Wed
      const dateStr = format(date, 'MM/dd'); // 01/09
      return `${dayName} ${dateStr}`;
    });
    console.log('📅 X-axis categories:', formattedCategories);

    // Use updateOptions to prevent flickering
    console.log(
      '🎯 Updating chart with series:',
      series.length,
      'series and',
      formattedCategories.length,
      'categories'
    );

    if (this.chart) {
      this.chart.updateOptions(
        {
          series,
          xaxis: {
            categories: formattedCategories,
            title: { text: 'Date' },
            labels: {
              rotate: -45,
              style: {
                fontSize: '12px',
              },
            },
          },
        },
        false
      );
      console.log('✅ Chart updated successfully');
    } else {
      // Fallback for initial load
      console.log('📊 Setting initial chart options');
      this.chartOptions = {
        ...this.chartOptions,
        series,
        xaxis: {
          ...this.chartOptions.xaxis,
          categories: formattedCategories,
        },
      };
    }
  }

  // Public method to refresh data (can be called from parent components)
  async refresh(): Promise<void> {
    await this.loadChartData();
  }

  // Public method to update period and date from parent
  async updatePeriod(period: 'daily' | 'weekly' | 'monthly', date: Date): Promise<void> {
    // Check if the period and date are actually different to avoid unnecessary updates
    const newStartDate = this.calculateStartDate(period, date);
    const newEndDate = this.calculateEndDate(period, date);

    if (
      this.currentPeriod === period &&
      this.startDate.getTime() === newStartDate.getTime() &&
      this.endDate.getTime() === newEndDate.getTime()
    ) {
      // No change needed
      return;
    }

    this.currentPeriod = period;
    this.currentDate = date;
    this.startDate = newStartDate;
    this.endDate = newEndDate;

    await this.loadChartData();
  }

  private calculateStartDate(period: 'daily' | 'weekly' | 'monthly', date: Date): Date {
    switch (period) {
      case 'daily':
        return new Date(date);
      case 'weekly':
        return startOfWeek(date, { weekStartsOn: 1 }); // Monday
      case 'monthly':
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }
  }

  private calculateEndDate(period: 'daily' | 'weekly' | 'monthly', date: Date): Date {
    switch (period) {
      case 'daily':
        return new Date(date);
      case 'weekly':
        return endOfWeek(date, { weekStartsOn: 1 });
      case 'monthly':
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }
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
