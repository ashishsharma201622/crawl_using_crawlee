import { PlaywrightCrawler, EnqueueLinksOptions } from 'crawlee'; // Import EnqueueLinksOptions
import ExcelJS from 'exceljs';
// import * as path from 'path';

async function crawlWebsite(websiteUrl: string): Promise<string | undefined> {
  let foundUrl: string | undefined;

  const crawler = new PlaywrightCrawler({
    headless: false,
    async requestHandler({ page, enqueueLinks }) {
      console.log(`Crawling website: ${websiteUrl}`);
      
      await page.goto(websiteUrl);
  
      // Set a timeout for the page navigation to 60 seconds (in milliseconds)
      await page.goto(websiteUrl, { timeout: 30000 });

      // Extract links from the current page and enqueue them for crawling
      const links = await page.$$eval('a', (anchors) =>
        anchors.map((a) => a.getAttribute('href')).filter((href) => href)
      );
      
      for (const link of links) {
        // Check if the link is not null and if its URL contains "recruit"
        if (link && link.includes('recruit')) {
          foundUrl = link; // Capture the URL if "recruit" is found
          // Construct an object of type EnqueueLinksOptions with the URL property
          const enqueueOptions: EnqueueLinksOptions = {
              urls: [link] // No need for || '' here, as we've checked for null
          };
          await enqueueLinks(enqueueOptions);
        }
      }
    },

  });

  await crawler.run([websiteUrl]);
  return foundUrl;
}


// Function to read the Excel file and process each URL
async function processExcelFile() {
  // Define the relative path to the Excel file from the root of your project
  const excelFilePath = 'src/excel/namesite.xlsx';
  console.log(`Processing Excel file: ${excelFilePath};`);    

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelFilePath);

  const worksheet = workbook.getWorksheet(1);

  // Iterate over the URLs in the Excel file from B2 to B5 and write results to C2 to C5
  for (let i = 2; i <= 3; i++) {
    const cellB = worksheet.getCell(`B${i}`);
    const cellC = worksheet.getCell(`C${i}`);

    const cellValue: string | undefined = cellB.text;

    if (cellValue !== null && typeof cellValue === 'string' && cellValue.trim() !== '') {
      console.log(`Crawling URL from Excel: ${cellValue}`);
      const resultUrl = await crawlWebsite(cellValue);

      if (resultUrl) {
        console.log(`Found 'recruit' at: ${resultUrl.toString()}`);
        cellC.value = resultUrl; // Write the result URL to cell C
      } else {
        console.log(`'recruit' not found for: ${cellValue}`);
        cellC.value = 'Not found'; // Mark as 'Not found' in cell C if not found
      }
    }
  }

  // Save the modified Excel file
  await workbook.xlsx.writeFile(excelFilePath);
}

// Main function to process the Excel file
async function main() {
  await processExcelFile();
}

main().catch((error) => {
  console.error('Error:', error);
});
