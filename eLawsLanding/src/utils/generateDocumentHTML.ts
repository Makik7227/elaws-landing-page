const generateDocumentHTML = (content: string): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Legal Document</title>
    <style>
      body {
        font-family: "Georgia", serif;
        font-size: 14px;
        color: #111;
        padding: 48px;
        line-height: 1.6;
      }
      h1, h2, h3, h4 {
        color: #111;
        margin-top: 24px;
      }
      p {
        margin-bottom: 12px;
      }
      ul, ol {
        padding-left: 20px;
        margin-bottom: 12px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 12px;
      }
      th, td {
        border: 1px solid #ccc;
        padding: 6px 8px;
        text-align: left;
      }
      hr {
        margin: 24px 0;
      }
      strong {
        font-weight: 600;
      }
      em {
        font-style: italic;
      }
      .signature-space {
        height: 80px;
        border-bottom: 1px solid #000;
        width: 60%;
        margin-top: 40px;
      }
    </style>
</head>
<body>
  ${content}
</body>
</html>`;
};

export default generateDocumentHTML;
