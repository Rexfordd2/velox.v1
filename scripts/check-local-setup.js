const checkSetup = () => {
  const checks = [
    { name: 'Web App', url: 'http://localhost:3000', status: '❓' },
    { name: 'Expo Server', url: 'http://localhost:19000', status: '❓' },
  ];

  console.log('\n🔍 Local Setup Checklist:');
  console.log('========================');
  
  checks.forEach(check => {
    console.log(`${check.status} ${check.name} (${check.url})`);
  });
  
  console.log('\nLegend:');
  console.log('✅ - Running');
  console.log('❌ - Not Running');
  console.log('❓ - Status Unknown\n');
};

checkSetup(); 