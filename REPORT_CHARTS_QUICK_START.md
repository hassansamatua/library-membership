# Report Charts Quick Start Guide

## How to Use the Enhanced Reports with Charts

### 1. **Generate a Report**
- Navigate to `/admin/reports`
- Click "Generate Report" or select a report template
- Choose your date range (optional)
- Click "Generate"

### 2. **View Suggested Charts** (Automatic)
When the report loads, you'll see **Suggested Visualizations** at the top:
- Each report type has 4 pre-configured chart suggestions
- Click any chart tile to view it fullscreen
- Charts are sorted by relevance to that report type

### 3. **Create Custom Charts**
Below the suggestions, there's a **Custom Visualization** section:
1. Select a field from the dropdown
2. Choose chart type: Bar, Pie, or Line
3. Chart updates automatically

## Chart Types by Report

### 📊 Payment Reports Show:
```
Suggested Charts:
  • Pie: Paid vs Pending/Overdue status distribution
  • Bar: Payment Methods Trend (which methods are popular)
  • Bar: Payments by Membership Type (subscription breakdown)
  • Line: Payment Amounts Trend (revenue trends)
```

### 📅 Event Reports Show:
```
Suggested Charts:
  • Bar: Registration by Event (which events are popular)
  • Pie: Event Status Distribution (scheduled vs completed)
  • Bar: Events by Attendance (capacity analysis)
  • Bar: Events by Location (geographic distribution)
```

### 👥 User Reports Show:
```
Suggested Charts:
  • Pie: Users by Membership Type
  • Pie: User Status Distribution (active vs inactive)
  • Line: Registration Trend Over Time (growth chart)
```

### 💳 Membership Reports Show:
```
Suggested Charts:
  • Pie: Active vs Inactive Members (health check)
  • Pie: Membership Types Distribution
  • Bar: Payment History by Member (renewal tracking)
```

### 📈 Activity Reports Show:
```
Suggested Charts:
  • Bar: User Logins (daily active users)
  • Bar: Page Views Distribution (popular pages)
  • Bar: User Actions (engagement metrics)
  • Line: Session Duration Trend (user satisfaction)
```

## Data Analysis Tips

### For Payment Analysis
1. Look at "Paid vs Pending" pie chart to see payment health
2. Check "Payment Methods Trend" to understand customer preferences
3. Compare "Membership Type" to identify revenue patterns

### For Event Planning
1. View "Registration by Event" to identify popular events
2. Check "Events by Attendance" to find underperforming events
3. Analyze location distribution for expansion planning

### For Membership Health
1. Check "Active vs Inactive" ratio first (should be 70%+ active)
2. Review membership type breakdown
3. Analyze payment history to predict renewals

### For User Growth
1. Monitor registration trend over time
2. Check status distribution (ideally 80%+ active)
3. Analyze membership type adoption

### For Platform Engagement
1. Monitor login trends
2. Track page views to identify navigation issues
3. Analyze session duration for UX improvements

## Best Practices

✅ **DO:**
- Generate reports with at least 30 days of data for trends
- Use suggested charts first (they're optimized for the data)
- Combine multiple charts for comprehensive analysis
- Monitor monthly trends to identify patterns

❌ **DON'T:**
- Rely on single data points (use trends)
- Ignore pie charts showing imbalanced distributions
- Forget to filter by date range for relevant analysis
- Compare incompatible metrics

## Keyboard Shortcuts
- `Esc` - Close chart modal
- Click suggested chart - Load chart fullscreen
- Select field → Select type - Instant chart generation

## Export Options
- Download individual chart as image (future feature)
- Export report data as CSV (in table below charts)
- Print formatted report with charts

---

For more details, see [REPORT_ENHANCEMENTS.md](./REPORT_ENHANCEMENTS.md)
