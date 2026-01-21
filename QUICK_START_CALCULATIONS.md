# KPI Calculation System - Quick Start Guide

## 🚀 Installation Steps

### 1. Run Database Migration
```bash
# Windows
cd server
run-migration.bat

# Linux/Mac
cd server
chmod +x run-migration.sh
./run-migration.sh
```

Or manually:
```bash
psql -U postgres -d hyloc_db -f server/migrations/add-formula-columns.sql
```

### 2. Restart Server
```bash
cd server
npm run dev
```

### 3. Restart Client
```bash
cd client
npm start
```

## 📝 Creating a Computed KPI (Admin)

### Step 1: Navigate to KMI Detail Page
Click on any KMI/KPI to view its details

### Step 2: Click "Add KPI Value"
Look for the blue "+ Add KPI Value" button

### Step 3: Configure the Computed KPI

**Basic Information:**
- **Data**: Name of the calculated metric (e.g., "Efficiency Rate")
- **KPI Type**: Select **"Computed"** from dropdown

**Formula Configuration:**
- **Reference Table** appears showing available KPIs:
  ```
  | Use in Formula | KPI Value Name        | Type   |
  |----------------|-----------------------|--------|
  | v5             | Total Production      | manual |
  | v3             | Target Production     | manual |
  | v8             | Defect Count         | manual |
  ```

- **Enter Formula**: Use the v{id} numbers from reference table
  ```
  v5 * 100 / v3
  ```

- **Select Dependencies**: Check boxes for v5 and v3

### Step 4: Assign to Employee
- Select the employee who will see this calculated value
- Choose unit of measurement if needed
- Set if target is required

### Step 5: Save
System validates formula and saves the computed KPI

## 👁️ Viewing Computed KPIs (Employee)

### What Employees See:

**Manual KPIs** (Blue/White cards):
```
┌─────────────────────────┐
│ April                   │
│                         │
│ Target: 1000            │
│ Actual: 850             │
│                         │
│ [Edit] [Add Data]       │
└─────────────────────────┘
```

**Computed KPIs** (Green cards):
```
┌─────────────────────────┐
│ April                   │
│                         │
│ Calculated: 85%         │
│                         │
│ ⚙️ Auto-calculated      │
└─────────────────────────┘
```

### How It Works:
1. Employee enters "Actual: 850" for Total Production (v5)
2. Employee enters "Actual: 1000" for Target Production (v3)
3. System automatically calculates: 850 * 100 / 1000 = **85%**
4. Result appears instantly in Efficiency Rate KPI

## 📊 Formula Examples

### Basic Calculations

**Percentage:**
```javascript
Formula: v2 * 100 / v1
Example: 850 * 100 / 1000 = 85%
Use: Efficiency, completion rate, success rate
```

**Sum:**
```javascript
Formula: v1 + v2 + v3
Example: 100 + 150 + 200 = 450
Use: Total costs, combined metrics
```

**Average:**
```javascript
Formula: AVERAGE(v1, v2, v3)
Example: AVERAGE(80, 90, 85) = 85
Use: Average rating, mean score
```

### Advanced Calculations

**Weighted Average:**
```javascript
Formula: (v1 * 0.5) + (v2 * 0.3) + (v3 * 0.2)
Example: (80 * 0.5) + (90 * 0.3) + (70 * 0.2) = 81
Use: Weighted scores, priority-based metrics
```

**Conditional Logic:**
```javascript
Formula: IF(v1 > 100, v2 * 1.1, v2)
Example: IF(120 > 100, 50 * 1.1, 50) = 55
Use: Bonuses, discounts, tier-based calculations
```

**Rounded Calculations:**
```javascript
Formula: ROUND(v1 / v2, 2)
Example: ROUND(123.456 / 10, 2) = 12.35
Use: Currency, precise metrics
```

**Min/Max:**
```javascript
Formula: MAX(v1, v2) - MIN(v3, v4)
Example: MAX(100, 150) - MIN(20, 30) = 130
Use: Range calculations, spread analysis
```

## 🎯 Real-World Examples

### Manufacturing KPIs

