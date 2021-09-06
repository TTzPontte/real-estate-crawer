
const chromium = require('chrome-aws-lambda');

let _browser = null;

const browser = async () => {
  if (_browser) return _browser;
  _browser = chromium.puppeteer.launch({
     args: chromium.args,
     defaultViewport: chromium.defaultViewport,
     executablePath: await chromium.executablePath,
     headless: chromium.headless,
     ignoreHTTPSErrors: true,
  });
  return _browser;
};

const crawZap = async page => {
  const address = await page.$$eval(
    '.js-address',
    ([{ textContent }]) => textContent.trim()
  );
  const estado = address.replace(/.+- ([^-]+)$/i, "$1");
  const cidade = address.replace(/.+, ([^,]+) - [^-]+$/i, "$1");
  const bairro = address.replace(/.+- ([^-]+), ([^,]+) - [^-]+$/i, "$1");
  const logradouro = address.replace(/(.+) - ([^-]+), ([^,]+) - [^-]+$/i, "$1");
  const l = v => console.log(v) || v;
  const areaTerreno = await page.$$eval(
    '.js-area',
    ([{ textContent } = { textContent: '0'}]) => parseInt(
      textContent.trim().replace(/a.+$/ig, '').replace(/[^0-9]+/ig, ''),
      10
    )
  );
  const banheiros = await page.$$eval(
    '.js-bathrooms',
    ([{ textContent } = { textContent: '0'}]) => parseInt(
      textContent.trim().replace(/a.+$/ig, '').replace(/[^0-9]+/ig, ''),
      10
    )
  );
  const andares = await page.$$eval(
    '.js-floor',
    ([{ textContent } = { textContent: '0'}]) => parseInt(
      textContent.trim().replace(/a.+$/ig, '').replace(/[^0-9]+/ig, ''),
      10
    )
  );
  const quartos = await page.$$eval(
    '.js-bedrooms',
    ([{ textContent } = { textContent: '0'}]) => parseInt(
      textContent.trim().replace(/a.+$/ig, '').replace(/[^0-9]+/ig, ''),
      10
    )
  );
  const vagas = await page.$$eval(
    '.js-parking-spaces',
    ([{ textContent } = { textContent: '0'}]) => parseInt(
      textContent.trim().replace(/a.+$/ig, '').replace(/[^0-9]+/ig, ''),
      10
    )
  );
  const valorTotal = await page.$$eval(
    '.js-price-sale',
    ([{ textContent } = { textContent: '0'}]) => parseInt(
      textContent.trim().replace(/a.+$/ig, '').replace(/[^0-9]+/ig, ''),
      10
    )
  );
  const valorCondominio = await page.$$eval(
    '.condominium span',
    ([{ textContent } = { textContent: '0'}]) => parseInt(
      textContent.trim().replace(/a.+$/ig, '').replace(/[^0-9]+/ig, ''),
      10
    )
  );
  const IPTU =  await page.$$eval(
    '.iptu span',
    ([{ textContent } = { textContent: '0'}]) => parseInt(
      textContent.trim().replace(/a.+$/ig, '').replace(/[^0-9]+/ig, ''),
      10
    )
  );
  return l({
    status: "ok",
    response: {
      logradouro,
      bairro,
      cidade,
      estado,
      areaTerreno,
      areaPrivativa: 0,
      vagas,
      valorTotal,
      IPTU,
      valorCondominio,
      quartos,
      banheiros,
      andares,
    },
  });
};

const crawVivaReal = async page => {
  return crawZap(page);
};

exports.urlCrawler = async (event, context) => {
  let page = null;
  try {
    const navigator = await browser();
    page = await navigator.newPage();

    const { queryStringParameters: { url } = {} } = event;
    const isVivaReal = /vivareal.com.br\//.test(url);
    const isZap = /zapimoveis.com.br\//.test(url);
    if (!isVivaReal && !isZap) {
      throw new Error(`Dominio invalido ${url}`);
    }

    await page.goto(url);

    const result = await (isZap && crawZap(page) || isVivaReal && crawVivaReal(page));
    return {
      status: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.log(error);
    return {
      status: 400,
      body: JSON.stringify({
        status: 'NOK',
        message: error.message
      }),
    };
  } finally {
    page && page.close();
  }
};
