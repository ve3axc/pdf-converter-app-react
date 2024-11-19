import React, { useState } from "react";
import { jsPDF } from "jspdf";           // For creating PDFs
import * as pdfjsLib from "pdfjs-dist";  // For rendering PDF pages
import { ClipLoader } from "react-spinners";  // Spinner component from react-spinners

// Set the workerSrc for pdf.js
import { GlobalWorkerOptions } from "pdfjs-dist";
GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js`;

function PDFConverter() {
    const [file, setFile] = useState(null); // State for the uploaded file
    const [isLoading, setIsLoading] = useState(false); // Loading state for the spinner
    const [message, setMessage] = useState(""); // Message to show during and after conversion

    // Handle PDF file upload
    const handleFileChange = (e) => {
        const uploadedFile = e.target.files[0];
        if (uploadedFile) {
            setFile(uploadedFile); // Set the uploaded file
        }
    };

    // Convert the uploaded PDF to 17x11
    const convertTo17x11 = async () => {
        if (!file) {
            alert("Please upload a PDF first!");
            return;
        }

        setIsLoading(true); // Start the spinner
        setMessage("Please wait for PDF to convert..."); // Set the waiting message

        const fileReader = new FileReader();
        fileReader.onload = async () => {
            const pdfBytes = new Uint8Array(fileReader.result);
            const pdfDoc = await pdfjsLib.getDocument(pdfBytes).promise; // Use pdf.js to load the PDF
            const numPages = pdfDoc.numPages; // Get the total number of pages in the PDF
            const newPdf = new jsPDF("landscape", "pt", [1224, 792]); // Create a 17x11 landscape PDF

            // Assuming the PDF has exactly 4 pages
            if (numPages === 4) {
                // Page 1 to the left of the first 17x11 sheet
                const page1 = await pdfDoc.getPage(1);
                const viewport1 = page1.getViewport({ scale: 2 });
                const canvas1 = document.createElement("canvas");
                const context1 = canvas1.getContext("2d");
                canvas1.height = viewport1.height;
                canvas1.width = viewport1.width;
                await page1.render({ canvasContext: context1, viewport: viewport1 }).promise;
                newPdf.addImage(canvas1, "PNG", 0, 0, 612, 792); // Left side of first sheet

                // Page 4 to the right of the first 17x11 sheet
                const page4 = await pdfDoc.getPage(4);
                const viewport4 = page4.getViewport({ scale: 2 });
                const canvas4 = document.createElement("canvas");
                const context4 = canvas4.getContext("2d");
                canvas4.height = viewport4.height;
                canvas4.width = viewport4.width;
                await page4.render({ canvasContext: context4, viewport: viewport4 }).promise;
                newPdf.addImage(canvas4, "PNG", 612, 0, 612, 792); // Right side of first sheet
                newPdf.addPage(); // Add a new page for the second sheet

                // Page 2 to the left of the second 17x11 sheet
                const page2 = await pdfDoc.getPage(2);
                const viewport2 = page2.getViewport({ scale: 2 });
                const canvas2 = document.createElement("canvas");
                const context2 = canvas2.getContext("2d");
                canvas2.height = viewport2.height;
                canvas2.width = viewport2.width;
                await page2.render({ canvasContext: context2, viewport: viewport2 }).promise;
                newPdf.addImage(canvas2, "PNG", 0, 0, 612, 792); // Left side of second sheet

                // Page 3 to the right of the second 17x11 sheet
                const page3 = await pdfDoc.getPage(3);
                const viewport3 = page3.getViewport({ scale: 2 });
                const canvas3 = document.createElement("canvas");
                const context3 = canvas3.getContext("2d");
                canvas3.height = viewport3.height;
                canvas3.width = viewport3.width;
                await page3.render({ canvasContext: context3, viewport: viewport3 }).promise;
                newPdf.addImage(canvas3, "PNG", 612, 0, 612, 792); // Right side of second sheet
            }

            newPdf.save("converted_17x11.pdf"); // Save the converted PDF

            // After completion, stop the spinner and update the message
            setIsLoading(false);
            setMessage("Done, check your Downloads folder.");
        };

        fileReader.readAsArrayBuffer(file); // Read the file as ArrayBuffer
    };

    return (
        <div>
            <h1>Upload a PDF to Convert</h1>
            <input 
                type="file" 
                accept="application/pdf" 
                onChange={handleFileChange} 
            />
            {file && <p>File selected: {file.name}</p>} {/* Display the selected file name */}
            
            {/* Display spinner and message while processing */}
            {isLoading ? (
                <div>
                    <ClipLoader size={50} color={"#123abc"} loading={isLoading} />
                    <p>{message}</p>
                </div>
            ) : (
                <button onClick={convertTo17x11}>Convert to 17x11</button>
            )}
        </div>
    );
}

export default PDFConverter;
