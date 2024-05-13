var showdown = require('showdown');
var fs = require('fs');
let filename = process.argv[4] || "README.md"
let pageTitle = process.argv[2] || ""
let plausibleDomain = process.argv[3] || ""
var hljs = require('highlight.js');

showdown.extension('highlight', function () {
  function htmlunencode(text) {
    return (
      text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
    );
  }
  return [{
    type: "output",
    filter: function (text, converter, options) {
      var left = "<pre><code\\b[^>]*>",
        right = "</code></pre>",
        flags = "g";
      var replacement = function (wholeMatch, match, left, right) {
        match = htmlunencode(match);
        var lang = (left.match(/class=\"([^ \"]+)/) || [])[1];
        left = left.slice(0, 18) + 'hljs ' + left.slice(18);
        if (lang && hljs.getLanguage(lang)) {
          return left + hljs.highlight(match, { language: lang }).value + right;
        } else {
          return left + hljs.highlightAuto(match).value + right;
        }
      };
      return showdown.helper.replaceRecursiveRegExp(text, replacement, left, right, flags);
    }
  }];
});

fs.readFile(__dirname + '/style.css', function (err, styleData) {
  fs.readFile(__dirname + '/node_modules/highlight.js/styles/atom-one-dark.css', function (err, highlightingStyles) {
    fs.readFile(process.cwd() + '/' + filename, function (err, data) {
      if (err) {
        throw err;
      }
      let text = data.toString();

      converter = new showdown.Converter({
        ghCompatibleHeaderId: true,
        simpleLineBreaks: true,
        ghMentions: true,
        extensions: ['highlight'],
        tables: true
      });

      var preContent = `
      <html>
        <head>
          <title>` + pageTitle + `</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta charset="UTF-8">`

      if (plausibleDomain.length > 0) {
        preContent += `
          <script defer data-domain="` + plausibleDomain + `" src="https://plausible.io/js/script.js"></script>
        `
      }
      preContent += `
        </head>
        <body>
          <div id='content'>
      `

      let postContent = `

          </div>
          <style type='text/css'>` + styleData + `</style>
          <style type='text/css'>` + highlightingStyles + `</style>
          <script>
          let blocks = document.querySelectorAll('pre code');

          blocks.forEach((block) => {
            // Create a copy button element
            const copyButton = document.createElement("span");
            copyButton.innerText = "Copy";
            copyButton.classList.add("copy-button");

            // Append the copy button to the <pre> tag
            block.appendChild(copyButton);

            // Add click event listener to the copy button
            copyButton.addEventListener("click", () => {
              // Hide the copy button temporarily
              copyButton.style.display = "none";
            
              // Create a range and select the text inside the <pre> tag
              const range = document.createRange();
              range.selectNode(block);
              window.getSelection().removeAllRanges();
              window.getSelection().addRange(range);
            
              try {
                // Copy the selected text to the clipboard
                document.execCommand("copy");
              
                // Alert the user that the text has been copied
                copyButton.innerText = "Copied!";
                setTimeout(function(){
                  copyButton.innerText = "Copy";
                }, 1500);
              } catch (err) {
                console.error("Unable to copy text:", err);
              } finally {
                // Show the copy button again
                copyButton.style.display = "inline";
              
                // Deselect the text
                window.getSelection().removeAllRanges();
              }
            });
          });
          
      </script>
        </body>
      </html>`;


      html = preContent + converter.makeHtml(text) + postContent

      converter.setFlavor('github');
      // console.log(html);

      let markdownFileNameWithoutPath = filename.replace(".md", ".html")
      let filePath = process.cwd() + "/" + markdownFileNameWithoutPath
      fs.writeFile(filePath, html, { flag: "wx" }, function (err) {
        if (err) {
          console.log("File '" + filePath + "' already exists. Aborted!");
        } else {
          console.log("Done, saved to " + filePath);
        }
      });
    });
  });
});
