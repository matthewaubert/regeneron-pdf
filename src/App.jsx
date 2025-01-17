import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

export default function App() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [outputFiles, setOutputFiles] = useState([]);
  const [pageNames, setPageNames] = useState([]);

  // console.log('pageNames:', pageNames);

  function handleFileChange(event) {
    setUploadedFile(event.target.files[0]);
  }

  async function splitPDF() {
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target.result;
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const outputFilesTemp = [];

      for (let i = 0; i < pages.length; i++) {
        const newPdfDoc = await PDFDocument.create();
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
        newPdfDoc.addPage(copiedPage);

        const pdfBytes = await newPdfDoc.save(); // save the PDF to a Uint8Array
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        outputFilesTemp.push({ name: pageNames[i] || `page${i + 1}`, blob });
      }

      setOutputFiles(outputFilesTemp);
    };
    reader.readAsArrayBuffer(uploadedFile);
  }

  async function downloadAllFiles() {
    const zip = new JSZip();
    outputFiles.forEach(async (file, i) => {
      const filename = pageNames[i] || `page${i + 1}`;
      zip.file(`${filename}.pdf`, file.blob);
    });

    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, 'split_pdfs.zip');
    });
  }

  return (
    <main className="flex flex-col gap-2">
      <div>
        <input
          type="file"
          className="cursor-pointer"
          onChange={handleFileChange}
          accept="application/pdf"
        />
        <button
          className="bg-zinc-200 border border-zinc-500 rounded px-2 py-1 hover:brightness-95"
          onClick={splitPDF}
        >
          Split PDF
        </button>
      </div>

      {outputFiles.map((file, index) => (
        <input
          key={index}
          type="text"
          className="border border-zinc-300 rounded px-2 py-1 hover:shadow-inner flex-grow"
          placeholder={`Name for page ${index + 1}`}
          value={pageNames[index] || ''}
          onChange={(e) => {
            const newPageNames = [...pageNames];
            newPageNames[index] = e.target.value;
            setPageNames(newPageNames);
          }}
        />
      ))}
      {outputFiles.length > 0 && (
        <button
          className="mt-4 bg-zinc-200 border border-zinc-500 rounded px-4 py-2 hover:brightness-95"
          onClick={downloadAllFiles}
        >
          Download all files
        </button>
      )}
    </main>
  );
}
