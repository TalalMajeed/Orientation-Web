const fs = require('fs');
const path = require('path');

async function fetchSecrets() {
  const token = process.env.SECRETS_KEY;
  if (!token) {
    console.error('Error: SECRETS_KEY is not defined.');
    process.exit(1);
  }

  const url = 'https://secrets.ecello.net/api/v1/secrets?project=6a553080e3f067860aa099eb&env=prod';
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    
    const envLines = Object.entries(data)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const targetDir = __dirname;

    fs.writeFileSync(path.join(targetDir, 'secrets.json'), JSON.stringify(data, null, 2));
    fs.writeFileSync(path.join(targetDir, '.env'), envLines);

    console.log('Successfully generated secrets.json and .env inside the root directory');
  } catch (error) {
    console.error('Failed to fetch secrets:', error);
    process.exit(1);
  }
}

fetchSecrets();