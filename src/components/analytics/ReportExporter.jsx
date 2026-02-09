import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};

export const exportToPDF = (reportConfig, data, charts = []) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(14, 165, 233); // sky-400
  doc.text(reportConfig.name || 'Analytics Report', 15, 20);
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 28);
  
  if (reportConfig.dateRange?.from && reportConfig.dateRange?.to) {
    doc.text(
      `Period: ${reportConfig.dateRange.from.toLocaleDateString()} - ${reportConfig.dateRange.to.toLocaleDateString()}`,
      15,
      34
    );
  }

  let yPosition = 45;

  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Report Summary', 15, yPosition);
  yPosition += 10;

  // Selected Metrics
  doc.setFontSize(10);
  doc.text('Included Metrics:', 15, yPosition);
  yPosition += 6;
  
  const selectedMetrics = Object.entries(reportConfig.metrics || {})
    .filter(([_, selected]) => selected)
    .map(([key, _]) => key);
  
  selectedMetrics.forEach(metric => {
    doc.text(`• ${metric}`, 20, yPosition);
    yPosition += 5;
  });

  yPosition += 10;

  // Data tables
  if (data && data.length > 0) {
    doc.setFontSize(12);
    doc.text('Data Report', 15, yPosition);
    yPosition += 5;

    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => row[h]));

    doc.autoTable({
      startY: yPosition,
      head: [headers],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] },
      margin: { top: 10 }
    });
  }

  // Save
  doc.save(`${reportConfig.name || 'report'}.pdf`);
};

export const prepareReportData = (reportConfig, evaluations, incidents, audits, teams) => {
  const data = [];
  
  if (reportConfig.metrics.qaScores && evaluations) {
    evaluations.forEach(evaluation => {
      data.push({
        Type: 'QA Evaluation',
        Agent: evaluation.agent_name,
        Score: evaluation.final_score,
        Date: evaluation.evaluation_date,
        Team: teams.find(t => t.id === evaluation.team_id)?.name || 'N/A',
      });
    });
  }

  if (reportConfig.metrics.incidents && incidents) {
    incidents.forEach(incident => {
      data.push({
        Type: 'Incident',
        Title: incident.title,
        Severity: incident.severity,
        Status: incident.status,
        Date: incident.incident_date,
        Category: incident.category,
      });
    });
  }

  if (reportConfig.metrics.audits && audits) {
    audits.forEach(audit => {
      data.push({
        Type: 'Audit',
        Title: audit.title,
        'Audit Type': audit.audit_type,
        'Compliance Score': audit.compliance_score || 'N/A',
        Status: audit.status,
        Date: audit.scheduled_date,
      });
    });
  }

  // Filter by date range if specified
  if (reportConfig.dateRange?.from && reportConfig.dateRange?.to) {
    return data.filter(item => {
      const itemDate = new Date(item.Date);
      return itemDate >= reportConfig.dateRange.from && itemDate <= reportConfig.dateRange.to;
    });
  }

  return data;
};