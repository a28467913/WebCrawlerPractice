(async function() {
    let $input = $("<input/>").attr({
        "type": "file",
        "accept": "*.csv"
    }).hide();
    $("body").append($input);
    $input.click();
    
    function readFileContent(fileInputElem, callback) {
        let reader = new FileReader();
        reader.readAsText(fileInputElem, "UTF-8");
        reader.onload = function (evt) {
            const content = evt.target.result;
            const lines = content.split(/\r?\n/).slice(1);
            callback(lines);
        }
        reader.onerror = function (evt) {
            console.error(evt)
        }
    }

    function createProgressDialogElement() {
        let $dialog = $(`
            <div id="dialog" title="Company Info Crawler">
                <div class="progress-label">Initializing...</div>
                <div id="progressbar"></div>
            </div>
        `);
        $("body").append($dialog);

        return $("#dialog").dialog({
            autoOpen: false,
            maxWidth:600,
            width: 600,
            modal: true
        });
    }
    
    function download(filename, text) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
    
        element.style.display = 'none';
        document.body.appendChild(element);
    
        element.click();
    
        document.body.removeChild(element);
    }
    
    async function callbackHandler(compaines) {
        let chunk = 3;
        let urls = compaines.map(company => `https://data.gcis.nat.gov.tw/od/data/api/6BBA2268-1367-4B42-9CCA-BC17499EBE8C?$format=json&$filter=Company_Name like ${company} and Company_Status eq 01`);
        
        let header = "";
        let lines = [];
        for (let i = 0; i <= Math.ceil(urls.length / chunk); i++) {	
            const start = i * chunk;
            const end = ((i + 1) * chunk) - 1;
            const partialUrls = urls.slice(start, end);
            console.log('Start:', start, 'End:', end);
            await Promise.all(partialUrls.map(url => fetch(url).then(res => res.text()))).then(resAry => {
                resAry.flat(1).filter(res => res).map(res => JSON.parse(res)).flat(1).map(item => {
                    $(".progress-label").text(`Crawling ${item.Company_Name}...`); // Show progress label
                    !header && (header = Object.keys(item).join(","));
                    lines.push(Object.values(item).join(","));
                });
            });
            $("#progressbar").progressbar({
                value: Math.ceil((i + 1) / Math.ceil(urls.length / chunk) * 100)
            });
        }
        let body = lines.join("\r\n");
        let content = `\ufeff${header}\n${body}`;
        download("CompanyInfo.csv", content);
        setTimeout(() => {
            $("#dialog").dialog("close");
            $("#dialog").remove();
        }, 2_000);
        // console.log(content);
    }
    
    $input.on("change", e => {
        const $dialog = createProgressDialogElement();
        $dialog.dialog("open"); // open dialog
        readFileContent($input[0].files[0], callbackHandler);
        $input.remove();
    });
}) ();