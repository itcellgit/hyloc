# KPI/KAI Calculation System Implementation

## Overview
This implementation adds support for **computed (calculated) KPIs/KAIs** that are automatically calculated based on formulas using other KPI values as inputs.

## Features Implemented

### 1. **Database Schema Updates**
- Added `formula` column to store calculation formulas (TEXT)
- Added `source_kpi_value_ids` column to track dependencies (INTEGER[])
- Created indexes for performance optimization
- Added constraint to ensure computed KPIs have formulas

**Migration File**: `server/migrations/add-formula-columns.sql`

**To apply migration**:
```bash
# Using psql
psql -U postgres -d hyloc_db -f server/migrations/add-formula-columns.sql

# Or using your preferred PostgreSQL client
# Execute the SQL file directly in your database
```

### 2. **Backend Services**

#### KPI Calculation Service (`server/src/services/kpiCalculationService.js`)
- **calculateKPIValue()**: Calculates a computed KPI for specific month/year
- **recalculateDependentKPIs()**: Auto-recalculates all KPIs that depend on a changed value
- **calculateAllForEmployee()**: Batch calculate all computed KPIs for an employee
- **validateFormula()**: Validates formula syntax and dependencies
- **checkCircularDependency()**: Prevents circular reference issues

#### Enhanced Formula Evaluator (`server/src/utils/formulaEvaluator.js`)
**Supported Operations**:
- Basic arithmetic: `+`, `-`, `*`, `/`, `%`
- Functions: `AVERAGE()`, `SUM()`, `MIN()`, `MAX()`, `ROUND()`, `ABS()`, `IF()`
- Comparisons: `>`, `<`, `>=`, `<=`, `==`, `!=`
- KPI references: `v{kpi_value_id}` (e.g., `v1`, `v2`, `v15`)

**Example Formulas**:
```javascript
v2 * 100 / v1                    // Percentage calculation
AVERAGE(v1, v2, v3)              // Average of three values
IF(v1 > 100, v2 * 0.9, v2)      // Conditional discount
ROUND(v1 * v2, 2)                // Rounded multiplication
SUM(v1, v2, v3) / 3              // Sum divided by count
```

### 3. **Updated Backend Controllers**

#### KPI Value Controller
- **create()**: Now accepts `formula` and `source_kpi_value_ids`
- **update()**: Validates formulas when changing to computed type
- Validates formula syntax and dependencies before saving

#### Employee KPI Controller
- **submitKPIData()**: Automatically triggers recalculation of dependent KPIs
- When a manual KPI value is saved, all computed KPIs depending on it are recalculated
- Cascading calculations for nested dependencies

### 4. **Frontend Admin Interface (KmiDetail.js)**

**Formula Entry UI**:
- KPI Type selector: Manual or Computed
- **Reference Table**: Shows all available KPI values with their `v{id}` numbers
- **Formula Input**: Text field with syntax help and examples
- **Source Dependencies**: Checkboxes to select which KPI values the formula uses
- **Live Validation**: Shows which KPI IDs are referenced in the formula

**User Experience**:
1. Select "Computed" as KPI Type
2. See reference table showing all available KPIs with their v{id} numbers
3. Enter formula using those v{id} references
4. Check the boxes for all KPI values used in the formula
5. System validates formula before saving

### 5. **Employee Dashboard Updates (EmployeeDashboard.js)**

**Computed KPI Display**:
- Computed KPIs shown with distinctive green gradient background
- Formula displayed inline for transparency
- Values marked as "⚙️ Auto-calculated"
- Read-only display (no edit button)
- Target values still shown if applicable

### 6. **Styling**
- `FormulaStyles.css`: Comprehensive styling for formula UI
- Green-themed computed KPI cards
- Monospace font for formula display
- Reference table with sticky header
- Responsive design

## How to Use

### For Administrators (Adding Computed KPIs)

1. **Navigate to KMI Detail page**
2. **Click "Add KPI Value"**
3. **Select "Computed" as KPI Type**
4. **View the reference table** to see available KPI values and their IDs
5. **Enter the formula** using `v{id}` syntax:
   - Example: `v5 * 100 / v3` (calculate percentage)
6. **Select source dependencies** by checking the boxes
7. **Click Save**

### For Employees (Viewing Calculated Values)

1. **View your assigned KPIs** in Employee Dashboard
2. **Computed KPIs appear with green background**
3. **Values are automatically calculated** when you enter manual data
4. **Formula is displayed** for transparency
5. **No manual entry needed** - values update automatically

## Calculation Flow

```
Employee enters Manual KPI Data
           ↓
Backend saves actual value
           ↓
System identifies dependent computed KPIs
           ↓
For each dependent KPI:
  - Fetch source values for current month/year
  - Evaluate formula with actual values
  - Save calculated result
  - Recursively calculate KPIs depending on this result
           ↓
Employee sees updated computed values in dashboard
```

