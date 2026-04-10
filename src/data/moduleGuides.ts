import type { GuideStep } from '@/components/ModuleGuide';

export const moduleGuides: Record<string, { description: string; steps: GuideStep[] }> = {
  Projects: {
    description: 'Create, edit, and manage your construction projects. Invite team members with connection codes.',
    steps: [
      { title: 'Create a project', description: 'Click "Create Project" to start a new project with a unique connection code.' },
      { title: 'Share connection code', description: 'Share the 8-character code with team members so they can join.' },
      { title: 'Manage join requests', description: 'Approve or reject pending join requests from team members.' },
      { title: 'Edit or delete', description: 'Admins can edit project details or delete projects they created.' },
      { title: 'Assign Co-Admins', description: 'Promote members to Co-Admin role (max 3 per project) for shared management.' },
    ],
  },
  Dashboard: {
    description: 'Your project overview showing key metrics, charts, and pending approvals.',
    steps: [
      { title: 'View project KPIs', description: 'See overall progress, activity completion, procurement status and financial summaries at a glance.' },
      { title: 'Review pending approvals', description: 'If you are an Admin or Co-Admin, approve or reject data changes submitted by team members.' },
      { title: 'Navigate to modules', description: 'Click on any stat card to jump directly to that module for detailed data.' },
      { title: 'Switch projects', description: 'Use the project dropdown in the sidebar to switch between your projects.' },
    ],
  },
  Activities: {
    description: 'Plan and track project activities using Gantt charts, CPM network diagrams, and Primavera-style schedules.',
    steps: [
      { title: 'Add an activity', description: 'Click "+ Add" to create a new activity with WBS code, name, planned dates, and predecessors.' },
      { title: 'Switch views', description: 'Toggle between Gantt Chart, Table, CPM Diagram, Critical Path Flow, and Primavera Schedule views.' },
      { title: 'Track progress', description: 'Update percent complete and actual dates as work progresses. Critical activities are highlighted.' },
      { title: 'Export data', description: 'Use "Export XLS" to download the schedule for offline use or sharing.', tip: 'Link predecessors using WBS codes separated by commas.' },
    ],
  },
  'BOQ / Items': {
    description: 'Manage your Bill of Quantities with item codes, descriptions, units, quantities and rates.',
    steps: [
      { title: 'Add BOQ items', description: 'Click "+ Add" to enter items manually, or use "Import Excel" to bulk-upload from a spreadsheet.' },
      { title: 'Track execution', description: 'Update executed quantities as work is completed. The system calculates remaining and financial values.' },
      { title: 'Generate activities', description: 'Use AI to auto-generate a project schedule from your BOQ items.' },
      { title: 'Material analysis', description: 'Run AI material analysis to estimate required materials from your BOQ.', tip: 'Use "New Project" to clear all items and start fresh.' },
    ],
  },
  Inventory: {
    description: 'Track stock levels, receipts, issues, and minimum reorder levels for all materials.',
    steps: [
      { title: 'Add items', description: 'Enter material code, description, unit, opening stock, and minimum level.' },
      { title: 'Record movements', description: 'Update receipts (incoming) and issues (outgoing). Balance is calculated automatically.' },
      { title: 'Monitor alerts', description: 'Items at or below minimum level show as "Low Stock". Items with zero balance show "Out of Stock".' },
      { title: 'Set required quantities', description: 'Enter the total required quantity to track shortages against current balance.', tip: 'Export to Excel for detailed inventory reports.' },
    ],
  },
  'Daily Manpower': {
    description: 'Record daily labor deployment by trade, location, and supervisor.',
    steps: [
      { title: 'Create daily entry', description: 'Click "+ Add", select the date and location, then add trades with worker counts.' },
      { title: 'Add multiple trades', description: 'Use "+ Add Trade" to include all trades deployed that day. Select from the dropdown or type custom trades.' },
      { title: 'Review totals', description: 'The system auto-calculates total workers per entry.' },
      { title: 'Print reports', description: 'Use the print button to generate manpower deployment reports.' },
    ],
  },
  Equipment: {
    description: 'Log equipment usage, hours, fuel consumption, and maintenance issues.',
    steps: [
      { title: 'Register equipment', description: 'Add each piece of equipment with ID, name, operator, and ownership type.' },
      { title: 'Log daily usage', description: 'Record hours worked, fuel consumed, and the activity the equipment was used for.' },
      { title: 'Track issues', description: 'Note any breakdowns or maintenance needs in the issues field.' },
      { title: 'Attach photos', description: 'Upload equipment condition photos for documentation.', tip: 'Equipment entries sync with the Fuel Log module.' },
    ],
  },
  'Fuel Log': {
    description: 'Track fuel consumption, costs, and odometer readings for all equipment.',
    steps: [
      { title: 'Record fuel entry', description: 'Select the equipment, enter date, liters, cost, and odometer reading.' },
      { title: 'Monitor consumption', description: 'Review fuel usage trends across equipment to identify efficiency issues.' },
      { title: 'Export reports', description: 'Download fuel consumption data for accounting and analysis.' },
    ],
  },
  Safety: {
    description: 'Report and track safety incidents, near-misses, and observations.',
    steps: [
      { title: 'Report incident', description: 'Click "+ Add" and select the type: Incident, Near-Miss, or Observation.' },
      { title: 'Document details', description: 'Enter date, location, description, injured persons (if any), cause, and preventive measures.' },
      { title: 'Track trends', description: 'Review incident patterns by type and location to improve safety measures.' },
    ],
  },
  'Quality (ITP/NCR)': {
    description: 'Manage Inspection Test Plans and Non-Conformance Reports.',
    steps: [
      { title: 'Create ITP entries', description: 'Add inspection items with specifications, acceptance criteria, and inspection dates.' },
      { title: 'Log NCRs', description: 'Record non-conformances with root cause, corrective action, and follow-up dates.' },
      { title: 'Track status', description: 'Monitor open vs closed items and ensure all quality checks are completed.' },
    ],
  },
  Delays: {
    description: 'Register and track project delays, their causes, impacts, and recovery plans.',
    steps: [
      { title: 'Log a delay', description: 'Enter the affected activity, cause, duration (days), and impact description.' },
      { title: 'Plan recovery', description: 'Document the recovery plan and update status as mitigation progresses.' },
      { title: 'Monitor status', description: 'Track open, mitigated, and closed delays. Use this data for extension of time claims.' },
    ],
  },
  'Purchase Orders': {
    description: 'Create and track purchase orders for materials and services.',
    steps: [
      { title: 'Create PO', description: 'Enter PO number, supplier, item code, quantity, unit price, and delivery date.' },
      { title: 'Track status', description: 'Update PO status: Draft → Issued → Delivered → Closed.' },
      { title: 'Monitor spending', description: 'Review total order values and compare against budget.', tip: 'Link PO item codes to your inventory codes for seamless tracking.' },
    ],
  },
  'Daily Quantity': {
    description: 'Record daily executed quantities linked to BOQ items.',
    steps: [
      { title: 'Add daily record', description: 'Select the date, BOQ code, location, and enter the quantity executed.' },
      { title: 'Link to BOQ', description: 'Use the BOQ code to automatically link daily quantities to your Bill of Quantities.' },
      { title: 'Review progress', description: 'Track cumulative quantities against planned totals.' },
    ],
  },
  'Concrete Pour': {
    description: 'Log concrete pours with grade, volume, slump, temperature, and supplier details.',
    steps: [
      { title: 'Record pour', description: 'Enter date, location, concrete grade, volume, slump test result, and temperature.' },
      { title: 'Track supplier', description: 'Record which supplier provided the concrete for each pour.' },
      { title: 'Quality check', description: 'Note any issues or remarks about concrete quality.', tip: 'Ensure slump and temperature are within specification limits.' },
    ],
  },
  Welding: {
    description: 'Track welding activities, qualifications, and inspection results.',
    steps: [
      { title: 'Log weld', description: 'Enter welder ID, joint number, welding process, and inspection result.' },
      { title: 'Record inspections', description: 'Document visual, NDT, or destructive test results.' },
      { title: 'Track qualifications', description: 'Ensure welder qualifications are current and appropriate for the work.' },
    ],
  },
  'Key Staff': {
    description: 'Manage key project staff records and contact information.',
    steps: [
      { title: 'Add staff', description: 'Enter name, position, qualifications, and contact details for key personnel.' },
      { title: 'Track assignments', description: 'Record which staff are assigned to which areas or activities.' },
    ],
  },
  Subcontractors: {
    description: 'Manage subcontractor information, contracts, and performance.',
    steps: [
      { title: 'Register subcontractor', description: 'Enter company name, scope of work, contract value, and contact details.' },
      { title: 'Track performance', description: 'Monitor delivery, quality, and compliance for each subcontractor.' },
    ],
  },
  Tools: {
    description: 'Track tools and small equipment issued to teams or locations.',
    steps: [
      { title: 'Register tools', description: 'Add tool name, ID, condition, and assigned location or person.' },
      { title: 'Track movements', description: 'Record when tools are issued, returned, or moved between locations.' },
    ],
  },
  Photos: {
    description: 'Upload and organize project photos for documentation.',
    steps: [
      { title: 'Upload photos', description: 'Add photos with date, location, and description tags.' },
      { title: 'Organize by date/location', description: 'Browse photos filtered by date range or site area.' },
    ],
  },
  'Change Orders': {
    description: 'Track variation orders and scope changes with cost impact.',
    steps: [
      { title: 'Log change order', description: 'Enter CO number, description, reason, and cost/time impact.' },
      { title: 'Track approval', description: 'Update status as the change order moves through the approval process.' },
    ],
  },
  Documents: {
    description: 'Manage project documents, drawings, and submittals.',
    steps: [
      { title: 'Upload documents', description: 'Add documents with title, type, revision number, and status.' },
      { title: 'Track revisions', description: 'Maintain revision history and approval status for each document.' },
    ],
  },
  Bills: {
    description: 'Manage project bills, invoices, and payment tracking.',
    steps: [
      { title: 'Add bill', description: 'Enter bill number, supplier, amount, due date, and payment status.' },
      { title: 'Track payments', description: 'Update payment status and record actual payment dates.' },
    ],
  },
  'Procurement Plan': {
    description: 'Plan material procurement with required quantities, suppliers, and timelines.',
    steps: [
      { title: 'Add material', description: 'Enter material details, required quantity, preferred supplier, and delivery timeline.' },
      { title: 'Track procurement', description: 'Monitor order status from planning through delivery.' },
      { title: 'Analyze costs', description: 'Review unit rates and total costs across all procurement items.' },
    ],
  },
  'Procurement Tracker': {
    description: 'Track all procurement items from order to delivery.',
    steps: [
      { title: 'Monitor orders', description: 'View all active procurement items with their current status.' },
      { title: 'Track deliveries', description: 'Update expected and actual delivery dates.' },
      { title: 'Compare quantities', description: 'Check ordered vs received quantities to identify shortfalls.' },
    ],
  },
  'Supplier Performance': {
    description: 'Evaluate and compare supplier performance metrics.',
    steps: [
      { title: 'View ratings', description: 'See delivery performance, quality scores, and pricing competitiveness for each supplier.' },
      { title: 'Compare suppliers', description: 'Use charts to compare suppliers side by side.' },
    ],
  },
  Reports: {
    description: 'Generate and view project reports and analytics.',
    steps: [
      { title: 'Select report type', description: 'Choose from available report templates.' },
      { title: 'Generate report', description: 'Click generate to create the report with current data.' },
      { title: 'Export or print', description: 'Download as Excel or print the report.' },
    ],
  },
  Settings: {
    description: 'Configure your profile and application preferences.',
    steps: [
      { title: 'Update profile', description: 'Edit your name, phone, company, and avatar.' },
      { title: 'Fresh Start', description: 'Clear all project data to start completely fresh. A backup reminder will appear first.' },
    ],
  },
  'Backup / Restore': {
    description: 'Export all project data for backup or restore from a previous backup.',
    steps: [
      { title: 'Create backup', description: 'Click "Backup" to download a ZIP file containing all your project data.' },
      { title: 'Restore data', description: 'Upload a previously downloaded backup ZIP to restore your data.' },
      { title: 'Schedule backups', description: 'The system reminds you every 48 hours if no backup has been created.', tip: 'Always backup before using Fresh Start or making major changes.' },
    ],
  },
  'User Management': {
    description: 'Manage user accounts, roles, and access permissions.',
    steps: [
      { title: 'View users', description: 'See all registered users with their roles and status.' },
      { title: 'Assign roles', description: 'Change user roles: Admin, Project Manager, Engineer, Viewer, Accountant, Safety Officer, Store Keeper, Surveyor.' },
      { title: 'Create users', description: 'Admin can create new user accounts directly.' },
    ],
  },
  Projects: {
    description: 'Create and manage multiple projects. Each project has isolated data.',
    steps: [
      { title: 'Create project', description: 'Click "Create Project" and enter the project name and description.' },
      { title: 'Share connection code', description: 'Copy the unique 8-character code and share with team members to let them join.' },
      { title: 'Manage members', description: 'Approve pending join requests, assign project roles (Admin, Co-Admin, Member).' },
      { title: 'Switch projects', description: 'Use the dropdown in the sidebar to switch between your projects.', tip: 'All module data is scoped to the selected project.' },
    ],
  },
};
