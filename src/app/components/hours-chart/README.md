# Hours Chart Component

A reusable Angular standalone component for displaying time tracking data as a bar chart.

## Usage

```html
<app-hours-chart [date]="selectedDate" [period]="'daily'" #chartRef> </app-hours-chart>
```

## Inputs

- `date: Date` - The date for which to display data (required)
- `period: ReportPeriod` - The time period: 'daily', 'weekly', or 'monthly' (default: 'daily')

## Features

- **Standalone Component**: Can be used anywhere in the app without additional module imports
- **Chart.js Integration**: Uses Chart.js for rendering responsive bar charts
- **Automatic Data Loading**: Fetches and aggregates data based on date and period
- **Category Resolution**: Automatically resolves category IDs to names
- **Color-coded**: Uses different colors for each category bar
- **Responsive Design**: Adapts to container size
- **Loading States**: Shows loading and no-data states appropriately

## Methods

### `refresh(): Promise<void>`

Manually refresh the chart data. Useful when data changes externally.

```typescript
@ViewChild('chartRef') chartRef!: HoursChartComponent;

async onDataChanged() {
  await this.chartRef.refresh();
}
```

## Example Usage

### Simple Daily Chart (Home Page)

```typescript
export class HomePage {
  today = new Date();
}
```

```html
<app-hours-chart [date]="today" period="daily"></app-hours-chart>
```

### Interactive Chart with Period Selection (Reports Page)

```typescript
export class ReportsPage {
  selectedDate = signal(new Date());
  selectedPeriod = signal<ReportPeriod>('daily');

  @ViewChild('hoursChart') hoursChart!: HoursChartComponent;

  async onPeriodChange(period: ReportPeriod) {
    this.selectedPeriod.set(period);
    this.hoursChart.period = period;
    await this.hoursChart.refresh();
  }
}
```

```html
<app-hours-chart #hoursChart [date]="selectedDate()" [period]="selectedPeriod()"> </app-hours-chart>
```

## Dependencies

- Chart.js
- Angular Material (MatCardModule)
- ReportService (for data aggregation)
- TaxonomyService (for category name resolution)

## Styling

The component includes built-in styles for:

- Card container with Material Design shadow
- 400px height chart container
- Loading and no-data states
- Responsive canvas sizing

Custom styling can be applied by targeting the `app-hours-chart` selector:

```scss
app-hours-chart {
  .hours-chart-card {
    margin: 16px 0;
  }
}
```
