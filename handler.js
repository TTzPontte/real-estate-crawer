const chromium = require('chrome-aws-lambda');
const { addExtra } = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

const puppeteerCore = chromium.puppeteer;
const puppeteer = addExtra(puppeteerCore);
const stealth = StealthPlugin();
puppeteer.use(stealth);


exports.urlCrawler = async (event, context, callback) => {
  let result = null;
  let browser = null;

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    let page = await browser.newPage();

    await page.goto("https://www.imovelweb.com.br/propriedades/mercure-sao-paulo-pinheiros-2953734307.html");

    result = await page.title();
  } catch (error) {
    return callback(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }

  return callback(null, result);
};

