let kwyword = "";
let indcat = "1013001000";
let totalPage = 1;
let pageSize = 18;
let configs = [{
	source: "summary",
	field: "encodedCustNo",
	label: "識別碼"
}, {
	source: "summary",
    field: "name",
    label: "公司名字"
}, {
	source: "summary",
    field: "industryDesc",
    label: "產業類別"
}, {
	source: "detail",
    field: "indcat",
    label: "產業描述"
}, {
	source: "detail",
    field: "hrName",
    label: "聯絡人"
}, {
	source: "detail",
    field: "phone",
    label: "電話"
}, {
	source: "detail",
    field: "fax",
    label: "傳真"
}, {
	source: "detail",
    field: "addrNoDesc",
    label: "地區"
}, {
	source: "detail",
    field: "address",
    label: "地址"
}, {
	source: "summary",
    field: "employeeCountDesc",
    label: "公司人數"
}, {
	source: "summary",
    field: "capitalDesc",
    label: "資本額"
}, {
	source: "detail",
    field: "product",
    label: "主要商品",
	formatter: (val) => val.replace(",", "，").replace(/\r?\n/g, " ")
}, {
	source: "summary",
	field: "encodedCustNo",
	label: "104 連結",
	formatter: (val) => `https://www.104.com.tw/company/${val}?jobsource=n_my104_search`
}, {
	source: "detail",
	field: "custLink",
	label: "公司網址"
}];

// Main Logic
let finalData = [];
let endpoint = "https://www.104.com.tw/company/ajax/list";
let detailEndpoint = "https://www.104.com.tw/company/ajax/content";
for (let i = 1; i <= totalPage; i++) {
    await fetch(`${endpoint}?indcat=${indcat}&order=1&keyword=${kwyword}&jobsource=n_my104_search&mode=s&page=${i}&pageSize=${pageSize}`).then(res => res.json()).then(async ({ data, metadata }) => {
        totalPage = metadata?.pagination?.lastPage ?? 1;
		for (item of data) {
			const encodedCustNo = item.encodedCustNo;
			await fetch(`${detailEndpoint}/${encodedCustNo}`).then(res => res.json()).then(detail => {
				Object.entries(detail.data).forEach(([prop, value]) => {
					item[prop] = value;
				});
			});
			const collectObj = configs.reduce((obj, config) => {
                const field = config.field;
                obj[field] = item[field];
                return obj;
            }, {});
			finalData.push(collectObj);
		}
    });
}
let header = configs.map(config => config.label).join(",");
let body = finalData.map(item => {
	return configs.map(config => {
		const formatter = config.formatter;
		const value = item[config.field];
		
		return formatter ? formatter(value) : value;
	}).join(",");
}).join("\r\n");
let csvContent = `${header}\r\n${body}`;
console.log(csvContent);