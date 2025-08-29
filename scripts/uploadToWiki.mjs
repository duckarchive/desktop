#!/usr/bin/env node

import { existsSync, statSync, createReadStream } from 'fs';
import { basename, extname } from 'path';
import { Mwn } from 'mwn';
import { program } from 'commander';
import FormData from 'form-data';

// Hardcoded constants
const credentials = {
  apiUrl: 'https://commons.wikimedia.org/w/api.php',
};

const source = 'Журнал "Волынскія Єпархіальныя Вѣдомости"';
const author = 'Редакція "Волынскіхъ Єпархіальнихъ Вѣдомостей" г. Кременецъ';
const categories = [
  'Category:Volynskie eparkhialnyye vedomosti'
];

// Chunked upload configuration
const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB

// Parse command-line arguments
program
  .description('Upload files to Wikimedia Commons')
  .argument('<filepath>', 'Path to the file to upload')
  .parse(process.argv);

const filePath = program.args[0];

if (!filePath || !existsSync(filePath)) {
  console.error('Error: File does not exist');
  process.exit(1);
}

// Parse filename
function parseFileName(originalFileName) {
  const fileName = basename(originalFileName);

  // Match pattern like: "Волинські Єпархіальні Відомості. 1867. Випуск №8 від 16 Грудня 1867.pdf"
  const regex = /^(.+?)\s*\.\s\d{4}\.(?:\.?\s*Випуск\s*)?№(\d+)\s*від\s*(\d+)\s*([А-Яа-яІіЇїЄє]+)\s*(\d{4})(.+)?$/;
  const match = fileName.match(regex);

  if (!match) {
    console.error('Error: Could not parse filename');
    throw new Error('Filename parsing failed');
  }

  const [, title, issueNumber, day, monthText, year, extension] = match;

  // Convert Ukrainian month to numeric
  const monthMap = {
    'січня': '01', 'лютого': '02', 'березня': '03', 'квітня': '04',
    'травня': '05', 'червня': '06', 'липня': '07', 'серпня': '08',
    'вересня': '09', 'жовтня': '10', 'листопада': '11', 'грудня': '12'
  };

  const monthUk2Ru = {
    'січня': 'Января', 'лютого': 'Февраля', 'березня': 'Марта', 'квітня': 'Апреля',
    'травня': 'Мая', 'червня': 'Июня', 'липня': 'Июля', 'серпня': 'Августа',
    'вересня': 'Сентября', 'жовтня': 'Октября', 'листопада': 'Ноября', 'грудня': 'Декабря'
  };

  const month = monthMap[monthText.toLowerCase()] || '01';
  const paddedDay = day.padStart(2, '0');
  const date = `${year}-${month}-${paddedDay}`;

  // Format the file name according to the required format
  const formattedFileName = `${title.replace('Волинські Єпархіальні Відомості', 'Волынскія Єпархіальныя Ведомости')} №${issueNumber} ${year}${extension || '.pdf'}`;

  // Create description
  const description = {
    uk: `Волинські Єпархіальні Відомості. Випуск №${issueNumber} від ${day} ${monthText} ${year}`,
    ru: `Волынские Епархиальные Ведомости. Выпуск №${issueNumber} от ${day} ${monthUk2Ru[monthText.toLowerCase()] || monthText} ${year}`
  };

  return {
    formattedFileName,
    description,
    date
  };
}

async function uploadFile() {
  try {
    const fileName = basename(filePath);
    const { formattedFileName, description, date } = parseFileName(fileName);
    const fileSize = statSync(filePath).size;

    // Create wiki text for the file
    const wikiText = `
=={{int:filedesc}}==
{{Information
|description={{uk|1=${description.uk}}}{{ru|1=${description.ru}}}
|date=${date || ''}
|source=${source}
|author=${author}
|permission=
|other versions=
}}

=={{int:license-header}}==
{{PD-Ukraine}}{{PD-scan|PD-old-assumed-expired}}

${categories.map(category => `[[${category}]]`).join('\n')}
`;

    console.log(`Uploading file: ${formattedFileName}`);
    console.log(`Wiki text to be used:\n${wikiText}`);

    // Initialize mwn client
    const bot = await Mwn.init({
      apiUrl: credentials.apiUrl,
      username: credentials.username,
      password: credentials.password,
      userAgent: 'Duck Helper Bot/1.0',
    });

    const csrfToken = await bot.getCsrfToken();
    
    let offset = 0;
    let filekey = null;

    const fileStream = createReadStream(filePath, {
      highWaterMark: CHUNK_SIZE,
    });

    // Process file in chunks
    for await (const chunk of fileStream) {
      const form = new FormData();
      form.append("action", "upload");
      form.append("filename", formattedFileName);
      form.append("filesize", fileSize);
      form.append("format", "json");
      form.append("token", csrfToken);
      form.append("stash", "1");
      form.append("offset", offset.toString());
      if (filekey) form.append("filekey", filekey);
      form.append("chunk", chunk, {
        filename: formattedFileName,
        contentType: "application/octet-stream",
      });

      const headers = {
        ...form.getHeaders(),
        "User-Agent": "ChunkedUploader/1.0",
      };

      const res = await bot.rawRequest({
        url: credentials.apiUrl,
        method: "POST",
        headers,
        data: form,
        timeout: 1000 * 60 * 3,
      });
      const data = res.data;

      if (
        data?.upload?.result !== "Continue" &&
        data?.upload?.result !== "Success"
      ) {
        throw new Error("Upload failed: " + JSON.stringify(data));
      }

      filekey = data.upload.filekey;
      offset += chunk.length;
      
      const progress = Math.floor(Math.min((offset / fileSize) * 100, 100));
      console.log(`Upload progress: ${progress}% (${offset}/${fileSize} bytes)`);
    }

    // Finalize upload
    const finalizeForm = new FormData();
    finalizeForm.append("action", "upload");
    finalizeForm.append("filename", formattedFileName);
    finalizeForm.append("filesize", fileSize);
    finalizeForm.append("format", "json");
    finalizeForm.append("token", csrfToken);
    finalizeForm.append("filekey", filekey);
    finalizeForm.append("ignorewarnings", "1");
    finalizeForm.append("comment", "Uploaded via Duck Helper Bot");

    const finalHeaders = {
      ...finalizeForm.getHeaders(),
      "User-Agent": "ChunkedUploader/1.0",
    };

    const finalRes = await bot.rawRequest({
      url: credentials.apiUrl,
      headers: finalHeaders,
      method: "POST",
      data: finalizeForm,
      timeout: 1000 * 60 * 3,
    });

    if (finalRes.data?.upload?.result !== "Success") {
      throw new Error("Final upload failed: " + JSON.stringify(finalRes.data));
    }

    console.log(`File uploaded successfully: ${finalRes.data?.upload?.imageinfo?.url}`);

    // Add description and license information
    await bot.edit(`File:${formattedFileName}`, () => ({
      text: wikiText.trim(),
      summary: "Updated file description and license",
    }));

    console.log('Description and license added successfully');
    console.log(`File page: ${finalRes.data?.upload?.imageinfo?.descriptionurl}`);
  } catch (error) {
    console.error('Error during upload:', error);
    process.exit(1);
  }
}

// Start the upload process
uploadFile().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});