**1. Overall Equipment Effectiveness (OEE)**
```javascript
KPIs needed:
- v1: Actual Production Time (manual)
- v2: Planned Production Time (manual)  
- v3: Good Units Produced (manual)
- v4: Total Units Produced (manual)

Formula: (v1/v2) * (v3/v4) * 100
Result: OEE percentage
```

**2. Defect Rate**
```javascript
KPIs needed:
- v5: Defective Units (manual)
- v6: Total Units (manual)

Formula: (v5 * 100) / v6
Result: Defect percentage
```

**3. Productivity Index**
```javascript
KPIs needed:
- v7: Units Produced (manual)
- v8: Labor Hours (manual)
- v9: Target Rate (manual)

Formula: (v7 / v8) / v9 * 100
Result: Productivity vs target
```

### Sales KPIs

**1. Conversion Rate**
```javascript
KPIs needed:
- v10: Closed Deals (manual)
- v11: Total Leads (manual)

Formula: v10 * 100 / v11
Result: Conversion percentage
```

**2. Average Deal Size**
```javascript
KPIs needed:
- v12: Total Revenue (manual)
- v13: Number of Deals (manual)

Formula: ROUND(v12 / v13, 2)
Result: Average revenue per deal
```

**3. Sales Growth**
```javascript
KPIs needed:
- v14: Current Month Sales (manual)
- v15: Previous Month Sales (manual)

Formula: ((v14 - v15) / v15) * 100
Result: Growth percentage
```

### Financial KPIs

**1. Profit Margin**
```javascript
KPIs needed:
- v16: Revenue (manual)
- v17: Costs (manual)

Formula: ((v16 - v17) / v16) * 100
Result: Profit margin percentage
```

**2. ROI**
```javascript
KPIs needed:
- v18: Net Profit (manual)
- v19: Investment Cost (manual)

Formula: ((v18 - v19) / v19) * 100
Result: Return on investment
```

## ⚠️ Common Issues & Solutions

### Issue: "Formula is required for computed KPI"
**Cause**: Selected "Computed" but didn't enter formula
**Solution**: Enter a formula like `v1 + v2` in the formula field

### Issue: "Source KPI value IDs are required"
**Cause**: Didn't select dependency checkboxes
**Solution**: Check the boxes for all v{id} numbers used in your formula

### Issue: Calculated value shows as "-"
**Cause**: Source data not entered yet for that month
**Solution**: Enter manual data for all source KPIs first

### Issue: "Circular dependency detected"
**Cause**: KPI A depends on KPI B which depends on KPI A
**Solution**: Restructure your formulas to avoid circular references

### Issue: Calculated value is 0
**Cause**: Division by zero or missing data
**Solution**: Check that denominator values are non-zero

## 🔧 Advanced Features

### Nested Calculations
You can create computed KPIs that depend on other computed KPIs:

```
Level 1 (Manual):
- v1: Revenue (manual)
- v2: Cost (manual)

Level 2 (Computed):
- v20: Profit = v1 - v2

Level 3 (Computed):
- v21: Profit Margin = (v20 / v1) * 100
```

System automatically calculates in the correct order!

### Conditional Tiers
```javascript
Formula: IF(v1 > 1000, IF(v1 > 5000, v2 * 1.2, v2 * 1.1), v2)
```
- If v1 > 5000: multiply v2 by 1.2
- Else if v1 > 1000: multiply v2 by 1.1
- Else: use v2 as-is

### Safety Checks
```javascript
Formula: IF(v1 > 0, v2 / v1, 0)
```
Prevents division by zero errors

## 📞 Need Help?

1. **Check the main documentation**: `KPI_CALCULATION_IMPLEMENTATION.md`
2. **View server logs**: Look for calculation errors
3. **Test your formula**: Use simple values first (1, 2, 3) to verify logic
4. **Start simple**: Begin with basic formulas then build complexity

---

**Quick Reference Card:**
```
Operators: + - * / %
Functions: AVERAGE, SUM, MIN, MAX, ROUND, ABS, IF
Syntax: v{number} (e.g., v1, v5, v10)
Example: v2 * 100 / v1
```

Happy Calculating! 🎉
