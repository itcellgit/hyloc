import api from './src/services/api.js';

async function checkAllKPIs() {
  try {
    const kpisRes = await api.get('/kpis');
    const kpis = kpisRes.data?.data || [];
    
    console.log('\n=== ALL KPIs IN DATABASE ===\n');
    kpis.forEach((kpi, idx) => {
      console.log(`${idx + 1}. ID: ${kpi.id}`);
      console.log(`   Title: "${kpi.title}"`);
      console.log(`   Fin Year: ${kpi.fin_year}`);
      console.log(`   ---`);
    });

    console.log('\n=== SEARCHING FOR SPECIFIC KPIs ===\n');

    // Search for Industry
    const industryKpis = kpis.filter(k => (k.title || '').toLowerCase().includes('industry'));
    console.log(`Industry KPIs (${industryKpis.length}):`);
    industryKpis.forEach(k => console.log(`  - ${k.id}: ${k.title}`));

    // Search for Quality
    const qualityKpis = kpis.filter(k => 
      (k.title || '').toLowerCase().includes('quality') || 
      (k.title || '').toLowerCase().includes('complaint')
    );
    console.log(`\nQuality KPIs (${qualityKpis.length}):`);
    qualityKpis.forEach(k => console.log(`  - ${k.id}: ${k.title}`));

    // Search for Sales
    const salesKpis = kpis.filter(k => 
      (k.title || '').toLowerCase().includes('sales') || 
      (k.title || '').toLowerCase().includes('revenue')
    );
    console.log(`\nSales KPIs (${salesKpis.length}):`);
    salesKpis.forEach(k => console.log(`  - ${k.id}: ${k.title}`));

    // Search for Profit
    const profitKpis = kpis.filter(k => 
      (k.title || '').toLowerCase().includes('profit') || 
      (k.title || '').toLowerCase().includes('pl')
    );
    console.log(`\nProfit KPIs (${profitKpis.length}):`);
    profitKpis.forEach(k => console.log(`  - ${k.id}: ${k.title}`));

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAllKPIs();
