/********************************************
 * Full Debug Version of app.js
 ********************************************/
const fs = require('fs');
const express = require('express');
const fileUpload = require('express-fileupload');
const { PDFDocument } = require('pdf-lib'); // same library used in Electron

const app = express();

// 1. Serve static files from the "public" folder
app.use(express.static('public'));

// 2. Enable file uploads (debug mode logs each chunk)
app.use(fileUpload({ debug: true }));

// 3. POST endpoint to convert the PDF
app.post('/convert', async (req, res) => {
  try {
    /********************************************
     * Step A: Check & read the uploaded file
     ********************************************/
    if (!req.files || !req.files.pdfFile) {
      console.log('No file uploaded');
      return res.status(400).send('No PDF file uploaded.');
    }

    const uploadedFile = req.files.pdfFile;
    console.log('Uploaded file:', uploadedFile.name, 'Size:', uploadedFile.data.length);

    const existingPdfBytes = uploadedFile.data;

    /********************************************
     * Step B: Load the PDF with pdf-lib
     ********************************************/
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const numPages = pdfDoc.getPageCount();
    console.log('Number of pages in uploaded PDF:', numPages);

    // We expect exactly 4 pages
    if (numPages !== 4) {
      console.log(`Expected 4 pages, got ${numPages}`);
      return res
        .status(400)
        .send(`The PDF must have exactly 4 pages (found ${numPages}).`);
    }

    /********************************************
     * Step C: Create the new PDF & embed pages
     ********************************************/
    // The new page order is [3, 0] (Page 4 on the left, Page 1 on the right)
    const newPdfDoc = await PDFDocument.create();
    const pagePairs = [
      { left: 3, right: 0 }, // Page 4 on the left, Page 1 on the right
      { left: 1, right: 2 }  // Page 2 on the left, Page 3 on the right
    ];

    for (const pair of pagePairs) {
      console.log(`Embedding pages: Left=${pair.left}, Right=${pair.right}`);

      // Get the pages from original
      const leftPage = pdfDoc.getPage(pair.left);
      const rightPage = pdfDoc.getPage(pair.right);

      // Embed them
      const [embeddedLeft] = await newPdfDoc.embedPages([leftPage]);
      const [embeddedRight] = await newPdfDoc.embedPages([rightPage]);

      // Create a 17x11 inch page => 17 * 72 by 11 * 72
      const mergedPage = newPdfDoc.addPage([17 * 72, 11 * 72]);

      // Left half
      mergedPage.drawPage(embeddedLeft, {
        x: 0,
        y: 0,
        width: 8.5 * 72,
        height: 11 * 72,
      });

      // Right half
      mergedPage.drawPage(embeddedRight, {
        x: 8.5 * 72,
        y: 0,
        width: 8.5 * 72,
        height: 11 * 72,
      });
    }

    /********************************************
     * Step D: Save the final PDF
     ********************************************/
    const pdfBytes = await newPdfDoc.save();
    console.log('Final PDF byte length:', pdfBytes.length);

    // Write to disk for debugging
    const debugPath = 'debug_output.pdf';
    fs.writeFileSync(debugPath, pdfBytes);
    console.log(`Wrote debug PDF to disk at "${debugPath}"`);

    /********************************************
     * Step E: Send the PDF back to the browser
     ********************************************/
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="converted_17x11.pdf"');

    // Using res.end() with a Buffer to ensure binary is sent correctly
    res.end(Buffer.from(pdfBytes), 'binary');

  } catch (error) {
    console.error('Error during PDF conversion:', error);
    return res.status(500).send('An error occurred during conversion.');
  }
});

// 4. Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
