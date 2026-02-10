# KMI Replication Feature Documentation

## Overview
This feature allows administrators to replicate KMI structures from a previous financial year to a new financial year, saving time when creating similar KMI hierarchies across fiscal periods.

## Key Features
- ✅ View KMI structure from any previous financial year
- ✅ Select specific KMIs to replicate (parent selection auto-selects children)
- ✅ See hierarchical view with expandable/collapsible nodes
- ✅ Replicate KMI structure WITHOUT data points (scores, values, etc.)
- ✅ Preserve department and employee mappings
- ✅ Automatic parent reference mapping for hierarchical KPIs

## UI Changes

### 1. Page Header
- **Added:** "Replicate from Previous Year" button next to "Add KMI" button
- **Icon:** 📋 (clipboard icon)
- **Location:** Top right of KMIs page

### 2. Replicate Modal
- **Size:** Large modal (800px max width, 80vh max height)
- **Content:**
  - Information section with guidelines
  - Tree view of KMIs from selected previous year
  - Checkboxes for selecting KMIs
  - Selection counter showing number of selected KMIs

### 3. Tree Node Selection
- **Checkbox:** Each KMI node has a checkbox
- **Behavior:** 
  - Selecting a parent automatically selects all children
  - Deselecting a parent deselects all children
  - Expandable/collapsible nodes to show hierarchy
  - Visual indication of selection status

## Frontend Implementation

### State Management (Kmis.js)
```javascript
const [showReplicateModal, setShowReplicateModal] = useState(false);
const [replicateFromYear, setReplicateFromYear] = useState('');
const [previousYearKpis, setPreviousYearKpis] = useState([]);
const [previousYearTree, setPreviousYearTree] = useState([]);
const [selectedKpisToReplicate, setSelectedKpisToReplicate] = useState(new Set());
const [replicateLoading, setReplicateLoading] = useState(false);
const [replicateExpandedNodes, setReplicateExpandedNodes] = useState(new Set());
```

### Key Functions
1. **handleOpenReplicateModal()**: Opens modal and loads KMIs from previous year
2. **loadPreviousYearKpis()**: Fetches KPI data for selected previous year
3. **toggleReplicateNodeExpand()**: Expands/collapses tree nodes
4. **toggleReplicateNodeSelection()**: Handles checkbox selection logic
5. **handleReplicateKmis()**: Processes replication with ID mapping

### Replication Process
```
1. User selects KMIs to replicate
2. Sort KPIs by depth (top-level first)
3. For each selected KPI:
   a. Create new KPI with same title, fin_year, category_id
   b. Map old parent_kpi_id to new parent_kpi_id using idMapping
   c. Store new KPI ID in idMapping
   d. Replicate department mappings (if exists)
   e. Replicate employee mappings (if exists)
4. Show success notification
5. Refresh KPI tree
```

## Backend API Endpoints

### Existing Endpoints (Used)
- `GET /kpis` - Fetch all KPIs
- `POST /kpis` - Create new KPI
- `GET /kpi-departments?kpi_id=` - Fetch department mappings
- `POST /kpi-departments` - Create department mapping
- `GET /kpi-employees?kpi_id=` - Fetch employee mappings
- `POST /kpi-employees` - Create employee mapping

### Database Modifications Required

#### No schema changes needed!
- Existing KPI table structure supports replication
- Just create new records with new fin_year

#### Data Considerations
1. **Only copy structure:** 
   - Copy: id, title, fin_year, category_id, parent_kpi_id
   - Do NOT copy: scores, values, data points, actual_value, target_value

2. **Parent Reference Mapping:**
   - Use Map to store old_id → new_id mappings
   - Update parent_kpi_id references during creation
   - Ensures hierarchy is preserved

3. **Department/Employee Mappings:**
   - Fetch existing mappings for old KPI ID
   - Create new mappings with new KPI ID
   - Use same department_id and emp_id values

## Implementation Steps

### Frontend (✅ Completed)
1. Add state variables for replication modal
2. Add "Replicate from Previous Year" button
3. Create replicate modal component with tree view
4. Implement checkbox selection logic with parent-child relationships
5. Add styling for replicate modal and tree nodes
6. Implement replication handler with ID mapping

### Backend (⚠️ TO DO - If Additional Endpoints Needed)
The current implementation uses existing endpoints:
- `GET /kpis` - Already fetches all KPIs, filter by fin_year on frontend
- `POST /kpis` - Creates single KPI, call in loop
- `GET /kpi-departments` - Fetch mappings
- `POST /kpi-departments` - Create mappings
- `GET /kpi-employees` - Fetch mappings  
- `POST /kpi-employees` - Create mappings

### Optional Backend Optimization
You can create a batch endpoint for faster replication:
```
POST /kpis/replicate-from-year
Body: {
  sourceYear: "2024-25",
  targetYear: "2025-26",
  selectedKpiIds: [1, 2, 3, ...]
}
Response: {
  success: true,
  replicated_count: 10,
  id_mapping: { old_id: new_id, ... }
}
```

## Data Safety
- ✅ No data points are copied (only structure)
- ✅ New KPIs have new IDs (no conflicts)
- ✅ Previous year data remains unchanged
- ✅ Can be repeated for same year without duplicates (user must choose which to replicate)

## Error Handling
- Shows error if no previous years available
- Shows error if replication API call fails
- Allows retry without losing selections
- Graceful handling of partial failures (e.g., one mapping fails)

## User Experience
1. Click "Replicate from Previous Year" button
2. Modal opens with previous year KMI tree
3. User expands nodes to see hierarchy
4. User selects KMIs using checkboxes
5. Parent selection auto-selects children
6. Click "Replicate Selected KMIs" button
7. Success notification shows number replicated
8. Page refreshes to show new KMIs

## Testing Checklist
- [ ] Verify modal opens with correct previous year data
- [ ] Test checkbox selection (single KPI)
- [ ] Test parent selection (auto-selects children)
- [ ] Test parent deselection (auto-deselects children)
- [ ] Test tree expand/collapse
- [ ] Test replication of single KMI
- [ ] Test replication of KMI hierarchy
- [ ] Verify new KPIs created with correct data
- [ ] Verify parent-child relationships maintained
- [ ] Verify department mappings replicated
- [ ] Verify employee mappings replicated
- [ ] Verify NO data points copied
- [ ] Verify error handling (no previous years)
- [ ] Test on responsive screen sizes

## Files Modified
1. `/client/src/pages/Kmis.js` - Main component with replication logic
2. `/client/src/styles/Kmis.css` - New styles for replicate modal

## CSS Classes Added
- `.header-buttons` - Container for header buttons
- `.btn-secondary` - Secondary button style (gray)
- `.large-modal` - Larger modal size for replication
- `.modal-body` - Scrollable modal content area
- `.replicate-info` - Information section styling
- `.replicate-tree-container` - Tree container styling
- `.replicate-kpi-node` - Individual tree node
- `.replicate-kpi-node-header` - Node header with checkbox
- `.replicate-node-left` - Left section (checkbox + expand button)
- `.node-checkbox` - Checkbox styling
- `.replicate-kpi-node-body` - Node content section
- `.replicate-kpi-children` - Children container
- `.selection-summary` - Counter text styling

## Notes
- The feature automatically handles complex hierarchies
- Parent-child references are correctly mapped to new IDs
- Department and Employee KPI mappings are preserved
- Data points/scores are NOT copied (as requested)
- Can be repeated multiple times for the same target year by selecting different source KMIs