## Formula Examples

### Simple Calculations
```javascript
// Efficiency percentage
v2 * 100 / v1

// Total cost
v1 + v2 + v3

// Average rating
AVERAGE(v1, v2, v3, v4)
```

### Complex Calculations
```javascript
// Weighted average
(v1 * 0.5) + (v2 * 0.3) + (v3 * 0.2)

// Conditional pricing
IF(v1 > 1000, v2 * 0.9, v2)

// Performance score with rounding
ROUND((v1 + v2 + v3) / 3, 2)

// Min/Max calculations
MAX(v1, v2) - MIN(v3, v4)
```

### Advanced Formulas
```javascript
// Multi-level conditional
IF(v1 > 100, IF(v2 > 50, v3 * 1.2, v3), v3 * 0.8)

// Complex business logic
(SUM(v1, v2, v3) - v4) * 100 / MAX(v5, 1)

// Percentage change with safety
IF(v1 > 0, ((v2 - v1) / v1) * 100, 0)
```

## Error Handling

### Formula Validation
- ✅ Syntax check before saving
- ✅ Verify all referenced KPI IDs exist
- ✅ Check for circular dependencies
- ✅ Validate required dependencies are selected

### Calculation Safety
- Division by zero returns 0
- Missing values default to 0
- Invalid operations logged but don't crash
- Failed calculations don't prevent manual data entry

## API Endpoints Updated

### Create KPI Value with Formula
```http
POST /api/kpi-values
Content-Type: application/json

{
  "data": "Efficiency Rate",
  "kpi_id": 123,
  "kpi_type": "computed",
  "formula": "v5*100/v3",
  "source_kpi_value_ids": [5, 3],
  "data_operator": 12345,
  "target_required": true
}
```

### Submit Manual KPI Data (Triggers Calculations)
```http
POST /api/employees/kpi-data
Content-Type: application/json

{
  "kpiValueId": 5,
  "kpiId": 123,
  "empId": 12345,
  "month": 4,
  "year": 2024,
  "actualValue": 850
}
```

## Database Schema Changes

```sql
-- New columns in kpi_values table
ALTER TABLE kpi_values 
ADD COLUMN formula TEXT,
ADD COLUMN source_kpi_value_ids INTEGER[];

-- Indexes for performance
CREATE INDEX idx_kpi_values_type ON kpi_values(kpi_type);
CREATE INDEX idx_kpi_values_source_deps ON kpi_values USING gin(source_kpi_value_ids);

-- Unique constraint for monthly data
CREATE UNIQUE INDEX idx_kpi_data_value_unique 
ON kpi_data_value(kpi_value_id, month, year, value_type);
```

## Testing Checklist

### Backend
- [ ] Run database migration
- [ ] Restart server
- [ ] Test formula validation API
- [ ] Test computed KPI creation
- [ ] Test manual data entry triggers calculation
- [ ] Verify cascading calculations work

### Frontend
- [ ] Formula UI displays correctly
- [ ] Reference table shows all KPI values
- [ ] Formula validation works
- [ ] Computed KPIs show in employee dashboard
- [ ] Green styling appears correctly
- [ ] Manual KPIs still editable

## Troubleshooting

### Issue: "Formula is required for computed KPI"
**Solution**: Make sure to enter a formula when KPI type is "Computed"

### Issue: "Source KPI value IDs are required"
**Solution**: Check at least one KPI value in the dependencies section

### Issue: Calculated values not updating
**Solution**: 
1. Check that source KPIs have data for the same month/year
2. Verify formula syntax is correct
3. Check server logs for calculation errors

### Issue: Circular dependency detected
**Solution**: Review your formulas - KPI A cannot depend on KPI B if KPI B depends on KPI A (directly or indirectly)

## Performance Considerations

- Calculations run asynchronously when manual data is saved
- Cascading calculations processed sequentially to maintain data integrity
- Database indexes optimize lookup of dependent KPIs
- Failed calculations logged but don't block the main operation

## Future Enhancements

- [ ] Add formula builder UI with drag-and-drop
- [ ] Support for date-based calculations (YTD, QTD)
- [ ] Historical comparison formulas
- [ ] External data source integration
- [ ] Formula templates library
- [ ] Bulk recalculation tool for admins
- [ ] Calculation audit log
- [ ] Formula testing/preview feature

## Support

For issues or questions about the calculation system, check:
1. Server logs: `server/logs/`
2. Browser console for frontend errors
3. Database logs for query issues
4. This documentation for formula syntax

---

**Version**: 1.0
**Last Updated**: January 16, 2026
**Implemented By**: AI Assistant
