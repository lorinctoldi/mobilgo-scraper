const fs = require('fs');
const { Parser } = require('json2csv');

const jsonToCsv = (jsonData) => {
    const fields = [
        'url',
        'phone',
        'email',
        'address',
        'county',
        'city',
        'website',
        'description',
        'instagram',
        'facebook',
        'categories'
    ];
    
    const json2csvParser = new Parser({ fields });
    return json2csvParser.parse(jsonData);
};

const convertJsonToCsv = () => {
    try {
        const jsonData = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
        
        const csvData = jsonToCsv(jsonData);
        
        fs.writeFileSync('data.csv', csvData, 'utf-8');
        
        console.log('Data successfully converted to data.csv');
    } catch (error) {
        console.error('Error converting JSON to CSV:', error);
    }
};

// Execute conversion
convertJsonToCsv();
